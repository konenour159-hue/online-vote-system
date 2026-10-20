import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { config } from '../config/env.js';
import { UserError, NotFoundError } from '../utils/errors.js';
import { sendMail, verificationCodeMail } from '../utils/mailer.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_CODES_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;
const SESSION_TTL = '30m';

export type Phase = 'not_open' | 'open' | 'closed';

export const phaseOf = (election: { status: string; endDate: Date }): Phase => {
  if (election.status === 'DRAFT') return 'not_open';
  if (election.status === 'ACTIVE') return new Date() <= election.endDate ? 'open' : 'closed';
  return 'closed';
};

const voteSecret = `${config.jwt_access_secret}:vote`; // différent du secret des comptes : un jeton de vote n'ouvre aucune session admin

const hashCode = (participantId: string, code: string): string =>
  crypto.createHmac('sha256', config.jwt_access_secret).update(`${participantId}:${code}`).digest('hex');

const safeEqual = (a: string, b: string): boolean => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const identifySchema = z.object({
  name: z.string().trim().min(2, 'Saisissez votre nom (2 caractères minimum).').max(80, 'Ce nom est trop long.'),
  email: z.string().trim().toLowerCase().email('Saisissez une adresse e-mail valide.').max(200)
});

const loadElection = async (token: string) => {
  if (!UUID.test(token)) throw new NotFoundError('Vote');
  const election = await prisma.election.findUnique({
    where: { publicToken: token },
    include: { positions: { include: { candidates: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' }, take: 1 } }
  });
  if (!election) throw new NotFoundError('Vote');
  return election;
};

/** Décompte des bulletins par candidat. */
export const tally = async (electionId: string): Promise<Map<string, number>> => {
  const rows = await prisma.publicVote.groupBy({ by: ['candidateId'], where: { electionId }, _count: { _all: true } });
  return new Map(rows.map((r) => [r.candidateId, r._count._all]));
};

const percent = (votes: number, total: number): number => (total > 0 ? Math.round((votes / total) * 1000) / 10 : 0);

export const publicVoteService = {
  /** Informations affichées à l'audience : jamais de décompte tant que le vote est ouvert. */
  async getVote(token: string) {
    const election = await loadElection(token);
    return {
      title: election.title,
      description: election.description,
      phase: phaseOf(election),
      endDate: election.endDate,
      candidates: (election.positions[0]?.candidates ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        bio: c.bio,
        photo: c.photo
      }))
    };
  },

  /** Étape 1 : nom + e-mail, envoi d'un code à 6 chiffres. */
  async identify(token: string, input: unknown) {
    const parsed = identifySchema.safeParse(input);
    if (!parsed.success) throw new UserError(400, parsed.error.issues[0].message);
    const { name, email } = parsed.data;

    const election = await loadElection(token);
    const phase = phaseOf(election);
    if (phase === 'not_open') throw new UserError(409, "Ce vote n'est pas encore ouvert.");
    if (phase === 'closed') throw new UserError(409, 'Ce vote est terminé.');

    const participant = await prisma.participant.upsert({
      where: { electionId_email: { electionId: election.id, email } },
      update: { name },
      create: { electionId: election.id, email, name }
    });

    const recent = await prisma.verificationCode.findMany({
      where: { participantId: participant.id, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' }
    });
    if (recent.length >= MAX_CODES_PER_HOUR) {
      throw new UserError(429, 'Trop de codes demandés pour cette adresse. Réessayez dans une heure.');
    }
    if (recent[0] && Date.now() - recent[0].createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new UserError(429, 'Un code vient d’être envoyé. Patientez une minute avant d’en demander un nouveau.');
    }

    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    const record = await prisma.verificationCode.create({
      data: {
        participantId: participant.id,
        codeHash: hashCode(participant.id, code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS)
      }
    });

    try {
      await sendMail(verificationCodeMail(email, name, election.title, code));
    } catch (err) {
      await prisma.verificationCode.delete({ where: { id: record.id } }).catch(() => undefined);
      throw new UserError(502, 'Impossible d’envoyer le code pour le moment. Réessayez dans quelques instants.');
    }
    return { sent: true, resendAfterSeconds: RESEND_COOLDOWN_MS / 1000, expiresInMinutes: CODE_TTL_MS / 60000 };
  },

  /** Étape 2 : vérification du code, remise d'un jeton de vote de courte durée. */
  async verify(token: string, input: unknown) {
    const parsed = z
      .object({ email: z.string().trim().toLowerCase().email(), code: z.string().trim().regex(/^\d{6}$/) })
      .safeParse(input);
    if (!parsed.success) throw new UserError(400, 'Saisissez le code à 6 chiffres reçu par e-mail.');
    const { email, code } = parsed.data;

    const election = await loadElection(token);
    if (phaseOf(election) !== 'open') throw new UserError(409, 'Ce vote n’est pas ouvert.');

    const invalid = new UserError(400, 'Code incorrect ou expiré. Demandez un nouveau code si besoin.');
    const participant = await prisma.participant.findUnique({
      where: { electionId_email: { electionId: election.id, email } }
    });
    if (!participant) throw invalid;

    const record = await prisma.verificationCode.findFirst({
      where: { participantId: participant.id, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' }
    });
    if (!record || record.attempts >= MAX_ATTEMPTS) throw invalid;

    // Le compteur monte avant la comparaison : des essais simultanés ne peuvent pas dépasser la limite.
    const updated = await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } }
    });
    if (updated.attempts > MAX_ATTEMPTS || !safeEqual(record.codeHash, hashCode(participant.id, code))) throw invalid;

    if (participant.hasVoted) {
      throw new UserError(409, 'Cette adresse e-mail a déjà été utilisée pour voter.');
    }

    await prisma.$transaction([
      prisma.verificationCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
      prisma.participant.update({ where: { id: participant.id }, data: { verifiedAt: new Date() } })
    ]);

    const session = jwt.sign({ typ: 'vote', pid: participant.id, eid: election.id }, voteSecret, {
      expiresIn: SESSION_TTL
    });
    return { session, name: participant.name };
  },

  /** Étape 3 : enregistrement du bulletin. Une seule fois par participant, même en cas de requêtes simultanées. */
  async castVote(token: string, session: string | undefined, candidateId: unknown) {
    if (!session) throw new UserError(401, 'Votre session a expiré. Recommencez la vérification par e-mail.');
    let claims: { typ?: string; pid?: string; eid?: string };
    try {
      claims = jwt.verify(session, voteSecret) as typeof claims;
    } catch {
      throw new UserError(401, 'Votre session a expiré. Recommencez la vérification par e-mail.');
    }
    if (claims.typ !== 'vote' || !claims.pid || !claims.eid) throw new UserError(401, 'Session invalide.');

    const election = await loadElection(token);
    if (claims.eid !== election.id) throw new UserError(401, 'Session invalide.');
    if (phaseOf(election) !== 'open') throw new UserError(409, 'Ce vote n’est pas ouvert.');

    const id = z.string().min(1).safeParse(candidateId);
    const candidate = id.success
      ? election.positions[0]?.candidates.find((c) => c.id === id.data)
      : undefined;
    if (!candidate) throw new UserError(400, 'Choisissez un candidat de la liste.');

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.participant.updateMany({
        where: { id: claims.pid, electionId: election.id, hasVoted: false, verifiedAt: { not: null } },
        data: { hasVoted: true, votedAt: new Date() }
      });
      if (claimed.count !== 1) throw new UserError(409, 'Vous avez déjà voté dans ce vote.');
      await tx.publicVote.create({ data: { electionId: election.id, candidateId: candidate.id } });
    });
    return { recorded: true };
  },

  /** Résultats publics : seulement une fois le vote terminé. */
  async getResults(token: string) {
    const election = await loadElection(token);
    if (phaseOf(election) !== 'closed') throw new UserError(403, 'Les résultats seront publiés à la clôture du vote.');
    const counts = await tally(election.id);
    const candidates = election.positions[0]?.candidates ?? [];
    const total = candidates.reduce((sum, c) => sum + (counts.get(c.id) ?? 0), 0);
    return {
      title: election.title,
      totalVotes: total,
      results: candidates
        .map((c) => ({ id: c.id, name: c.name, votes: counts.get(c.id) ?? 0, percentage: percent(counts.get(c.id) ?? 0, total) }))
        .sort((a, b) => b.votes - a.votes)
    };
  },

  /** Lien privé d'un candidat : SES voix et SON pourcentage, en direct. Rien sur les autres. */
  async getCandidateView(accessToken: string) {
    if (!UUID.test(accessToken)) throw new NotFoundError('Candidate');
    const candidate = await prisma.candidate.findUnique({
      where: { accessToken },
      include: { position: { include: { election: true } } }
    });
    if (!candidate) throw new NotFoundError('Candidate');
    const election = candidate.position.election;
    const counts = await tally(election.id);
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    const votes = counts.get(candidate.id) ?? 0;
    return {
      candidateName: candidate.name,
      voteTitle: election.title,
      phase: phaseOf(election),
      endDate: election.endDate,
      votes,
      percentage: percent(votes, total)
    };
  }
};
