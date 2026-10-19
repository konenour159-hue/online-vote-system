import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { Layout } from '../components/Layout';
import { ElectionStats } from '../components/StatsCard';
import { VoteChart } from '../components/VoteChart';
import { analyticsService } from '../services/analyticsService';
import { useIsAdmin } from '../hooks/useRole';
import { gsap, useGSAP } from '../motion/gsap';
import { dur, ease, FULL_MOTION, stagger } from '../motion/tokens';

export const AnalyticsPage: React.FC = () => {
  const { id = '' } = useParams();
  const isAdmin = useIsAdmin();
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['election-stats', id],
    queryFn: () => analyticsService.getElectionStats(id),
    refetchInterval: isAdmin ? 5000 : false,
    retry: (count, err: any) => err?.response?.status !== 403 && err?.response?.status !== 401 && count < 1
  });
  const locked = (error as any)?.response?.status === 403;

  const root = useRef<HTMLDivElement>(null);
  const barsIntroPlayed = useRef(false);
  // La transition CSS n'est activée qu'après l'entrée GSAP, pour ne pas la ralentir.
  const [barsSettled, setBarsSettled] = useState(false);
  const hasStats = !!stats;
  useEffect(() => {
    if (!hasStats) return;
    const t = setTimeout(() => setBarsSettled(true), 1400);
    return () => clearTimeout(t);
  }, [hasStats]);

  // Les barres partent de zéro vers la valeur réelle ; la valeur et le libellé restent affichés en texte.
  useGSAP(
    () => {
      if (!stats || barsIntroPlayed.current) return;
      barsIntroPlayed.current = true; // une seule entrée ; ensuite les barres glissent vers les nouvelles valeurs (CSS)
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        gsap.from('[data-bar]', { width: 0, duration: dur.slow + 0.3, ease: ease.out, stagger: stagger.tight });
      });
      return () => mm.revert();
    },
    { dependencies: [stats], scope: root }
  );

  return (
    <>
      <Header />
      <Layout>
        <Link to="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
          Retour aux scrutins
        </Link>
        {isLoading && <p className="mt-8 text-muted">Chargement des résultats…</p>}
        {isError && locked && (
          <div role="status" className="mt-10 max-w-xl border-t border-line pt-8">
            <h1 className="text-3xl font-extrabold md:text-4xl">Résultats pas encore disponibles</h1>
            <p className="mt-3 text-muted">
              Les résultats de ce scrutin seront publiés dès sa clôture. Si vous êtes candidat, suivez votre score en
              direct dans « Ma candidature ».
            </p>
          </div>
        )}
        {isError && !locked && (
          <p role="alert" className="mt-8 text-bad">
            Impossible de charger ces résultats. Revenez en arrière et réessayez.
          </p>
        )}
        {stats && (
          <div ref={root} className="mt-6">
            <h1 className="text-4xl font-extrabold md:text-5xl">{stats.electionTitle}</h1>
            <p className="mt-3 text-muted">
              {isAdmin
                ? 'Résultats en direct : actualisés toutes les 5 secondes.'
                : 'Les résultats se mettent à jour à mesure que les bulletins arrivent.'}
            </p>

            <div className="mt-10">
              <ElectionStats electionId={id} live={isAdmin} />
            </div>

            <div className="mt-14 space-y-14">
              {stats.positions?.map((p: any) => (
                <section key={p.positionId} className="grid gap-8 border-t border-line pt-8 lg:grid-cols-2">
                  <div>
                    <h2 className="text-3xl font-bold">{p.positionTitle}</h2>
                    <ul className="mt-5 space-y-4">
                      {p.candidates.map((c: any) => (
                        <li key={c.candidateId}>
                          <div className="flex justify-between gap-4">
                            <span className="font-semibold">{c.candidateName}</span>
                            <span className="tabular-nums text-muted">
                              {c.votes} {c.votes > 1 ? 'voix' : 'voix'} ({Number(c.percentage).toFixed(0)} %)
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 rounded-full bg-ink/10" aria-hidden="true">
                            <div data-bar className={`h-2 rounded-full bg-spark ${barsSettled ? 'transition-[width] duration-700 ease-out' : ''}`} style={{ width: `${c.percentage}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <VoteChart data={p.candidates.map((c: any) => ({ name: c.candidateName, votes: c.votes }))} />
                </section>
              ))}
            </div>
          </div>
        )}
      </Layout>
    </>
  );
};
