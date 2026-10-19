import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { Layout } from '../components/Layout';
import { Input } from '../components/Input';
import { StatusBadge } from '../components/StatusBadge';
import { FadeIn } from '../motion/FadeIn';
import { adminService, Account, ManagedCandidate } from '../services/adminService';

const errorMessage = (err: any): string => {
  switch (err?.response?.status) {
    case 409:
      return 'Ce compte est déjà lié à un autre candidat de ce poste.';
    case 404:
      return 'Ce compte est introuvable ou désactivé.';
    case 403:
      return 'Vous n’administrez pas ce scrutin.';
    default:
      return 'L’opération a échoué. Vérifiez votre connexion et réessayez.';
  }
};

const fullName = (a: Account) => `${a.firstName} ${a.lastName}`.trim();

const useDebounced = (value: string, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const CandidateRow: React.FC<{ candidate: ManagedCandidate }> = ({ candidate }) => {
  const queryClient = useQueryClient();
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const term = useDebounced(search.trim());

  const results = useQuery({
    queryKey: ['admin-users', term],
    queryFn: () => adminService.searchUsers(term),
    enabled: picking && term.length >= 2
  });

  const mutation = useMutation({
    mutationFn: (userId: string | null) => adminService.setCandidateAccount(candidate.id, userId),
    onSuccess: (updated: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-elections'] });
      queryClient.invalidateQueries({ queryKey: ['my-candidacies'] });
      setPicking(false);
      setSearch('');
      setNotice({
        kind: 'ok',
        text: updated.user
          ? `Compte lié : ${fullName(updated.user)} peut maintenant suivre son score.`
          : 'Compte délié. Ce candidat ne voit plus son score.'
      });
    },
    onError: (err) => setNotice({ kind: 'error', text: errorMessage(err) })
  });

  const linked = candidate.user;

  return (
    <li className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">{candidate.name}</p>
          {linked ? (
            <p className="text-sm text-muted">
              Compte lié : <span className="font-semibold text-ink">{fullName(linked)}</span> ({linked.email})
            </p>
          ) : (
            <p className="text-sm text-muted">Aucun compte lié. Ce candidat ne peut pas suivre son score.</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPicking((p) => !p);
              setNotice(null);
            }}
            aria-expanded={picking}
            className="h-10 rounded-md border border-ink/30 px-4 text-sm font-semibold hover:bg-ink/5"
          >
            {picking ? 'Annuler' : linked ? 'Changer de compte' : 'Lier un compte'}
          </button>
          {linked && (
            <button
              type="button"
              onClick={() => mutation.mutate(null)}
              disabled={mutation.isPending}
              className="h-10 rounded-md px-4 text-sm font-semibold text-bad hover:bg-bad/10 disabled:opacity-50"
            >
              Délier
            </button>
          )}
        </div>
      </div>

      {picking && (
        <FadeIn className="mt-4 max-w-md">
          <Input
            label={`Rechercher le compte de ${candidate.name}`}
            placeholder="Nom ou adresse e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            autoFocus
          />
          <div aria-live="polite" className="mt-2">
            {term.length < 2 && <p className="text-sm text-muted">Saisissez au moins 2 caractères.</p>}
            {results.isFetching && term.length >= 2 && <p className="text-sm text-muted">Recherche…</p>}
            {results.data && !results.isFetching && results.data.length === 0 && (
              <p className="text-sm text-muted">Aucun compte ne correspond à « {term} ».</p>
            )}
          </div>
          {results.data && results.data.length > 0 && (
            <ul className="mt-1 divide-y divide-line rounded-md border border-line bg-surface">
              {results.data.map((account) => (
                <li key={account.id}>
                  <button
                    type="button"
                    onClick={() => mutation.mutate(account.id)}
                    disabled={mutation.isPending}
                    className="block w-full px-3 py-2.5 text-left hover:bg-ink/5 disabled:opacity-50"
                  >
                    <span className="block font-semibold">{fullName(account)}</span>
                    <span className="block text-sm text-muted">{account.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </FadeIn>
      )}

      {notice && (
        <FadeIn
          role={notice.kind === 'error' ? 'alert' : 'status'}
          className={`mt-3 text-sm font-semibold ${notice.kind === 'error' ? 'text-bad' : 'text-ok'}`}
        >
          {notice.text}
        </FadeIn>
      )}
    </li>
  );
};

export const CandidatesAdminPage: React.FC = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-elections'],
    queryFn: () => adminService.getManageableElections()
  });

  return (
    <>
      <Header />
      <Layout>
        <Link to="/admin" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
          Retour à l’administration
        </Link>
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Candidats</h1>
        <p className="mt-3 max-w-[60ch] text-muted">
          Reliez chaque candidat à un compte utilisateur. Une fois relié, il voit sa propre part des électeurs inscrits
          en direct dans « Ma candidature », et rien d’autre. Chaque changement est inscrit dans le journal d’activité.
        </p>

        {isLoading && <p className="mt-10 text-muted">Chargement des candidats…</p>}
        {isError && (
          <FadeIn role="alert" className="mt-10 text-bad">
            Impossible de charger les candidats. Connectez-vous avec un compte administrateur.
          </FadeIn>
        )}
        {data && data.length === 0 && (
          <FadeIn className="mt-12 border-t border-line pt-10">
            <h2 className="text-2xl font-bold">Aucun scrutin à gérer</h2>
            <p className="mt-2 max-w-[50ch] text-muted">Les scrutins que vous administrez apparaîtront ici.</p>
          </FadeIn>
        )}

        <div className="mt-10 space-y-14">
          {data?.map((election) => (
            <section key={election.id} className="border-t border-line pt-8">
              <h2 className="text-2xl font-bold">{election.title}</h2>
              <p className="mt-2">
                <StatusBadge status={election.status} />
              </p>
              <div className="mt-6 space-y-8">
                {election.positions.map((position) => (
                  <div key={position.id}>
                    <h3 className="font-display text-xl font-bold">{position.title}</h3>
                    {position.candidates.length === 0 ? (
                      <p className="mt-2 text-sm text-muted">Aucun candidat pour ce poste.</p>
                    ) : (
                      <ul className="mt-1 divide-y divide-line">
                        {position.candidates.map((c) => (
                          <CandidateRow key={c.id} candidate={c} />
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Layout>
    </>
  );
};
