import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const titles: Array<[string, string]> = [
  ['/admin/candidates', 'Candidats'],
  ['/admin/activity', 'Activité'],
  ['/admin', 'Administration'],
  ['/candidacy', 'Ma candidature'],
  ['/results/', 'Résultats'],
  ['/elections/', 'Bulletin de vote'],
  ['/dashboard', 'Scrutins'],
  ['/login', 'Se connecter']
];

const titleFor = (path: string): string => {
  const hit = titles.find(([prefix]) => (prefix.endsWith('/') ? path.startsWith(prefix) : path === prefix));
  return hit ? `${hit[1]} · Genies` : 'Genies · Vote';
};

/**
 * Pour les lecteurs d'écran et le clavier, dans une application à page unique :
 * - le titre du document change à chaque page ;
 * - après une navigation, le focus passe au contenu principal et la page revient en haut.
 */
export const RouteEffects: React.FC = () => {
  const { pathname } = useLocation();
  const previous = useRef(pathname);

  useEffect(() => {
    document.title = titleFor(pathname);
    // Pas de déplacement du focus au chargement initial ni quand la page ne change pas.
    if (previous.current === pathname) return;
    previous.current = pathname;

    window.scrollTo(0, 0);
    let tries = 0;
    const timer = window.setInterval(() => {
      // Seule la page de la nouvelle route compte : l'ancienne peut rester un instant pendant le chargement.
      const main = document.querySelector<HTMLElement>(`main[data-route="${pathname}"]`);
      const ready = !!main && getComputedStyle(main).visibility !== 'hidden';
      if (ready || ++tries > 40) {
        window.clearInterval(timer);
        if (ready) main!.focus({ preventScroll: true });
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [pathname]);

  return null;
};
