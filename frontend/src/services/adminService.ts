import api from './api';

export interface Account {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}
export interface ManagedCandidate {
  id: string;
  name: string;
  user: Account | null;
}
export interface ManagedPosition {
  id: string;
  title: string;
  candidates: ManagedCandidate[];
}
export interface ManagedElection {
  id: string;
  title: string;
  status: string;
  positions: ManagedPosition[];
}

export const adminService = {
  getManageableElections: async (): Promise<ManagedElection[]> => (await api.get('/admin/elections')).data.data,

  searchUsers: async (search: string): Promise<Account[]> =>
    (await api.get('/admin/users', { params: { search } })).data.data,

  setCandidateAccount: async (candidateId: string, userId: string | null) =>
    (await api.put(`/admin/candidates/${candidateId}/account`, { userId })).data.data
};
