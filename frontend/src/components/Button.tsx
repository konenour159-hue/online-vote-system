import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const variantClasses = {
  primary: 'bg-brand text-brand-fg hover:bg-brand/90',
  secondary: 'bg-ink/10 text-ink hover:bg-ink/15',
  outline: 'border border-ink/30 text-ink hover:bg-ink/5',
  ghost: 'text-ink hover:bg-ink/10'
};

export const sizeClasses = {
  sm: 'h-10 px-3 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-12 px-7 text-base'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className,
  ...props
}) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-[background-color,transform] duration-150 active:scale-[0.98]
      disabled:cursor-not-allowed disabled:opacity-50
      ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
    {children}
  </button>
);
