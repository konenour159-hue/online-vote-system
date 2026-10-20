import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Header } from '../components/Header';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { StatusBadge } from '../components/StatusBadge';
import { CopyField } from '../components/CopyField';
import { QrCode } from '../components/QrCode';
import { ConfirmButton } from '../components/ConfirmButton';
import { FadeIn } from '../motion/FadeIn';
import { CountUp } from '../motion/CountUp';
import { useFreshRows } from '../motion/useFreshRows';
import { adminService, audienceLink, candidateLink, VoteCandidate, VoteDetail } from '../services/adminService';
import { errorText } from '../services/publicApi';

const when = (iso: string) => format(new Date(iso), "d MMM yyyy 'à' HH:mm", { locale: fr });
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const Section: React.FC<{ title: string; intro?: string; children: React.ReactNode }> = ({ title, intro, children }) => (
  <section className="border-t border-line pt-8">
    <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
    {intro && <p className="mt-2 max-w-[62ch] text-muted">{intro}</p>}
    <div className="mt-6">{children}</div>
  </section>
);

const CandidateRow: React.FC<{
  vote: VoteDetail;
  candidate: VoteCandidate;
  onChanged: (message?: string) => void;
  onError: (message: string) => void;
}> = ({ vote, candidate, onChanged, onError }) => {
  const editable = vote.status === 'DRAFT';
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(candidate.name);
  const [bio, setBio] = useState(candidate.bio ?? '');

  const save = useMutation({
    mutationFn: () => adminService.updateCandidate(vote.id, candidate.id, { name, bio }),
    onSuccess: () => {
      setEditing(false);
      onChanged();
    },
    onError: (e) => onError(errorText(e))
  });
  const remove = useMutation({
    mutationFn: () => adminService.removeCandidate(vote.id, candidate.id),
    onSuccess: () => onChanged(`${candidate.name} a été retiré.`),
    onError: (e) => onError(errorText(e))
  });
  const regenerate = useMutation({
    mutationFn: () => adminService.regenerateLink(vote.id, candidate.id),
    onSuccess: () => onChanged(`Nouveau lien créé pour ${candidate.name}. L’ancien ne fonctionne plus.`),
    onError: (e) => onError(errorText(e))
  });

  return (
    <li className="py-6">
      {editing ? (
        <form
          className="grid max-w-xl gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Présentation (facultatif)" value={bio} onChange={(e) => setBio(e.target.value)} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" isLoading={save.isPending}>
              Enregistrer
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold">{candidate.name}</h3>
            {candidate.bio && <p className="text-sm text-muted">{candidate.bio}</p>}
          </div>
          {editable && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEditing(true)} className="h-10 rounded-md border border-ink/30 px-4 text-sm font-semibold hover:bg-ink/5">
                Modifier
              </button>
              <ConfirmButton tone="danger" question={`Retirer ${candidate.name} ?`} confirmLabel="Retirer" onConfirm={() => remove.mutateAsync()}>
                Retirer
              </ConfirmButton>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 max-w-xl">
        <CopyField label={`Lien privé de ${candidate.name}`} value={candidateLink(candidate.accessToken)} />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>Montre uniquement son score, en direct. À lui envoyer personnellement.</span>
          <ConfirmButton
            tone="danger"
            question="Remplacer ce lien ?"
            confirmLabel="Remplacer"
            onConfirm={() => regenerate.mutateAsync()}
            className="!h-9"
          >
            Régénérer le lien
          </ConfirmButton>
        </div>
      </div>
    </li>
  );
};

export const VoteDetailPage: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [newBio, setNewBio] = useState('');

  const { data: vote, isLoading, isError, error } = useQuery({
    queryKey: ['admin-vote', id],
    queryFn: () => adminService.get(id),
    refetchInterval: (q) => (q.state.data?.status === 'ACTIVE' ? 5000 : false),
    retry: (count, err: any) => err?.response?.status !== 403 && err?.response?.status !== 404 && count < 1
  });

  const refresh = (message?: string) => {
    queryClient.invalidateQueries({ queryKey: ['admin-vote', id] });
    queryClient.invalidateQueries({ queryKey: ['admin-votes'] });
    setNotice(message ? { kind: 'ok', text: message } : null);
  };
  const fail = (text: string) => setNotice({ kind: 'error', text });

  const open = useMutation({
    mutationFn: () => adminService.open(id),
    onSuccess: () => refresh('Le vote est ouvert. Vous pouvez partager le lien.'),
    onError: (e) => fail(errorText(e))
  });
  const close = useMutation({
    mutationFn: () => adminService.close(id),
    onSuccess: () => refresh('Le vote est clos. Les résultats sont maintenant visibles de tous via le lien public.'),
    onError: (e) => fail(errorText(e))
  });
  const remove = useMutation({
    mutationFn: () => adminService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-votes'] });
      navigate('/dashboard');
    },
    onError: (e) => fail(errorText(e))
  });
  const addCandidate = useMutation({
    mutationFn: () => adminService.addCandidate(id, { name: newName, bio: newBio }),
    onSuccess: () => {
      setNewName('');
      setNewBio('');
      refresh(`Candidat ajouté.`);
    },
    onError: (e) => fail(errorText(e))
  });

  // Paramètres du vote
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endDate, setEndDate] = useState('');
  useEffect(() => {
    if (vote) {
      setTitle(vote.title);
      setDescription(vote.description ?? '');
      setEndDate(toLocalInput(vote.endDate));
    }
  }, [vote?.id, vote?.title, vote?.description, vote?.endDate]); // eslint-disable-line react-hooks/exhaustive-deps
  const saveSettings = useMutation({
    mutationFn: () => adminService.update(id, { title, description, endDate: new Date(endDate).toISOString() }),
    onSuccess: () => refresh('Paramètres enregistrés.'),
    onError: (e) => fail(errorText(e, 'Les paramètres n’ont pas pu être enregistrés.'))
  });

  const participantRows = useRef<HTMLTableSectionElement>(null);
  useFreshRows(participantRows, vote?.participants);

  const forbidden = (error as any)?.response?.status === 403 || (error as any)?.response?.status === 404;
  const link = vote ? audienceLink(vote.publicToken) : '';

  return (
    <>
      <Header />
      <Layout>
        <Link to="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
          Retour à vos votes
        </Link>
        {isLoading && <p className="mt-6 text-muted">Chargement du vote…</p>}
        {isError && (
          <p role="alert" className="mt-6 text-bad">
            {forbidden ? 'Ce vote est introuvable ou ne vous appartient pas.' : 'Impossible de charger ce vote. Actualisez la page.'}
          </p>
        )}

        {vote && (
          <div className="mt-4 space-y-12">
            <header>
              <h1 className="text-4xl font-extrabold md:text-5xl">{vote.title}</h1>
              {vote.description && <p className="mt-3 max-w-[62ch] text-muted">{vote.description}</p>}
              <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <StatusBadge status={vote.status} />
                <span className="text-muted">Fin : {when(vote.endDate)}</span>
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {vote.status === 'DRAFT' && (
                  <ConfirmButton
                    question="Ouvrir le vote maintenant ? Les candidats ne seront plus modifiables."
                    confirmLabel="Oui, ouvrir"
                    onConfirm={() => open.mutateAsync()}
                  >
                    Ouvrir le vote
                  </ConfirmButton>
                )}
                {vote.status === 'ACTIVE' && (
                  <ConfirmButton
                    tone="danger"
                    question="Clore le vote ? Il ne pourra pas être rouvert."
                    confirmLabel="Oui, clore"
                    onConfirm={() => close.mutateAsync()}
                  >
                    Clore le vote
                  </ConfirmButton>
                )}
              </div>
              {notice && (
                <FadeIn role={notice.kind === 'error' ? 'alert' : 'status'} className={`mt-4 text-sm font-semibold ${notice.kind === 'error' ? 'text-bad' : 'text-ok'}`}>
                  {notice.text}
                </FadeIn>
              )}
            </header>

            <Section
              title="Partager avec votre public"
              intro={
                vote.status === 'DRAFT'
                  ? 'Ce lien fonctionnera dès que vous aurez ouvert le vote. Chaque personne y saisit son nom et son e-mail, reçoit un code, puis vote une seule fois.'
                  : vote.status === 'ACTIVE'
                    ? 'Le vote est ouvert. Envoyez ce lien à votre public : chaque personne vote une seule fois, après avoir confirmé son e-mail.'
                    : 'Le vote est terminé : ce lien affiche désormais les résultats.'
              }
            >
              <div className="flex flex-wrap items-start gap-6">
                <div className="min-w-[16rem] flex-1">
                  <CopyField label="Lien du vote" value={link} />
                  <a href={link} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
                    Voir la page comme votre public (nouvel onglet)
                  </a>
                </div>
                <div className="text-center">
                  <QrCode value={link} label={`QR code du lien de vote « ${vote.title} »`} />
                  <p className="mt-2 text-xs text-muted">À afficher ou imprimer</p>
                </div>
              </div>
            </Section>

            <Section
              title="Candidats et liens privés"
              intro="Chaque candidat a son propre lien, qui lui montre uniquement son pourcentage et son nombre de voix en direct. Il ne voit rien des autres."
            >
              <ul className="divide-y divide-line border-y border-line">
                {vote.candidates.map((c) => (
                  <CandidateRow key={c.id} vote={vote} candidate={c} onChanged={refresh} onError={fail} />
                ))}
              </ul>
              {vote.status === 'DRAFT' && (
                <form
                  className="mt-6 grid max-w-xl gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addCandidate.mutate();
                  }}
                >
                  <h3 className="font-display text-xl font-bold">Ajouter un candidat</h3>
                  <Input label="Nom" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <Input label="Présentation (facultatif)" value={newBio} onChange={(e) => setNewBio(e.target.value)} />
                  <div>
                    <Button type="submit" variant="outline" size="sm" isLoading={addCandidate.isPending}>
                      Ajouter
                    </Button>
                  </div>
                </form>
              )}
            </Section>

            <Section
              title="Résultats"
              intro={
                vote.status === 'ACTIVE'
                  ? 'En direct, actualisés toutes les 5 secondes. Visibles de vous seul tant que le vote est ouvert.'
                  : vote.status === 'COMPLETED'
                    ? 'Résultat final.'
                    : 'Aucun vote n’est possible avant l’ouverture.'
              }
            >
              <div className="flex flex-wrap gap-10">
                <div className="border-l-2 border-spark pl-4">
                  <p className="font-display text-4xl font-extrabold tabular-nums">
                    <CountUp value={vote.totalVotes} />
                  </p>
                  <p className="mt-1 text-sm text-muted">{vote.totalVotes > 1 ? 'votes' : 'vote'} enregistrés</p>
                </div>
                <div className="border-l-2 border-spark pl-4">
                  <p className="font-display text-4xl font-extrabold tabular-nums">
                    <CountUp value={vote.verifiedParticipants} />
                  </p>
                  <p className="mt-1 text-sm text-muted">participants vérifiés</p>
                </div>
              </div>
              <ul className="mt-8 max-w-2xl space-y-5">
                {[...vote.candidates].sort((a, b) => b.votes - a.votes).map((c) => (
                  <li key={c.id}>
                    <div className="flex justify-between gap-4">
                      <span className="font-semibold">{c.name}</span>
                      <span className="tabular-nums text-muted">
                        {c.votes} {c.votes > 1 ? 'voix' : 'voix'} ({String(c.percentage).replace('.', ',')} %)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-ink/10" aria-hidden="true">
                      <div className="h-2 rounded-full bg-spark transition-[width] duration-700 ease-out" style={{ width: `${c.percentage}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              {vote.totalVotes === 0 && <p className="mt-4 text-sm text-muted">Aucun vote pour l’instant.</p>}
            </Section>

            <Section
              title="Participants"
              intro="Qui a participé et qui a déjà voté. Le choix de chacun n’est jamais enregistré avec son nom : le vote reste secret."
            >
              {vote.participants.length === 0 ? (
                <p className="text-muted">Personne ne s’est encore identifié.</p>
              ) : (
                <div role="region" aria-label="Liste des participants (défilement horizontal si besoin)" tabIndex={0} className="overflow-x-auto">
                  <table className="w-full min-w-[30rem] text-left text-sm">
                    <caption className="sr-only">Participants au vote</caption>
                    <thead>
                      <tr className="text-muted">
                        <th scope="col" className="py-3 pr-4 font-semibold">Nom</th>
                        <th scope="col" className="py-3 pr-4 font-semibold">E-mail</th>
                        <th scope="col" className="py-3 font-semibold">État</th>
                      </tr>
                    </thead>
                    <tbody ref={participantRows} className="divide-y divide-line border-t border-line">
                      {vote.participants.map((p) => (
                        <tr key={p.id} data-row data-key={p.id} data-time={p.votedAt ?? p.verifiedAt ?? ''}>
                          <td className="py-3 pr-4 font-semibold">{p.name}</td>
                          <td className="py-3 pr-4 text-muted">{p.email}</td>
                          <td className="py-3">{p.hasVoted ? 'A voté' : p.verifiedAt ? 'Vérifié, n’a pas encore voté' : 'E-mail non confirmé'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section title="Paramètres">
              <form
                className="grid max-w-2xl gap-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveSettings.mutate();
                }}
              >
                <Input label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Input label="Fin du vote" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={vote.status === 'COMPLETED'} />
                <div>
                  <Button type="submit" variant="outline" isLoading={saveSettings.isPending}>
                    Enregistrer les paramètres
                  </Button>
                </div>
              </form>
            </Section>

            <Section title="Supprimer ce vote">
              <p className="mb-4 max-w-[62ch] text-muted">
                Efface le vote, ses candidats, les participants et tous les bulletins. Cette action est définitive. Pensez à enregistrer les résultats avant.
              </p>
              <ConfirmButton
                tone="danger"
                question="Supprimer définitivement ce vote ?"
                confirmLabel="Oui, supprimer"
                onConfirm={() => remove.mutateAsync()}
              >
                Supprimer le vote
              </ConfirmButton>
            </Section>
          </div>
        )}
      </Layout>
    </>
  );
};
