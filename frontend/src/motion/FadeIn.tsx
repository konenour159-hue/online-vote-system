import React, { useRef } from 'react';
import { gsap, useGSAP } from './gsap';
import { dur, ease, FULL_MOTION } from './tokens';

/**
 * Apparition discrète pour les messages (erreurs, confirmations).
 * Opacité et léger décalage uniquement : aucun contrôle voisin ne bouge.
 */
export const FadeIn: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        gsap.from(ref.current, { opacity: 0, y: -4, duration: dur.base, ease: ease.out, clearProps: 'all' });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
};
