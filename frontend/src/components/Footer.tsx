import React from 'react';
import { Logo } from './Logo';

export const Footer: React.FC = () => (
  <footer className="mt-24 border-t border-line">
    <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <Logo className="text-ink" height={18} />
      <p>Plateforme de vote proposée par Genies, pour tout groupe qui doit élire son responsable. Chaque membre vote une seule fois.</p>
    </div>
  </footer>
);
