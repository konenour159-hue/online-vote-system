import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { UserError, NotFoundError } from '../utils/errors.js';
import { phaseOf, tally } from './publicVoteService.js';

export interface Admin {
  id: string;
  role: string;
}

const candidateSchema = z.object({
  name: z.string().trim().min(2, 'Le nom d’un candidat doit contenir au moins 2 caractères.').max(80, 'Un nom de candidat est trop long.'),
  bio: z.string().trim().max(500, 'La présentation d’un candidat est trop longue (500 caractères).').optional().or(z.literal(''))
});

const futureDate = z.coerce
  .date({ invalid_type_error: 'Choisissez une date de fin valide.' })
  .refine((d) => d.getTime() > Date.now(), 'La date de fin doit être dans le futur.');

export const createVoteSchema = z.object({
  title: z.string().trim().min(3, 'Le titre doit contenir au moins 3 caractères.').max(120, 'Le titre est trop long.'),
  description: z.string().trim().max(1000, 'La description est trop longue.').optional().or(z.literal('')),
  endDate: futureDate,
  candidates: z
    .array(candidateSchema)
    .min(2, 'Ajoutez au moins 2 candidats.')
    .max(30, '30 candidats au maximum.')
    .refine((list) => new Set(list.map((c) => c.name.toLowerCase())).size === list.length, 'Deux candidats portent le même nom.')
});

export const updateVoteSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  endDate: futureDate.optional()
});

export { candidateSchema };

const accessFilter = (admin: Admin) => (admin.role === 'SUPER_ADMIN' ? {} : { admin: { userId: admin.id } });

const loadOwned = async (admin: Admin, id: string) => {
  const election = await prisma.election.findUnique({
    where: { id },
    include: { admin: { select: { userId: true } }, positions: { orderBy: { order: 'asc' }, take: 1 } }
  });
  if (!election) throw new NotFoundError('Vote');
  if (admin.role !== 'SUPER_ADMIN' && election.admin.userId !== admin.id) {
    throw new UserError(403, 'Vous n’administrez pas ce vote.');
  }
  return election;
};

