import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Button } from './Button';
import { LinkButton } from './LinkButton';
import { Logo } from './Logo';
import { useMyCandidacies } from '../hooks/useMyCandidacies';
import { useIsAdmin, useRole } from '../hooks/useRole';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-10 shrink-0 items-center border-b-2 text-sm font-semibold ${
    isActive ? 'border-spark' : 'border-transparent text-muted hover:text-ink'
  }`;

/** Liens de navigation : affichés en ligne dans l'en-tête (écran large) et sur une seconde ligne (téléphone). */
const NavItems: React.FC = () => {
  const { data: candidacies } = useMyCandidacies();
  const isCandidate = (candidacies?.length ?? 0) > 0;
  const isAdmin = useIsAdmin();
  const role = useRole();
  return (
    <>
      <NavLink to="/dashboard" className={navClass}>
        Scrutins
      </NavLink>
      {isAdmin && (
        <NavLink to="/admin/candidates" className={navClass}>
          Candidats
        </NavLink>
      )}
      {isCandidate && (
        <NavLink to="/candidacy" className={navClass}>
          Ma candidature
        </NavLink>
      )}
      {role === 'SUPER_ADMIN' && (
        <NavLink to="/admin" end className={navClass}>
          Administration
        </NavLink>
      )}
      {role === 'SUPER_ADMIN' && (
        <NavLink to="/admin/activity" className={navClass}>
          Activité
        </NavLink>
      )}
    </>
  );
};

export const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="relative border-b border-line">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-fg"
      >
        Aller au contenu
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-8">
          <Link to="/" aria-label="Genies, accueil" className="inline-flex min-h-11 items-center">
            <Logo height={22} />
          </Link>
          {isAuthenticated && (
            <nav className="hidden items-center gap-5 sm:flex" aria-label="Principal">
              <NavItems />
            </nav>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={isDark ? 'Passer au thème clair' : 'Passer au thème sombre'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={signOut}>
              Se déconnecter
            </Button>
          ) : (
            <LinkButton to="/login" size="sm">
              Se connecter
            </LinkButton>
          )}
        </div>
      </div>
      {isAuthenticated && (
        <nav
          className="flex items-center gap-5 overflow-x-auto border-t border-line px-4 sm:hidden"
          aria-label="Principal"
        >
          <NavItems />
        </nav>
      )}
    </header>
  );
};
