import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Header } from '../components/Header';
import { Layout } from '../components/Layout';
import { ConfirmButton } from '../components/ConfirmButton';
import { FadeIn } from '../motion/FadeIn';
import { accountService, ApprovalStatus, SignupRequest } from '../services/accountApi';
import { errorText } from '../services/publicApi';

const tabs: Array<{ value: ApprovalStatus; label: string; key: 'pending' | 'approved' | 'rejected' }> = [
  { value: 'PENDING', label: 'En attente', key: 'pending' },
  { value: 'APPROVED', label: 'Validées', key: 'approved' },
  { value: 'REJECTED', label: 'Refusées', key: 'rejected' }
];

export const AdminSignupsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ApprovalStatus>('PENDING');
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['signups', tab],
    queryFn: () => accountService.listSignups(tab),
    refetchInterval: 30000,
    retry: (count, err: any) => err?.response?.status !== 403 && count < 1
  });
  const refresh = (text?: string) => {
    queryClient.invalidateQueries({ queryKey: ['signups'] });
    queryClient.invalidateQueries({ queryKey: ['signups-pending'] });
    setNotice(text ? { kind: 'ok', text } : null);
  };
  const fail = (e: unknown) => setNotice({ kind: 'error', text: errorText(e) });

  const approve = useMutation({
    mutationFn: (r: SignupRequest) => accountService.approve(r.id),
    onSuccess: (_d, r) =>
      refresh(
        `${r.firstName} ${r.lastName} peut maintenant se connecter.${data?.emailAvailable ? ' Un e-mail lui a été envoyé.' : ' Prévenez-la vous-même : aucun e-mail n’est envoyé.'}`
      ),
    onError: fail
  });
  const reject = useMutation({
    mutationFn: (r: SignupRequest) => accountService.reject(r.id),
    onSuccess: (_d, r) => refresh(`L’accès de ${r.firstName} ${r.lastName} est refusé.`),
    onError: fail
  });
  const toggle = useMutation({
    mutationFn: (open: boolean) => accountService.setOpen(open),
    onSuccess: (r) => refresh(r.open ? 'Les inscriptions sont ouvertes.' : 'Les inscriptions sont fermées : personne ne peut plus envoyer de demande.'),
    onError: fail
  });

  const forbidden = (error as any)?.response?.status === 403;
  const items = data?.items ?? [];

  return (
    <>
      <Header />
      <Layout>
        <Link to="/admin" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
          Retour à l’administration
        </Link>
        <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">Inscriptions</h1>
        <p className="mt-3 max-w-[60ch] text-muted">
          Les personnes qui demandent un compte organisateur apparaissent ici. Elles ne peuvent pas se connecter tant que vous n’avez pas validé leur demande.
        </p>

        {isError && (
          <p role="alert" className="mt-8 text-bad">
            {forbidden ? 'Cette page est réservée au super administrateur.' : 'Impossible de charger les inscriptions. Actualisez la page.'}
          </p>
        )}

        {data && (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4">
              <div>
                <p className="font-semibold" id="signups-switch-label">
                  Accepter de nouvelles inscriptions
                </p>
                <p className="text-sm text-muted">
                  {data.open ? 'Le lien « Demander un accès » est visible sur la page de connexion.' : 'Fermées : la page d’inscription refuse toute nouvelle demande.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={data.open}
                aria-labelledby="signups-switch-label"
                disabled={toggle.isPending}
                onClick={() => toggle.mutate(!data.open)}
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors disabled:opacity-60 ${data.open ? 'border-ok bg-ok' : 'border-line bg-ink/20'}`}
              >
                <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${data.open ? 'translate-x-7' : 'translate-x-1'}`} />
                <span className="sr-only">{data.open ? 'Ouvertes' : 'Fermées'}</span>
              </button>
            </div>

            {notice && (
              <FadeIn role={notice.kind === 'error' ? 'alert' : 'status'} className={`mt-4 text-sm font-semibold ${notice.kind === 'error' ? 'text-bad' : 'text-ok'}`}>
                {notice.text}
              </FadeIn>
            )}

            <div role="group" aria-label="Filtrer par état" className="mt-8 flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={tab === t.value}
                  onClick={() => setTab(t.value)}
                  className={`h-10 rounded-md border px-4 text-sm font-semibold transition-colors ${tab === t.value ? 'border-brand bg-brand text-brand-fg' : 'border-line hover:border-smoke'}`}
                >
                  {t.label} ({data.counts[t.key]})
                </button>
              ))}
            </div>

            {items.length === 0 ? (
              <FadeIn className="mt-10 border-t border-line pt-8">
                <h2 className="text-2xl font-bold">{tab === 'PENDING' ? 'Aucune demande en attente' : tab === 'APPROVED' ? 'Aucun compte validé' : 'Aucune demande refusée'}</h2>
                <p className="mt-2 max-w-[52ch] text-muted">
                  {tab === 'PENDING' ? 'Quand quelqu’un demandera un accès, sa demande apparaîtra ici (et dans le menu).' : 'Rien à afficher pour le moment.'}
                </p>
              </FadeIn>
            ) : (
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {items.map((r) => (
                  <li key={r.id} className="grid gap-4 py-6 md:grid-cols-[1fr_auto] md:items-start">
                    <div>
                      <h2 className="font-display text-xl font-bold">
                        {r.firstName} {r.lastName}
                      </h2>
                      <p className="text-sm text-muted">
                        {r.email}
                        {r.organisation ? ` · ${r.organisation}` : ''}
                      </p>
                      {r.signupMessage && <p className="mt-2 max-w-[62ch] rounded-md bg-ink/5 p-3 text-sm">« {r.signupMessage} »</p>}
                      <p className="mt-2 text-xs text-muted">Demande du {format(new Date(r.createdAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.approvalStatus !== 'APPROVED' && (
                        <ConfirmButton question={`Valider ${r.firstName} ?`} confirmLabel="Valider" onConfirm={() => approve.mutateAsync(r)}>
                          Valider
                        </ConfirmButton>
                      )}
                      {r.approvalStatus !== 'REJECTED' && (
                        <ConfirmButton
                          tone="danger"
                          question={r.approvalStatus === 'APPROVED' ? `Retirer l’accès de ${r.firstName} ?` : `Refuser ${r.firstName} ?`}
                          confirmLabel={r.approvalStatus === 'APPROVED' ? 'Retirer' : 'Refuser'}
                          onConfirm={() => reject.mutateAsync(r)}
                        >
                          {r.approvalStatus === 'APPROVED' ? 'Retirer l’accès' : 'Refuser'}
                        </ConfirmButton>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {isLoading && <p className="mt-8 text-muted">Chargement des inscriptions…</p>}
      </Layout>
    </>
  );
};
