import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { Header } from '../components/Header';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { electionService } from '../services/electionService';
import api from '../services/api';
import { FadeIn } from '../motion/FadeIn';
import { popSelected } from '../motion/usePressPop';
import { useIsAdmin } from '../hooks/useRole';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const ElectionPage: React.FC = () => {
  const { id = '' } = useParams();
  const isAdmin = useIsAdmin();
  const online = useOnlineStatus();
  const { data: election, isLoading, isError } = useQuery({
    queryKey: ['election', id],
    queryFn: () => electionService.getElection(id)
  });
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const positions: any[] = (election as any)?.positions ?? [];
  const pending = positions.filter((p) => choices[p.id] && !done[p.id]);
  const allDone = positions.length > 0 && positions.every((p) => done[p.id]);

  const submit = async () => {
    setSubmitting(true);
    const nextErrors: Record<string, string> = {};
    const nextDone = { ...done };
    for (const p of pending) {
      try {
        await api.post('/votes', { electionId: id, positionId: p.id, candidateId: choices[p.id] });
        nextDone[p.id] = true;
      } catch (err: any) {
        nextErrors[p.id] = err.response?.status === 409 || /already/i.test(err.response?.data?.message || '') ? 'Vous avez déjà voté pour ce poste.' : 'Ce vote n’a pas abouti. Vérifiez que le scrutin est ouvert, puis réessayez.';
      }
    }
    setDone(nextDone);
    setErrors(nextErrors);
    setSubmitting(false);
  };

  return (
    <>
      <Header />
      <Layout>
        <Link to="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
          Retour aux scrutins
        </Link>

        {isLoading && <p className="mt-8 text-muted">Chargement du bulletin…</p>}
        {isError && (
          <p role="alert" className="mt-8 text-bad">
            Impossible de charger ce scrutin. Revenez en arrière et rouvrez-le.
          </p>
        )}

        {election && (
          <div className="mt-6 max-w-2xl">
            <h1 className="text-4xl font-extrabold md:text-5xl">{(election as any).title}</h1>
            <p className="mt-3">
              <StatusBadge status={(election as any).status} />
            </p>

            {allDone ? (
              <FadeIn className="mt-10 flex gap-4 rounded-lg border border-ok/40 bg-ok/10 p-6" role="status">
                <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-ok" aria-hidden="true" />
                <div>
                  <h2 className="text-2xl font-bold">Votre bulletin est enregistré</h2>
                  <p className="mt-1 text-muted">
                    Merci d’avoir voté. Les résultats seront publiés à la clôture du scrutin.
                  </p>
                  {(isAdmin || (election as any).status === 'COMPLETED') && (
                    <Link to={`/results/${id}`} className="mt-3 inline-block font-semibold underline underline-offset-4">
                      Voir les résultats
                    </Link>
                  )}
                </div>
              </FadeIn>
            ) : (
              <>
                {(election as any).status !== 'ACTIVE' && (
                  <p role="status" className="mt-8 rounded-md border border-line bg-surface p-4 text-sm">
                    Ce scrutin n’est pas ouvert au vote pour le moment. Vous pourrez remplir votre bulletin dès son ouverture.
                  </p>
                )}
                <div className="mt-10 space-y-10">
                  {positions.map((p) => (
                    <fieldset key={p.id} disabled={done[p.id]} className="border-t border-line pt-6">
                      <legend className="pr-4 font-display text-2xl font-bold">{p.title}</legend>
                      {p.description && <p className="mt-1 text-muted">{p.description}</p>}
                      <div className="mt-4 space-y-2">
                        {p.candidates?.map((c: any) => {
                          const selected = choices[p.id] === c.id;
                          return (
                            <label
                              key={c.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition-colors
                                ${selected ? 'border-ink bg-ink/5' : 'border-line hover:border-smoke'}`}
                            >
                              <input
                                type="radio"
                                name={`position-${p.id}`}
                                className="mt-1.5 h-4 w-4 accent-[rgb(var(--ink))]"
                                checked={selected}
                                onChange={(e) => {
                                  setChoices((s) => ({ ...s, [p.id]: c.id }));
                                  popSelected(e.currentTarget.closest('label'));
                                }}
                              />
                              <span>
                                <span className="block font-semibold">{c.name}</span>
                                {c.bio && <span className="block text-sm text-muted">{c.bio}</span>}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {done[p.id] && <FadeIn className="mt-3 text-sm font-semibold text-ok">Vote enregistré.</FadeIn>}
                      {errors[p.id] && (
                        <FadeIn role="alert" className="mt-3 text-sm text-bad">
                          {errors[p.id]}
                        </FadeIn>
                      )}
                    </fieldset>
                  ))}
                </div>
                <div className="mt-10 flex items-center gap-4">
                  <Button size="lg" onClick={submit} isLoading={submitting} disabled={pending.length === 0 || (election as any).status !== 'ACTIVE' || !online}>
                    Valider le bulletin
                  </Button>
                  <p className="text-sm text-muted">
                    {online
                      ? 'Les votes sont définitifs une fois validés.'
                      : 'Vous êtes hors ligne : reconnectez-vous pour valider votre bulletin.'}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </Layout>
    </>
  );
};
