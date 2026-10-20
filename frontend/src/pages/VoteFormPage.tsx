import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { Header } from '../components/Header';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { FadeIn } from '../motion/FadeIn';
import { adminService } from '../services/adminService';
import { errorText } from '../services/publicApi';

const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface Row {
  key: number;
  name: string;
  bio: string;
}

export const VoteFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endDate, setEndDate] = useState(() => toLocalInput(new Date(Date.now() + 7 * 24 * 3600 * 1000)));
  const [rows, setRows] = useState<Row[]>([
    { key: 1, name: '', bio: '' },
    { key: 2, name: '', bio: '' }
  ]);
  const [nextKey, setNextKey] = useState(3);
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () =>
      adminService.create({
        title,
        description,
        endDate: new Date(endDate).toISOString(),
        candidates: rows.filter((r) => r.name.trim()).map((r) => ({ name: r.name, bio: r.bio }))
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['admin-votes'] });
      navigate(`/admin/votes/${created.id}`);
    },
    onError: (err) => setError(errorText(err, 'Le vote n’a pas pu être créé. Vérifiez les champs et réessayez.'))
  });

  const setRow = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <>
      <Header />
      <Layout>
        <Link to="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
          Retour à vos votes
        </Link>
        <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">Créer un vote</h1>
        <p className="mt-3 max-w-[56ch] text-muted">
          Posez votre question et ajoutez les candidats. Le vote est créé en brouillon : vous le vérifiez, puis vous l’ouvrez et partagez le lien.
        </p>

        <form
          noValidate
          className="mt-10 max-w-2xl space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            setError('');
            create.mutate();
          }}
        >
          <Input label="Question ou titre du vote" placeholder="Qui sera le responsable du groupe en 2026 ?" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            label="Description (facultatif)"
            hint="Quelques mots pour expliquer le contexte aux votants."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>
            <Input label="Fin du vote" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <p className="mt-1.5 text-sm text-muted">Le vote se ferme automatiquement à cette date. Vous pouvez aussi le clore plus tôt.</p>
          </div>

          <fieldset>
            <legend className="font-display text-2xl font-bold">Candidats</legend>
            <p className="mt-1 text-sm text-muted">Au moins 2. Chaque candidat recevra son propre lien privé pour suivre son score.</p>
            <ul className="mt-4 space-y-5">
              {rows.map((row, i) => (
                <li key={row.key} className="rounded-lg border border-line p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid flex-1 gap-3">
                      <Input label={`Nom du candidat ${i + 1}`} value={row.name} onChange={(e) => setRow(row.key, { name: e.target.value })} />
                      <Input label="Présentation (facultatif)" value={row.bio} onChange={(e) => setRow(row.key, { bio: e.target.value })} />
                    </div>
                    {rows.length > 2 && (
                      <button
                        type="button"
                        aria-label={`Retirer le candidat ${i + 1}`}
                        onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                        className="mt-7 inline-flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-ink/10"
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={rows.length >= 30}
              onClick={() => {
                setRows((rs) => [...rs, { key: nextKey, name: '', bio: '' }]);
                setNextKey((k) => k + 1);
              }}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-ink/30 px-4 text-sm font-semibold hover:bg-ink/5 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter un candidat
            </button>
          </fieldset>

          {error && (
            <FadeIn role="alert" className="rounded-md border border-bad/40 bg-bad/10 p-3 text-sm text-bad">
              {error}
            </FadeIn>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" isLoading={create.isPending}>
              Créer le vote
            </Button>
            <p className="text-sm text-muted">Rien n’est visible du public tant que vous n’avez pas ouvert le vote.</p>
          </div>
        </form>
      </Layout>
    </>
  );
};
