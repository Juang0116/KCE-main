import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { Coffee, Compass, ArrowRight, MessageCircle, Sparkles, Mail, DownloadCloud } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import CaptureCtas from '@/features/marketing/CaptureCtas';
import TourCardPremium from '@/features/tours/components/TourCardPremium';
import { listTours } from '@/features/tours/catalog.server';
import { toTourLike } from '@/features/tours/adapters';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

export const revalidate = 300;

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
  const canonical = withLocale(locale, '/discover/coffee');

  return {
    metadataBase: new URL(base),
    title: 'Coffee journeys for travelers who want Colombia at its most iconic | KCE',
    description: 'A coffee-led landing page designed for travelers who search finca experiences, tastings, mountain landscapes and curated cultural routes in Colombia.',
    alternates: {
      canonical,
      languages: { es: withLocale('es', '/discover/coffee'), en: withLocale('en', '/discover/coffee'), fr: withLocale('fr', '/discover/coffee'), de: withLocale('de', '/discover/coffee') },
    },
    openGraph: {
      title: 'Coffee journeys for travelers who want Colombia at its most iconic | KCE',
      description: 'A coffee-led landing page designed for travelers who search finca experiences, tastings, mountain landscapes and curated cultural routes in Colombia.',
      url: `${base}${canonical}`,
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  };
}

async function getLandingTours() {
  const primary = await listTours({ tag: 'coffee', sort: 'popular', limit: 3, offset: 0 });
  if (primary.items.length >= 3) return primary.items.slice(0, 3);
  const fallback = await listTours({ sort: 'popular', limit: 3, offset: 0 });
  return (primary.items.length ? primary.items : fallback.items).slice(0, 3);
}

export default async function CoffeeLandingPage() {
  const locale = await resolveLocale();
  const base = getBaseUrl();
  const tours = await getLandingTours();
  
  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: 'Hola KCE, quiero una shortlist de tours de café y paisajes en Colombia.',
    url: `${base}${withLocale(locale, '/discover/coffee')}`,
  });
  const waOrContactHref = waHref ?? withLocale(locale, '/contact');

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-24 pt-24 md:pt-32">
      <div className="mx-auto max-w-7xl px-6">
        
        {/* HERO DIVIDIDO (PREMIUM) */}
        <section className="overflow-hidden rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            
            {/* Contenido Izquierdo */}
            <div className="p-10 md:p-16">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--brand-dark)]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand-dark)] shadow-sm">
                <Coffee className="h-3 w-3" /> Coffee Travel Style
              </div>
              
              <h1 className="font-heading text-4xl leading-[1.1] text-brand-blue md:text-5xl lg:text-6xl">
                Coffee journeys for travelers who want Colombia at its most iconic
              </h1>
              
              <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-[var(--color-text)]/70">
                A coffee-led landing page designed for travelers who search finca experiences, tastings, mountain landscapes and curated cultural routes in Colombia.
              </p>

              {/* Pilares */}
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5 transition-colors hover:border-[var(--brand-dark)]/30">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/50 mb-2">High intent</div>
                  <div className="text-base font-heading text-brand-blue leading-tight">Coffee-led search traffic</div>
                </div>
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5 transition-colors hover:border-[var(--brand-dark)]/30">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/50 mb-2">Cultural fit</div>
                  <div className="text-base font-heading text-brand-blue leading-tight">Tastings, fincas and local stories</div>
                </div>
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5 transition-colors hover:border-[var(--brand-dark)]/30">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/50 mb-2">Cross-sell ready</div>
                  <div className="text-base font-heading text-brand-blue leading-tight">Add cities, hikes or boutique stays</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-12 flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-full px-8 shadow-md">
                  <Link href={withLocale(locale, '/tours')}>
                    Browse tours <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                  <Link href={withLocale(locale, '/plan')}>
                    Start a personalized plan
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="rounded-full px-8 text-brand-blue">
                  <a href={waOrContactHref} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              </div>
            </div>

            {/* Sidebar Derecho Corporativo */}
            <div className="bg-brand-blue p-10 md:p-16 text-white flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/10">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm shadow-inner mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Compass className="h-6 w-6 text-brand-yellow" />
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Why this route fits</div>
                </div>
                <h3 className="text-2xl font-heading leading-tight mb-3">Coffee culture, landscapes and experiences that feel unmistakably Colombian</h3>
                <p className="text-sm font-light leading-relaxed text-white/70">
                  Perfect for searchers and referrals who already know they want coffee, scenery and culture in one curated route.
                </p>
              </div>

              <div className="space-y-6 pl-2 border-l border-white/20">
                <div className="pl-4">
                  <div className="text-sm font-bold text-white mb-1">Why travelers choose this</div>
                  <p className="text-sm font-light text-white/60 leading-relaxed">Coffee is one of the strongest international intent clusters for Colombia. This landing turns that curiosity into a guided shortlist.</p>
                </div>
                <div className="pl-4">
                  <div className="text-sm font-bold text-white mb-1">How to continue</div>
                  <p className="text-sm font-light text-white/60 leading-relaxed">Send people to the personalized plan if they are undecided between coffee, culture and nature, or directly to tours if they are ready to compare.</p>
                </div>
                <div className="pl-4">
                  <div className="text-sm font-bold text-white mb-1">Best for</div>
                  <p className="text-sm font-light text-white/60 leading-relaxed">Useful for SEO, affiliates, paid traffic and WhatsApp follow-up once the traveler asks for a curated plan.</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* LISTADO DE TOURS (SHORTLIST) */}
        <section className="mt-20">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[var(--color-border)] pb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow mb-4 shadow-sm">
                <Sparkles className="h-3 w-3" /> Curated Shortlist
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-[var(--color-text)]">Tours to start the conversation</h2>
            </div>
            <Link href={withLocale(locale, '/tours')} className="inline-flex items-center text-sm font-bold text-brand-blue hover:text-brand-yellow transition-colors">
              See full catalog <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tours.map((t) => {
              const ui = toTourLike(t);
              return <TourCardPremium key={ui.slug} tour={ui} href={withLocale(locale, `/tours/${ui.slug}`)} />;
            })}
          </div>
        </section>

        {/* INTENT TO ACTION (Marketing / B2B) */}
        <section className="mt-20 overflow-hidden rounded-[3rem] border border-[var(--color-border)] bg-brand-dark shadow-2xl relative">
          <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark to-brand-blue/30"></div>
          
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center p-10 md:p-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow mb-4">
                Intent to action
              </div>
              <h2 className="text-3xl md:text-4xl font-heading text-white leading-tight">Use this landing to move cold traffic into qualified travel intent</h2>
              <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-white/70">
                Pair editorial content, shortlist-ready tours and a human handoff so the traveler does not fall into dead ends while deciding.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="outline" size="lg" className="rounded-full border-white/20 text-white hover:bg-white/10 px-8">
                <Link href={withLocale(locale, '/newsletter')}>
                  <Mail className="mr-2 h-4 w-4" /> Newsletter
                </Link>
              </Button>
              <Button asChild size="lg" className="rounded-full bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90 px-8 shadow-xl">
                <Link href={withLocale(locale, '/lead-magnets/eu-guide')}>
                  <DownloadCloud className="mr-2 h-4 w-4" /> Lead magnet EU
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CAPTURE CTA */}
        <div className="mt-16">
          <CaptureCtas compact locale={locale} />
        </div>

      </div>
    </main>
  );
}