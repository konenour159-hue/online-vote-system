import { useAuthStore } from '../store/authStore';

/** Nom du rôle de l'utilisateur connecté, quelle que soit la forme renvoyée par l'API. */
export const useRole = (): string | undefined => {
  const user = useAuthStore((s) => s.user) as any;
  return typeof user?.role === 'string' ? user.role : user?.role?.name;
};

export const useIsAdmin = (): boolean => {
  const role = useRole();
  return role === 'SUPER_ADMIN' || role === 'ELECTION_ADMIN';
};
