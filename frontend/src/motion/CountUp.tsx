import React, { useRef } from 'react';
import { gsap, useGSAP } from './gsap';
import { dur, ease, FULL_MOTION } from './tokens';

const motionAllowed = () => window.matchMedia(FULL_MOTION).matches;

/**
 * Affiche toujours la vraie valeur : le texte final est rendu par React,
 * l'animation ne fait que compter jusqu'à lui quand le mouvement est autorisé.
 * Quand la valeur change (mise à jour en direct), le compteur part de l'ancienne valeur.
 */
export const CountUp: React.FC<{ value: number; suffix?: string; decimals?: number }> = ({
  value,
  suffix = '',
  decimals = 0
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const fmt = (n: number) => `${n.toFixed(decimals).replace('.', ',')}${suffix}`;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const from = previous.current;
      // Sans animation : on retient tout de suite la valeur affichée pour la prochaine mise à jour.
      if (!motionAllowed()) previous.current = value;
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        const state = { n: from };
        gsap.to(state, {
          n: value,
          duration: from === 0 ? dur.slow + 0.2 : dur.slow,
          ease: ease.out,
          onUpdate: () => {
            previous.current = state.n; // dernière valeur réellement affichée (robuste au double montage de React)
            el.textContent = fmt(state.n);
          },
          onComplete: () => {
            previous.current = value;
            el.textContent = fmt(value);
          }
        });
      });
      return () => {
        mm.revert();
        el.textContent = fmt(value);
      };
    },
    { dependencies: [value, suffix, decimals], scope: ref }
  );

  return <span ref={ref}>{fmt(value)}</span>;
};
