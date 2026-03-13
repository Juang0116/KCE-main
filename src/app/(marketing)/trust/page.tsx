// src/app/(marketing)/trust/page.tsx
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SITE_URL } from '@/lib/env';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';

export const revalidate = 300;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || SITE_URL || 'https://kce.travel').replace(
  /\/+$/,
  '',
);

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const c = await cookies();
  const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;

  return 'es';
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const canonicalPath = `/${locale}/trust`;
  const canonicalAbs = absoluteUrl(canonicalPath);

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: 'Confianza y Seguridad — KCE',
    description:
      'Pagos seguros con Stripe, facturas PDF, políticas claras y soporte real. Conoce cómo KCE protege tus reservas.',
    alternates: {
      canonical: canonicalAbs,
      languages: {
        es: '/es/trust',
        en: '/en/trust',
        fr: '/fr/trust',
        de: '/de/trust',
      },
    },
    openGraph: {
      title: 'Confianza y Seguridad — KCE',
      description: 'Pagos seguros, soporte real y políticas claras.',
      url: canonicalAbs,
      type: 'website',
      images: [
        {
          url: absoluteUrl('/images/hero-kce.jpg'),
          width: 1200,
          height: 630,
          alt: 'KCE — Confianza y Seguridad',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: [absoluteUrl('/images/hero-kce.jpg')],
    },
  };
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
      <h2 className="font-heading text-xl text-brand-blue">{title}</h2>
      <div className="mt-3 text-sm text-[color:var(--color-text)]/75">{children}</div>
    </section>
  );
}

export default async function TrustPage() {
  const locale = await resolveLocale();
  const base = (SITE_URL || getPublicBaseUrl() || BASE_SITE_URL).replace(/\/+$/, '');
  const canonical = absoluteUrl(`/${locale}/trust`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Confianza y Seguridad — KCE',
    url: canonical,
    isPartOf: { '@type': 'WebSite', name: 'KCE', url: base },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <main className="mx-auto max-w-[var(--container-max)] px-4 py-10">
        <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue/80">Trust Center</p>
          <h1 className="mt-2 font-heading text-3xl text-brand-blue">Confianza y seguridad</h1>
          <p className="mt-3 max-w-3xl text-sm text-[color:var(--color-text)]/75">
            KCE está diseñado para vender en Europa con una base técnica seria: pagos reales (Stripe), facturas PDF,
            enlaces firmados para gestionar reservas, políticas claras y soporte humano cuando lo necesitas.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={withLocale(locale, '/tours')}
              className="rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-soft hover:opacity-95"
            >
              Ver tours
            </Link>
            <Link
              href={withLocale(locale, '/contact')}
              className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text)] hover:bg-[color:var(--color-surface)]"
            >
              Contacto y soporte
            </Link>
            <Link
              href={withLocale(locale, '/faq')}
              className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text)] hover:bg-[color:var(--color-surface)]"
            >
              Preguntas frecuentes
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Pagos seguros + comprobantes">
            <ul className="list-disc pl-5">
              <li>Pagos procesados por Stripe (estándar internacional).</li>
              <li>Confirmación por email + factura PDF.</li>
              <li>Moneda principal: EUR (enfocado a mercado europeo).</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/policies/payments')}>
                Política de pagos
              </Link>
              <span className="text-[color:var(--color-text)]/30">•</span>
              <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/account/bookings')}>
                Ver mis reservas
              </Link>
            </div>
          </Card>

          <Card title="Reservas protegidas">
            <ul className="list-disc pl-5">
              <li>Enlaces firmados (tokens) para booking/invoice/calendario en producción.</li>
              <li>Rate limits y protecciones anti‑abuso en endpoints críticos.</li>
              <li>Auditoría y trazabilidad de eventos (Ops/Admin).</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/privacy')}>
                Privacidad
              </Link>
              <span className="text-[color:var(--color-text)]/30">•</span>
              <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/cookies')}>
                Cookies
              </Link>
            </div>
          </Card>

          <Card title="Políticas claras (Europa)">
            <ul className="list-disc pl-5">
              <li>Términos y condiciones accesibles y versionados.</li>
              <li>Política de cancelación visible antes del checkout.</li>
              <li>Soporte para incidencias y reembolsos con trazabilidad.</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/terms')}>
                Términos
              </Link>
              <span className="text-[color:var(--color-text)]/30">•</span>
              <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/policies/cancellation')}>
                Cancelación
              </Link>
            </div>
          </Card>

          <Card title="Soporte real">
            <ul className="list-disc pl-5">
              <li>Canal de tickets dentro de tu cuenta.</li>
              <li>Chat en la web + seguimiento por conversación.</li>
              <li>Escalamiento a humano cuando el bot no está seguro.</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/account/support')}>
                Abrir ticket
              </Link>
              <span className="text-[color:var(--color-text)]/30">•</span>
              <Link className="font-semibold text-brand-blue hover:underline" href={withLocale(locale, '/contact')}>
                Contacto
              </Link>
            </div>
          </Card>
        </div>

        <div className="mt-10 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-sm text-[color:var(--color-text)]/75">
          <p className="font-heading text-lg text-brand-blue">Siguiente nivel (10/10)</p>
          <p className="mt-2">
            Este Trust Center es la base. El siguiente paso para 10/10 es completar la capa global: multi‑moneda real,
            inventario/disponibilidad de partners, automatizaciones post‑venta y analítica avanzada.
          </p>
        </div>
      </main>
    </>
  );
}
