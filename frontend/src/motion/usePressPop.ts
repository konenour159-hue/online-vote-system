import { gsap, prefersReducedMotion } from './gsap';
import { dur, ease } from './tokens';

/** Petit rebond quand une option est choisie. L'état choisi reste porté par le style, pas par l'animation. */
export const popSelected = (el: Element | null) => {
  if (!el || prefersReducedMotion()) return;
  gsap.fromTo(el, { scale: 0.985 }, { scale: 1, duration: dur.base, ease: ease.press, clearProps: 'transform' });
};
