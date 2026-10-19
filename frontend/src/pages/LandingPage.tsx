import React, { lazy, Suspense, useRef } from 'react';
import { Header } from '../components/Header';
import { Layout } from '../components/Layout';
import { LinkButton } from '../components/LinkButton';
import { DemoBallot } from '../components/DemoBallot';
// three.js est chargé à part : le texte et le bouton s'affichent sans l'attendre.
const LogoRing = lazy(() => import('../components/LogoRing').then((m) => ({ default: m.LogoRing })));
import { useAuthStore } from '../store/authStore';
import { NeuralNetwork } from '../motion/NeuralNetwork';
import { gsap, SplitText, useGSAP } from '../motion/gsap';
import { dur, ease, FULL_MOTION, scroll, stagger } from '../motion/tokens';

const steps = [
  { title: 'Se connecter', text: 'Utilisez l’adresse e-mail que l’organisateur de votre groupe a enregistrée pour vous.' },
  { title: 'Remplir votre bulletin', text: 'Choisissez un candidat par poste. Vous pouvez changer d’avis tant que vous n’avez pas validé.' },
  { title: 'Valider', text: 'Une fois validé, votre bulletin est définitif. Impossible de voter deux fois dans le même scrutin.' }
];

export const LandingPage: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const page = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(FULL_MOTION, () => {
        // Séquence d'entrée unique et courte : le titre, le texte, l'action, puis le bulletin.
        const split = SplitText.create('[data-hero-title]', { type: 'lines', mask: 'lines', autoSplit: true });
        const tl = gsap.timeline({ defaults: { ease: ease.expo } });
        tl.from(split.lines, { yPercent: 105, duration: dur.hero, stagger: stagger.list }, 0.05)
          .from('[data-hero-text]', { opacity: 0, y: 14, duration: dur.slow }, 0.45)
          .from('[data-hero-cta]', { opacity: 0, y: 14, duration: dur.slow }, 0.6)
          .from('[data-hero-ballot]', { opacity: 0, y: 20, duration: dur.slow + 0.1 }, 0.35);

        // Les étapes apparaissent une seule fois, quand on y arrive.
        gsap.from('[data-step]', {
          opacity: 0,
          y: 16,
          duration: dur.slow,
          ease: ease.out,
          stagger: stagger.list,
          scrollTrigger: { trigger: '[data-steps]', start: scroll.start, once: true }
        });

        // Le bloc « secret » se révèle par un balayage de gauche à droite.
        gsap.fromTo(
          '[data-secret]',
          { clipPath: 'inset(0 100% 0 0)' },
          {
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.9,
            ease: ease.inOut,
            clearProps: 'clipPath',
            scrollTrigger: { trigger: '[data-secret]', start: 'top 88%', once: true }
          }
        );
      });
      return () => mm.revert();
    },
    { scope: page }
  );

  return (
    <>
      <Header />
      <Layout animate={false}>
        <div ref={page}>
        <section className="relative isolate grid items-center gap-12 py-6 lg:grid-cols-[1.15fr_1fr] lg:py-14">
          <Suspense fallback={null}>
            <LogoRing anchor={0.84} anchorY={0.17} fit={0.27} className="-z-10 -mx-4 sm:-mx-6 lg:-mx-[calc((100vw-72rem)/2+1.5rem)]" />
          </Suspense>
          <div>
            <h1 data-hero-title className="max-w-[14ch] text-[clamp(2.75rem,6.5vw,5rem)] font-extrabold">
              Choisissez le responsable de votre groupe.
            </h1>
            <p data-hero-text className="mt-6 max-w-[46ch] text-lg text-muted">
              Genies a conçu cette plateforme pour que chaque groupe élise son responsable en toute équité.
              Connectez-vous, remplissez votre bulletin et consultez les résultats dès la clôture du scrutin.
            </p>
            <div data-hero-cta className="mt-8 flex flex-wrap items-center gap-4">
              <LinkButton to={isAuthenticated ? '/dashboard' : '/login'} size="lg">
                {isAuthenticated ? 'Voir les scrutins' : 'Se connecter pour voter'}
              </LinkButton>
              <span className="text-sm text-muted">Essayez d’abord le bulletin d’exemple.</span>
            </div>
          </div>
          <div data-hero-ballot className="lg:pt-44">
            <DemoBallot />
          </div>
        </section>

        <section className="mt-24 grid gap-10 border-t border-line pt-12 md:grid-cols-[1fr_2fr]">
          <h2 className="text-3xl font-bold md:text-4xl">Voter en trois étapes</h2>
          <ol data-steps className="divide-y divide-line">
            {steps.map((s, i) => (
              <li key={s.title} data-step className="grid grid-cols-[2.5rem_1fr] gap-4 py-5 first:pt-0">
                <span className="font-display text-2xl font-extrabold text-smoke">{i + 1}</span>
                <div>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="mt-1 max-w-[56ch] text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          data-secret
          className="mt-20 grid items-center gap-10 rounded-lg bg-night p-8 text-white md:grid-cols-[1.1fr_1fr] md:p-12"
        >
          <div>
            <h2 className="max-w-[20ch] text-3xl font-bold md:text-4xl">Votre choix reste secret.</h2>
            <p className="mt-4 max-w-[58ch] opacity-85">
              Les organisateurs voient les totaux et la participation, jamais qui a voté pour qui. Les mots de passe
              sont chiffrés, les sessions expirent et chaque action d’administration est journalisée.
            </p>
          </div>
          <NeuralNetwork className="h-auto w-full text-white/80" />
        </section>
        </div>
      </Layout>
    </>
  );
};
