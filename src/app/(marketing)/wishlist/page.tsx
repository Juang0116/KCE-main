/* src/app/(marketing)/wishlist/page.tsx */
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import {
  Heart,
  Sparkles,
  ArrowRight,
  Compass,
  Map,
  ChevronRight,
  BookmarkCheck,
  Globe2,
} from 'lucide-react';

import WishlistView from '@/features/wishlist/WishlistView';
import { Button } from '@/components/ui/Button';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(
  /\/+$/,
  '',
);

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const fromHeader = (h.get('x-kce-locale') || '').trim().toLowerCase();
  if (SUPPORTED.has(fromHeader as SupportedLocale)) return fromHeader as SupportedLocale;

  const c = await cookies();
  const fromCookie = (c.get('kce.locale')?.value || '').trim().toLowerCase();
  if (SUPPORTED.has(fromCookie as SupportedLocale)) return fromCookie as SupportedLocale;

  return 'es';
}

function getCopy(locale: SupportedLocale) {
  switch (locale) {
    case 'en':
      return {
        badge: 'Your Shortlist',
        title: 'Your Future Adventures',
        subtitle:
          'Tours and cultural experiences you have saved to design your perfect trip to Colombia.',
        emptyCta: 'Explore Tours',
      };
    case 'fr':
      return {
        badge: 'Vos Coups de Cœur',
        title: 'Vos Prochaines Aventures',
        subtitle:
          'Les circuits et expériences culturelles que vous avez enregistrés pour préparer votre voyage idéal.',
        emptyCta: 'Explorer les Tours',
      };
    case 'de':
      return {
        badge: 'Deine Wunschliste',
        title: 'Deine Nächsten Abenteuer',
        subtitle:
          'Touren und kulturelle Erlebnisse, die du gespeichert hast, um deine perfekte Reise zu planen.',
        emptyCta: 'Touren Erkunden',
      };
    default:
      return {
        badge: 'Tus Favoritos',
        title: 'Tus próximas aventuras',
        subtitle:
          'Tours y experiencias culturales que has guardado para diseñar tu viaje ideal por Colombia.',
        emptyCta: 'Explorar Catálogo',
      };
  }
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const t =
    locale === 'en'
      ? { title: 'Wishlist — KCE', desc: 'Your saved tours.' }
      : locale === 'fr'
        ? { title: 'Favoris — KCE', desc: 'Vos tours enregistrés.' }
        : locale === 'de'
          ? { title: 'Wunschliste — KCE', desc: 'Deine gespeicherten Touren.' }
          : { title: 'Wishlist — KCE', desc: 'Tus tours guardados.' };

  return {
    metadataBase: new URL(BASE_SITE_URL),
    title: t.title,
    description: t.desc,
    alternates: { canonical: `${BASE_SITE_URL}/${locale}/wishlist` },
    robots: { index: false, follow: false },
  };
}

