import { Request } from 'express';
import { prisma } from '../config/database.js';
import { logger } from './logger.js';

interface AuditTarget {
  entity?: string;
  entityId?: string;
  electionId?: string;
  changes?: Record<string, unknown>;
}

/**
 * Enregistre une action dans le journal d'activité.
 * Ne bloque jamais la requête et n'échoue jamais : une erreur de journal est simplement consignée.
 */
export const recordAudit = (userId: string, action: string, req: Request, target: AuditTarget = {}): void => {
  prisma.auditLog
    .create({
      data: {
        userId,
        action,
        entity: target.entity ?? 'User',
        entityId: target.entityId ?? userId,
        electionId: target.electionId,
        changes: target.changes ? JSON.stringify(target.changes) : undefined,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || undefined
      }
    })
    .catch((err: unknown) => logger.error?.('Journal d’activité : écriture impossible', err as any));
};
