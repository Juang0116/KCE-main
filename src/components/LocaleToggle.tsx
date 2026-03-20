'use client';

import clsx from 'clsx';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Globe } from 'lucide-react';

const LOCALES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' },
] as const;

type LocaleCode = (typeof LOCALES)[number]['code'];

function splitLocale(pathname: string): { locale: LocaleCode; rest: string } {
  // Regex mejorada para capturar el locale de forma más segura
  const m = pathname.match(/^\/(es|en|fr|de)(?=\/|$)/);
  const locale = (m?.[1] as LocaleCode) || 'es';
  const rest = pathname.replace(/^\/(es|en|fr|de)(?=\/|$)/, '') || '/';
  return { locale, rest };
}

export default function LocaleToggle({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { locale, rest } = splitLocale(pathname);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as LocaleCode;
    // Evitamos duplicar el slash si rest es solo '/'
    const cleanRest = rest === '/' ? '' : rest;
    router.push(`/${next}${cleanRest}`);
  };

  return (
    <div className={clsx(
      'group relative flex items-center gap-2 rounded-full border border-brand-dark/5 bg-white/50 px-3 py-1.5 transition-all hover:border-brand-blue/30 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10',
      className
    )}>
      {/* Icono sutil para dar contexto visual sin ocupar mucho espacio */}
      <Globe className="h-3.5 w-3.5 text-[color:var(--color-text)]/40 group-hover:text-brand-blue transition-colors" />
      
      <label className="flex items-center">
        <span className="sr-only">Cambiar idioma</span>
        <select
          value={locale}
          onChange={onChange}
          className={clsx(
            'appearance-none bg-transparent text-xs font-bold tracking-widest text-[color:var(--color-text)]/70 outline-none cursor-pointer',
            'pr-1 group-hover:text-brand-blue transition-colors uppercase'
          )}
          aria-label="Seleccionar idioma"
        >
          {LOCALES.map((l) => (
            <option key={l.code} value={l.code} className="bg-[color:var(--color-surface)] text-[color:var(--color-text)] dark:bg-brand-dark dark:text-white">
              {l.label}
            </option>
          ))}
        </select>
        
        {/* Flecha decorativa minimalista para indicar que es un dropdown */}
        <span className="pointer-events-none text-[8px] text-[color:var(--color-text)]/30 group-hover:text-brand-blue/50 transition-colors">
          ▼
        </span>
      </label>
    </div>
  );
}