import React, { useState } from 'react';
import { popSelected } from '../motion/usePressPop';

const candidates = ['Alice Johnson', 'Bob Smith', 'Carol White'];

export const DemoBallot: React.FC = () => {
  const [choice, setChoice] = useState<string | null>(null);
  const [stamped, setStamped] = useState(false);

  const reset = () => {
    setChoice(null);
    setStamped(false);
  };

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="relative rounded-lg border border-line bg-surface shadow-[0_18px_40px_-18px_rgb(var(--ink)/0.35)]">
        <div className="p-6 pb-5">
          <p className="text-sm text-muted">Bulletin d’exemple</p>
          <h2 className="mt-1 text-2xl font-bold">Président</h2>
          <p className="mt-1 text-sm text-muted">Choisissez un candidat.</p>

          <fieldset className="mt-5 space-y-2" disabled={stamped}>
            <legend className="sr-only">Candidats au poste de président</legend>
            {candidates.map((name) => {
              const selected = choice === name;
              return (
                <label
                  key={name}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-smoke
                    ${selected ? 'border-ink bg-ink/5' : 'border-line hover:border-smoke'}`}
                >
                  <input
                    type="radio"
                    name="demo-president"
                    className="sr-only"
                    checked={selected}
                    onChange={(e) => {
                      setChoice(name);
                      popSelected(e.currentTarget.closest('label'));
                    }}
                  />
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 ${
                      selected ? 'border-ink' : 'border-line'
                    }`}
                    aria-hidden="true"
                  >
                    {selected && (
                      <svg viewBox="0 0 24 24" className="h-5 w-5 text-ink">
                        <path
                          d="M4 13l5 5L20 6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="30"
                          strokeDashoffset="30"
                          className="animate-tick"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="font-semibold">{name}</span>
                </label>
              );
            })}
          </fieldset>
        </div>

        <div className="relative">
          <div className="border-t-2 border-dashed border-line" />
          <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border border-line bg-paper" aria-hidden="true" />
          <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full border border-line bg-paper" aria-hidden="true" />
        </div>

        <div className="flex items-center justify-between gap-3 p-6 pt-5">
          {stamped ? (
            <>
              <p className="text-sm text-muted">Démonstration uniquement. Rien n’a été enregistré.</p>
              <button onClick={reset} className="text-sm font-semibold underline underline-offset-4">
                Réessayer
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted" aria-live="polite">
                {choice ? `Vous avez choisi ${choice}.` : 'Aucun choix pour l’instant.'}
              </p>
              <button
                onClick={() => setStamped(true)}
                disabled={!choice}
                className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Valider le bulletin
              </button>
            </>
          )}
        </div>

        {stamped && (
          <div
            className="pointer-events-none absolute right-5 top-24 animate-stamp rounded-md border-[3px] border-spark px-4 py-1.5 font-display text-3xl font-extrabold text-spark"
            style={{ textShadow: '0 0 0 currentColor', background: 'rgb(var(--surface) / 0.85)' }}
            role="status"
          >
            Compté
          </div>
        )}
      </div>
    </div>
  );
};
