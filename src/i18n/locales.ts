// src/i18n/locales.ts
export const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'es';

export function isSupportedLocale(v: string | null | undefined): v is SupportedLocale {
  return !!v && (SUPPORTED_LOCALES as readonly string[]).includes(v);
}
