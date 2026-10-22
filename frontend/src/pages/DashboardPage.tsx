import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Header } from '../components/Header';
import { Layout } from '../components/Layout';
import { LinkButton } from '../components/LinkButton';
import { StatusBadge } from '../components/StatusBadge';
import { adminService } from '../services/adminService';
import { useAuthStore } from '../store/authStore';
import { gsap, useGSAP } from '../motion/gsap';
import { dur, ease, FULL_MOTION, MAX_STAGGERED_ITEMS, stagger } from '../motion/tokens';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-votes'], queryFn: adminService.list, refetchInterval: 10000 });
  const votes = data ?? [];
  const list = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      if (!votes.length) return;
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        const rows = gsap.utils.toArray<HTMLElement>('[data-row]', list.current).slice(0, MAX_STAGGERED_ITEMS);
        gsap.from(rows, { opacity: 0, y: 14, duration: dur.slow, ease: ease.out, stagger: stagger.list, clearProps: 'all' });
      });
      return () => mm.revert();
    },
    { dependencies: [votes.length], scope: list }
  );

  return (
    <>
      <Header />
      <Layout>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold md:text-5xl">Bonjour, {user?.firstName || 'à vous'}</h1>
            <p className="mt-3 max-w-[52ch] text-muted">Créez un vote, partagez le lien avec votre public et suivez les résultats en direct.</p>
          </div>
          <LinkButton to="/admin/votes/new" size="lg">
            Créer un vote
          </LinkButton>
        </div>

        <h2 className="mt-12 text-2xl font-bold">Vos votes</h2>
        <div className="mt-4 border-t border-line">
          {isLoading && <p className="py-8 text-muted">Chargement de vos votes…</p>}
          {isError && (
            <p role="alert" className="py-8 text-bad">
              Impossible de charger vos votes. Actualisez la page pour réessayer.
            </p>
          )}
          {!isLoading && !isError && votes.length === 0 && (
            <div className="py-16">
              <h3 className="text-2xl font-bold">Aucun vote pour l’instant</h3>
              <p className="mt-2 max-w-[48ch] text-muted">
                Un vote, c’est une question, quelques candidats et un lien à partager. Vous pouvez en créer un en deux minutes.
              </p>
              <LinkButton to="/admin/votes/new" className="mt-5">
                Créer votre premier vote
              </LinkButton>
            </div>
          )}
          <ul ref={list} className="divide-y divide-line">
            {votes.map((v) => (
              <li key={v.id} data-row className="grid gap-4 py-6 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <h3 className="text-2xl font-bold">
                    <Link to={`/admin/votes/${v.id}`} className="inline-flex min-h-11 items-center hover:underline">
                      {v.title}
                    </Link>
                  </h3>
                  <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
                    <StatusBadge status={v.status} />
                    <span>
                      {v.candidatesCount} candidats · {v.participantsCount} participants · {v.votesCount} {v.votesCount > 1 ? 'votes' : 'vote'}
                    </span>
                    <span>Fin : {format(new Date(v.endDate), "d MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                    {v.pendingCount > 0 && (
                      <Link to={`/admin/votes/${v.id}#demandes`} className="inline-flex items-center gap-2 font-semibold text-ink underline underline-offset-4">
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-spark px-1.5 text-xs font-bold text-night" aria-hidden="true">{v.pendingCount}</span>
                        {v.pendingCount > 1 ? 'demandes à valider' : 'demande à valider'}
                      </Link>
                    )}
                  </p>
                </div>
                <LinkButton to={`/admin/votes/${v.id}`} variant="outline" size="sm">
                  Gérer
                </LinkButton>
              </li>
            ))}
          </ul>
        </div>
      </Layout>
    </>
  );
};
