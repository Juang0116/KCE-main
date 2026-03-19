import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import { listPublishedVideos } from '@/features/content/content.server';
import { youTubeThumbnailUrl } from '@/lib/youtube';
import { PlayCircle, ArrowRight, Video, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const revalidate = 600;

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers(); const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;
  const c = await cookies(); const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;
  return 'es';
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  const hasLocale = /^\/(es|en|fr|de)(\/|$)/i.test(href);
  if (hasLocale) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function absoluteUrl(pathOrUrl: string) {
  const s = (pathOrUrl || '').trim();
  if (!s) return BASE_SITE_URL;
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return s.startsWith('/') ? `${BASE_SITE_URL}${s}` : `${BASE_SITE_URL}/${s}`;
}

function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const title = 'KCE Cinema | Relatos Visuales de Colombia';
  const description = 'Documentales cortos y guías visuales diseñadas para inspirar tu próxima expedición cultural.';
  const canonical = absoluteUrl(withLocale(locale, '/vlog'));

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title,
    description,
    openGraph: { title, description, url: canonical, type: 'website' },
    twitter: { card: 'summary_large_image', title },
  };
}

export default async function VlogPage() {
  const locale = await resolveLocale();
  const { items } = await listPublishedVideos({ limit: 30 });
  const canonical = absoluteUrl(withLocale(locale, '/vlog'));

  const jsonLd = {
    '@context': 'https://schema.org', 
    '@graph': [
      { '@type': 'CollectionPage', name: 'KCE Cinema', url: canonical },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl(`/${locale}`) },
        { '@type': 'ListItem', position: 2, name: 'Cinema', item: canonical }
      ]}
    ],
  };

  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] pb-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* HERO CINEMATOGRÁFICO */}
      <header className="relative overflow-hidden bg-brand-dark px-6 py-32 md:py-48 text-center">
        {/* Overlay de textura y gradiente */}
        <div className="absolute inset-0 opacity-40 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay scale-105 animate-slow-zoom"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--brand-blue)]/80 via-[var(--brand-dark)] to-[var(--color-bg)]"></div>
        
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-yellow backdrop-blur-xl shadow-2xl">
            <Sparkles className="h-4 w-4" /> Estrenos KCE Cinema
          </div>
          <h1 className="font-heading text-6xl leading-[0.85] md:text-8xl lg:text-9xl text-white tracking-tighter drop-shadow-2xl">
            Historias que <br/>
            <span className="text-brand-yellow italic font-light">cobran vida.</span>
          </h1>
          <p className="mx-auto mt-10 max-w-2xl text-xl font-light leading-relaxed text-blue-100/70 md:text-2xl">
            Documentales cortos sobre la Colombia profunda, narrados desde la autenticidad y el respeto por el territorio.
          </p>
        </div>
      </header>

      {/* REJILLA DE CONTENIDO */}
      <section className="mx-auto max-w-7xl px-6 -mt-20 relative z-20">
        {items.length === 0 ? (
          <div className="rounded-[4rem] border border-[color:var(--color-border)] bg-white py-32 text-center shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[color:var(--color-surface-2)] text-slate-300 mb-6">
              <Video className="h-10 w-10" />
            </div>
            <h2 className="font-heading text-4xl text-brand-blue mb-4">Próximamente en cartelera</h2>
            <p className="text-lg font-light text-[color:var(--color-text-muted)] max-w-md mx-auto">
              Estamos editando nuevas piezas visuales. Suscríbete para ser el primero en verlas.
            </p>
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-2">
            {items.map((v) => {
              const thumb = v.cover_url || youTubeThumbnailUrl(v.youtube_url, 'hq') || null;
              return (
                <Link
                  key={v.id}
                  href={withLocale(locale, `/vlog/${v.slug}`)}
                  className="group relative overflow-hidden rounded-[3rem] bg-brand-dark aspect-[16/11] flex flex-col justify-end shadow-xl transition-all duration-700 hover:-translate-y-3 hover:shadow-[0_40px_80px_-15px_rgba(0,74,124,0.3)]"
                >
                  {/* Imagen de fondo con Zoom al Hover */}
                  {thumb && (
                    <div className="absolute inset-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={thumb} 
                        alt={v.title} 
                        loading="lazy" 
                        className="h-full w-full object-cover transition-all duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-40" 
                      />
                    </div>
                  )}
                  
                  {/* Gradiente dramático */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-dark)] via-[var(--brand-dark)]/20 to-transparent"></div>

                  {/* Icono de Play dinámico */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500">
                    <div className="h-24 w-24 rounded-full bg-brand-yellow flex items-center justify-center shadow-2xl">
                      <PlayCircle className="h-10 w-10 text-brand-blue fill-[var(--brand-blue)]/20" />
                    </div>
                  </div>

                  {/* Metadatos del Video */}
                  <div className="relative z-10 p-10 md:p-14">
                    <div className="mb-6 flex items-center gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-yellow">
                        {v.lang || 'ES'}
                      </span>
                      <div className="h-[1px] w-8 bg-white/20"></div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">
                        Documental
                      </span>
                    </div>
                    
                    <h2 className="font-heading text-4xl text-white leading-[1.1] mb-6 group-hover:text-brand-yellow transition-colors duration-300">
                      {v.title}
                    </h2>
                    
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                      Explorar experiencia <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-2" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* SECCIÓN DE INVITACIÓN FINAL */}
      <section className="mt-32 px-6 text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-slate-300">Nuevos relatos cada mes</p>
          <h2 className="font-heading text-4xl text-brand-blue">¿Tienes una historia que contar?</h2>
          <p className="text-lg font-light text-[color:var(--color-text-muted)]">
            Colaboramos con documentalistas y viajeros para mostrar la cara más humana de Colombia.
          </p>
          <Button asChild variant="outline" className="rounded-full px-12 h-16 border-[var(--brand-blue)] text-brand-blue hover:bg-brand-blue hover:text-white transition-all text-[11px] font-bold uppercase tracking-widest">
            <Link href="/contact">Escríbenos</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}