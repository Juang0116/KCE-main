// src/app/(marketing)/destinations/[slug]/page.tsx
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import CaptureCtas from '@/features/marketing/CaptureCtas';
import FeaturedReviews from '@/features/reviews/FeaturedReviews';
import { getFacets, listTours } from '@/features/tours/catalog.server';
import { toTourLike } from '@/features/tours/adapters';
import TourCardPremium from '@/features/tours/components/TourCardPremium';
import { absoluteUrl, getPublicBaseUrl, safeJsonLd } from '@/lib/seoJson';

export const revalidate = 900;

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

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

function slugify(s: string) {
  return (s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(s: string) {
  return (s || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata(ctx: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale();
  const { slug } = await ctx.params;
  const base = getPublicBaseUrl().replace(/\/+$/, '');

  const cityLabel = titleCase(String(slug || '').replace(/-/g, ' '));
  const canonicalPath = withLocale(locale, `/destinations/${encodeURIComponent(slug)}`);
  const canonicalAbs = absoluteUrl(canonicalPath);

  return {
    metadataBase: new URL(base),
    title: `${cityLabel} — Destinations | KCE`,
    description: `Explora experiencias curadas en ${cityLabel} con apoyo real, reserva clara y ayuda para elegir mejor tu próxima ruta.`,
    alternates: {
      canonical: canonicalAbs,
      languages: {
        es: `/es/destinations/${slug}`,
        en: `/en/destinations/${slug}`,
        fr: `/fr/destinations/${slug}`,
        de: `/de/destinations/${slug}`,
      },
    },
    openGraph: {
      title: `${cityLabel} — KCE`,
      description: `Descubre tours y experiencias en ${cityLabel} con una ruta más clara para comparar y reservar.`,
      url: canonicalAbs,
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function DestinationCityPage(ctx: { params: Promise<{ slug: string }> }) {
  const locale = await resolveLocale();
  const base = getPublicBaseUrl().replace(/\/+$/, '');
  const { slug } = await ctx.params;
  const slugNorm = String(slug || '').trim().toLowerCase();

  const { cities } = await getFacets();
  const match = (cities || []).find((c) => slugify(c) === slugNorm);
  const city = match || null;
  if (!city) return notFound();

  const tours = await listTours({ city, sort: 'popular', limit: 9, offset: 0 });
  const canonicalPath = withLocale(locale, `/destinations/${encodeURIComponent(slugNorm)}`);
  const canonicalAbs = absoluteUrl(canonicalPath);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${city} — Destinations`,
        url: canonicalAbs,
        isPartOf: { '@type': 'WebSite', name: 'KCE', url: base },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl(withLocale(locale, '/')) },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Destinations',
            item: absoluteUrl(withLocale(locale, '/destinations')),
          },
          { '@type': 'ListItem', position: 3, name: city, item: canonicalAbs },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-28">
      <section className="overflow-hidden rounded-[calc(var(--radius)+0.5rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] shadow-soft">
        <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 md:p-10">
            <div className="text-sm font-semibold text-[color:var(--color-text)]/60">Explora {city} con más claridad</div>
            <h1 className="mt-2 text-3xl font-heading tracking-tight text-[color:var(--color-text)] md:text-5xl">
              {city}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-[color:var(--color-text)]/75 md:text-lg">
              Descubre experiencias en {city} con apoyo real antes de reservar, pago seguro y una forma más simple de comparar antes de decidir.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {['Pago seguro', 'Soporte real', 'Booking claro', 'Ayuda al elegir'].map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-muted)]"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={withLocale(locale, `/tours/city/${encodeURIComponent(slugNorm)}`)}
                className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] no-underline transition hover:bg-[color:var(--color-surface)] hover:no-underline"
              >
                Ver listado filtrado
              </Link>
              <Link
                href={withLocale(locale, '/plan')}
                className="inline-flex items-center rounded-full bg-[color:var(--brand-yellow)] px-5 py-3 text-sm font-bold text-[color:var(--brand-blue)] no-underline transition hover:opacity-95 hover:no-underline"
              >
                Abrir plan personalizado
              </Link>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-6 md:border-l md:border-t-0 md:p-10">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">Qué encontrarás aquí</div>
              <ul className="mt-4 space-y-3 text-sm text-[color:var(--color-text)]/75">
                <li>• Una entrada clara para explorar experiencias desde este destino.</li>
                <li>• Una forma simple de pasar de inspiración a comparación sin perder contexto.</li>
                <li>• Acceso rápido a tours, plan personalizado y apoyo humano cuando lo necesites.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[calc(var(--radius)+0.35rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">Cómo usar {city} para empezar bien tu viaje</div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ['01', 'Explora', `Empieza por ${city} si ya sabes qué ciudad quieres conocer o quieres comparar desde un punto claro.`],
              ['02', 'Compara', 'Revisa detalles, reseñas y experiencias relacionadas antes de decidir.'],
              ['03', 'Reserva', 'Cuando ya lo tengas claro, reserva con confianza o habla con KCE si necesitas ayuda.'],
            ].map(([step, title, copy]) => (
              <div key={step} className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <div className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-text-muted)]">{step}</div>
                <div className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
                <div className="mt-1 text-sm text-[color:var(--color-text)]/70">{copy}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[calc(var(--radius)+0.35rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">Siguientes pasos</div>
          <div className="mt-4 grid gap-3">
            <Link href={withLocale(locale, `/tours/city/${encodeURIComponent(slugNorm)}`)} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm font-semibold text-[color:var(--color-text)] no-underline hover:no-underline">
              Ver todas las experiencias en {city} →
            </Link>
            <Link href={withLocale(locale, '/plan')} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm font-semibold text-[color:var(--color-text)] no-underline hover:no-underline">
              Abrir plan personalizado si aún no sabes qué elegir →
            </Link>
            <Link href={withLocale(locale, '/contact')} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm font-semibold text-[color:var(--color-text)] no-underline hover:no-underline">
              Hablar con KCE antes de reservar →
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading tracking-tight text-[color:var(--color-text)]">Experiencias destacadas en {city}</h2>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/65">
              Una selección curada para empezar a comparar con más claridad desde este destino.
            </p>
          </div>
          <Link
            href={withLocale(locale, '/destinations')}
            className="text-sm font-semibold text-[color:var(--brand-blue)] hover:underline"
          >
            Todos los destinos
          </Link>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(tours.items || []).map((t) => {
            const ui = toTourLike(t);
            return (
              <TourCardPremium
                key={ui.slug}
                tour={ui}
                href={withLocale(locale, `/tours/${ui.slug}`)}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <FeaturedReviews locale={locale} />
      </section>

      <section className="mt-12">
        <CaptureCtas locale={locale} />
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    </main>
  );
}
