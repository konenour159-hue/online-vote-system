import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthorizationError, NotFoundError } from '../utils/errors.js';

/**
 * Contrôle d'accès aux résultats d'un scrutin (route avec `:electionId`, après `authenticate`).
 * - SUPER_ADMIN : toujours.
 * - ELECTION_ADMIN : uniquement pour les scrutins qu'il administre.
 * - Tout autre utilisateur connecté : seulement une fois le scrutin clos (COMPLETED).
 * Un candidat suit ses propres résultats via /analytics/me/candidacy, à tout moment.
 */
export const authorizeResultsAccess = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    throw new AuthorizationError('User not authenticated');
  }

  const { electionId } = req.params;
  const [election, user] = await Promise.all([
    prisma.election.findUnique({
      where: { id: electionId },
      select: { status: true, admin: { select: { userId: true } } }
    }),
    prisma.user.findUnique({ where: { id: req.user.userId }, include: { role: true } })
  ]);

  if (!election) {
    throw new NotFoundError('Election');
  }
  if (!user || !user.role) {
    throw new AuthorizationError('User role not found');
  }

  const role = user.role.name;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isOwnerAdmin = role === 'ELECTION_ADMIN' && election.admin?.userId === user.id;

  if (isSuperAdmin || isOwnerAdmin || election.status === 'COMPLETED') {
    next();
    return;
  }

  throw new AuthorizationError('Results are available once the election is closed');
};
