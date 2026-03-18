import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { Heart, Sparkles, ArrowRight, Compass, Map } from 'lucide-react';

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
    case 'fr': return { badge: 'Vos Coups de Cœur', title: 'Vos Prochaines Aventures', subtitle: 'Les circuits et expériences culturelles que vous avez enregistrés para préparer votre voyage idéal.', emptyCta: 'Explorer les Tours' };
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
    <main className="min-h-screen bg-[var(--color-bg)] pb-24">
      
      {/* HERO WISHLIST (PREMIUM DARK) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center text-white shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[url('/brand/pattern.png')] bg-repeat"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400 backdrop-blur-md shadow-sm">
            <Heart className="h-3 w-3 fill-rose-500 text-rose-500" /> {copy.badge}
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-6xl lg:text-7xl drop-shadow-xl">
            {copy.title.split(' ')[0]} <br/>
            <span className="text-brand-yellow font-light italic">{copy.title.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
            {copy.subtitle}
          </p>
        </div>
      </section>

      {/* CONTENEDOR DE LA LISTA (THE VAULT) */}
      <section className="mx-auto max-w-7xl px-6 -mt-12 relative z-20">
        <div className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-16 shadow-2xl min-h-[400px]">
          
          <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/5 text-rose-500 border border-rose-500/10">
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-2xl text-brand-blue">Tu Selección</h2>
                <p className="text-xs font-light text-[var(--color-text)]/40 uppercase tracking-widest">Planificación en curso</p>
              </div>
            </div>

            <Button asChild variant="outline" className="rounded-full border-brand-blue/20 text-brand-blue hover:bg-brand-blue/5">
              <Link href={withLocale(locale, '/tours')}>
                {copy.emptyCta} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </header>

          <div className="wishlist-view-wrapper">
            <WishlistView />
          </div>

          {/* GUÍA RÁPIDA INFERIOR (Solo visible si hay contexto) */}
          <div className="mt-16 grid gap-6 md:grid-cols-3 border-t border-[var(--color-border)] pt-12">
            {[
              { icon: Compass, title: 'Organiza', text: 'Tus favoritos están guardados aquí para que puedas compararlos con calma.' },
              { icon: Sparkles, title: 'Personaliza', text: '¿Dudas entre dos tours? Nuestro equipo puede ayudarte a unificarlos.' },
              { icon: Map, title: 'Reserva', text: 'Cuando estés listo, el proceso de pago es rápido, seguro y bilingüe.' }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center px-4">
                <item.icon className="h-6 w-6 text-brand-blue/30 mb-4" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-blue mb-2">{item.title}</h4>
                <p className="text-xs font-light text-[var(--color-text)]/50 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION SECUNDARIO */}
      <section className="mx-auto max-w-4xl px-6 mt-20 text-center">
        <p className="text-sm font-light text-[var(--color-text)]/40 italic">
          Tu Wishlist se guarda automáticamente en tu navegador. <br/>
          <Link href="/login" className="text-brand-blue font-medium hover:underline">Inicia sesión</Link> para ver tus favoritos desde cualquier dispositivo.
        </p>
      </section>

    </main>
  );
}