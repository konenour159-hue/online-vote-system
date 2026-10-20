import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { config } from '../config/env.js';
import { UserError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { sendMail, signupDecisionMail, signupRequestMail } from '../utils/mailer.js';

const SETTING_KEY = 'signups_open';

const signupSchema = z.object({
  firstName: z.string().trim().min(2, 'Saisissez votre prénom.').max(60, 'Ce prénom est trop long.'),
  lastName: z.string().trim().min(2, 'Saisissez votre nom.').max(60, 'Ce nom est trop long.'),
  email: z.string().trim().toLowerCase().email('Saisissez une adresse e-mail valide.').max(200),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir une majuscule.')
    .regex(/[a-z]/, 'Le mot de passe doit contenir une minuscule.')
    .regex(/[0-9]/, 'Le mot de passe doit contenir un chiffre.')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir un symbole (par exemple ! ? # @).')
    .max(100, 'Ce mot de passe est trop long.'),
  organisation: z.string().trim().max(120, 'Le nom de l’organisation est trop long.').optional().or(z.literal('')),
  message: z.string().trim().max(500, 'Le message est trop long (500 caractères maximum).').optional().or(z.literal(''))
});

/** Meilleur effort : un e-mail qui échoue ne doit jamais bloquer ni annuler une inscription ou une décision. */
const tryMail = async (build: () => Parameters<typeof sendMail>[0]): Promise<void> => {
  try {
    await sendMail(build());
  } catch (err) {
    logger.error('E-mail d’inscription non envoyé', err as any);
  }
};

export const signupService = {
  async isOpen(): Promise<boolean> {
    const setting = await prisma.appSetting.findUnique({ where: { key: SETTING_KEY } });
    return setting ? setting.value === 'true' : true; // ouvertes par défaut
  },

  async setOpen(open: boolean): Promise<boolean> {
    await prisma.appSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: String(open) },
      create: { key: SETTING_KEY, value: String(open) }
    });
    return open;
  },

  /**
   * Demande d'accès d'un organisateur. La réponse est identique que l'adresse soit déjà connue ou non :
   * on ne révèle pas quels e-mails ont un compte.
   */
  async request(input: unknown) {
    const parsed = signupSchema.safeParse(input);
    if (!parsed.success) throw new UserError(400, parsed.error.issues[0].message);
    if (!(await this.isOpen())) throw new UserError(403, 'Les inscriptions sont fermées pour le moment.');
    const { firstName, lastName, email, password, organisation, message } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!existing) {
      const role = await prisma.role.upsert({ where: { name: 'ELECTION_ADMIN' }, update: {}, create: { name: 'ELECTION_ADMIN' } });
      const user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          password: await bcrypt.hash(password, 12),
          roleId: role.id,
          approvalStatus: 'PENDING',
          organisation: organisation || null,
          signupMessage: message || null
        }
      });
      await prisma.auditLog.create({
        data: { userId: user.id, action: 'SIGNUP_REQUESTED', entity: 'User', entityId: user.id }
      }).catch(() => undefined);

      // Prévenir les super administrateurs (meilleur effort).
      const admins = await prisma.user.findMany({
        where: { role: { name: 'SUPER_ADMIN' }, isActive: true, approvalStatus: 'APPROVED' },
        select: { email: true }
      });
      const reviewUrl = config.public_app_url ? `${config.public_app_url}/admin/signups` : '';
      for (const admin of admins) {
        void tryMail(() => signupRequestMail(admin.email, `${firstName} ${lastName}`, email, organisation || null, reviewUrl));
      }
    }
    return { received: true };
  },

  async list(status?: string) {
    const where = { role: { name: 'ELECTION_ADMIN' }, ...(status ? { approvalStatus: status } : {}) };
    const [items, counts] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          organisation: true,
          signupMessage: true,
          approvalStatus: true,
          createdAt: true,
          reviewedAt: true
        }
      }),
      prisma.user.groupBy({ by: ['approvalStatus'], where: { role: { name: 'ELECTION_ADMIN' } }, _count: { _all: true } })
    ]);
    const count = (s: string) => counts.find((c) => c.approvalStatus === s)?._count._all ?? 0;
    return { items, counts: { pending: count('PENDING'), approved: count('APPROVED'), rejected: count('REJECTED') }, open: await this.isOpen() };
  },

  /** Valider ou refuser. Ne concerne que les comptes organisateurs : un super administrateur n'est jamais modifié ici. */
  async decide(reviewerId: string, userId: string, decision: 'approve' | 'reject') {
    const user = await prisma.user.findFirst({ where: { id: userId, role: { name: 'ELECTION_ADMIN' } } });
    if (!user) throw new NotFoundError('Account');
    const approved = decision === 'approve';
    await prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: approved ? 'APPROVED' : 'REJECTED', reviewedAt: new Date(), reviewedById: reviewerId }
    });
    if (!approved) {
      // Un accès retiré coupe aussi les sessions déjà ouvertes (renouvellement impossible).
      await prisma.refreshToken.deleteMany({ where: { userId } });
    }
    const loginUrl = config.public_app_url ? `${config.public_app_url}/login` : '';
    void tryMail(() => signupDecisionMail(user.email, user.firstName, approved, loginUrl));
    return { id: userId, approvalStatus: approved ? 'APPROVED' : 'REJECTED', name: `${user.firstName} ${user.lastName}`, email: user.email };
  }
};
