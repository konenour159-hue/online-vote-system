import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/index.js';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/response.js';
import { AuthorizationError, ConflictError, NotFoundError, ValidationError } from '../utils/errors.js';
import { recordAudit } from '../utils/audit.js';

/** Rôle de l'utilisateur connecté (SUPER_ADMIN ou ELECTION_ADMIN : garanti par la route). */
const currentAdmin = async (req: Request) => {
  if (!req.user) throw new ValidationError('User not authenticated');
  const user = await prisma.user.findUnique({ where: { id: req.user.userId }, include: { role: true } });
  if (!user || !user.role) throw new AuthorizationError('User role not found');
  return { id: user.id, role: user.role.name };
};

/** Un SUPER_ADMIN gère tout ; un ELECTION_ADMIN seulement les scrutins qu'il administre. */
const ownershipFilter = (admin: { id: string; role: string }) =>
  admin.role === 'SUPER_ADMIN' ? {} : { admin: { userId: admin.id } };

const accountSelect = { id: true, firstName: true, lastName: true, email: true } as const;

export const listManageableElections = asyncHandler(async (req: Request, res: Response) => {
  const admin = await currentAdmin(req);
  const elections = await prisma.election.findMany({
    where: ownershipFilter(admin),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      positions: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          candidates: {
            orderBy: { order: 'asc' },
            select: { id: true, name: true, user: { select: accountSelect } }
          }
        }
      }
    }
  });
  sendSuccess(res, 200, 'Manageable elections retrieved', elections);
});

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  await currentAdmin(req);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }
        : {})
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: 8,
    select: accountSelect
  });
  sendSuccess(res, 200, 'Users retrieved', users);
});

const linkSchema = z.object({ userId: z.string().min(1).nullable() });

export const setCandidateAccount = asyncHandler(async (req: Request, res: Response) => {
  const admin = await currentAdmin(req);
  const parsed = linkSchema.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('userId must be a user id or null');
  const { userId } = parsed.data;

  const candidate = await prisma.candidate.findUnique({
    where: { id: req.params.id },
    include: { position: { include: { election: { select: { id: true, admin: { select: { userId: true } } } } } } }
  });
  if (!candidate) throw new NotFoundError('Candidate');

  const election = candidate.position.election;
  if (admin.role !== 'SUPER_ADMIN' && election.admin?.userId !== admin.id) {
    throw new AuthorizationError('You do not manage this election');
  }

  if (userId) {
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isActive: true } });
    if (!target || !target.isActive) throw new NotFoundError('User');

    // Un même compte ne peut pas représenter deux candidats du même poste.
    const duplicate = await prisma.candidate.findFirst({
      where: { userId, positionId: candidate.positionId, id: { not: candidate.id } },
      select: { name: true }
    });
    if (duplicate) throw new ConflictError(`This account is already linked to ${duplicate.name} for this position`);
  }

  const updated = await prisma.candidate.update({
    where: { id: candidate.id },
    data: { userId },
    select: { id: true, name: true, user: { select: accountSelect } }
  });

  recordAudit(admin.id, userId ? 'CANDIDATE_ACCOUNT_LINKED' : 'CANDIDATE_ACCOUNT_UNLINKED', req, {
    entity: 'Candidate',
    entityId: candidate.id,
    electionId: election.id,
    changes: { candidate: candidate.name, linkedUserId: userId, previousUserId: candidate.userId }
  });

  sendSuccess(res, 200, userId ? 'Candidate account linked' : 'Candidate account unlinked', updated);
});
