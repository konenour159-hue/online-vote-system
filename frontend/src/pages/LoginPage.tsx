import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { FadeIn } from '../motion/FadeIn';
import { NeuralNetwork } from '../motion/NeuralNetwork';

const loginSchema = z.object({
  email: z.string().email('Saisissez une adresse e-mail valide.'),
  password: z.string().min(1, 'Saisissez votre mot de passe.')
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { setUser, setAuthenticated } = useAuthStore();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      const result = await authService.login(data.email, data.password);
      setUser(result.user);
      setAuthenticated(true);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response
          ? err.response.status === 429
            ? 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
            : 'E-mail ou mot de passe incorrect.'
          : 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.'
      );
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-night p-12 text-white lg:flex">
        <Link to="/" aria-label="Genies, accueil" className="inline-flex min-h-11 items-center text-white">
          <Logo inverted height={24} />
        </Link>
        <div className="flex min-h-[14rem] flex-1 items-center justify-center py-8">
          <NeuralNetwork className="pointer-events-none h-auto max-h-64 w-full text-white opacity-70" />
        </div>
        <div>
          <p className="font-display text-5xl font-extrabold leading-[1.05] text-white">Votre groupe.<br />Votre voix.</p>
          <p className="mt-5 max-w-[34ch] text-white/75">
            Connectez-vous pour voter pour le responsable de votre groupe ou consulter les résultats d’un scrutin clos.
          </p>
        </div>
        <p className="text-sm text-white/60">Plateforme de vote proposée par Genies</p>
      </aside>

      <main id="main" data-route={pathname} tabIndex={-1} className="flex items-center justify-center px-6 py-12 focus:outline-none">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex min-h-11 items-center lg:hidden" aria-label="Genies, accueil">
            <Logo height={22} />
          </Link>
          <h1 className="text-4xl font-extrabold">Se connecter</h1>
          <p className="mt-2 text-muted">Utilisez l’e-mail et le mot de passe fournis par votre groupe.</p>

          {error && (
            <FadeIn role="alert" className="mt-6 rounded-md border border-bad/40 bg-bad/10 p-3 text-sm text-bad">
              {error}
            </FadeIn>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <Input label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
            <Input
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Se connecter
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};
