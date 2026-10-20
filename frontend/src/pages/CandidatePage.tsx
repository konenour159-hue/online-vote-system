import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PublicLayout } from '../components/PublicLayout';
import { FadeIn } from '../motion/FadeIn';
import { CountUp } from '../motion/CountUp';
import { publicVoteService } from '../services/publicApi';

export const CandidatePage: React.FC = () => {
  const { token = '' } = useParams();
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['candidate-view', token],
    queryFn: () => publicVoteService.getCandidateView(token),
    refetchInterval: (q) => (q.state.data?.phase === 'closed' ? false : 5000),
    retry: (count, err: any) => err?.response?.status !== 404 && count < 1
  });
  const invalid = (error as any)?.response?.status === 404;

  return (
    <PublicLayout>
      {isLoading && <p className="text-muted">Chargement de votre page…</p>}
      {isError && (
        <FadeIn role="alert">
          <h1 className="text-3xl font-extrabold">{invalid ? 'Ce lien n’est plus valide' : 'Impossible de charger votre page'}</h1>
          <p className="mt-3 text-muted">
            {invalid ? 'Il a peut-être été remplacé. Demandez votre nouveau lien à l’organisateur.' : 'Actualisez la page ou réessayez dans un instant.'}
          </p>
        </FadeIn>
      )}
      {data && (
        <>
          <p className="text-muted">{data.voteTitle}</p>
          <h1 className="mt-1 text-4xl font-extrabold md:text-5xl">{data.candidateName}</h1>
          <p className="mt-3 max-w-[58ch] text-muted">
            Votre page personnelle. Vous voyez uniquement votre propre score, jamais celui des autres candidats. Ne partagez pas ce lien.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-[auto_1fr] md:items-end">
            <div>
              <p className="font-display text-7xl font-extrabold tabular-nums md:text-8xl">
                <CountUp value={data.percentage} decimals={1} suffix=" %" />
              </p>
              <p className="mt-2 text-sm text-muted" aria-live="polite">
                des votes exprimés
              </p>
            </div>
            <div>
              <div
                className="h-3 rounded-full bg-ink/10"
                role="progressbar"
                aria-label="Votre pourcentage des votes exprimés"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(data.percentage)}
              >
                <div className="h-3 rounded-full bg-spark transition-[width] duration-700 ease-out" style={{ width: `${data.percentage}%` }} />
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-6 text-sm">
                <div>
                  <dt className="text-muted">Vos voix</dt>
                  <dd className="mt-1 font-display text-3xl font-bold tabular-nums">{data.votes}</dd>
                </div>
                <div>
                  <dt className="text-muted">État</dt>
                  <dd className="mt-1 font-semibold">
                    {data.phase === 'open' && 'Vote en cours, résultat provisoire'}
                    {data.phase === 'not_open' && 'Le vote n’a pas encore commencé'}
                    {data.phase === 'closed' && 'Vote terminé, résultat final'}
                  </dd>
                  {data.phase === 'open' && (
                    <dd className="mt-1 inline-flex items-center gap-2 text-muted">
                      <span className={`h-2 w-2 rounded-full bg-ok transition-opacity ${isFetching ? 'opacity-100' : 'opacity-50'}`} aria-hidden="true" />
                      Actualisé toutes les 5 secondes
                    </dd>
                  )}
                </div>
              </dl>
            </div>
          </div>
        </>
      )}
    </PublicLayout>
  );
};