export const adminVoteService = {
  async list(admin: Admin) {
    const elections = await prisma.election.findMany({
      where: accessFilter(admin),
      orderBy: { createdAt: 'desc' },
      include: {
        positions: { include: { _count: { select: { candidates: true } } }, take: 1 },
        _count: { select: { publicVotes: true } }
      }
    });
    const verified = await prisma.participant.groupBy({
      by: ['electionId'],
      where: { electionId: { in: elections.map((e) => e.id) }, verifiedAt: { not: null } },
      _count: { _all: true }
    });
    const verifiedBy = new Map(verified.map((v) => [v.electionId, v._count._all]));
    return elections.map((e) => ({
      id: e.id,
      title: e.title,
      status: e.status,
      phase: phaseOf(e),
      endDate: e.endDate,
      createdAt: e.createdAt,
      candidatesCount: e.positions[0]?._count.candidates ?? 0,
      participantsCount: verifiedBy.get(e.id) ?? 0,
      votesCount: e._count.publicVotes,
      publicToken: e.publicToken
    }));
  },

  async get(admin: Admin, id: string) {
    const election = await loadOwned(admin, id);
    const [candidates, participants, counts] = await Promise.all([
      prisma.candidate.findMany({ where: { position: { electionId: id } }, orderBy: { order: 'asc' } }),
      prisma.participant.findMany({
        where: { electionId: id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, verifiedAt: true, hasVoted: true, votedAt: true }
      }),
      tally(id)
    ]);
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    return {
      id: election.id,
      title: election.title,
      description: election.description,
      status: election.status,
      phase: phaseOf(election),
      startDate: election.startDate,
      endDate: election.endDate,
      publicToken: election.publicToken,
      totalVotes: total,
      verifiedParticipants: participants.filter((p) => p.verifiedAt).length,
      candidates: candidates.map((c) => ({
        id: c.id,
        name: c.name,
        bio: c.bio,
        accessToken: c.accessToken,
        votes: counts.get(c.id) ?? 0,
        percentage: total > 0 ? Math.round(((counts.get(c.id) ?? 0) / total) * 1000) / 10 : 0
      })),
      participants
    };
  },

  async create(admin: Admin, input: z.infer<typeof createVoteSchema>) {
    const profile = await prisma.electionAdmin.upsert({
      where: { userId: admin.id },
      update: {},
      create: { userId: admin.id }
    });
    const election = await prisma.election.create({
      data: {
        title: input.title,
        description: input.description || null,
        startDate: new Date(),
        endDate: input.endDate,
        status: 'DRAFT',
        adminId: profile.id,
        positions: {
          create: {
            title: 'Choix',
            order: 1,
            maxVotes: 1,
            candidates: {
              create: input.candidates.map((c, i) => ({ name: c.name, bio: c.bio || null, order: i + 1 }))
            }
          }
        }
      }
    });
    return { id: election.id, title: election.title };
  },

  async update(admin: Admin, id: string, input: z.infer<typeof updateVoteSchema>) {
    await loadOwned(admin, id);
    const election = await prisma.election.update({
      where: { id },
      data: { title: input.title, description: input.description === undefined ? undefined : input.description || null, endDate: input.endDate }
    });
    return { id: election.id };
  },

  /** Ouvrir (DRAFT → ACTIVE) ou clore (ACTIVE → COMPLETED). Une fois clos, un vote ne se rouvre pas. */
  async setStatus(admin: Admin, id: string, action: 'open' | 'close') {
    const election = await loadOwned(admin, id);
    if (action === 'open') {
      if (election.status !== 'DRAFT') throw new UserError(409, 'Ce vote est déjà ouvert ou terminé.');
      const candidates = await prisma.candidate.count({ where: { position: { electionId: id } } });
      if (candidates < 2) throw new UserError(409, 'Ajoutez au moins 2 candidats avant d’ouvrir le vote.');
      if (election.endDate.getTime() <= Date.now()) throw new UserError(409, 'La date de fin est passée : modifiez-la avant d’ouvrir.');
      await prisma.election.update({ where: { id }, data: { status: 'ACTIVE', startDate: new Date() } });
    } else {
      if (election.status !== 'ACTIVE') throw new UserError(409, 'Seul un vote ouvert peut être clos.');
      await prisma.election.update({ where: { id }, data: { status: 'COMPLETED', endDate: new Date() } });
    }
    return { id, status: action === 'open' ? 'ACTIVE' : 'COMPLETED' };
  },

  async remove(admin: Admin, id: string) {
    await loadOwned(admin, id);
    await prisma.election.delete({ where: { id } }); // supprime aussi participants, codes et bulletins
    return { id };
  },

  /** Les candidats ne peuvent changer que tant que le vote n'est pas ouvert. */
  async addCandidate(admin: Admin, id: string, input: z.infer<typeof candidateSchema>) {
    const election = await loadOwned(admin, id);
    if (election.status !== 'DRAFT') throw new UserError(409, 'Les candidats ne se modifient plus une fois le vote ouvert.');
    const position = election.positions[0];
    const existing = await prisma.candidate.findMany({ where: { positionId: position.id }, select: { name: true, order: true } });
    if (existing.length >= 30) throw new UserError(409, '30 candidats au maximum.');
    if (existing.some((c) => c.name.toLowerCase() === input.name.toLowerCase())) throw new UserError(409, 'Un candidat porte déjà ce nom.');
    const created = await prisma.candidate.create({
      data: { name: input.name, bio: input.bio || null, positionId: position.id, order: Math.max(0, ...existing.map((c) => c.order)) + 1 }
    });
    return { id: created.id };
  },

  async updateCandidate(admin: Admin, id: string, candidateId: string, input: z.infer<typeof candidateSchema>) {
    const election = await loadOwned(admin, id);
    if (election.status !== 'DRAFT') throw new UserError(409, 'Les candidats ne se modifient plus une fois le vote ouvert.');
    const candidate = await prisma.candidate.findFirst({ where: { id: candidateId, position: { electionId: id } } });
    if (!candidate) throw new NotFoundError('Candidate');
    await prisma.candidate.update({ where: { id: candidateId }, data: { name: input.name, bio: input.bio || null } });
    return { id: candidateId };
  },

  async removeCandidate(admin: Admin, id: string, candidateId: string) {
    const election = await loadOwned(admin, id);
    if (election.status !== 'DRAFT') throw new UserError(409, 'Les candidats ne se modifient plus une fois le vote ouvert.');
    const candidate = await prisma.candidate.findFirst({ where: { id: candidateId, position: { electionId: id } } });
    if (!candidate) throw new NotFoundError('Candidate');
    await prisma.candidate.delete({ where: { id: candidateId } });
    return { id: candidateId };
  },

  /** Génère un nouveau lien privé (l'ancien cesse de fonctionner), par exemple s'il a été partagé par erreur. */
  async regenerateCandidateLink(admin: Admin, id: string, candidateId: string) {
    await loadOwned(admin, id);
    const candidate = await prisma.candidate.findFirst({ where: { id: candidateId, position: { electionId: id } } });
    if (!candidate) throw new NotFoundError('Candidate');
    const updated = await prisma.candidate.update({
      where: { id: candidateId },
      data: { accessToken: crypto.randomUUID() },
      select: { accessToken: true }
    });
    return { accessToken: updated.accessToken };
  }
};
