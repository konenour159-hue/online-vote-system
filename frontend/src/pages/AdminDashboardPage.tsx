import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Header } from '../components/Header';
import { Layout } from '../components/Layout';
import { StatsCard } from '../components/StatsCard';
import { analyticsService } from '../services/analyticsService';
import { FadeIn } from '../motion/FadeIn';
import { useFreshRows } from '../motion/useFreshRows';

const actionLabels: Record<string, string> = {
  USER_LOGIN: 'Connexion',
  USER_LOGOUT: 'Déconnexion',
  CANDIDATE_ACCOUNT_LINKED: 'Compte candidat lié',
  CANDIDATE_ACCOUNT_UNLINKED: 'Compte candidat délié'
};

export const AdminDashboardPage: React.FC = () => {
  const { data: systemStats, isError } = useQuery({
    queryKey: ['system-stats'],
    queryFn: () => analyticsService.getSystemStats()
  });
  const { data: activityLog } = useQuery({
    queryKey: ['activity-log'],
    queryFn: () => analyticsService.getUserActivityLog(50),
    refetchInterval: 30000
  });

  const list = useRef<HTMLUListElement>(null);
  useFreshRows(list, activityLog);

  return (
    <>
      <Header />
      <Layout>
        <h1 className="text-4xl font-extrabold md:text-5xl">Administration</h1>
        <p className="mt-3 text-muted">Un aperçu de la plateforme et de l’activité récente.</p>

        {isError ? (
          <FadeIn role="alert" className="mt-10 text-bad">
            Vous n’avez pas accès à ces chiffres. Connectez-vous avec un compte administrateur.
          </FadeIn>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <StatsCard title="Électeurs" value={systemStats?.totalUsers ?? 0} loading={!systemStats} />
            <StatsCard title="Scrutins" value={systemStats?.totalElections ?? 0} loading={!systemStats} />
            <StatsCard title="Bulletins déposés" value={systemStats?.totalVotes ?? 0} loading={!systemStats} />
          </div>
        )}

        <div className="mt-16 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl font-bold">Votre activité récente</h2>
          <Link to="/admin/activity" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
            Voir l’activité de tous les utilisateurs
          </Link>
        </div>
        {activityLog?.length ? (
          <ul ref={list} className="mt-4 divide-y divide-line border-t border-line">
            {activityLog.map((log: any) => (
              <li
                key={log.id}
                data-row
                data-key={log.id}
                data-time={log.createdAt}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <span className="font-semibold">{actionLabels[log.action] ?? log.action}</span>
                <span className="text-muted">{format(new Date(log.createdAt), 'd MMM yyyy, HH:mm', { locale: fr })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-muted">Rien ne s’est encore passé. Les actions seront listées ici.</p>
        )}
      </Layout>
    </>
  );
};
