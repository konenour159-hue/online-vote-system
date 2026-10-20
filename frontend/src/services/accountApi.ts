import axios from 'axios';
import api from './api';

const base: string = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

/** Client des appels publics d'authentification (sans intercepteurs : une erreur ici ne renvoie jamais vers la connexion). */
const authPublicApi = axios.create({ baseURL: `${base}/api/auth`, headers: { 'Content-Type': 'application/json' } });

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SignupRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organisation: string | null;
  signupMessage: string | null;
  approvalStatus: ApprovalStatus;
  createdAt: string;
  reviewedAt: string | null;
}
export interface SignupList {
  items: SignupRequest[];
  counts: { pending: number; approved: number; rejected: number };
  open: boolean;
}
export interface NewSignup {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organisation?: string;
  message?: string;
}

export const accountService = {
  signupStatus: async (): Promise<{ open: boolean }> => (await authPublicApi.get('/signup-status')).data.data,
  requestSignup: async (payload: NewSignup) => (await authPublicApi.post('/signup', payload)).data.data,

  // Super administrateur
  listSignups: async (status?: ApprovalStatus): Promise<SignupList> =>
    (await api.get('/admin/signups', { params: { status } })).data.data,
  approve: async (id: string) => (await api.post(`/admin/signups/${id}/approve`)).data.data,
  reject: async (id: string) => (await api.post(`/admin/signups/${id}/reject`)).data.data,
  setOpen: async (open: boolean) => (await api.put('/admin/signups/settings', { open })).data.data as { open: boolean }
};
