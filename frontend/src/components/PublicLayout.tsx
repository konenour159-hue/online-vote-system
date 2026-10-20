import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import { Logo } from './Logo';
import { Button } from './Button';
import { Footer } from './Footer';

/** Cadre des pages publiques (vote, page candidat) : aucun lien vers l'espace administrateur. */
export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDark, toggleTheme } = useThemeStore();
  const { pathname } = useLocation();
  return (
    <>
      <header className="relative border-b border-line">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-fg"
        >
          Aller au contenu
        </a>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="inline-flex min-h-11 items-center">
            <Logo height={22} />
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={isDark ? 'Passer au thème clair' : 'Passer au thème sombre'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>
      <div className="flex min-h-[calc(100vh-61px)] flex-col">
        <main id="main" data-route={pathname} tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 focus:outline-none sm:px-6">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
};
