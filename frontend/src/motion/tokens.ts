/** Jetons de mouvement partagés : une seule source pour les durées, courbes et décalages. */
export const dur = { fast: 0.18, base: 0.35, slow: 0.7, hero: 0.95 } as const;

export const ease = {
  out: 'power3.out',
  expo: 'expo.out',
  inOut: 'power2.inOut',
  press: 'back.out(2.2)'
} as const;

export const stagger = { tight: 0.05, list: 0.07 } as const;

export const scroll = { start: 'top 82%' } as const;

/** Au-delà, les lignes d'une liste apparaissent sans animation individuelle. */
export const MAX_STAGGERED_ITEMS = 12;

export const REDUCED = '(prefers-reduced-motion: reduce)';
export const FULL_MOTION = '(prefers-reduced-motion: no-preference)';
