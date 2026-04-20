import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { Landmark, Map, Compass, ArrowRight, MessageCircle, Sparkles, Mail, DownloadCloud } from 'lucide-react';

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
  const canonical = withLocale(locale, '/discover/cultural');

  return {
    metadataBase: new URL(base),
    title: 'Cultural Colombia for travelers who want meaning, people and local context | KCE',
    description: 'A culture-led landing page focused on heritage, neighborhoods, local stories, art and curated guided experiences in Colombia.',
    alternates: {
      canonical,
      languages: { es: withLocale('es', '/discover/cultural'), en: withLocale('en', '/discover/cultural'), fr: withLocale('fr', '/discover/cultural'), de: withLocale('de', '/discover/cultural') },
    },
    openGraph: {
      title: 'Cultural Colombia for travelers who want meaning, people and local context | KCE',
      description: 'A culture-led landing page focused on heritage, neighborhoods, local stories, art and curated guided experiences in Colombia.',
      url: `${base}${canonical}`,
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  };
}

async function getLandingTours() {
  const primary = await listTours({ q: 'culture', sort: 'popular', limit: 3, offset: 0 });
  if (primary.items.length >= 3) return primary.items.slice(0, 3);
  const fallback = await listTours({ sort: 'popular', limit: 3, offset: 0 });
  return (primary.items.length ? primary.items : fallback.items).slice(0, 3);
}

export default async function CulturalLandingPage() {
  const locale = await resolveLocale();
  const base = getBaseUrl();
  const tours = await getLandingTours();
  
  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: 'Hola KCE, busco experiencias culturales y auténticas en Colombia.',
    url: `${base}${withLocale(locale, '/discover/cultural')}`,
  });
  const waOrContactHref = waHref ?? withLocale(locale, '/contact');

  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] pb-24 pt-24 md:pt-32">
      <div className="mx-auto max-w-7xl px-6">
        
        {/* HERO DIVIDIDO (PREMIUM) */}
        <section className="overflow-hidden rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-2xl">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            
            {/* Contenido Izquierdo */}
            <div className="p-10 md:p-16">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
                <Landmark className="h-3 w-3" /> Culture Seeker Lane
              </div>
              
              <h1 className="font-heading text-4xl leading-[1.1] text-brand-blue md:text-5xl lg:text-6xl">
                Cultural Colombia for travelers who want meaning, people and local context
              </h1>
              
              <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-[color:var(--color-text)]/70">
                A culture-led landing page focused on heritage, neighborhoods, local stories, art and curated guided experiences in Colombia.
              </p>

              {/* Pilares Culturales */}
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5 transition-colors hover:border-brand-yellow/50 hover:bg-brand-yellow/5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/50 mb-2">Meaningful travel</div>
                  <div className="text-base font-heading text-brand-blue leading-tight">Context-rich routes</div>
                </div>
                <div className="rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5 transition-colors hover:border-brand-yellow/50 hover:bg-brand-yellow/5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/50 mb-2">Guided choice</div>
                  <div className="text-base font-heading text-brand-blue leading-tight">Clear next steps from content to booking</div>
                </div>
                <div className="rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5 transition-colors hover:border-brand-yellow/50 hover:bg-brand-yellow/5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/50 mb-2">Human support</div>
                  <div className="text-base font-heading text-brand-blue leading-tight">A real team behind the shortlist</div>
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
                  <Compass className="h-6 w-6 text-brand-blue" />
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Why this route fits</div>
                </div>
                <h3 className="text-2xl font-heading leading-tight mb-3">Move cultural curiosity into a real shortlist with guidance and trust</h3>
                <p className="text-sm font-light leading-relaxed text-white/80">
                  This landing is designed for travelers who care about context, hosts, neighborhoods and memorable local stories more than generic sightseeing.
                </p>
              </div>

              <div className="space-y-6 pl-2 border-l border-brand-yellow/30">
                <div className="pl-4">
                  <div className="text-sm font-bold text-white mb-1">Why travelers choose this</div>
                  <p className="text-sm font-light text-white/60 leading-relaxed">Culture-focused travelers usually need confidence that the experience is thoughtful, not generic. This page frames that promise clearly.</p>
                </div>
                <div className="pl-4">
                  <div className="text-sm font-bold text-white mb-1">How to continue</div>
                  <p className="text-sm font-light text-white/60 leading-relaxed">Use content and stories to warm the traveler, then move them into tours, a personalized plan or WhatsApp depending on readiness.</p>
                </div>
                <div className="pl-4">
                  <div className="text-sm font-bold text-white mb-1">Best for</div>
                  <p className="text-sm font-light text-white/60 leading-relaxed">A strong landing for intent terms around culture, heritage, local experiences, neighborhoods and art in Colombia.</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* LISTADO DE TOURS (SHORTLIST) */}
        <section className="mt-20">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[color:var(--color-border)] pb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue mb-4 shadow-sm">
                <Sparkles className="h-3 w-3" /> Curated Shortlist
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-[color:var(--color-text)]">Tours to start the conversation</h2>
            </div>
            <Link href={withLocale(locale, '/tours')} className="inline-flex items-center text-sm font-bold text-brand-blue hover:text-brand-blue transition-colors">
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
        <section className="mt-20 overflow-hidden rounded-[3rem] border border-[color:var(--color-border)] bg-brand-dark shadow-2xl relative">
          <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.svg')] bg-repeat"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark to-brand-blue/30"></div>
          
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center p-10 md:p-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue mb-4">
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
              <Button asChild size="lg" className="rounded-full bg-brand-yellow text-[color:var(--color-text)] hover:bg-brand-yellow/90 px-8 shadow-xl">
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