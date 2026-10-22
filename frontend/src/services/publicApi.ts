import axios from 'axios';

/**
 * Client des pages publiques (vote et candidat). Volontairement SANS les intercepteurs du client principal :
 * une erreur 401 ici (session de vote expirée) ne doit jamais renvoyer vers la connexion administrateur,
 * et aucun jeton d'administrateur ne doit être envoyé.
 */
const base: string = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

export const publicApi = axios.create({ baseURL: `${base}/api/public`, headers: { 'Content-Type': 'application/json' } });

/** Message lisible à afficher à partir d'une erreur réseau ou serveur. */
export const errorText = (err: any, fallback = 'Une erreur est survenue. Réessayez dans un instant.'): string => {
  if (!err?.response) return 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.';
  const { status, data } = err.response;
  // Le serveur marque lui-même les messages rédigés pour l'utilisateur.
  if (data?.userFacing && data?.message) return data.message;
  if (status === 429) return 'Trop de tentatives. Patientez un moment puis réessayez.';
  if (status === 404) return 'Ce lien n’est pas valide ou n’existe plus.';
  if (status === 401) return 'Votre session a expiré. Reconnectez-vous et réessayez.';
  if (status === 403) return 'Vous n’avez pas accès à cette page.';
  return fallback;
};

export interface PublicVote {
  title: string;
  description: string | null;
  phase: 'not_open' | 'open' | 'closed';
  accessMode: 'APPROVAL' | 'EMAIL_CODE';
  endDate: string;
  candidates: Array<{ id: string; name: string; bio: string | null; photo: string | null }>;
}
export interface PublicResults {
  title: string;
  totalVotes: number;
  results: Array<{ id: string; name: string; votes: number; percentage: number }>;
}
export interface CandidateView {
  candidateName: string;
  voteTitle: string;
  phase: 'not_open' | 'open' | 'closed';
  endDate: string;
  votes: number;
  percentage: number;
}

export const publicVoteService = {
  getVote: async (token: string): Promise<PublicVote> => (await publicApi.get(`/votes/${token}`)).data.data,
  join: async (token: string, name: string, email: string, message: string) =>
    (await publicApi.post(`/votes/${token}/join`, { name, email, message })).data.data as { participantToken: string; status: 'PENDING' },
  joinStatus: async (token: string, participantToken: string) =>
    (await publicApi.post(`/votes/${token}/join-status`, { participantToken })).data.data as {
      status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'VOTED';
      name: string;
      phase: 'not_open' | 'open' | 'closed';
      session?: string;
    },
  identify: async (token: string, name: string, email: string) =>
    (await publicApi.post(`/votes/${token}/identify`, { name, email })).data.data as { sent: boolean; resendAfterSeconds: number; expiresInMinutes: number },
  verify: async (token: string, email: string, code: string) =>
    (await publicApi.post(`/votes/${token}/verify`, { email, code })).data.data as { session: string; name: string },
  castBallot: async (token: string, session: string, candidateId: string) =>
    (await publicApi.post(`/votes/${token}/ballot`, { candidateId }, { headers: { Authorization: `Bearer ${session}` } })).data.data,
  getResults: async (token: string): Promise<PublicResults> => (await publicApi.get(`/votes/${token}/results`)).data.data,
  getCandidateView: async (accessToken: string): Promise<CandidateView> =>
    (await publicApi.get(`/candidates/${accessToken}`)).data.data
};
