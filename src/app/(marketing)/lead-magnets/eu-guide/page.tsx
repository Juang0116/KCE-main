import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import EuGuideLeadMagnetForm from '@/features/marketing/EuGuideLeadMagnetForm';
import InternationalGrowthDeck from '@/features/marketing/InternationalGrowthDeck';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

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

function getBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://kce.travel';
  return raw.trim().replace(/\/+$/, '');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getBaseUrl();
  const canonical = withLocale(locale, '/lead-magnets/eu-guide');
  return {
    metadataBase: new URL(base),
    title: 'Europe → Colombia guide | KCE',
    description:
      'Capture early-stage travel intent with a practical premium guide for European travelers planning Colombia.',
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: {
        es: '/es/lead-magnets/eu-guide',
        en: '/en/lead-magnets/eu-guide',
        fr: '/fr/lead-magnets/eu-guide',
        de: '/de/lead-magnets/eu-guide',
      },
    },
  };
}

export default async function EuGuideLeadMagnetPage() {
  const locale = await resolveLocale();
  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message:
      process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE || 'Hola KCE, quiero la guía Europa → Colombia.',
    url: `${getBaseUrl()}${withLocale(locale, '/lead-magnets/eu-guide')}`,
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="card p-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs text-[color:var(--color-text)]/70">
              <span className="font-semibold text-brand-blue">Lead magnet</span>
              <span className="opacity-70">·</span>
              <span>EU → Colombia</span>
            </div>

            <h1 className="mt-4 font-heading text-3xl text-brand-blue md:text-4xl">Guía Europa → Colombia</h1>

            <p className="mt-3 text-[color:var(--color-text)]/75">
              Te enviamos por correo una guía corta y útil para viajeros europeos: rutas sugeridas,
              tips de seguridad, qué empacar, presupuesto aproximado y recomendaciones de tours KCE.
            </p>
          </div>

          <aside className="w-full rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5 md:w-[320px]">
            <div className="text-sm font-semibold text-[color:var(--color-text)]">Qué incluye</div>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-text)]/75">
              <li className="flex gap-2">
                <span className="mt-0.5 text-brand-blue">•</span>
                <span>Checklist de viaje (antes / durante / después).</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-brand-blue">•</span>
                <span>Destinos recomendados + experiencias culturales.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-brand-blue">•</span>
                <span>Tips de reserva segura + soporte KCE.</span>
              </li>
            </ul>
          </aside>
        </header>

        <section aria-label="Formulario para recibir la guía" className="mt-8">
          <EuGuideLeadMagnetForm />
        </section>

        <section className="mt-8">
          <InternationalGrowthDeck locale={locale} whatsAppHref={waHref} compact />
        </section>

        <footer className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
          <p className="text-sm text-[color:var(--color-text)]/75">
            Privacidad: usamos tu email solo para enviarte la guía y darte soporte. Puedes pedir
            eliminación cuando quieras.
          </p>

          <nav aria-label="Enlaces legales" className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link href={withLocale(locale, '/privacy')} className="text-brand-blue underline underline-offset-4 hover:opacity-90">
              Ver privacidad
            </Link>
            <Link href={withLocale(locale, '/cookies')} className="text-brand-blue underline underline-offset-4 hover:opacity-90">
              Preferencias de cookies
            </Link>
            <Link href={withLocale(locale, '/tours')} className="text-brand-blue underline underline-offset-4 hover:opacity-90">
              Ver tours
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
