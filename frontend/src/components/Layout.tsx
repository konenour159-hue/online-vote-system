import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { gsap, useGSAP } from '../motion/gsap';
import { dur, ease, FULL_MOTION } from '../motion/tokens';

export const Layout: React.FC<{ children: React.ReactNode; animate?: boolean }> = ({ children, animate = true }) => {
  const main = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // Transition de page : fondu court sur le contenu, jamais de blocage de l'interaction.
  useGSAP(
    () => {
      if (!animate) return;
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        gsap.from(main.current, { opacity: 0, y: 8, duration: dur.base, ease: ease.out, clearProps: 'all' });
      });
      return () => mm.revert();
    },
    { scope: main }
  );

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col">
      <main ref={main} id="main" data-route={pathname} tabIndex={-1} className="mx-auto focus:outline-none w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
      <Footer />
    </div>
  );
};
