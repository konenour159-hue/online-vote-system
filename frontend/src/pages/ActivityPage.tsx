import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Header } from '../components/Header';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { analyticsService } from '../services/analyticsService';
import { FadeIn } from '../motion/FadeIn';
import { useFreshRows } from '../motion/useFreshRows';

const PAGE_SIZE = 50;

const actionLabels: Record<string, string> = {
  USER_LOGIN: 'Connexion',
  USER_LOGOUT: 'Déconnexion',
  CANDIDATE_ACCOUNT_LINKED: 'Compte candidat lié',
  CANDIDATE_ACCOUNT_UNLINKED: 'Compte candidat délié'
};

const filters = [
  { value: '', label: 'Tout' },
  { value: 'USER_LOGIN', label: 'Connexions' },
  { value: 'USER_LOGOUT', label: 'Déconnexions' },
  { value: 'CANDIDATE_ACCOUNT_LINKED', label: 'Comptes liés' },
  { value: 'CANDIDATE_ACCOUNT_UNLINKED', label: 'Comptes déliés' }
];

export const ActivityPage: React.FC = () => {
  const [action, setAction] = React.useState('');
  const [limit, setLimit] = React.useState(PAGE_SIZE);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['activity', action, limit],
    queryFn: () => analyticsService.getAllActivity(limit, action),
    placeholderData: keepPreviousData, // garde l'ancienne liste à l'écran pendant le chargement : pas de saut de mise en page
    refetchInterval: 30000
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const body = useRef<HTMLTableSectionElement>(null);
  useFreshRows(body, data, action);

  const changeFilter = (value: string) => {
    setAction(value);
    setLimit(PAGE_SIZE);
  };

  return (
    <>
      <Header />
      <Layout>
        <Link to="/admin" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
          Retour à l’administration
        </Link>
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Activité</h1>
        <p className="mt-3 max-w-[56ch] text-muted">
          Les connexions, déconnexions et changements de comptes candidats de tous les utilisateurs, de la plus récente à la plus ancienne. La liste se
          met à jour toutes les 30 secondes.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div role="group" aria-label="Filtrer par type d’action" className="flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = action === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => changeFilter(f.value)}
                  className={`h-10 rounded-md border px-4 text-sm font-semibold transition-colors ${
                    active ? 'border-brand bg-brand text-brand-fg' : 'border-line hover:border-smoke'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-muted" aria-live="polite">
            {data ? `${items.length} sur ${total} ${total > 1 ? 'événements' : 'événement'}` : ''}
          </p>
        </div>

        {isError && (
          <FadeIn role="alert" className="mt-10 text-bad">
            Impossible de charger l’activité. Vous n’avez peut-être pas accès à cette page : connectez-vous avec un
            compte administrateur.
          </FadeIn>
        )}
        {isLoading && <p className="mt-10 text-muted">Chargement de l’activité…</p>}

        {data && (
          <div
            role="region"
            aria-label="Journal d’activité (défilement horizontal si besoin)"
            tabIndex={0}
            className={`mt-6 overflow-x-auto transition-opacity duration-200 ${isFetching ? 'opacity-70' : ''}`}
          >
            <table className="w-full min-w-[34rem] border-t border-line text-left text-sm">
              <caption className="sr-only">Journal d’activité des utilisateurs</caption>
              <thead>
                <tr className="text-muted">
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Date
                  </th>
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Utilisateur
                  </th>
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Action
                  </th>
                  <th scope="col" className="py-3 font-semibold">
                    Adresse IP
                  </th>
                </tr>
              </thead>
              <tbody ref={body} className="divide-y divide-line border-t border-line">
                {items.map((log: any) => (
                  <tr key={log.id} data-row data-key={log.id} data-time={log.createdAt}>
                    <td className="whitespace-nowrap py-3 pr-4 tabular-nums">
                      {format(new Date(log.createdAt), 'd MMM yyyy, HH:mm:ss', { locale: fr })}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="block font-semibold">
                        {log.user.firstName} {log.user.lastName}
                      </span>
                      <span className="block text-muted">{log.user.email}</span>
                    </td>
                    <td className="py-3 pr-4 font-semibold">{actionLabels[log.action] ?? log.action}</td>
                    <td className="py-3 tabular-nums text-muted">{log.ipAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {items.length === 0 && (
              <FadeIn className="py-16">
                <h2 className="text-2xl font-bold">Aucune activité</h2>
                <p className="mt-2 max-w-[48ch] text-muted">
                  {action
                    ? 'Aucun événement ne correspond à ce filtre. Choisissez « Tout » pour tout voir.'
                    : 'Les connexions et déconnexions apparaîtront ici dès qu’elles auront lieu.'}
                </p>
              </FadeIn>
            )}
          </div>
        )}

        {data && items.length < total && (
          <div className="mt-6">
            <Button variant="outline" onClick={() => setLimit((l) => l + PAGE_SIZE)} isLoading={isFetching}>
              Afficher plus
            </Button>
          </div>
        )}
      </Layout>
    </>
  );
};
