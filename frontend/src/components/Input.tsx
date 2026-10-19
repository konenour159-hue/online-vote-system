import React, { forwardRef, useId } from 'react';
import { FadeIn } from '../motion/FadeIn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, id, ...props }, ref) => {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`h-11 w-full rounded-md border bg-surface px-3 text-base placeholder:text-muted/70
          ${error ? 'border-bad' : 'border-line hover:border-smoke'} ${className || ''}`}
        {...props}
      />
      {error && (
        <FadeIn id={`${inputId}-error`} className="mt-1.5 text-sm text-bad">
          {error}
        </FadeIn>
      )}
    </div>
  );
});
Input.displayName = 'Input';
