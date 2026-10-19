import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';
import { useAuthStore } from '../store/authStore';

export interface Candidacy {
  candidateId: string;
  candidateName: string;
  positionTitle: string;
  election: { id: string; title: string; status: string; startDate: string; endDate: string };
  votes: number;
  registeredVoters: number;
  percentageOfRegistered: number;
}

/** Candidatures de l'utilisateur connecté ; `live` active l'actualisation toutes les 5 secondes. */
export const useMyCandidacies = (live = false) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<Candidacy[]>({
    queryKey: ['my-candidacies'],
    queryFn: () => analyticsService.getMyCandidacies(),
    enabled: isAuthenticated,
    refetchInterval: live ? 5000 : false,
    staleTime: 60_000
  });
};
