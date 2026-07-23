/* src/app/(marketing)/login/page.tsx */
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { ShieldCheck, CalendarDays, LifeBuoy, ArrowRight } from 'lucide-react';

import LoginForm from '@/features/auth/LoginForm';
import { SITE_URL } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Iniciar sesión | KCE',
  description: 'Accede a tu portal de viajero para gestionar reservas y itinerarios.',
  robots: { index: false, follow: false },
  metadataBase: new URL(SITE_URL || 'https://kce.travel'),
};

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

async function resolveLocale(): Promise<SupportedLocale> {
  const h = await headers();
  const c = await cookies();
  const v = (h.get('x-kce-locale') || c.get('kce.locale')?.value || '').toLowerCase();
  return v === 'en' || v === 'fr' || v === 'de' ? (v as SupportedLocale) : 'es';
}

function getCopy(locale: SupportedLocale) {
  switch (locale) {
    case 'en':
      return { title: 'Welcome back', subtitle: 'Access your bookings and continue your journey.' };
    case 'fr':
      return {
        title: 'De retour',
        subtitle: 'Accédez à vos réservations et continuez votre voyage.',
      };
    case 'de':
      return {
        title: 'Willkommen zurück',
        subtitle: 'Greifen Sie auf Ihre Buchungen zu und setzen Sie Ihre Reise fort.',
      };
    default:
      return {
        title: 'Te damos la bienvenida',
        subtitle:
          'Inicia sesión para gestionar tus reservas o seguir planeando tu viaje por Colombia.',
      };
  }
}

export default async function LoginPage() {
  const locale = await resolveLocale();
  const copy = getCopy(locale);

  return (
    <main className="relative flex min-h-screen animate-fade-in items-center justify-center overflow-hidden bg-base p-4 md:p-6 lg:p-10">
      {/* Destellos ambientales (Glow) KCE */}
      <div className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-brand-blue/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-brand-yellow/5 blur-[120px]" />

      <div className="relative z-10 flex w-full max-w-6xl flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-surface shadow-soft transition-shadow duration-500 hover:shadow-pop dark:border-white/10 md:flex-row">
        {/* Panel Izquierdo: Branding & Value Props (Inmersivo KCE) */}
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-brand-dark/10 bg-brand-dark p-12 text-white md:flex md:w-5/12 lg:p-16">
          {/* Capas de fondo sutiles */}
          <div className="absolute inset-0 scale-110 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent" />

          <div className="relative z-10">
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-sm backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-yellow" /> Portal Seguro KCE
            </div>
            <h2 className="font-heading text-4xl leading-[1.05] tracking-tight drop-shadow-md lg:text-5xl">
              Tu viaje, <br />
              <span className="font-light italic text-brand-yellow opacity-90">bajo control.</span>
            </h2>
            <p className="mt-6 max-w-sm text-base font-light leading-relaxed text-white/70 lg:text-lg">
              Gestiona cada detalle de tu experiencia, desde la inspiración inicial hasta tu voucher
              de reserva.
            </p>
          </div>

          <div className="relative z-10 mt-16 space-y-8">
            <div className="group flex items-start gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 group-hover:scale-110 group-hover:border-brand-yellow/30 group-hover:bg-brand-yellow/10">
                <CalendarDays className="h-5 w-5 text-brand-yellow" />
              </div>
              <div className="pt-1">
                <h3 className="mb-1 font-heading text-lg tracking-tight text-white">
                  Reservas & Tickets
                </h3>
                <p className="text-xs font-light leading-relaxed text-white/60">
                  Acceso instantáneo a itinerarios y recibos de pago.
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 group-hover:scale-110 group-hover:border-brand-blue/30 group-hover:bg-brand-blue/10">
                <LifeBuoy className="h-5 w-5 text-brand-blue" />
              </div>
              <div className="pt-1">
                <h3 className="mb-1 font-heading text-lg tracking-tight text-white">
                  Soporte Directo
                </h3>
                <p className="text-xs font-light leading-relaxed text-white/60">
                  Contacto humano con el contexto exacto de tu viaje.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-12 border-t border-white/10 pt-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
              Knowing Cultures Enterprise © 2026
            </p>
          </div>
        </div>

        {/* Panel Derecho: Formulario (Limpio y Editorial) */}
        <div className="relative flex w-full flex-col justify-center bg-surface p-8 md:w-7/12 md:p-16 lg:p-24">
          {/* Elemento decorativo sutil */}
          <div className="pointer-events-none absolute right-0 top-0 p-12 opacity-[0.03]">
            <ShieldCheck className="h-64 w-64 -rotate-12 text-brand-blue" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[400px]">
            <header className="mb-12 text-center md:text-left">
              <h1 className="mb-4 font-heading text-4xl tracking-tight text-main md:text-5xl">
                {copy.title}
              </h1>
              <p className="text-base font-light leading-relaxed text-muted">{copy.subtitle}</p>
            </header>

            <section className="login-form-wrapper">
              <LoginForm locale={locale} />
            </section>

            <footer className="mt-12 border-t border-brand-dark/5 pt-8 text-center dark:border-white/5 md:text-left">
              <p className="text-xs leading-relaxed text-muted">
                ¿Problemas para entrar? Contacta a nuestro equipo de{' '}
                <a
                  href="/contact"
                  className="text-[10px] font-bold uppercase tracking-widest text-brand-blue transition-colors hover:text-brand-terra"
                >
                  Concierge
                </a>{' '}
                para recuperar el acceso a tu cuenta.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
