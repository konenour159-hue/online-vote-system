import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Header } from '../components/Header';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { electionService } from '../services/electionService';
import { useAuthStore } from '../store/authStore';
import { useIsAdmin } from '../hooks/useRole';
import { gsap, useGSAP } from '../motion/gsap';
import { dur, ease, FULL_MOTION, MAX_STAGGERED_ITEMS, stagger } from '../motion/tokens';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useIsAdmin();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['elections'],
    queryFn: () => electionService.getElections(1, 20)
  });
  const elections: any[] = data?.elections ?? [];
  const list = useRef<HTMLUListElement>(null);

  // Apparition échelonnée à l'arrivée des données ; seules les premières lignes sont animées.
  useGSAP(
    () => {
      if (!elections.length) return;
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        const rows = gsap.utils.toArray<HTMLElement>('[data-row]', list.current).slice(0, MAX_STAGGERED_ITEMS);
        gsap.from(rows, { opacity: 0, y: 14, duration: dur.slow, ease: ease.out, stagger: stagger.list, clearProps: 'all' });
      });
      return () => mm.revert();
    },
    { dependencies: [elections.length], scope: list }
  );

  return (
    <>
      <Header />
      <Layout>
        <h1 className="text-4xl font-extrabold md:text-5xl">Bonjour, {user?.firstName || 'à vous'}</h1>
        <p className="mt-3 max-w-[52ch] text-muted">Voici les scrutins de votre groupe. Ouvrez un bulletin pour voter ou consultez les résultats passés.</p>

        <div className="mt-12 border-t border-line">
          {isLoading && <p className="py-8 text-muted">Chargement des scrutins…</p>}
          {isError && (
            <p role="alert" className="py-8 text-bad">
              Impossible de charger les scrutins. Actualisez la page pour réessayer.
            </p>
          )}
          {!isLoading && !isError && elections.length === 0 && (
            <div className="py-16">
              <h2 className="text-2xl font-bold">Aucun scrutin pour l’instant</h2>
              <p className="mt-2 max-w-[48ch] text-muted">
                Quand l’organisateur de votre groupe ouvrira un scrutin, il apparaîtra ici et vous pourrez voter.
              </p>
            </div>
          )}
          <ul ref={list} className="divide-y divide-line">
            {elections.map((e) => (
              <li key={e.id} data-row className="grid gap-4 py-6 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <h2 className="text-2xl font-bold">{e.title}</h2>
                  {e.description && <p className="mt-1 max-w-[60ch] text-muted">{e.description}</p>}
                  <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
                    <StatusBadge status={e.status} />
                    <span>
                      {format(new Date(e.startDate), 'd MMM yyyy', { locale: fr })} au {format(new Date(e.endDate), 'd MMM yyyy', { locale: fr })}
                    </span>
                    <span>{e.positions?.length ?? 0} {(e.positions?.length ?? 0) > 1 ? 'postes' : 'poste'}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {e.status === 'ACTIVE' && (
                    <Link
                      to={`/elections/${e.id}`}
                      className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-brand-fg hover:bg-brand/90"
                    >
                      Ouvrir le bulletin
                    </Link>
                  )}
                  {isAdmin || e.status === 'COMPLETED' ? (
                    <Link
                      to={`/results/${e.id}`}
                      className="inline-flex h-10 items-center rounded-md border border-ink/30 px-4 text-sm font-semibold hover:bg-ink/5"
                    >
                      Voir les résultats
                    </Link>
                  ) : (
                    <span className="inline-flex h-10 items-center text-sm text-muted">Résultats à la clôture</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Layout>
    </>
  );
};
