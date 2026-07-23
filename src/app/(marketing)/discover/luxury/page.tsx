import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import {
  Crown,
  Sparkles,
  Gem,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Map,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import CaptureCtas from '@/features/marketing/CaptureCtas';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { toTourLike } from '@/features/tours/adapters';
import { listTours } from '@/features/tours/catalog.server';
import TourCardPremium from '@/features/tours/components/TourCardPremium';

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
  const canonical = withLocale(locale, '/discover/luxury');
  return {
    metadataBase: new URL(base),
    title: 'Luxury Colombia journeys with concierge feel | KCE',
    description:
      'A premium landing for travelers who want boutique comfort, polished service, private-feel guidance and a more elevated Colombia trip planning experience.',
    alternates: {
      canonical,
      languages: {
        es: withLocale('es', '/discover/luxury'),
        en: withLocale('en', '/discover/luxury'),
        fr: withLocale('fr', '/discover/luxury'),
        de: withLocale('de', '/discover/luxury'),
      },
    },
    openGraph: {
      title: 'Luxury Colombia journeys with concierge feel | KCE',
      description:
        'For travelers who want boutique comfort, polished service and a more elevated Colombia experience.',
      url: `${base}${canonical}`,
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
  };
}

async function getLandingTours() {
  const primary = await listTours({ sort: 'popular', limit: 3, offset: 0 });
  return primary.items.slice(0, 3);
}

export default async function LuxuryLandingPage() {
  const locale = await resolveLocale();
  const base = getBaseUrl();
  const tours = await getLandingTours();
  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: 'Hola KCE, quiero una propuesta más premium y personalizada para viajar a Colombia.',
    url: `${base}${withLocale(locale, '/discover/luxury')}`,
  });
  const waOrContactHref = waHref ?? withLocale(locale, '/contact');

  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] pb-24 pt-24 md:pt-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* HERO DIVIDIDO (ULTRA PREMIUM) */}
        <section className="overflow-hidden rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-2xl">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            {/* Contenido Izquierdo */}
            <div className="p-10 md:p-16">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
                <Crown className="h-3 w-3" /> Luxury Journeys
              </div>

              <h1 className="font-heading text-4xl leading-[1.1] text-brand-blue md:text-5xl lg:text-6xl">
                Luxury Colombia journeys with concierge feel
              </h1>

              <p className="text-[color:var(--color-text)]/70 mt-6 max-w-xl text-lg font-light leading-relaxed">
                A premium landing for travelers who want boutique comfort, polished service,
                private-feel guidance and a more elevated Colombia trip planning experience.
              </p>

              {/* Pilares Luxury */}
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="group rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5 transition-all hover:border-brand-yellow/50 hover:bg-brand-yellow/5">
                  <div className="text-[color:var(--color-text)]/50 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] group-hover:text-brand-blue">
                    Premium signal
                  </div>
                  <div className="font-heading text-base leading-tight text-brand-blue">
                    More curated and polished
                  </div>
                </div>
                <div className="group rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5 transition-all hover:border-brand-yellow/50 hover:bg-brand-yellow/5">
                  <div className="text-[color:var(--color-text)]/50 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] group-hover:text-brand-blue">
                    Human guidance
                  </div>
                  <div className="font-heading text-base leading-tight text-brand-blue">
                    A real person can shape the shortlist
                  </div>
                </div>
                <div className="group rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5 transition-all hover:border-brand-yellow/50 hover:bg-brand-yellow/5">
                  <div className="text-[color:var(--color-text)]/50 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] group-hover:text-brand-blue">
                    Confidence
                  </div>
                  <div className="font-heading text-base leading-tight text-brand-blue">
                    Trust, clarity and premium pacing
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-12 flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-8 shadow-md"
                >
                  <Link href={withLocale(locale, '/tours')}>
                    Browse tours <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8"
                >
                  <Link href={withLocale(locale, '/plan')}>Start a personalized plan</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="rounded-full px-8 text-brand-blue"
                >
                  <a
                    href={waOrContactHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> Talk to KCE
                  </a>
                </Button>
              </div>
            </div>

            {/* Sidebar Derecho Concierge */}
            <div className="flex flex-col justify-center border-t border-white/10 bg-brand-blue p-10 text-white md:p-16 lg:border-l lg:border-t-0">
              <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-inner backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-3">
                  <Gem className="h-6 w-6 text-brand-blue" />
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                    Why this route fits
                  </div>
                </div>
                <h3 className="mb-3 font-heading text-2xl leading-tight">
                  A higher-trust route for higher-value buyers
                </h3>
                <p className="text-sm font-light leading-relaxed text-white/80">
                  Use this landing when the traveler expects reassurance, concierge energy and a
                  more premium tone before choosing a route.
                </p>
              </div>

              <div className="space-y-6 border-l border-brand-yellow/30 pl-2">
                <div className="pl-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-bold text-white">
                    <Star className="h-3 w-3 text-brand-blue" /> Why travelers choose this
                  </div>
                  <p className="text-sm font-light leading-relaxed text-white/60">
                    Luxury buyers often respond better to polish, clarity and human support than to
                    crowded generic pages.
                  </p>
                </div>
                <div className="pl-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-bold text-white">
                    <Map className="h-3 w-3 text-brand-blue" /> How to continue
                  </div>
                  <p className="text-sm font-light leading-relaxed text-white/60">
                    Use the personalized plan for preference discovery or move directly to a curated
                    shortlist plus WhatsApp follow-up.
                  </p>
                </div>
                <div className="pl-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-bold text-white">
                    <ShieldCheck className="h-3 w-3 text-brand-blue" /> Best for
                  </div>
                  <p className="text-sm font-light leading-relaxed text-white/60">
                    Useful for higher-value referrals, partnership pages and paid traffic that
                    should feel more elevated from the first click.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LISTADO DE TOURS (CURATED SHORTLIST) */}
        <section className="mt-20">
          <div className="mb-10 flex flex-col justify-between gap-6 border-b border-[color:var(--color-border)] pb-6 sm:flex-row sm:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
                <Sparkles className="h-3 w-3" /> Curated Shortlist
              </div>
              <h2 className="font-heading text-3xl text-[color:var(--color-text)] md:text-4xl">
                Tours to elevate the first shortlist
              </h2>
            </div>
            <Link
              href={withLocale(locale, '/tours')}
              className="inline-flex items-center text-sm font-bold text-brand-blue transition-colors hover:text-brand-blue"
            >
              See full catalog <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tours.map((t) => {
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

        {/* CAPTURE CTA */}
        <div className="mt-20">
          <CaptureCtas
            compact
            locale={locale}
          />
        </div>
      </div>
    </main>
  );
}
