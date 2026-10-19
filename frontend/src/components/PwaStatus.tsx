import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { FadeIn } from '../motion/FadeIn';

const box =
  'pointer-events-auto rounded-lg border border-line bg-surface p-4 text-sm shadow-[0_12px_32px_-12px_rgb(var(--ink)/0.4)]';

/**
 * Messages liés à l'application installable :
 * - hors ligne : on prévient que voter et les résultats ont besoin du réseau ;
 * - nouvelle version : l'utilisateur choisit quand actualiser (jamais de rechargement automatique) ;
 * - première mise en cache : on indique que l'application s'ouvre sans connexion.
 */
export const PwaStatus: React.FC = () => {
  const online = useOnlineStatus();
  const [offlineReadyShown, setOfflineReadyShown] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker
  } = useRegisterSW();

  useEffect(() => {
    if (!offlineReady) return;
    setOfflineReadyShown(true);
    const t = window.setTimeout(() => {
      setOfflineReady(false);
      setOfflineReadyShown(false);
    }, 6000);
    return () => window.clearTimeout(t);
  }, [offlineReady, setOfflineReady]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-3 p-4">
      {!online && (
        <FadeIn role="status" className={`${box} w-full max-w-md`}>
          <p className="font-semibold">Vous êtes hors ligne</p>
          <p className="mt-1 text-muted">
            Vous pouvez parcourir l’application, mais voter et suivre les résultats demandent une connexion.
          </p>
        </FadeIn>
      )}
      {needRefresh && (
        <FadeIn role="status" className={`${box} w-full max-w-md`}>
          <p className="font-semibold">Une nouvelle version est disponible</p>
          <p className="mt-1 text-muted">Actualisez quand vous êtes prêt, par exemple après avoir validé votre bulletin.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="h-10 rounded-md bg-brand px-4 font-semibold text-brand-fg hover:bg-brand/90"
            >
              Actualiser
            </button>
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="h-10 rounded-md px-4 font-semibold hover:bg-ink/10"
            >
              Plus tard
            </button>
          </div>
        </FadeIn>
      )}
      {offlineReadyShown && !needRefresh && (
        <FadeIn role="status" className={`${box} w-full max-w-md`}>
          L’application est prête : elle s’ouvrira même sans connexion.
        </FadeIn>
      )}
    </div>
  );
};
