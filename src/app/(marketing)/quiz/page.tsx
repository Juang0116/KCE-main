import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

/**
 * Resolve locale centralizado para evitar inconsistencias entre metadata y el body.
 */
async function resolveLocale(): Promise<SupportedLocale> {
  const [h, c] = await Promise.all([headers(), cookies()]);
  
  const fromHeader = h.get('x-kce-locale')?.trim().toLowerCase();
  if (fromHeader && SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const fromCookie = c.get('kce.locale')?.value?.trim().toLowerCase();
  if (fromCookie && SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;

  return 'es';
}

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  // Evita duplicar el prefijo si ya existe
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return `/${locale}${href === '/' ? '' : href}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  return {
    title: 'Plan personalizado | KCE',
    description: 'Redirigiendo a la nueva experiencia de planificación.',
    robots: { index: false, follow: true },
    alternates: { canonical: withLocale(locale, '/plan') },
  };
}

/**
 * QuizRedirectPage:
 * Redirección instantánea del lado del servidor de /quiz a /plan.
 */
export default async function QuizRedirectPage() {
  const locale = await resolveLocale();
  
  /**
   * Usamos Permanent (308) para indicar a los motores de búsqueda que 
   * la ruta /quiz ha sido reemplazada definitivamente por /plan.
   */
  redirect(withLocale(locale, '/plan'), RedirectType.replace);
}