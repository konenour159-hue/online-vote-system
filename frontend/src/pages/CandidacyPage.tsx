import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { CountUp } from '../motion/CountUp';
import { FadeIn } from '../motion/FadeIn';
import { useMyCandidacies } from '../hooks/useMyCandidacies';

const phase = (status: string): string => {
  if (status === 'COMPLETED') return 'Résultat final';
  if (status === 'ACTIVE') return 'Résultat provisoire, mis à jour en direct';
  return 'Aucun vote pour le moment';
};

export const CandidacyPage: React.FC = () => {
  const { data, isLoading, isError, isFetching } = useMyCandidacies(true);
  const candidacies = data ?? [];

  return (
    <>
      <Header />
      <Layout>
        <h1 className="text-4xl font-extrabold md:text-5xl">Ma candidature</h1>
        <p className="mt-3 max-w-[58ch] text-muted">
          Suivez votre score pendant le scrutin. Il est calculé sur l’ensemble des électeurs inscrits : vous ne voyez
          que vos propres voix, jamais celles des autres candidats ni le total des votes.
        </p>

        {isLoading && <p className="mt-10 text-muted">Chargement de vos résultats…</p>}
        {isError && (
          <FadeIn role="alert" className="mt-10 text-bad">
            Impossible de charger vos résultats. Actualisez la page pour réessayer.
          </FadeIn>
        )}

        {data && candidacies.length === 0 && (
          <FadeIn className="mt-12 border-t border-line pt-10">
            <h2 className="text-2xl font-bold">Vous n’êtes candidat à aucun scrutin</h2>
            <p className="mt-2 max-w-[52ch] text-muted">
              Si vous devriez l’être, demandez à l’organisateur de votre groupe de relier votre compte à votre
              candidature.
            </p>
            <Link to="/dashboard" className="mt-4 inline-block font-semibold underline underline-offset-4">
              Voir les scrutins
            </Link>
          </FadeIn>
        )}

        <div className="mt-10 space-y-12">
          {candidacies.map((c) => {
            const live = c.election.status === 'ACTIVE';
            return (
              <section key={c.candidateId} className="border-t border-line pt-8">
                <h2 className="text-2xl font-bold">{c.election.title}</h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-muted">
                  <span>
                    Candidat au poste de <strong className="font-semibold text-ink">{c.positionTitle}</strong>
                  </span>
                  <StatusBadge status={c.election.status} />
                </p>

                <div className="mt-8 grid gap-10 md:grid-cols-[auto_1fr] md:items-end">
                  <div>
                    <p className="font-display text-7xl font-extrabold tabular-nums md:text-8xl">
                      <CountUp value={Math.round(c.percentageOfRegistered * 10) / 10} decimals={1} suffix=" %" />
                    </p>
                    <p className="mt-2 text-sm text-muted" aria-live="polite">
                      des électeurs inscrits ont voté pour vous
                    </p>
                  </div>

                  <div>
                    <div
                      className="h-3 rounded-full bg-ink/10"
                      role="progressbar"
                      aria-label="Votre pourcentage des électeurs inscrits"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(c.percentageOfRegistered)}
                    >
                      <div
                        className="h-3 rounded-full bg-spark transition-[width] duration-700 ease-out"
                        style={{ width: `${c.percentageOfRegistered}%` }}
                      />
                    </div>
                    <dl className="mt-6 grid grid-cols-2 gap-6 text-sm">
                      <div>
                        <dt className="text-muted">Vos voix</dt>
                        <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{c.votes}</dd>
                        <dd className="text-muted">sur {c.registeredVoters} électeurs inscrits</dd>
                      </div>
                      <div>
                        <dt className="text-muted">État du résultat</dt>
                        <dd className="mt-1 font-semibold">{phase(c.election.status)}</dd>
                        {live && (
                          <dd className="mt-1 inline-flex items-center gap-2 text-muted">
                            <span
                              className={`h-2 w-2 rounded-full bg-ok ${isFetching ? 'opacity-100' : 'opacity-50'} transition-opacity`}
                              aria-hidden="true"
                            />
                            Actualisé toutes les 5 secondes
                          </dd>
                        )}
                      </div>
                    </dl>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </Layout>
    </>
  );
};
