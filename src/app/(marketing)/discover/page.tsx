import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { listDiscover } from '@/features/content/content.server';

const SUPPORTED = new Set(['es', 'en', 'fr', 'de'] as const);
type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

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
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
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

function youTubeThumbnailUrl(url?: string | null, quality: 'hq' | 'mq' = 'hq') {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  const id = m?.[1];
  if (!id) return null;
  return `https://i.ytimg.com/vi/${id}/${quality === 'hq' ? 'hqdefault' : 'mqdefault'}.jpg`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getBaseUrl();
  const canonical = withLocale(locale, '/discover');
  return {
    metadataBase: new URL(base),
    title: 'Discover Colombia | KCE',
    description: 'Guías, ideas y contenido editorial para inspirarte antes de reservar tu viaje por Colombia.',
    alternates: {
      canonical,
      languages: { es: '/es/discover', en: '/en/discover', fr: '/fr/discover', de: '/de/discover' },
    },
    robots: { index: false, follow: true },
    openGraph: {
      title: 'Discover Colombia | KCE',
      description: 'Inspiración, rutas e ideas de viaje conectadas con tours reales y ayuda personalizada.',
      url: `${base}${canonical}`,
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  };
}

function kindLabel(kind: string) {
  return kind === 'post' ? 'Guía' : kind === 'video' ? 'Video' : 'Contenido';
}

function safeUpperLang(v: unknown) {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s.toUpperCase() : '';
}

export default async function DiscoverPage() {
  const locale = await resolveLocale();
  const { items } = await listDiscover({ limit: 12 });
  const editorialItems = items.slice(0, 9);
  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message:
      process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ||
      'Hola KCE, quiero ideas para planear mi viaje por Colombia.',
    url: `${getBaseUrl()}${withLocale(locale, '/discover')}`,
  });

  const quickLinks = [
    {
      href: withLocale(locale, '/tours'),
      kicker: 'Tours',
      title: 'Ve directo a experiencias listas para reservar',
      copy: 'Empieza aquí cuando ya quieres comparar rutas, duración, precio y disponibilidad.',
    },
    {
      href: withLocale(locale, '/destinations'),
      kicker: 'Destinations',
      title: 'Explora por ciudad o región',
      copy: 'Útil cuando aún sabes el tipo de viaje, pero no la ciudad o el ritmo ideal.',
    },
    {
      href: withLocale(locale, '/plan'),
      kicker: 'Plan personalizado',
      title: 'Pide una recomendación más guiada',
      copy: 'Cuéntanos fechas, estilo y presupuesto para aterrizar una ruta inicial.',
    },
  ];

  const usageCards = [
    {
      title: 'Úsalo para inspirarte',
      body: 'Discover es una capa editorial. Sirve para leer, comparar ideas y llegar con más claridad al catálogo o al plan.',
    },
    {
      title: 'No es la entrada principal de compra',
      body: 'Si ya quieres reservar o cerrar una shortlist, KCE te va a servir mejor desde Tours, Destinations o Plan personalizado.',
    },
    {
      title: 'Mantén la continuidad',
      body: 'Todo lo que encuentres aquí debe llevarte a una acción clara: ver tours, pedir ayuda o abrir tu plan personalizado.',
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8 space-y-4 rounded-[calc(var(--radius)+0.5rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text)]/70">
          Discover · editorial secondary layer
        </div>
        <h1 className="font-heading text-3xl tracking-tight text-brand-blue md:text-5xl">
          Ideas para viajar por Colombia sin perder el foco comercial
        </h1>
        <p className="max-w-3xl text-[color:var(--color-text)]/72 md:text-lg">
          Discover reúne guías, videos e ideas para inspirarte. Es una capa editorial secundaria: te ayuda a pensar mejor tu viaje, pero el núcleo de KCE sigue viviendo en Tours, Destinations y Plan personalizado.
        </p>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4 text-sm text-[color:var(--color-text)]/72">
          <span className="font-semibold text-[color:var(--color-text)]">Recomendación rápida:</span>{' '}
          si ya quieres comparar experiencias reales o avanzar hacia una reserva, entra primero por el catálogo o por tu plan personalizado.
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={withLocale(locale, '/tours')} className="inline-flex items-center rounded-full bg-[color:var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white no-underline hover:opacity-95 hover:no-underline">Ver tours</Link>
          <Link href={withLocale(locale, '/plan')} className="inline-flex items-center rounded-full bg-[color:var(--brand-yellow)] px-5 py-3 text-sm font-bold text-[color:var(--brand-blue)] no-underline hover:opacity-95 hover:no-underline">Abrir plan personalizado</Link>
          <Link href={withLocale(locale, '/destinations')} className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] no-underline hover:bg-[color:var(--color-surface)] hover:no-underline">Explorar destinos</Link>
          {waHref ? (
            <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] no-underline hover:bg-[color:var(--color-surface-2)] hover:no-underline">Hablar con KCE</a>
          ) : null}
        </div>
      </header>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => (
          <Link key={item.title} href={item.href} className="rounded-[calc(var(--radius)+0.25rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft no-underline transition hover:-translate-y-0.5 hover:no-underline hover:shadow-pop">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">{item.kicker}</div>
            <h2 className="mt-3 text-lg font-semibold text-[color:var(--color-text)]">{item.title}</h2>
            <p className="mt-2 text-sm text-[color:var(--color-text)]/72">{item.copy}</p>
          </Link>
        ))}
      </section>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        {usageCards.map((card) => (
          <div key={card.title} className="rounded-[calc(var(--radius)+0.25rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
            <h2 className="text-base font-semibold text-[color:var(--color-text)]">{card.title}</h2>
            <p className="mt-2 text-sm text-[color:var(--color-text)]/72">{card.body}</p>
          </div>
        ))}
      </section>

      {editorialItems.length === 0 ? (
        <div className="rounded-[calc(var(--radius)+0.25rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft">
          <div className="text-sm font-semibold text-[color:var(--color-text)]">Aún no hay contenido publicado</div>
          <p className="mt-2 text-sm text-[color:var(--color-text)]/72">Muy pronto encontrarás aquí guías, videos y recomendaciones útiles para inspirarte antes de reservar.</p>
        </div>
      ) : (
        <section aria-label="Contenido discover" className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">Editorial picks</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text)]">Últimas guías y videos</h2>
              <p className="mt-2 max-w-2xl text-sm text-[color:var(--color-text)]/72">
                Selección corta para mantener Discover compacto. Si un contenido te sirve, el siguiente paso ideal es seguir hacia Tours, Destinations o Plan.
              </p>
            </div>
            <div className="text-sm text-[color:var(--color-text)]/60">Mostrando {editorialItems.length} piezas recientes</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {editorialItems.map((it) => {
              const cover = it.cover_url ?? undefined;
              const ytThumb = it.kind === 'video' ? youTubeThumbnailUrl((it as any).youtube_url, 'hq') ?? undefined : undefined;
              const imgSrc = cover ?? ytThumb;
              const href =
                it.kind === 'post'
                  ? withLocale(locale, `/blog/${it.slug}`)
                  : withLocale(locale, `/vlog/${encodeURIComponent((it as any).slug ?? '')}`);
              const badge = kindLabel(it.kind);
              const lang = safeUpperLang((it as any).lang);
              return (
                <Link key={`${it.kind}:${it.id}`} href={href} className="rounded-[calc(var(--radius)+0.25rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft no-underline transition hover:-translate-y-0.5 hover:no-underline hover:shadow-pop">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-2.5 py-1 text-xs font-semibold text-[color:var(--color-text)]/80">{badge}</span>
                      {lang ? <span className="text-xs font-semibold tracking-wide text-[color:var(--color-text)]/55">{lang}</span> : <span className="text-xs text-[color:var(--color-text)]/40"> </span>}
                    </div>
                    {imgSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgSrc} alt={it.title} className="h-44 w-full rounded-2xl object-cover ring-1 ring-black/5 dark:ring-white/10" loading="lazy" />
                    ) : (
                      <div className="grid h-44 w-full place-items-center rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)]">
                        <span className="text-sm text-[color:var(--color-text)]/55">Sin imagen</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold tracking-tight text-[color:var(--color-text)]">{it.title}</h3>
                      {'excerpt' in it && (it as any).excerpt ? <p className="line-clamp-3 text-sm text-[color:var(--color-text)]/70">{(it as any).excerpt}</p> : null}
                      {'description' in it && (it as any).description ? <p className="line-clamp-3 text-sm text-[color:var(--color-text)]/70">{(it as any).description}</p> : null}
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue">{it.kind === 'post' ? 'Leer guía' : 'Ver video'} <span aria-hidden="true">→</span></span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-10 rounded-[calc(var(--radius)+0.5rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">Next best step</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-blue">Pasa de inspiración a una ruta real</h2>
          <p className="mt-3 text-sm text-[color:var(--color-text)]/72 md:text-base">
            Cuando ya tengas más claridad, sal de la capa editorial y vuelve al núcleo de KCE: compara tours, explora destinos o abre tu plan personalizado para recibir una recomendación más guiada.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={withLocale(locale, '/tours')} className="inline-flex items-center rounded-full bg-[color:var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white no-underline hover:opacity-95 hover:no-underline">Ir a Tours</Link>
          <Link href={withLocale(locale, '/destinations')} className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] no-underline hover:bg-[color:var(--color-surface)] hover:no-underline">Ir a Destinations</Link>
          <Link href={withLocale(locale, '/plan')} className="inline-flex items-center rounded-full bg-[color:var(--brand-yellow)] px-5 py-3 text-sm font-bold text-[color:var(--brand-blue)] no-underline hover:opacity-95 hover:no-underline">Abrir Plan personalizado</Link>
        </div>
      </section>
    </main>
  );
}
