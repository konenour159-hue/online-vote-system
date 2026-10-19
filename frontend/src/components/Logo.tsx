import React from 'react';

/** Mot-symbole Genies, dérivé du logo officiel (masque PNG coloré par la couleur du texte). */
export const Logo: React.FC<{ className?: string; inverted?: boolean; height?: number }> = ({
  className,
  inverted,
  height = 20
}) => (
  <span
    role="img"
    aria-label="Genies"
    className={`inline-block bg-current ${inverted ? 'text-white' : ''} ${className || ''}`}
    style={{
      height,
      aspectRatio: '978 / 168',
      WebkitMaskImage: 'url(/genies-wordmark.png)',
      maskImage: 'url(/genies-wordmark.png)',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'left center',
      maskPosition: 'left center'
    }}
  />
);
