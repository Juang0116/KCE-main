// src/components/ThemeToggle.tsx
'use client';

import clsx from 'clsx';
import { Moon, Sun } from 'lucide-react';
import * as React from 'react';

// Must match branding/themeInlineScript (see: src/branding/brand.tokens.ts)
const STORAGE_KEY = 'kce.theme';

type Theme = 'light' | 'dark';

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  return prefersDark ? 'dark' : 'light';
}

function applyThemeToDom(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
}

export default function ThemeToggle(props: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<Theme>('light');

  React.useEffect(() => {
    setMounted(true);

    const initial = getStoredTheme() ?? getSystemTheme();
    setTheme(initial);
    applyThemeToDom(initial);

    // Sync entre pestañas
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = e.newValue === 'dark' || e.newValue === 'light' ? (e.newValue as Theme) : null;
      const resolved = next ?? getSystemTheme();
      setTheme(resolved);
      applyThemeToDom(resolved);
    };
    window.addEventListener('storage', onStorage);

    // Si el usuario NO ha fijado tema en storage, sigue al sistema
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      const stored = getStoredTheme();
      if (stored) return; // usuario fijó tema manualmente
      const sys = getSystemTheme();
      setTheme(sys);
      applyThemeToDom(sys);
    };

    mq?.addEventListener?.('change', onSystemChange);

    return () => {
      window.removeEventListener('storage', onStorage);
      mq?.removeEventListener?.('change', onSystemChange);
    };
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyThemeToDom(next);
  };

  const Icon = theme === 'dark' ? Sun : Moon;
  const label = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className={clsx(
        'inline-flex items-center justify-center',
        'size-10 rounded-full',
        'transition',
        'dark:hover:bg-[color:var(--color-surface)]/10 hover:bg-black/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40',
        props.className,
      )}
      // evita warning/flash: el ícono solo aparece cuando mounted=true
      suppressHydrationWarning
    >
      {mounted ? (
        <Icon
          className="size-5"
          aria-hidden="true"
        />
      ) : (
        <span className="size-5" />
      )}
    </button>
  );
}
