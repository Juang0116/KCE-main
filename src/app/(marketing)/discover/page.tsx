import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { Compass, Lightbulb, PlayCircle, BookOpen, Sparkles, ArrowRight, MapPin, MessageCircle, HeartHandshake } from 'lucide-react';

import { Button } from '@/components/ui/Button';
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
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') || 'https://kce.travel';
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
    alternates: { canonical, languages: { es: '/es/discover', en: '/en/discover', fr: '/fr/discover', de: '/de/discover' } },
    robots: { index: false, follow: true },
    openGraph: { title: 'Discover Colombia | KCE', description: 'Inspiración, rutas e ideas de viaje conectadas con tours reales.', url: `${base}${canonical}`, type: 'website' },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function DiscoverPage() {
  const locale = await resolveLocale();
  const { items } = await listDiscover({ limit: 12 });
  const editorialItems = items.slice(0, 9);
  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: 'Hola KCE, estuve viendo el contenido de Discover y quiero ideas para mi viaje.',
    url: `${getBaseUrl()}${withLocale(locale, '/discover')}`,
  });

  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] pb-24 pt-24 md:pt-32">
      <div className="mx-auto max-w-7xl px-6">
        
        {/* HERO DISCOVER */}
        <header className="relative mb-16 overflow-hidden rounded-[3.5rem] border border-[color:var(--color-border)] bg-brand-blue p-10 md:p-20 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.svg')] bg-repeat"></div>
          <div className="relative z-10 max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue backdrop-blur-md">
              <Compass className="h-3 w-3" /> Editorial Layer
            </div>
            <h1 className="font-heading text-4xl leading-tight md:text-6xl lg:text-7xl mb-8">
              Ideas para viajar por Colombia <br/>
              <span className="text-brand-blue font-light italic text-3xl md:text-5xl lg:text-6xl">sin perder el foco comercial.</span>
            </h1>
            <p className="max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl mb-10">
              Discover reúne guías, videos e ideas para inspirarte. Es una capa secundaria diseñada para ayudarte a pensar mejor tu viaje antes de saltar al catálogo de tours.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full bg-brand-yellow text-[color:var(--color-text)] hover:bg-brand-yellow/90 px-8 shadow-xl">
                <Link href={withLocale(locale, '/tours')}>Ver todos los Tours</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-white/20 text-white hover:bg-white/5 px-8">
                <Link href={withLocale(locale, '/plan')}>Abrir Plan Personalizado</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* QUICK ACCESS CARDS */}
        <section className="mb-20 grid gap-6 md:grid-cols-3">
          {[
            { icon: Sparkles, title: 'Inspiración Pura', copy: 'Discover es una capa editorial para leer y comparar ideas.', color: 'text-brand-blue' },
            { icon: Lightbulb, title: 'Menos Ruido', copy: 'Si ya quieres reservar, ve directo a Tours o Destinations.', color: 'text-brand-blue' },
            { icon: HeartHandshake, title: 'Continuidad KCE', copy: 'Todo contenido te lleva a una acción real con soporte humano.', color: 'text-emerald-500' }
          ].map((card, i) => (
            <div key={i} className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
              <card.icon className={`h-8 w-8 ${card.color} mb-6`} />
              <h3 className="font-heading text-xl text-brand-blue mb-3">{card.title}</h3>
              <p className="text-sm font-light text-[color:var(--color-text)]/70 leading-relaxed">{card.copy}</p>
            </div>
          ))}
        </section>

        {/* CONTENT GRID */}
        {editorialItems.length > 0 && (
          <section className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[color:var(--color-border)] pb-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] mb-2">Editorial Picks</p>
                <h2 className="font-heading text-3xl md:text-4xl text-brand-blue">Últimas guías y videos</h2>
              </div>
              <div className="text-sm font-bold uppercase tracking-widest text-brand-blue/40">
                Mostrando {editorialItems.length} piezas
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {editorialItems.map((it) => {
                const cover = it.cover_url ?? undefined;
                const ytThumb = it.kind === 'video' ? youTubeThumbnailUrl((it as any).youtube_url, 'hq') ?? undefined : undefined;
                const imgSrc = cover ?? ytThumb;
                const href = it.kind === 'post' 
                  ? withLocale(locale, `/blog/${it.slug}`) 
                  : withLocale(locale, `/vlog/${encodeURIComponent((it as any).slug ?? '')}`);
                
                return (
                  <Link key={it.id} href={href} className="group flex flex-col rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden shadow-sm transition-all hover:shadow-2xl hover:-translate-y-2">
                    <div className="relative h-56 w-full overflow-hidden">
                      {imgSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgSrc} alt={it.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[color:var(--color-surface-2)] text-brand-blue/20">
                          <BookOpen className="h-12 w-12" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-blue shadow-sm">
                          {it.kind === 'video' ? <PlayCircle className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
                          {it.kind === 'post' ? 'Guía' : 'Video'}
                        </span>
                      </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                      <h3 className="font-heading text-xl text-brand-blue mb-4 group-hover:text-brand-blue/80 transition-colors">
                        {it.title}
                      </h3>
                      <p className="text-sm font-light text-[color:var(--color-text)]/60 line-clamp-3 mb-6">
                        {(it as any).excerpt || (it as any).description || 'Explora esta historia cultural de Colombia...'}
                      </p>
                      <div className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-blue">
                        {it.kind === 'post' ? 'Leer guía' : 'Ver video'} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* CLOSING CALL TO ACTION */}
        <section className="mt-24 rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-10 md:p-16 shadow-inner text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue/40 mb-6">Next Best Step</p>
            <h2 className="font-heading text-3xl md:text-5xl text-brand-blue mb-8">Pasa de la inspiración a una ruta real</h2>
            <p className="text-lg font-light text-[color:var(--color-text)]/70 leading-relaxed mb-10">
              Cuando ya tengas más claridad, sal de la capa editorial y vuelve al núcleo de KCE: compara tours, explora destinos o recibe ayuda guiada.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="rounded-full px-8 shadow-md">
                <Link href={withLocale(locale, '/tours')}>Ir a Tours</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-brand-blue/20 text-brand-blue hover:bg-brand-blue/5">
                <Link href={withLocale(locale, '/destinations')}>Ir a Destinations</Link>
              </Button>
              {waHref && (
                <Button asChild variant="ghost" className="rounded-full px-8 text-brand-blue">
                  <a href={waHref} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> Hablar con KCE
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

// Nota: He añadido HeartHandshake a los imports de lucide-react.
// import { Compass, Lightbulb, PlayCircle, BookOpen, Sparkles, ArrowRight, MapPin, MessageCircle, HeartHandshake } from 'lucide-react';