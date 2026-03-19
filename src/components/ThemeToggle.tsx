'use client';

import clsx from 'clsx';
import { Moon, Sun } from 'lucide-react';
import * as React from 'react';

const STORAGE_KEY = 'kce.theme';
type Theme = 'light' | 'dark';

/* --- Utilitarios de Sincronización --- */
const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return (stored === 'light' || stored === 'dark') ? stored : null;
};

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeToDom = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
};

export default function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<Theme>('light');

  React.useEffect(() => {
    setMounted(true);
    const initial = getStoredTheme() ?? getSystemTheme();
    setTheme(initial);
    applyThemeToDom(initial);

    // Sincronización entre pestañas (Storage Event)
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = (e.newValue as Theme) || getSystemTheme();
      setTheme(next);
      applyThemeToDom(next);
    };

    // Sincronización con el sistema (si no hay preferencia manual)
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      if (getStoredTheme()) return; 
      const sys = getSystemTheme();
      setTheme(sys);
      applyThemeToDom(sys);
    };

    window.addEventListener('storage', onStorage);
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
    } catch (e) { /* ignore */ }
    applyThemeToDom(next);
  };

  // Renderizado condicional para evitar Hydration Mismatch
  if (!mounted) return <div className={clsx('size-10', className)} />;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      className={clsx(
        'group relative inline-flex size-10 items-center justify-center rounded-full transition-all duration-300',
        'border border-brand-dark/5 bg-white/50 backdrop-blur-sm dark:bg-white/5 dark:hover:bg-white/10 hover:bg-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40',
        className
      )}
    >
      <div className="relative size-5 overflow-hidden">
        {/* Icono de Sol (Aparece en Dark) */}
        <Sun 
          className={clsx(
            "absolute inset-0 transition-all duration-500 ease-spring",
            theme === 'dark' ? "translate-y-0 rotate-0 opacity-100" : "translate-y-8 rotate-90 opacity-0"
          )} 
        />
        {/* Icono de Luna (Aparece en Light) */}
        <Moon 
          className={clsx(
            "absolute inset-0 transition-all duration-500 ease-spring text-brand-blue",
            theme === 'light' ? "translate-y-0 rotate-0 opacity-100" : "-translate-y-8 -rotate-90 opacity-0"
          )} 
        />
      </div>
    </button>
  );
}