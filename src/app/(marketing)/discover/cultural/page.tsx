import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

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

export default async function LandingPage() {
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
    <main className='mx-auto w-full max-w-6xl px-4 pb-16 pt-28'>
      <section className='overflow-hidden rounded-[calc(var(--radius)+0.55rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] shadow-soft'>
        <div className='grid gap-0 lg:grid-cols-[1.15fr_0.85fr]'>
          <div className='p-6 sm:p-8 lg:p-10'>
            <div className='inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/60'>
              Culture seeker lane
            </div>
            <h1 className='mt-4 max-w-3xl font-heading text-4xl tracking-tight text-brand-blue sm:text-5xl'>Cultural Colombia for travelers who want meaning, people and local context</h1>
            <p className='mt-4 max-w-2xl text-base leading-7 text-[color:var(--color-text)]/75'>A culture-led landing page focused on heritage, neighborhoods, local stories, art and curated guided experiences in Colombia.</p>

            <div className='mt-8 grid gap-3 sm:grid-cols-3'>
              <div className='rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3'><div className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55'>Meaningful travel</div><div className='mt-1 text-lg font-semibold text-[color:var(--color-text)]'>Context-rich routes</div></div>
              <div className='rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3'><div className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55'>Guided choice</div><div className='mt-1 text-lg font-semibold text-[color:var(--color-text)]'>Clear next steps from content to booking</div></div>
              <div className='rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3'><div className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55'>Human support</div><div className='mt-1 text-lg font-semibold text-[color:var(--color-text)]'>A real team behind the shortlist</div></div>
            </div>

            <div className='mt-8 flex flex-wrap gap-3'>
              <Link href={withLocale(locale, '/tours')} className='inline-flex items-center rounded-full bg-brand-blue px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-px'>Browse tours</Link>
              <Link href={withLocale(locale, '/plan')} className='inline-flex items-center rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-2)]'>Start a personalized plan</Link>
              <a href={waOrContactHref} target='_blank' rel='noreferrer' className='inline-flex items-center rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-2)]'>WhatsApp</a>
            </div>
          </div>

          <div className='border-t border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-6 sm:p-8 lg:border-l lg:border-t-0'>
            <div className='rounded-3xl bg-brand-blue px-5 py-4 text-white shadow-soft'>
              <div className='text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70'>Why this route fits</div>
              <div className='mt-2 text-xl font-semibold tracking-tight'>Move cultural curiosity into a real shortlist with guidance and trust</div>
              <p className='mt-2 text-sm leading-6 text-white/80'>This landing is designed for travelers who care about context, hosts, neighborhoods and memorable local stories more than generic sightseeing.</p>
            </div>

            <div className='mt-5 space-y-3'>
              <div className='rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4'><div className='text-sm font-semibold text-[color:var(--color-text)]'>Why travelers choose this</div><p className='mt-1 text-sm leading-6 text-[color:var(--color-text)]/70'>Culture-focused travelers usually need confidence that the experience is thoughtful, not generic. This page frames that promise clearly.</p></div>
              <div className='rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4'><div className='text-sm font-semibold text-[color:var(--color-text)]'>How to continue</div><p className='mt-1 text-sm leading-6 text-[color:var(--color-text)]/70'>Use content and stories to warm the traveler, then move them into tours, a personalized plan or WhatsApp depending on readiness.</p></div>
              <div className='rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4'><div className='text-sm font-semibold text-[color:var(--color-text)]'>Best for</div><p className='mt-1 text-sm leading-6 text-[color:var(--color-text)]/70'>A strong landing for intent terms around culture, heritage, local experiences, neighborhoods and art in Colombia.</p></div>
            </div>
          </div>
        </div>
      </section>


      <section className='mt-10'>
        <div className='mb-4 flex items-end justify-between gap-4'>
          <div>
            <div className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55'>Curated shortlist</div>
            <h2 className='mt-2 font-heading text-2xl tracking-tight text-brand-blue'>Tours to start the conversation</h2>
          </div>
          <Link href={withLocale(locale, '/tours')} className='text-sm font-semibold text-brand-blue'>See full catalog →</Link>
        </div>
        <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
          {tours.map((t) => {
            const ui = toTourLike(t);
            return <TourCardPremium key={ui.slug} tour={ui} href={withLocale(locale, `/tours/${ui.slug}`)} />;
          })}
        </div>
      </section>

      <section className='mt-10 rounded-[calc(var(--radius)+0.35rem)] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft'>
        <div className='grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center'>
          <div>
            <div className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/55'>Intent to action</div>
            <h2 className='mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text)]'>Use this landing to move cold traffic into qualified travel intent</h2>
            <p className='mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/70'>Pair editorial content, shortlist-ready tours and a human handoff so the traveler does not fall into dead ends while deciding.</p>
          </div>
          <div className='flex flex-wrap gap-3'>
            <Link href={withLocale(locale, '/newsletter')} className='inline-flex items-center rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-text)]'>Newsletter</Link>
            <Link href={withLocale(locale, '/lead-magnets/eu-guide')} className='inline-flex items-center rounded-full bg-brand-yellow px-4 py-2.5 text-sm font-semibold text-brand-blue'>Lead magnet EU</Link>
          </div>
        </div>
      </section>

      <div className='mt-10'>
        <CaptureCtas compact locale={locale} />
      </div>
    </main>
  );
}
