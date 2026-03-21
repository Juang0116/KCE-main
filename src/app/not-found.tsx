'use client';

import Link from 'next/link';
import { MapPinned } from 'lucide-react';
import { useEffect, useState } from 'react';

const COPY: Record<'en' | 'fr' | 'de' | 'es', { title: string; sub: string; body: string; cta1: string; cta2: string; links: [string, string][] }> = {
  en: {
    title: "Off the map", sub: "Page not found",
    body: "The route you're looking for doesn't exist or has moved.",
    cta1: 'Explore tours', cta2: 'Go home',
    links: [['24/7 Support', '/contact'], ['My bookings', '/account/bookings'], ['About KCE', '/about']],
  },
  fr: {
    title: "Hors de la carte", sub: "Page introuvable",
    body: "La route que vous cherchez n'existe pas ou a été déplacée.",
    cta1: 'Explorer les tours', cta2: "Retour à l'accueil",
    links: [['Support 24h', '/contact'], ['Mes réservations', '/account/bookings'], ['À propos', '/about']],
  },
  de: {
    title: "Von der Karte", sub: "Seite nicht gefunden",
    body: "Die Route existiert nicht oder wurde verschoben.",
    cta1: 'Touren erkunden', cta2: 'Zur Startseite',
    links: [['Support 24h', '/contact'], ['Meine Buchungen', '/account/bookings'], ['Über KCE', '/about']],
  },
  es: {
    title: "Fuera del mapa", sub: "Página no encontrada",
    body: "La ruta que buscas no existe o ha sido movida.",
    cta1: 'Explorar tours', cta2: 'Ir al inicio',
    links: [['Soporte 24/7', '/contact'], ['Mis reservas', '/account/bookings'], ['Sobre KCE', '/about']],
  },
};

export default function NotFound() {
  const [locale, setLocale] = useState<keyof typeof COPY>('es');

  useEffect(() => {
    const lang = document.documentElement.lang?.slice(0, 2) || 
                 document.cookie.match(/kce\.locale=([^;]+)/)?.[1] || 'es';
    if (lang in COPY) setLocale(lang as keyof typeof COPY);
  }, []);

  const c = COPY[locale];
  const base = `/${locale}`;

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
              {c.title}<br />
              <span className="text-[color:var(--color-text-muted)] font-light">{c.sub}</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[color:var(--color-text-muted)] md:text-base">
              {c.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`${base}/tours`} className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white hover:bg-brand-blue/90 transition-all hover:-translate-y-0.5">
                {c.cta1} →
              </Link>
              <Link href={base} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-6 py-3 text-sm font-semibold text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-2)] transition-all">
                {c.cta2}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 border-t border-[color:var(--color-border)] pt-6">
              {c.links.map(([label, href]) => (
                <Link key={href} href={`${base}${href}`} className="text-xs text-brand-blue hover:underline">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
