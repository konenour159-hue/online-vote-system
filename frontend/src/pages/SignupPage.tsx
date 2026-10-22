import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { FadeIn } from '../motion/FadeIn';
import { accountService } from '../services/accountApi';
import { errorText } from '../services/publicApi';

export const SignupPage: React.FC = () => {
  const status = useQuery({ queryKey: ['signup-status'], queryFn: accountService.signupStatus, retry: 1 });
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '', organisation: '', message: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError(''); // l'ancien message n'a plus lieu d'être dès que la personne corrige
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const submit = useMutation({
    mutationFn: () =>
      accountService.requestSignup({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        organisation: form.organisation,
        message: form.message
      }),
    onSuccess: () => setSent(true),
    onError: (e) => setError(errorText(e))
  });

  useEffect(() => {
    if (sent) heading.current?.focus();
  }, [sent]);

  const closed = status.data && !status.data.open;

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-10">
      <header>
        <Link to="/" aria-label="Genies, accueil" className="inline-flex min-h-11 items-center">
          <Logo height={24} />
        </Link>
      </header>

      <main id="main" tabIndex={-1} className="mt-10 flex-1 focus:outline-none">
        {sent ? (
          <FadeIn role="status">
            <h1 ref={heading} tabIndex={-1} className="text-4xl font-extrabold focus:outline-none">
              Demande envoyée
            </h1>
            <p className="mt-4 text-muted">
              Merci {form.firstName}. Un administrateur va examiner votre demande. Vous pourrez vous connecter dès qu’elle sera validée : revenez essayer un peu plus tard avec votre adresse e-mail (<strong className="text-ink">{form.email}</strong>) et votre mot de passe.
            </p>
            <p className="mt-3 text-sm text-muted">Aucun e-mail de confirmation n’est envoyé : c’est à vous de revenir sur la page de connexion.</p>
            <Link to="/" className="mt-6 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
              Retour à l’accueil
            </Link>
          </FadeIn>
        ) : closed ? (
          <FadeIn role="status">
            <h1 className="text-4xl font-extrabold">Inscriptions fermées</h1>
            <p className="mt-4 text-muted">Les demandes d’accès ne sont pas ouvertes pour le moment. Contactez l’administrateur de la plateforme.</p>
            <Link to="/login" className="mt-6 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
              Se connecter
            </Link>
          </FadeIn>
        ) : (
          <>
            <h1 className="text-4xl font-extrabold">Demander un accès organisateur</h1>
            <p className="mt-3 text-muted">
              Pour créer vos propres votes, demandez un compte. Un administrateur valide chaque demande avant que vous puissiez vous connecter.
            </p>
            <form
              noValidate
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                if (form.password !== form.confirm) {
                  setError('Les deux mots de passe ne sont pas identiques.');
                  return;
                }
                submit.mutate();
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Prénom" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} />
                <Input label="Nom" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} />
              </div>
              <Input label="Adresse e-mail" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
              <div>
                <Input label="Mot de passe" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
                <p className="mt-1.5 text-sm text-muted">8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un symbole.</p>
              </div>
              <Input label="Confirmer le mot de passe" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
              <Input label="Organisation (facultatif)" autoComplete="organization" value={form.organisation} onChange={set('organisation')} />
              <Textarea label="Pourquoi souhaitez-vous créer des votes ? (facultatif)" hint="Quelques mots aident l’administrateur à valider votre demande." value={form.message} onChange={set('message')} />
              {error && (
                <FadeIn role="alert" className="rounded-md border border-bad/40 bg-bad/10 p-3 text-sm text-bad">
                  {error}
                </FadeIn>
              )}
              <div className="flex flex-wrap items-center gap-4">
                <Button type="submit" size="lg" isLoading={submit.isPending}>
                  Envoyer ma demande
                </Button>
                <Link to="/login" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
                  J’ai déjà un compte
                </Link>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
};
