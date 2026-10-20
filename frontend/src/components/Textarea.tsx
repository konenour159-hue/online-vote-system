import React, { forwardRef, useId } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, hint, className, id, ...props }, ref) => {
  const autoId = useId();
  const textId = id || autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textId} className="mb-1.5 block text-sm font-semibold">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textId}
        aria-describedby={hint ? `${textId}-hint` : undefined}
        className={`min-h-24 w-full rounded-md border border-line bg-surface px-3 py-2 text-base placeholder:text-muted/70 hover:border-smoke ${className || ''}`}
        {...props}
      />
      {hint && (
        <p id={`${textId}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
});
Textarea.displayName = 'Textarea';
