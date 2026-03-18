import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { Users, ShieldCheck, HeartHandshake, ArrowRight, MessageCircle, Sparkles, MapPin, Compass } from 'lucide-react';

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
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') || 'https://kce.travel';
  return raw.trim().replace(/\/+$/, '');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const base = getBaseUrl();
  const canonical = withLocale(locale, '/discover/family');
  return {
    metadataBase: new URL(base),
    title: 'Family-friendly Colombia planning with more clarity | KCE',
    description: 'A calmer landing for parents and mixed-age groups who need clearer pacing, safer expectations and an easier path from research to shortlist.',
    alternates: { canonical, languages: { es: withLocale('es', '/discover/family'), en: withLocale('en', '/discover/family'), fr: withLocale('fr', '/discover/family'), de: withLocale('de', '/discover/family') } },
    openGraph: { title: 'Family-friendly Colombia planning with more clarity | KCE', description: 'For parents and mixed-age groups who need safer, calmer and clearer trip planning.', url: `${base}${canonical}`, type: 'website' },
    twitter: { card: 'summary_large_image' },
  };
}

async function getLandingTours() {
  const primary = await listTours({ sort: 'popular', limit: 3, offset: 0 });
  return primary.items.slice(0, 3);
}

export default async function FamilyLandingPage() {
  const locale = await resolveLocale();
  const base = getBaseUrl();
  const tours = await getLandingTours();
  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: 'Hola KCE, quiero una ruta clara y familiar para viajar a Colombia.',
    url: `${base}${withLocale(locale, '/discover/family')}`,
  });
  const waOrContactHref = waHref ?? withLocale(locale, '/contact');

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-24 pt-24 md:pt-32">
      <div className="mx-auto max-w-7xl px-6">
        
        {/* HERO DIVIDIDO (PREMIUM & CALM) */}
        <section className="overflow-hidden rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            
            {/* Contenido Izquierdo */}
            <div className="p-10 md:p-16">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
                <Users className="h-3 w-3" /> Family Planning Lane
              </div>
              
              <h1 className="font-heading text-4xl leading-[1.1] text-brand-blue md:text-5xl lg:text-6xl">
                Family-friendly Colombia planning with more clarity
              </h1>
              
              <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-[var(--color-text)]/70">
                A calmer landing for parents and mixed-age groups who need clearer pacing, safer expectations and an easier path from research to shortlist.
              </p>

              {/* Pilares Familiares */}
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5 transition-colors hover:border-brand-blue/30">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/50 mb-2">Clarity</div>
                  <div className="text-base font-heading text-brand-blue leading-tight">Less friction, clearer next steps</div>
                </div>
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5 transition-colors hover:border-brand-blue/30">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/50 mb-2">Mixed ages</div>
                  <div className="text-base font-heading text-brand-blue leading-tight">A route that feels calmer and safer</div>
                </div>
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5 transition-colors hover:border-brand-blue/30">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/50 mb-2">Support</div>
                  <div className="text-base font-heading text-brand-blue leading-tight">Human help when the plan gets complex</div>
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
                    <MessageCircle className="mr-2 h-4 w-4" /> Talk to KCE
                  </a>
                </Button>
              </div>
            </div>

            {/* Sidebar Derecho Corporativo */}
            <div className="bg-brand-blue p-10 md:p-16 text-white flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/10">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm shadow-inner mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <HeartHandshake className="h-6 w-6 text-brand-yellow" />
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Why this route fits</div>
                </div>
                <h3 className="text-2xl font-heading leading-tight mb-3">A calmer planning lane for parents and mixed-age groups</h3>
                <p className="text-sm font-light leading-relaxed text-white/80">
                  Use this page when the buyer needs clearer structure, steadier pacing and a lower-friction path to compare options.
                </p>
              </div>

              <div className="space-y-6 pl-2 border-l border-white/20">
                <div className="pl-4">
                  <div className="text-sm font-bold text-white mb-1">Why travelers choose this</div>
                  <p className="text-sm font-light text-white/60 leading-relaxed">Family planning is rarely impulsive. A clearer path and visible support reduce drop-off before the traveler is ready.</p>
                </div>
                <div className="pl-4">
                  <div className="text-sm font-bold text-white mb-1">How to continue</div>
                  <p className="text-sm font-light text-white/60 leading-relaxed">Use the personalized plan to clarify pace, comfort and style preferences, then continue to tours or human planning help.</p>
                </div>
                <div className="pl-4">
                  <div className="text-sm font-bold text-white mb-1">Best for</div>
                  <p className="text-sm font-light text-white/60 leading-relaxed">Useful for family SEO pages, partnerships and ads that promise a smoother, safer and more guided Colombia route.</p>
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
                <Sparkles className="h-3 w-3" /> Starter Shortlist
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-[var(--color-text)]">Tours to begin a calmer conversation</h2>
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

        {/* OPCIONAL: Puedes añadir una sección 'Intent to Action' aquí, similar a las otras páginas si lo deseas */}

        {/* CAPTURE CTA */}
        <div className="mt-20">
          <CaptureCtas compact locale={locale} />
        </div>

      </div>
    </main>
  );
}