import api from './api';

export type VoteStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type AccessMode = 'APPROVAL' | 'EMAIL_CODE';

export interface VoteSummary {
  id: string;
  title: string;
  status: VoteStatus;
  phase: 'not_open' | 'open' | 'closed';
  endDate: string;
  createdAt: string;
  candidatesCount: number;
  participantsCount: number;
  votesCount: number;
  pendingCount: number;
  accessMode: AccessMode;
  publicToken: string;
}
export interface VoteCandidate {
  id: string;
  name: string;
  bio: string | null;
  accessToken: string;
  votes: number;
  percentage: number;
}
export interface Participant {
  id: string;
  name: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestMessage: string | null;
  createdAt: string;
  decidedAt: string | null;
  verifiedAt: string | null;
  hasVoted: boolean;
  votedAt: string | null;
}
export interface VoteDetail {
  id: string;
  title: string;
  description: string | null;
  status: VoteStatus;
  phase: 'not_open' | 'open' | 'closed';
  startDate: string;
  endDate: string;
  accessMode: AccessMode;
  emailAvailable: boolean;
  pendingCount: number;
  publicToken: string;
  totalVotes: number;
  verifiedParticipants: number;
  candidates: VoteCandidate[];
  participants: Participant[];
}
export interface NewVote {
  title: string;
  description?: string;
  endDate: string;
  accessMode?: AccessMode;
  candidates: Array<{ name: string; bio?: string }>;
}

export const adminService = {
  capabilities: async (): Promise<{ emailAvailable: boolean }> => (await api.get('/admin/capabilities')).data.data,
  list: async (): Promise<VoteSummary[]> => (await api.get('/admin/votes')).data.data,
  get: async (id: string): Promise<VoteDetail> => (await api.get(`/admin/votes/${id}`)).data.data,
  create: async (vote: NewVote): Promise<{ id: string }> => (await api.post('/admin/votes', vote)).data.data,
  approveParticipant: async (id: string, participantId: string) => (await api.post(`/admin/votes/${id}/participants/${participantId}/approve`)).data.data,
  rejectParticipant: async (id: string, participantId: string) => (await api.post(`/admin/votes/${id}/participants/${participantId}/reject`)).data.data,
  approveAll: async (id: string): Promise<{ approved: number }> => (await api.post(`/admin/votes/${id}/participants/approve-all`)).data.data,
  update: async (id: string, patch: { title?: string; description?: string; endDate?: string; accessMode?: AccessMode }) =>
    (await api.put(`/admin/votes/${id}`, patch)).data.data,
  remove: async (id: string) => (await api.delete(`/admin/votes/${id}`)).data,
  open: async (id: string) => (await api.post(`/admin/votes/${id}/open`)).data.data,
  close: async (id: string) => (await api.post(`/admin/votes/${id}/close`)).data.data,
  addCandidate: async (id: string, c: { name: string; bio?: string }) => (await api.post(`/admin/votes/${id}/candidates`, c)).data.data,
  updateCandidate: async (id: string, candidateId: string, c: { name: string; bio?: string }) =>
    (await api.put(`/admin/votes/${id}/candidates/${candidateId}`, c)).data.data,
  removeCandidate: async (id: string, candidateId: string) => (await api.delete(`/admin/votes/${id}/candidates/${candidateId}`)).data,
  regenerateLink: async (id: string, candidateId: string): Promise<{ accessToken: string }> =>
    (await api.post(`/admin/votes/${id}/candidates/${candidateId}/regenerate-link`)).data.data
};

/** Lien partagé avec le public. */
export const audienceLink = (token: string) => `${window.location.origin}/v/${token}`;
/** Lien privé d'un candidat. */
export const candidateLink = (accessToken: string) => `${window.location.origin}/c/${accessToken}`;
