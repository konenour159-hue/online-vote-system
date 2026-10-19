import { useSyncExternalStore } from 'react';

const subscribe = (callback: () => void) => {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
};

/** `true` tant que le navigateur se déclare connecté. */
export const useOnlineStatus = (): boolean => useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
