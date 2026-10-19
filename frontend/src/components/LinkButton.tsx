import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { variantClasses, sizeClasses } from './Button';

interface LinkButtonProps extends LinkProps {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
}

/** Lien qui a l'aspect d'un bouton : un seul élément interactif, donc un seul arrêt au clavier. */
export const LinkButton: React.FC<LinkButtonProps> = ({ variant = 'primary', size = 'md', className, ...props }) => (
  <Link
    className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-[background-color,transform] duration-150 active:scale-[0.98] ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`}
    {...props}
  />
);