export default async function WishlistPage() {
  const locale = await resolveLocale();
  const copy = getCopy(locale);

  return (
    <main className="min-h-screen animate-fade-in bg-base pb-32">
      {/* 01. HERO WISHLIST (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden border-b border-white/5 bg-brand-dark px-6 py-28 text-center text-white md:py-40">
        {/* Capas de profundidad */}
        <div className="absolute inset-0 bg-[url('/brand/pattern.svg')] bg-repeat opacity-10" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-rose-500/10 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-rose-500/20 bg-rose-500/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.3em] text-rose-400 shadow-2xl backdrop-blur-md">
            <Heart className="h-4 w-4 fill-rose-500" /> {copy.badge}
          </div>

          <h1 className="mb-10 font-heading text-5xl leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
            {copy.title.split(' ').slice(0, -1).join(' ')} <br className="hidden md:block" />
            <span className="font-light italic text-brand-yellow opacity-90">
              {copy.title.split(' ').pop()}
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl font-light leading-relaxed text-white/60 md:text-2xl">
            {copy.subtitle}
          </p>
        </div>
      </section>

      {/* 02. WISHLIST CONTENT (The Planning Table) */}
      <section className="relative z-20 mx-auto -mt-20 max-w-[var(--container-max)] px-6">
        <div className="group min-h-[600px] rounded-[var(--radius-3xl)] border border-brand-dark/10 bg-surface p-8 shadow-pop dark:border-white/10 md:p-16 lg:p-24">
          <header className="mb-20 flex flex-col justify-between gap-12 border-b border-brand-dark/5 pb-16 dark:border-white/5 md:flex-row md:items-end">
            <div className="flex items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-blue/10 bg-brand-blue/5 text-brand-blue shadow-sm transition-transform duration-500 group-hover:scale-110">
                <BookmarkCheck className="h-8 w-8" />
              </div>
              <div>
                <h2 className="font-heading text-3xl tracking-tight text-main md:text-4xl">
                  Tu Selección Personal
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted opacity-60">
                  Curaduría en proceso
                </p>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              className="group/btn h-auto rounded-full border-brand-dark/10 px-10 py-7 text-brand-blue shadow-sm transition-all hover:bg-surface-2 dark:border-white/10"
            >
              <Link
                href={withLocale(locale, '/tours')}
                className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest"
              >
                {copy.emptyCta}{' '}
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </Button>
          </header>

          <div className="wishlist-view-container">
            {/* El componente interno debe heredar el estilo minimalista de la plataforma */}
            <WishlistView />
          </div>

          {/* 03. PLANNING GUIDE (Editorial Grid) */}
          <div className="mt-32 grid gap-16 border-t border-brand-dark/5 pt-24 dark:border-white/5 md:grid-cols-3">
            {[
              {
                icon: Compass,
                title: 'Organiza',
                text: 'Tus favoritos están guardados aquí para que puedas compararlos con calma antes de decidir tu ruta final.',
              },
              {
                icon: Sparkles,
                title: 'Personaliza',
                text: '¿Dudas entre dos experiencias? Nuestro equipo puede ayudarte a unificarlas en una sola expedición de autor.',
              },
              {
                icon: Map,
                title: 'Reserva',
                text: 'Cuando estés listo, el proceso de reserva es rápido, seguro y con el respaldo oficial de Knowing Cultures S.A.S.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="group/item flex flex-col items-center px-8 text-center"
              >
                <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-dark/5 bg-surface-2 text-muted transition-all duration-500 group-hover/item:scale-110 group-hover/item:bg-surface group-hover/item:text-brand-blue group-hover/item:shadow-soft">
                  <item.icon className="h-7 w-7 stroke-[1.25px]" />
                </div>
                <h4 className="mb-5 text-[10px] font-bold uppercase tracking-[0.3em] text-main">
                  {item.title}
                </h4>
                <p className="max-w-[280px] text-base font-light leading-relaxed text-muted">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04. PERSISTENCE INSIGHT (Premium Context) */}
      <section className="mx-auto mt-24 max-w-4xl px-6 text-center">
        <div className="bg-surface-2/30 group relative overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/5 p-12 shadow-inner dark:border-white/5 md:p-16">
          {/* Brillo sutil decorativo */}
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-brand-blue/5 blur-2xl" />

          <div className="relative z-10 space-y-6">
            <div className="mb-6 flex justify-center opacity-30">
              <Globe2 className="h-8 w-8 text-brand-blue" />
            </div>
            <p className="mx-auto max-w-2xl text-base font-light leading-relaxed text-muted md:text-lg">
              Tu Wishlist se guarda automáticamente en este navegador. <br />
              <span className="font-medium text-main">
                Inicia sesión con tu cuenta de viajero
              </span>{' '}
              para sincronizar tus favoritos y acceder a ellos desde cualquier dispositivo en el
              mundo.
            </p>
            <div className="pt-6">
              <Link
                href="/login"
                className="group/link inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue transition-all hover:text-brand-dark"
              >
                Acceder a mi cuenta{' '}
                <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Marca de agua institucional sutil */}
      <div className="mt-32 pb-12 text-center">
        <p className="text-muted/30 text-[9px] font-bold uppercase tracking-[0.4em]">
          Knowing Cultures S.A.S. © 2026 — Bogotá, Colombia
        </p>
      </div>
    </main>
  );
}
