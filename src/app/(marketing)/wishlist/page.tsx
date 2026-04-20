/* src/app/(marketing)/wishlist/page.tsx */
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { Heart, Sparkles, ArrowRight, Compass, Map, ChevronRight, BookmarkCheck, Globe2 } from 'lucide-react';

import WishlistView from '@/features/wishlist/WishlistView';
import { Button } from '@/components/ui/Button';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';
const SUPPORTED = new Set<SupportedLocale>(['es', 'en', 'fr', 'de']);

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

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
    case 'en': return { badge: 'Your Shortlist', title: 'Your Future Adventures', subtitle: 'Tours and cultural experiences you have saved to design your perfect trip to Colombia.', emptyCta: 'Explore Tours' };
    case 'fr': return { badge: 'Vos Coups de Cœur', title: 'Vos Prochaines Aventures', subtitle: 'Les circuits et expériences culturelles que vous avez enregistrés pour préparer votre voyage idéal.', emptyCta: 'Explorer les Tours' };
    case 'de': return { badge: 'Deine Wunschliste', title: 'Deine Nächsten Abenteuer', subtitle: 'Touren und kulturelle Erlebnisse, die du gespeichert hast, um deine perfekte Reise zu planen.', emptyCta: 'Touren Erkunden' };
    default: return { badge: 'Tus Favoritos', title: 'Tus próximas aventuras', subtitle: 'Tours y experiencias culturales que has guardado para diseñar tu viaje ideal por Colombia.', emptyCta: 'Explorar Catálogo' };
  }
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const t = locale === 'en' ? { title: 'Wishlist — KCE', desc: 'Your saved tours.' } : locale === 'fr' ? { title: 'Favoris — KCE', desc: 'Vos tours enregistrés.' } : locale === 'de' ? { title: 'Wunschliste — KCE', desc: 'Deine gespeicherten Touren.' } : { title: 'Wishlist — KCE', desc: 'Tus tours guardados.' };
  
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
    <main className="min-h-screen bg-base pb-32 animate-fade-in">
      
      {/* 01. HERO WISHLIST (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-28 md:py-40 text-center text-white border-b border-white/5">
        {/* Capas de profundidad */}
        <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.svg')] bg-repeat" />
        <div className="absolute top-0 left-1/2 w-full max-w-4xl h-80 bg-rose-500/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-rose-500/20 bg-rose-500/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.3em] text-rose-400 backdrop-blur-md shadow-2xl">
            <Heart className="h-4 w-4 fill-rose-500" /> {copy.badge}
          </div>
          
          <h1 className="font-heading text-5xl leading-[1.05] md:text-7xl lg:text-8xl tracking-tight mb-10">
            {copy.title.split(' ').slice(0, -1).join(' ')} <br className="hidden md:block" />
            <span className="text-brand-yellow font-light italic opacity-90">{copy.title.split(' ').pop()}</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-xl font-light leading-relaxed text-white/60 md:text-2xl">
            {copy.subtitle}
          </p>
        </div>
      </section>

      {/* 02. WISHLIST CONTENT (The Planning Table) */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 -mt-20 relative z-20">
        <div className="rounded-[var(--radius-3xl)] border border-brand-dark/10 dark:border-white/10 bg-surface p-8 md:p-16 lg:p-24 shadow-pop min-h-[600px] group">
          
          <header className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-brand-dark/5 dark:border-white/5 pb-16">
            <div className="flex items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue border border-brand-blue/10 shadow-sm transition-transform group-hover:scale-110 duration-500">
                <BookmarkCheck className="h-8 w-8" />
              </div>
              <div>
                <h2 className="font-heading text-3xl md:text-4xl text-main tracking-tight">Tu Selección Personal</h2>
                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.25em] opacity-60">Curaduría en proceso</p>
              </div>
            </div>

            <Button asChild variant="outline" className="rounded-full border-brand-dark/10 dark:border-white/10 text-brand-blue hover:bg-surface-2 px-10 py-7 h-auto transition-all group/btn shadow-sm">
              <Link href={withLocale(locale, '/tours')} className="text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                {copy.emptyCta} <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </Button>
          </header>

          <div className="wishlist-view-container">
            {/* El componente interno debe heredar el estilo minimalista de la plataforma */}
            <WishlistView />
          </div>

          {/* 03. PLANNING GUIDE (Editorial Grid) */}
          <div className="mt-32 grid gap-16 md:grid-cols-3 border-t border-brand-dark/5 dark:border-white/5 pt-24">
            {[
              { icon: Compass, title: 'Organiza', text: 'Tus favoritos están guardados aquí para que puedas compararlos con calma antes de decidir tu ruta final.' },
              { icon: Sparkles, title: 'Personaliza', text: '¿Dudas entre dos experiencias? Nuestro equipo puede ayudarte a unificarlas en una sola expedición de autor.' },
              { icon: Map, title: 'Reserva', text: 'Cuando estés listo, el proceso de reserva es rápido, seguro y con el respaldo oficial de Knowing Cultures S.A.S.' }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center px-8 group/item">
                <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 border border-brand-dark/5 text-muted transition-all duration-500 group-hover/item:text-brand-blue group-hover/item:scale-110 group-hover/item:shadow-soft group-hover/item:bg-surface">
                  <item.icon className="h-7 w-7 stroke-[1.25px]" />
                </div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-main mb-5">{item.title}</h4>
                <p className="text-base font-light text-muted leading-relaxed max-w-[280px]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04. PERSISTENCE INSIGHT (Premium Context) */}
      <section className="mx-auto max-w-4xl px-6 mt-24 text-center">
        <div className="relative overflow-hidden p-12 md:p-16 rounded-[var(--radius-2xl)] border border-brand-dark/5 dark:border-white/5 bg-surface-2/30 shadow-inner group">
          {/* Brillo sutil decorativo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex justify-center mb-6 opacity-30">
               <Globe2 className="h-8 w-8 text-brand-blue" />
            </div>
            <p className="text-base md:text-lg font-light text-muted leading-relaxed max-w-2xl mx-auto">
              Tu Wishlist se guarda automáticamente en este navegador. <br/>
              <span className="text-main font-medium">Inicia sesión con tu cuenta de viajero</span> para sincronizar tus favoritos y acceder a ellos desde cualquier dispositivo en el mundo.
            </p>
            <div className="pt-6">
              <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-blue hover:text-brand-dark transition-all group/link">
                Acceder a mi cuenta <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" /> 
              </Link> 
            </div>
          </div>
        </div>
      </section>

      {/* Marca de agua institucional sutil */}
      <div className="mt-32 text-center pb-12">
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-muted/30">
          Knowing Cultures S.A.S. © 2026 — Bogotá, Colombia
        </p>
      </div>

    </main>
  );
}