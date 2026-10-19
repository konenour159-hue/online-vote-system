import React from 'react';
import { Logo } from './Logo';
import { InstallButton } from './InstallButton';

export const Footer: React.FC = () => (
  <footer className="mt-24 border-t border-line">
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <Logo className="text-ink" height={18} />
      <div className="flex flex-col gap-1 sm:items-end">
        <p>Plateforme de vote proposée par Genies, pour tout groupe qui doit élire son responsable. Chaque membre vote une seule fois.</p>
        <InstallButton />
      </div>
    </div>
  </footer>
);
