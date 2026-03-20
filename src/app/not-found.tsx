import Link from 'next/link';
import { MapPinned } from 'lucide-react';
import { cookies, headers } from 'next/headers';

// Minimal inline translations for 404 (no async server component needed for not-found)
const COPY: Record<string, { title: string; span: string; body: string; cta1: string; cta2: string }> = {
  en: { title: "Looks like you've gone off the map", span: 'Page not found', body: "The route you're looking for doesn't exist or has moved. Don't worry, even the best explorers get lost sometimes.", cta1: 'Explore experiences', cta2: 'Go home' },
  fr: { title: 'On dirait que vous avez quitté la carte', span: 'Page introuvable', body: "La route que vous cherchez n'existe pas ou a été déplacée. Ne vous inquiétez pas, même les meilleurs explorateurs se perdent parfois.", cta1: 'Explorer les expériences', cta2: "Retour à l'accueil" },
  de: { title: 'Sie haben die Karte verlassen', span: 'Seite nicht gefunden', body: 'Die gesuchte Route existiert nicht oder wurde verschoben. Keine Sorge, auch die besten Entdecker verirren sich manchmal.', cta1: 'Erlebnisse erkunden', cta2: 'Zur Startseite' },
  es: { title: 'Parece que te has salido del mapa', span: 'Página no encontrada', body: 'La ruta que buscas no existe o ha sido movida. No te preocupes, todos los grandes exploradores se pierden de vez en cuando.', cta1: 'Explorar experiencias', cta2: 'Ir al inicio' },
};

export default function NotFound() {
  // Note: not-found.tsx runs server-side but can't be async in Next.js 15
  // So we use a client-side locale fallback approach
  const copy = COPY.es; // Default to Spanish, locale switching happens via JS

  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4 font-body text-[color:var(--color-text)]">
      <main className="w-full max-w-2xl">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-soft md:p-14">
          <div className="absolute -right-8 -top-8 text-brand-blue/5">
            <MapPinned size={200} strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/5 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-brand-blue font-bold">
              Error 404
            </div>
            <h1 className="mt-6 font-heading text-4xl text-brand-blue md:text-5xl">
              {copy.title} <br />
              <span className="text-[color:var(--color-text-muted)]">{copy.span}</span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-[color:var(--color-text-muted)] md:text-base">
              {copy.body}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/tours" className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white hover:bg-brand-blue/90 transition-all hover:-translate-y-0.5">
                {copy.cta1} →
              </Link>
              <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-6 py-3 text-sm font-semibold text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-2)] transition-all">
                {copy.cta2}
              </Link>
            </div>
          </div>
        </div>
        {/* Footer links */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-[color:var(--color-text-muted)]">
          <Link href="/contact" className="hover:text-brand-blue transition-colors">Support 24/7</Link>
          <Link href="/account/bookings" className="hover:text-brand-blue transition-colors">Booking status</Link>
          <Link href="/about" className="hover:text-brand-blue transition-colors">About KCE</Link>
        </div>
      </main>
    </div>
  );
}
