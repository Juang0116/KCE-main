// src/i18n/getDictionary.ts
import type { SupportedLocale } from './locales';

// Re-export for consumers (pages/components) so they don't need to know the internal file.
export type { SupportedLocale } from './locales';

export type Dictionary = Record<string, any>;

export async function getDictionary(locale: SupportedLocale): Promise<Dictionary> {
  switch (locale) {
    case 'en':
      return (await import('./dictionaries/en.json')).default;
    case 'fr':
      return (await import('./dictionaries/fr.json')).default;
    case 'de':
      return (await import('./dictionaries/de.json')).default;
    default:
      return (await import('./dictionaries/es.json')).default;
  }
}

export function t(dict: Dictionary, key: string, fallback?: string): string {
  const parts = key.split('.');
  let cur: any = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else return fallback ?? key;
  }
  return typeof cur === 'string' ? cur : (fallback ?? key);
}
