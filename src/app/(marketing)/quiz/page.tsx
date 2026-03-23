/* src/app/(marketing)/quiz/page.tsx */
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { permanentRedirect } from 'next/navigation';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED: Set<SupportedLocale> = new Set(['es', 'en', 'fr', 'de']);

/**
 * Resolve locale centralizado.
 * Mantenemos la paridad con el sistema de detección de toda la app KCE.
 */
async function resolveLocale(): Promise<SupportedLocale> {
  const [h, c] = await Promise.all([headers(), cookies()]);
  
  const fromHeader = h.get('x-kce-locale')?.trim().toLowerCase();
  if (fromHeader && SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const fromCookie = c.get('kce.locale')?.value?.trim().toLowerCase();
  if (fromCookie && SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;

  return 'es';
}

/**
 * Helper de navegación consistente con el ruteo de KCE.
 */
function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  
  // Si es español, evitamos el prefijo /es para mantener URLs limpias
  if (locale === 'es') return href;
  
  return `/${locale}${href === '/' ? '' : href}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  return {
    title: 'Plan Personalizado | KCE Colombia',
    description: 'Redirigiendo a nuestra nueva experiencia de planificación de viajes de lujo.',
    robots: { index: false, follow: true },
    alternates: { canonical: withLocale(locale, '/plan') },
  };
}

/**
 * QuizRedirectPage:
 * Realiza una redirección permanente (308) desde /quiz hacia /plan.
 * Esto asegura que cualquier link antiguo o indexado en Google se actualice correctamente.
 */
export default async function QuizRedirectPage() {
  const locale = await resolveLocale();
  
  // Usamos permanentRedirect para optimización SEO (308)
  permanentRedirect(withLocale(locale, '/plan'));
}