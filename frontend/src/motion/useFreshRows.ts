import { RefObject, useRef } from 'react';
import { gsap, useGSAP } from './gsap';
import { dur, ease, FULL_MOTION, MAX_STAGGERED_ITEMS, stagger } from './tokens';

const HIGHLIGHT = 'rgba(255, 183, 3, 0.25)';

/**
 * Anime les lignes d'une liste d'activité.
 * - Premier affichage (ou changement de `resetKey`, par ex. un filtre) : cascade courte.
 * - Nouvelle ligne plus récente que tout ce qui est affiché : entre par le haut et se signale un instant.
 * - Ligne plus ancienne (« afficher plus ») : simple apparition, sans signal.
 * Chaque ligne doit porter `data-row`, `data-key` (identifiant stable) et `data-time` (date ISO).
 */
export const useFreshRows = (list: RefObject<HTMLElement | null>, data: unknown, resetKey: string = '') => {
  const seen = useRef<Set<string>>(new Set());
  const newest = useRef('');
  const lastReset = useRef(resetKey);

  useGSAP(
    () => {
      const root = list.current;
      if (!root) return;
      if (lastReset.current !== resetKey) {
        seen.current.clear();
        newest.current = '';
        lastReset.current = resetKey;
      }
      const rows = gsap.utils.toArray<HTMLElement>('[data-row]', root);
      if (!rows.length) return;

      const firstLoad = seen.current.size === 0;
      const previousNewest = newest.current;
      const fresh = rows.filter((r) => !seen.current.has(r.dataset.key || ''));
      rows.forEach((r) => {
        seen.current.add(r.dataset.key || '');
        const t = r.dataset.time || '';
        if (t > newest.current) newest.current = t;
      });
      if (!fresh.length) return;

      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        const base = { duration: dur.slow, ease: ease.out, stagger: stagger.tight, clearProps: 'all' };
        if (firstLoad) {
          gsap.from(fresh.slice(0, MAX_STAGGERED_ITEMS), { opacity: 0, y: 12, ...base });
          return;
        }
        const newer = fresh.filter((r) => (r.dataset.time || '') > previousNewest);
        const older = fresh.filter((r) => (r.dataset.time || '') <= previousNewest);
        if (newer.length) {
          gsap.from(newer.slice(0, MAX_STAGGERED_ITEMS), { opacity: 0, y: -10, backgroundColor: HIGHLIGHT, ...base });
        }
        if (older.length) gsap.from(older.slice(0, MAX_STAGGERED_ITEMS), { opacity: 0, y: 12, ...base });
      });
      return () => mm.revert();
    },
    { dependencies: [data, resetKey], scope: list }
  );
};
