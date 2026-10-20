import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PublicLayout } from '../components/PublicLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { FadeIn } from '../motion/FadeIn';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { popSelected } from '../motion/usePressPop';
import { errorText, publicVoteService } from '../services/publicApi';

type Step = 'identify' | 'code' | 'choose' | 'confirm' | 'done';

const StepTitle = React.forwardRef<HTMLHeadingElement, { n: number; children: React.ReactNode }>(({ n, children }, ref) => (
  <>
    <p className="text-sm text-muted">Étape {n} sur 3</p>
    <h2 ref={ref} tabIndex={-1} className="mt-1 text-3xl font-extrabold focus:outline-none">
      {children}
    </h2>
  </>
));
StepTitle.displayName = 'StepTitle';

export const VotePage: React.FC = () => {
  const { token = '' } = useParams();
  const online = useOnlineStatus();
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const [step, setStep] = useState<Step>('identify');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [session, setSession] = useState('');
  const [choice, setChoice] = useState('');
  const [error, setError] = useState('');
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const vote = useQuery({
    queryKey: ['public-vote', token],
    queryFn: () => publicVoteService.getVote(token),
    retry: (count, err: any) => err?.response?.status !== 404 && count < 1
  });
  const closed = vote.data?.phase === 'closed';
  const results = useQuery({
    queryKey: ['public-results', token],
    queryFn: () => publicVoteService.getResults(token),
    enabled: closed,
    retry: false
  });

  // Après chaque changement d'étape, le focus passe au titre : les lecteurs d'écran annoncent la nouvelle étape.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
  }, [step, alreadyVoted]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const identify = useMutation({
    mutationFn: () => publicVoteService.identify(token, name, email),
    onSuccess: (r) => {
      setError('');
      setCode('');
      setCooldown(r.resendAfterSeconds);
      setStep('code');
    },
    onError: (e) => setError(errorText(e))
  });
  const verify = useMutation({
    mutationFn: () => publicVoteService.verify(token, email, code),
    onSuccess: (r) => {
      setError('');
      setSession(r.session);
      setStep('choose');
    },
    onError: (e: any) => {
      if (e?.response?.status === 409 && e?.response?.data?.userFacing) setAlreadyVoted(true);
      setError(errorText(e));
    }
  });
  const cast = useMutation({
    mutationFn: () => publicVoteService.castBallot(token, session, choice),
    onSuccess: () => {
      setError('');
      setStep('done');
    },
    onError: (e: any) => {
      setError(errorText(e));
      if (e?.response?.status === 401) {
        setSession('');
        setStep('identify');
      }
      if (e?.response?.status === 409) vote.refetch();
    }
  });

  const info = vote.data;
  const chosen = info?.candidates.find((c) => c.id === choice);

  return (
    <PublicLayout>
      {vote.isLoading && <p className="text-muted">Chargement du vote…</p>}
      {vote.isError && (
        <FadeIn role="alert">
          <h1 className="text-3xl font-extrabold">
            {(vote.error as any)?.response?.status === 404 ? 'Ce lien n’est pas valide' : 'Impossible de charger le vote'}
          </h1>
          <p className="mt-3 text-muted">
            {(vote.error as any)?.response?.status === 404
              ? 'Vérifiez que vous avez copié le lien en entier, ou demandez-le de nouveau à l’organisateur.'
              : `${errorText(vote.error)} Le lien est peut-être valide : réessayez dans un instant.`}
          </p>
          {(vote.error as any)?.response?.status !== 404 && (
            <button
              type="button"
              onClick={() => vote.refetch()}
              className="mt-4 inline-flex h-11 items-center rounded-md border border-ink/30 px-4 text-sm font-semibold hover:bg-ink/5"
            >
              Réessayer
            </button>
          )}
        </FadeIn>
      )}

      {info && (
        <>
          <h1 className="text-4xl font-extrabold md:text-5xl">{info.title}</h1>
          {info.description && <p className="mt-4 max-w-[60ch] text-lg text-muted">{info.description}</p>}

          {info.phase === 'not_open' && (
            <FadeIn role="status" className="mt-10 rounded-lg border border-line bg-surface p-6">
              <h2 className="text-2xl font-bold">Ce vote n’est pas encore ouvert</h2>
              <p className="mt-2 text-muted">Revenez sur ce lien dès que l’organisateur aura ouvert le vote.</p>
            </FadeIn>
          )}

          {info.phase === 'closed' && (
            <FadeIn className="mt-10">
              <div role="status" className="rounded-lg border border-line bg-surface p-6">
                <h2 className="text-2xl font-bold">Ce vote est terminé</h2>
                <p className="mt-2 text-muted">Merci à toutes les personnes qui ont participé.</p>
              </div>
              {results.data && (
                <section className="mt-10">
                  <h2 className="text-3xl font-extrabold">Résultats</h2>
                  <p className="mt-1 text-muted">
                    {results.data.totalVotes} {results.data.totalVotes > 1 ? 'votes exprimés' : 'vote exprimé'}
                  </p>
                  <ul className="mt-6 space-y-5">
                    {results.data.results.map((r, i) => (
                      <li key={r.id}>
                        <div className="flex justify-between gap-4">
                          <span className="font-semibold">
                            {i === 0 && r.votes > 0 && <span className="sr-only">En tête : </span>}
                            {r.name}
                          </span>
                          <span className="tabular-nums text-muted">
                            {r.votes} {r.votes > 1 ? 'voix' : 'voix'} ({String(r.percentage).replace('.', ',')} %)
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 rounded-full bg-ink/10" aria-hidden="true">
                          <div className="h-2 rounded-full bg-spark" style={{ width: `${r.percentage}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </FadeIn>
          )}

          {info.phase === 'open' && (
            <div className="mt-10 max-w-xl">
              <p className="mb-6 text-sm text-muted">Vote ouvert jusqu’au {format(new Date(info.endDate), "d MMMM yyyy 'à' HH:mm", { locale: fr })}.</p>

              {alreadyVoted && (
                <FadeIn role="status" className="rounded-lg border border-line bg-surface p-6">
                  <h2 ref={heading} tabIndex={-1} className="text-2xl font-bold focus:outline-none">
                    Vous avez déjà voté
                  </h2>
                  <p className="mt-2 text-muted">Cette adresse e-mail a déjà été utilisée pour voter. Chaque personne ne vote qu’une fois.</p>
                </FadeIn>
              )}

              {!alreadyVoted && step === 'identify' && (
                <FadeIn>
                  <StepTitle ref={heading} n={1}>
                    Qui êtes-vous ?
                  </StepTitle>
                  <p className="mt-2 text-muted">Nous vous envoyons un code par e-mail pour vérifier votre adresse et éviter les doubles votes. Votre choix reste secret.</p>
                  <form
                    noValidate
                    className="mt-6 space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setError('');
                      identify.mutate();
                    }}
                  >
                    <Input label="Nom et prénom" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                    <Input label="Adresse e-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    {error && (
                      <FadeIn role="alert" className="text-sm text-bad">
                        {error}
                      </FadeIn>
                    )}
                    <Button type="submit" size="lg" isLoading={identify.isPending} disabled={!online}>
                      Recevoir mon code
                    </Button>
                    {!online && <p className="text-sm text-muted">Vous êtes hors ligne : reconnectez-vous pour continuer.</p>}
                  </form>
                </FadeIn>
              )}

              {!alreadyVoted && step === 'code' && (
                <FadeIn>
                  <StepTitle ref={heading} n={2}>
                    Saisissez votre code
                  </StepTitle>
                  <p className="mt-2 text-muted">
                    Un code à 6 chiffres vient d’être envoyé à <strong className="text-ink">{email}</strong>. Il est valable 10 minutes. Pensez à vérifier vos courriers indésirables.
                  </p>
                  <form
                    noValidate
                    className="mt-6 space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setError('');
                      verify.mutate();
                    }}
                  >
                    <Input
                      label="Code de vérification"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      className="max-w-[12rem] text-center font-display text-2xl tracking-[0.4em]"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                    />
                    {error && (
                      <FadeIn role="alert" className="text-sm text-bad">
                        {error}
                      </FadeIn>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="submit" size="lg" isLoading={verify.isPending} disabled={code.length !== 6 || !online}>
                        Continuer
                      </Button>
                      <button
                        type="button"
                        disabled={cooldown > 0 || identify.isPending}
                        onClick={() => identify.mutate()}
                        className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 disabled:no-underline disabled:opacity-60"
                      >
                        {cooldown > 0 ? `Renvoyer le code dans ${cooldown} s` : 'Renvoyer le code'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setStep('identify');
                        }}
                        className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
                      >
                        Changer d’adresse e-mail
                      </button>
                    </div>
                  </form>
                </FadeIn>
              )}

              {!alreadyVoted && step === 'choose' && (
                <FadeIn>
                  <StepTitle ref={heading} n={3}>
                    Votre choix
                  </StepTitle>
                  <form
                    className="mt-6"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (choice) setStep('confirm');
                    }}
                  >
                    <fieldset>
                      <legend className="text-muted">Choisissez un candidat. Vous pourrez vérifier avant de valider.</legend>
                      <div className="mt-4 space-y-2">
                        {info.candidates.map((c) => {
                          const selected = choice === c.id;
                          return (
                            <label
                              key={c.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-smoke ${
                                selected ? 'border-ink bg-ink/5' : 'border-line hover:border-smoke'
                              }`}
                            >
                              <input
                                type="radio"
                                name="candidate"
                                className="mt-1.5 h-4 w-4 accent-[rgb(var(--ink))]"
                                checked={selected}
                                onChange={(e) => {
                                  setChoice(c.id);
                                  popSelected(e.currentTarget.closest('label'));
                                }}
                              />
                              <span>
                                <span className="block font-semibold">{c.name}</span>
                                {c.bio && <span className="block text-sm text-muted">{c.bio}</span>}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                    <div className="mt-6">
                      <Button type="submit" size="lg" disabled={!choice}>
                        Continuer
                      </Button>
                    </div>
                  </form>
                </FadeIn>
              )}

              {!alreadyVoted && step === 'confirm' && (
                <FadeIn>
                  <p className="text-sm text-muted">Dernière vérification</p>
                  <h2 ref={heading} tabIndex={-1} className="mt-1 text-3xl font-extrabold focus:outline-none">
                    Confirmez votre vote
                  </h2>
                  <p className="mt-4 rounded-lg border border-line bg-surface p-5 text-lg">
                    Vous votez pour <strong className="font-display text-2xl">{chosen?.name}</strong>.
                  </p>
                  <p className="mt-3 text-sm text-muted">Une fois validé, votre vote est définitif et ne peut plus être modifié.</p>
                  {error && (
                    <FadeIn role="alert" className="mt-4 text-sm text-bad">
                      {error}
                    </FadeIn>
                  )}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button size="lg" isLoading={cast.isPending} disabled={!online} onClick={() => cast.mutate()}>
                      Valider mon vote
                    </Button>
                    <Button variant="ghost" size="lg" disabled={cast.isPending} onClick={() => setStep('choose')}>
                      Modifier mon choix
                    </Button>
                  </div>
                  {!online && <p className="mt-3 text-sm text-muted">Vous êtes hors ligne : reconnectez-vous pour valider.</p>}
                </FadeIn>
              )}

              {!alreadyVoted && step === 'done' && (
                <FadeIn role="status" className="rounded-lg border border-ok/40 bg-ok/10 p-6">
                  <h2 ref={heading} tabIndex={-1} className="text-3xl font-extrabold focus:outline-none">
                    Merci, votre vote est enregistré
                  </h2>
                  <p className="mt-3 text-muted">
                    Votre choix est secret : il n’est relié ni à votre nom ni à votre adresse e-mail. Vous ne pouvez plus voter avec <strong>{email}</strong>. Les résultats seront publiés à la clôture du vote, sur ce même lien.
                  </p>
                </FadeIn>
              )}
            </div>
          )}
        </>
      )}
    </PublicLayout>
  );
};
