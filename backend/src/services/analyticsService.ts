import { prisma } from '../config/database.js';

export class AnalyticsService {
  async getUserActivityLog(userId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /** Journal d'activité de tous les utilisateurs, du plus récent au plus ancien. Sans mot de passe. */
  async getAllActivity(limit = 50, action?: string) {
    const where = action ? { action } : {};
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          action: true,
          entity: true,
          ipAddress: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, email: true } }
        }
      }),
      prisma.auditLog.count({ where })
    ]);
    return { items, total };
  }

  async getSystemStats() {
    const [totalElections, totalParticipants, totalVotes, totalAdmins] = await Promise.all([
      prisma.election.count(),
      prisma.participant.count({ where: { verifiedAt: { not: null } } }),
      prisma.publicVote.count(),
      prisma.user.count()
    ]);
    return { totalElections, totalParticipants, totalVotes, totalAdmins };
  }
}

export const analyticsService = new AnalyticsService();
