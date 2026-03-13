import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

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
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-28">
      <section className="overflow-hidden rounded-[calc(var(--radius)+0.55rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/60">Family planning lane</div>
            <h1 className="mt-4 max-w-3xl font-heading text-4xl tracking-tight text-brand-blue sm:text-5xl">Family-friendly Colombia planning with more clarity</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--color-text)]/75">A calmer landing for parents and mixed-age groups who need clearer pacing, safer expectations and an easier path from research to shortlist.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3"><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">Clarity</div><div className="mt-1 text-lg font-semibold text-[color:var(--color-text)]">Less friction, clearer next steps</div></div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3"><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">Mixed ages</div><div className="mt-1 text-lg font-semibold text-[color:var(--color-text)]">A route that feels calmer and safer</div></div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3"><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">Support</div><div className="mt-1 text-lg font-semibold text-[color:var(--color-text)]">Human help when the plan gets complex</div></div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={withLocale(locale, '/tours')} className="inline-flex items-center rounded-full bg-brand-blue px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-px">Browse tours</Link>
              <Link href={withLocale(locale, '/plan')} className="inline-flex items-center rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-2)]">Start a personalized plan</Link>
              <a href={waOrContactHref} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-2)]">Talk to KCE</a>
            </div>
          </div>
          <div className="border-t border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-6 sm:p-8 lg:border-l lg:border-t-0">
            <div className="rounded-3xl bg-brand-blue px-5 py-4 text-white shadow-soft"><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Why this route fits</div><div className="mt-2 text-xl font-semibold tracking-tight">A calmer planning lane for parents and mixed-age groups</div><p className="mt-2 text-sm leading-6 text-white/80">Use this page when the buyer needs clearer structure, steadier pacing and a lower-friction path to compare options.</p></div>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4"><div className="text-sm font-semibold text-[color:var(--color-text)]">Why travelers choose this</div><p className="mt-1 text-sm leading-6 text-[color:var(--color-text)]/70">Family planning is rarely impulsive. A clearer path and visible support reduce drop-off before the traveler is ready.</p></div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4"><div className="text-sm font-semibold text-[color:var(--color-text)]">How to continue</div><p className="mt-1 text-sm leading-6 text-[color:var(--color-text)]/70">Use the personalized plan to clarify pace, comfort and style preferences, then continue to tours or human planning help.</p></div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4"><div className="text-sm font-semibold text-[color:var(--color-text)]">Best for</div><p className="mt-1 text-sm leading-6 text-[color:var(--color-text)]/70">Useful for family SEO pages, partnerships and ads that promise a smoother, safer and more guided Colombia route.</p></div>
            </div>
          </div>
        </div>
      </section>
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4"><div><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">Starter shortlist</div><h2 className="mt-2 font-heading text-2xl tracking-tight text-brand-blue">Tours to begin a calmer conversation</h2></div><Link href={withLocale(locale, '/tours')} className="text-sm font-semibold text-brand-blue">See full catalog →</Link></div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{tours.map((t) => { const ui = toTourLike(t); return <TourCardPremium key={ui.slug} tour={ui} href={withLocale(locale, `/tours/${ui.slug}`)} />; })}</div>
      </section>
      <div className="mt-10"><CaptureCtas compact locale={locale} /></div>
    </main>
  );
}
