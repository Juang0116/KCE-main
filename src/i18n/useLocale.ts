// src/i18n/useLocale.ts
'use client';

import { usePathname } from 'next/navigation';

import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from './locales';

export function useLocaleFromPath(): SupportedLocale {
  const pathname = usePathname() || '/';
  const m = pathname.match(/^\/(es|en|fr|de)(?=\/|$)/);
  const loc = (m?.[1] || '').toLowerCase();
  return isSupportedLocale(loc) ? (loc as SupportedLocale) : DEFAULT_LOCALE;
}
