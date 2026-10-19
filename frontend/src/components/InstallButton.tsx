import React, { useEffect, useState } from 'react';

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Bouton « Installer l'application », affiché seulement quand le navigateur propose l'installation. */
export const InstallButton: React.FC = () => {
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!event) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await event.prompt();
        await event.userChoice;
        setEvent(null);
      }}
      className="inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-4"
    >
      Installer l’application
    </button>
  );
};
