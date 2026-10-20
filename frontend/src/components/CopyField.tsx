import React, { useId, useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** Lien en lecture seule avec un bouton « Copier » (retour visuel et annoncé aux lecteurs d'écran). */
export const CopyField: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const id = useId();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Navigateur sans API presse-papiers : on sélectionne le champ pour une copie manuelle.
      (document.getElementById(id) as HTMLInputElement | null)?.select();
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="h-11 min-w-0 flex-1 rounded-md border border-line bg-surface px-3 text-sm"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md border border-ink/30 px-4 text-sm font-semibold hover:bg-ink/5"
        >
          {copied ? <Check className="h-4 w-4 text-ok" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
      <p role="status" className="sr-only">
        {copied ? 'Lien copié dans le presse-papiers' : ''}
      </p>
    </div>
  );
};
