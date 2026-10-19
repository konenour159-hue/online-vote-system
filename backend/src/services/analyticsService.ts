import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export class AnalyticsService {
  async trackVoteEvent(electionId: string, voterId: string, candidateId: string) {
    try {
      logger.info('Vote tracked', { electionId, voterId, candidateId });
      // Log to analytics service (Google Analytics, Mixpanel, etc.)
      // TODO: Implement analytics tracking
    } catch (error) {
      logger.error('Failed to track vote event', error);
    }
  }

  async getElectionStats(electionId: string) {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        voters: true,
        votes: true,
        positions: {
          include: {
            candidates: {
              include: { votes: true }
            }
          }
        }
      }
    });

    if (!election) return null;

    const totalVoters = election.voters.length;
    const totalVotes = election.votes.length;
    const voterTurnout = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0;

    return {
      electionId,
      electionTitle: election.title,
      totalVoters,
      totalVotes,
      voterTurnout,
      positions: election.positions.map((position) => {
        // Le pourcentage se calcule sur les voix exprimées pour CE poste, pas sur tous les bulletins du scrutin.
        const positionTotal = position.candidates.reduce((sum, c) => sum + c.votes.length, 0);
        return {
          positionId: position.id,
          positionTitle: position.title,
          candidates: position.candidates.map((candidate) => ({
            candidateId: candidate.id,
            candidateName: candidate.name,
            votes: candidate.votes.length,
            percentage: positionTotal > 0 ? (candidate.votes.length / positionTotal) * 100 : 0
          }))
        };
      })
    };
  }

  async getUserActivityLog(userId: string, limit = 50) {
    const logs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return logs;
  }

  /** Journal d'activité de tous les utilisateurs, du plus récent au plus ancien. Sans mot de passe ni donnée de vote. */
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
          ipAddress: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, email: true } }
        }
      }),
      prisma.auditLog.count({ where })
    ]);
    return { items, total };
  }

  /**
   * Résultats personnels d'un candidat : uniquement SES voix, en pourcentage des électeurs inscrits.
   * Aucun total de votes, aucune participation et aucun chiffre d'un autre candidat n'est renvoyé :
   * dans une course à deux, ils permettraient de déduire le score de l'adversaire.
   */
  async getMyCandidacies(userId: string) {
    const candidacies = await prisma.candidate.findMany({
      where: { userId },
      include: {
        _count: { select: { votes: true } },
        position: {
          include: {
            election: { select: { id: true, title: true, status: true, startDate: true, endDate: true } }
          }
        }
      }
    });

    return Promise.all(
      candidacies.map(async (c) => {
        const registered = await prisma.voter.count({ where: { electionId: c.position.election.id } });
        const votes = c._count.votes;
        return {
          candidateId: c.id,
          candidateName: c.name,
          positionTitle: c.position.title,
          election: c.position.election,
          votes,
          registeredVoters: registered,
          percentageOfRegistered: registered > 0 ? (votes / registered) * 100 : 0
        };
      })
    );
  }

  async getSystemStats() {
    const [totalUsers, totalElections, totalVotes] = await Promise.all([
      prisma.user.count(),
      prisma.election.count(),
      prisma.vote.count()
    ]);

    return {
      totalUsers,
      totalElections,
      totalVotes,
      timestamp: new Date()
    };
  }
}

export const analyticsService = new AnalyticsService();
