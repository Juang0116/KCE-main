// src/components/LocaleToggle.tsx
'use client';

import clsx from 'clsx';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

const LOCALES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' },
] as const;

type LocaleCode = (typeof LOCALES)[number]['code'];

function splitLocale(pathname: string): { locale: LocaleCode; rest: string } {
  const m = pathname.match(/^\/(es|en|fr|de)(?=\/|$)/);
  const locale = (m?.[1] as LocaleCode) || 'es';
  const rest = pathname.replace(/^\/(es|en|fr|de)(?=\/|$)/, '') || '/';
  return { locale, rest };
}

export default function LocaleToggle({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { locale, rest } = splitLocale(pathname);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as LocaleCode;
    const target = `/${next}${rest === '/' ? '' : rest}`;
    router.push(target);
  }

  return (
    <label className={clsx('inline-flex items-center gap-2', className)}>
      <span className="sr-only">Idioma</span>
      <select
        value={locale}
        onChange={onChange}
        className={clsx(
          'h-10 rounded-full border border-black/10 bg-transparent px-3 text-sm',
          'text-[color:var(--color-text)]/80',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40',
        )}
        aria-label="Idioma"
      >
        {LOCALES.map((l) => (
          <option
            key={l.code}
            value={l.code}
          >
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
