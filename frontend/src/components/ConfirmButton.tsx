import React, { useState } from 'react';

interface ConfirmButtonProps {
  children: React.ReactNode;
  /** Question posée avant l'action, par exemple « Ouvrir le vote maintenant ? » */
  question: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<unknown>;
  disabled?: boolean;
  tone?: 'normal' | 'danger';
  className?: string;
}

/** Action irréversible en deux temps : un premier clic demande confirmation, le second exécute. */
export const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  children,
  question,
  confirmLabel,
  onConfirm,
  disabled,
  tone = 'normal',
  className
}) => {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAsking(true)}
        className={`inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold disabled:opacity-50 ${
          tone === 'danger' ? 'border border-bad/50 text-bad hover:bg-bad/10' : 'bg-brand text-brand-fg hover:bg-brand/90'
        } ${className || ''}`}
      >
        {children}
      </button>
    );
  }

  return (
    <span role="group" aria-label={question} className="inline-flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface p-2">
      <span className="px-1 text-sm font-semibold">{question}</span>
      <button
        type="button"
        autoFocus
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onConfirm();
          } finally {
            setBusy(false);
            setAsking(false);
          }
        }}
        className={`h-9 rounded-md px-3 text-sm font-semibold disabled:opacity-50 ${
          tone === 'danger' ? 'bg-bad text-white hover:opacity-90' : 'bg-brand text-brand-fg hover:bg-brand/90'
        }`}
      >
        {confirmLabel}
      </button>
      <button type="button" disabled={busy} onClick={() => setAsking(false)} className="h-9 rounded-md px-3 text-sm font-semibold hover:bg-ink/10">
        Annuler
      </button>
    </span>
  );
};
