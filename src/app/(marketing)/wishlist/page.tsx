import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { Heart, Sparkles, ArrowRight, Compass, Map, ChevronRight } from 'lucide-react';

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
    <main className="min-h-screen bg-[var(--color-bg)] pb-32 animate-fade-in">
      
      {/* 01. HERO WISHLIST (Rose & Dark Contrast) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-28 md:py-40 text-center text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/40 via-brand-dark to-[var(--color-bg)]" />
        
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-rose-500/20 bg-rose-500/10 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.3em] text-rose-400 backdrop-blur-md shadow-2xl">
            <Heart className="h-4 w-4 fill-rose-500" /> {copy.badge}
          </div>
          
          <h1 className="font-heading text-5xl leading-[1.1] md:text-7xl lg:text-8xl tracking-tight mb-10">
            {copy.title.split(' ').slice(0, -1).join(' ')} <br/>
            <span className="text-brand-blue font-light italic">{copy.title.split(' ').pop()}</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-xl font-light leading-relaxed text-white/50 md:text-2xl">
            {copy.subtitle}
          </p>
        </div>
      </section>

      {/* 02. WISHLIST CONTENT (The Planning Table) */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 -mt-20 relative z-20">
        <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 md:p-16 lg:p-20 shadow-soft min-h-[500px] group">
          
          <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-[var(--color-border)] pb-12">
            <div className="flex items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/5 text-rose-500 border border-rose-500/10 shadow-sm transition-transform group-hover:scale-110 duration-500">
                <Heart className="h-8 w-8 fill-current" />
              </div>
              <div>
                <h2 className="font-heading text-3xl text-[var(--color-text)] tracking-tight">Tu Selección</h2>
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] opacity-60">Planificación en curso</p>
              </div>
            </div>

            <Button asChild variant="outline" className="rounded-full border-[var(--color-border)] text-brand-blue hover:bg-[var(--color-surface-2)] px-8 py-6 h-auto transition-all group/btn">
              <Link href={withLocale(locale, '/tours')} className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                {copy.emptyCta} <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
              </Link>
            </Button>
          </header>

          <div className="wishlist-view-container animate-slide-up">
            <WishlistView />
          </div>

          {/* 03. PLANNING GUIDE (Subtle & Instructive) */}
          <div className="mt-24 grid gap-12 md:grid-cols-3 border-t border-[var(--color-border)] pt-20">
            {[
              { icon: Compass, title: 'Organiza', text: 'Tus favoritos están guardados aquí para que puedas compararlos con calma antes de decidir.' },
              { icon: Sparkles, title: 'Personaliza', text: '¿Dudas entre dos destinos? Nuestro equipo puede ayudarte a unificarlos en una sola ruta.' },
              { icon: Map, title: 'Reserva', text: 'Cuando estés listo, el proceso de pago es rápido, seguro y con soporte humano bilingüe.' }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center px-6 group/item">
                <div className="mb-8 p-5 rounded-2xl bg-[var(--color-surface-2)] text-brand-blue/30 transition-all group-hover/item:text-brand-blue group-hover/item:scale-110 group-hover/item:shadow-soft">
                  <item.icon className="h-7 w-7 stroke-[1.5px]" />
                </div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text)] mb-4">{item.title}</h4>
                <p className="text-sm font-light text-[var(--color-text-muted)] leading-relaxed max-w-[240px]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04. PERSISTENCE NOTIFICATION */}
      <section className="mx-auto max-w-4xl px-6 mt-20 text-center">
        <div className="inline-block p-10 rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/30">
          <p className="text-sm font-light text-[var(--color-text-muted)] leading-loose">
            Tu Wishlist se guarda automáticamente en este navegador. <br/>
            <Link href="/login" className="text-brand-blue font-bold tracking-tight hover:underline flex items-center justify-center gap-2 mt-2">
              Inicia sesión <ChevronRight className="h-3 w-3" /> 
            </Link> 
            <span className="opacity-50">para ver tus favoritos desde cualquier dispositivo.</span>
          </p>
        </div>
      </section>

    </main>
  );
}