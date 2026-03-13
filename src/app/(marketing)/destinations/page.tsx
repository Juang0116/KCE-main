// src/app/(marketing)/destinations/page.tsx
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';

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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getPublicBaseUrl().replace(/\/+$/, '');

  const canonicalPath = withLocale(locale, '/destinations');
  const canonicalAbs = absoluteUrl(canonicalPath);
  return {
    metadataBase: new URL(base),
    title: 'Destinations in Colombia — KCE',
    description:
      'Explore Colombia by city and region with a clearer route into tours, personalized planning and real support.',
    alternates: {
      canonical: canonicalAbs,
      languages: {
        es: '/es/destinations',
        en: '/en/destinations',
        fr: '/fr/destinations',
        de: '/de/destinations',
      },
    },
    openGraph: {
      title: 'Destinations in Colombia — KCE',
      description: 'Start by city, compare curated experiences and continue with more clarity.',
      url: canonicalAbs,
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function DestinationsPage() {
  const locale = await resolveLocale();
  const base = getPublicBaseUrl().replace(/\/+$/, '');

  const [{ cities }, topTours] = await Promise.all([
    getFacets(),
    listTours({ sort: 'popular', limit: 6, offset: 0 }),
  ]);

  const citySlugs = (cities || [])
    .map((c) => ({ city: c, slug: slugify(c) }))
    .filter((x) => x.slug)
    .slice(0, 24);

  const canonicalPath = withLocale(locale, '/destinations');
  const canonicalAbs = absoluteUrl(canonicalPath);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Destinations',
        url: canonicalAbs,
        isPartOf: { '@type': 'WebSite', name: 'KCE', url: base },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl(withLocale(locale, '/')) },
          { '@type': 'ListItem', position: 2, name: 'Destinations', item: canonicalAbs },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-28">
      <section className="overflow-hidden rounded-[calc(var(--radius)+0.5rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] shadow-soft">
        <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-muted)]">
              KCE Destinations <span className="opacity-50">•</span> Colombia by city and region
            </div>

            <h1 className="mt-4 max-w-3xl text-3xl font-heading tracking-tight text-[color:var(--color-text)] md:text-5xl">
              Empieza por la ciudad correcta y sigue hacia la experiencia correcta.
            </h1>

            <p className="mt-4 max-w-2xl text-base text-[color:var(--color-text)]/75 md:text-lg">
              Destinations ahora funciona como una entrada simple para explorar Colombia por ciudad o región y continuar luego hacia tours, plan personalizado o contacto.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={withLocale(locale, '/tours')}
                className="inline-flex items-center rounded-full bg-[color:var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white no-underline transition hover:opacity-95 hover:no-underline"
              >
                Ver catálogo premium
              </Link>
              <Link
                href={withLocale(locale, '/plan')}
                className="inline-flex items-center rounded-full bg-[color:var(--brand-yellow)] px-5 py-3 text-sm font-bold text-[color:var(--brand-blue)] no-underline transition hover:opacity-95 hover:no-underline"
              >
                Plan personalizado
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {['Pago seguro', 'Soporte real', 'Experiencias curadas', 'Ayuda multilingüe'].map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-muted)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-6 md:border-l md:border-t-0 md:p-10">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">Empieza aquí</div>
              <div className="mt-4 space-y-4 text-sm text-[color:var(--color-text)]/75">
                <div>
                  <div className="font-semibold text-[color:var(--color-text)]">Elige una base clara</div>
                  <div className="mt-1">Empieza por Bogotá, Cartagena, Caldas u otra región según el tipo de viaje y el punto de entrada que más te convenga.</div>
                </div>
                <div>
                  <div className="font-semibold text-[color:var(--color-text)]">Pasa de ciudad a tours</div>
                  <div className="mt-1">Cuando una ciudad te interese, entra al catálogo y compara experiencias reales sin perder el contexto.</div>
                </div>
                <div>
                  <div className="font-semibold text-[color:var(--color-text)]">Escala a plan o contacto si hace falta</div>
                  <div className="mt-1">Si todavía no sabes qué encaja contigo, abre el plan personalizado o habla con KCE sin empezar desde cero.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] p-6 md:p-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-heading tracking-tight text-[color:var(--color-text)]">Explora por destino</h2>
              <p className="mt-1 text-sm text-[color:var(--color-text)]/65">
                Explora por ciudad y encuentra una forma más simple de empezar tu viaje.
              </p>
            </div>
            <Link
              href={withLocale(locale, '/tours')}
              className="text-sm font-semibold text-[color:var(--brand-blue)] hover:underline"
            >
              Ver tours
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {citySlugs.map((c) => (
              <Link
                key={c.slug}
                href={withLocale(locale, `/destinations/${encodeURIComponent(c.slug)}`)}
                className="group rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft no-underline transition hover:-translate-y-0.5 hover:shadow-pop hover:no-underline"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-[color:var(--color-text)] group-hover:underline">
                      {c.city}
                    </div>
                    <div className="mt-1 text-sm text-[color:var(--color-text)]/60">
                      Ver experiencias relacionadas y seguir con una ruta más clara hacia la decisión.
                    </div>
                  </div>
                  <div className="rounded-full bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-blue)]">
                    Ver
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[calc(var(--radius)+0.35rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">Cómo se usa mejor</div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ['1', 'Elige una ciudad', 'Empieza por el lugar que más te atrae o por la región que quieres conocer.'],
              ['2', 'Compara experiencias', 'Revisa tours, estilos y ritmo de viaje antes de decidir.'],
              ['3', 'Pide ayuda si la necesitas', 'Si sigues indeciso, abre el plan personalizado o habla con KCE.'],
            ].map(([step, title, copy]) => (
              <div key={step} className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                <div className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-text-muted)]">STEP {step}</div>
                <div className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
                <div className="mt-1 text-sm text-[color:var(--color-text)]/70">{copy}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[calc(var(--radius)+0.35rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">Continúa con claridad</div>
          <div className="mt-4 grid gap-3">
            <Link href={withLocale(locale, '/tours')} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm font-semibold text-[color:var(--color-text)] no-underline hover:no-underline">
              Catálogo completo →
            </Link>
            <Link href={withLocale(locale, '/plan')} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm font-semibold text-[color:var(--color-text)] no-underline hover:no-underline">
              Plan personalizado →
            </Link>
            <Link href={withLocale(locale, '/contact')} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm font-semibold text-[color:var(--color-text)] no-underline hover:no-underline">
              Hablar con KCE →
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading tracking-tight text-[color:var(--color-text)]">Tours destacados</h2>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/65">
              Una selección inicial para pasar de destino a experiencia sin ruido extra.
            </p>
          </div>
          <Link
            href={withLocale(locale, '/tours')}
            className="text-sm font-semibold text-[color:var(--brand-blue)] hover:underline"
          >
            Ver todo el catálogo
          </Link>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(topTours.items || []).map((t) => {
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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    </main>
  );
}
