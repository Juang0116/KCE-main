import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

/**
 * Resolve locale to ensure we redirect to the correct localized version
 * of the new planning path.
 */
async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const c = await cookies();
  const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;

  return 'es';
}

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  return {
    title: 'Plan personalizado | KCE',
    description: 'Ruta heredada. El flujo principal ahora vive en /plan.',
    robots: { index: false, follow: true },
    alternates: { canonical: withLocale(locale, '/plan') },
  };
}

/**
 * QuizRedirectPage:
 * Instant server-side redirect from legacy /quiz to new /plan.
 */
export default async function QuizRedirectPage() {
  const locale = await resolveLocale();
  
  // 301 or 307 redirect depending on how permanent you want this to be.
  // Next.js default redirect is 307 (Temporary).
  redirect(withLocale(locale, '/plan'));
}