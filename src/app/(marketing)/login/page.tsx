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
  return v === 'en' || v === 'fr' || v === 'de' ? v : 'es';
}

function getCopy(locale: SupportedLocale) {
  switch (locale) {
    case 'en': return { title: 'Welcome back', subtitle: 'Access your bookings and continue your journey.' };
    case 'fr': return { title: 'De retour', subtitle: 'Accédez à vos réservations et continuez votre voyage.' };
    case 'de': return { title: 'Willkommen zurück', subtitle: 'Greifen Sie auf Ihre Buchungen zu und setzen Sie Ihre Reise fort.' };
    default: return { title: 'Te damos la bienvenida', subtitle: 'Inicia sesión para gestionar tus reservas o seguir planeando tu viaje por Colombia.' };
  }
}

export default async function LoginPage() {
  const locale = await resolveLocale();
  const copy = getCopy(locale);

  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] flex items-center justify-center p-4 md:p-6 lg:p-10 animate-fade-in relative overflow-hidden">
      
      {/* Destellos ambientales (Glow) en el fondo de la página entera */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-yellow/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-6xl rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-soft overflow-hidden flex flex-col md:flex-row relative z-10 transition-shadow duration-500 hover:shadow-pop">
        
        {/* Panel Izquierdo: Branding & Value Props (Editorial Dark) */}
        <div className="relative hidden md:flex md:w-5/12 flex-col justify-between p-12 lg:p-16 bg-brand-dark text-white overflow-hidden border-r border-[color:var(--color-border)]">
          {/* Capas de fondo sutiles */}
          <div className="absolute inset-0 opacity-30 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-brand-blue/20"></div>
          
          <div className="relative z-10">
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md shadow-sm">
              <ShieldCheck className="h-3 w-3 text-brand-yellow" /> Portal Seguro KCE
            </div>
            <h2 className="font-heading text-4xl lg:text-5xl leading-[1.1] drop-shadow-md tracking-tight">
              Tu viaje, <br/>
              <span className="text-brand-yellow font-light italic opacity-90">bajo control.</span>
            </h2>
            <p className="mt-6 text-base font-light text-white/70 leading-relaxed max-w-sm">
              Gestiona cada detalle de tu experiencia, desde la inspiración inicial hasta tu voucher de reserva.
            </p>
          </div>

          <div className="relative z-10 mt-16 space-y-8">
            <div className="flex items-start gap-5 group">
              <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-[var(--radius-xl)] bg-white/5 border border-white/10 transition-all duration-300 group-hover:scale-110 group-hover:border-brand-yellow/30 group-hover:bg-brand-yellow/10">
                <CalendarDays className="h-5 w-5 text-brand-yellow" />
              </div>
              <div className="pt-1">
                <h3 className="font-heading text-lg text-white mb-1">Reservas & Tickets</h3>
                <p className="text-xs font-light text-white/60 leading-relaxed">Acceso instantáneo a itinerarios y recibos de pago.</p>
              </div>
            </div>

            <div className="flex items-start gap-5 group">
              <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-[var(--radius-xl)] bg-white/5 border border-white/10 transition-all duration-300 group-hover:scale-110 group-hover:border-brand-yellow/30 group-hover:bg-brand-yellow/10">
                <LifeBuoy className="h-5 w-5 text-brand-yellow" />
              </div>
              <div className="pt-1">
                <h3 className="font-heading text-lg text-white mb-1">Soporte Directo</h3>
                <p className="text-xs font-light text-white/60 leading-relaxed">Contacto humano con el contexto exacto de tu viaje.</p>
              </div>
            </div>
          </div>

          {/* Footer del panel izquierdo */}
          <div className="relative z-10 pt-12 border-t border-white/10 mt-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
              Knowing Cultures Enterprise © 2026
            </p>
          </div>
        </div>

        {/* Panel Derecho: Formulario (Glassmorphism Claro) */}
        <div className="w-full md:w-7/12 p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-[color:var(--color-surface)]/90 backdrop-blur-3xl relative">
          
          {/* Elemento decorativo sutil rotado */}
          <div className="absolute -top-10 -right-10 p-8 opacity-[0.02] pointer-events-none">
            <ShieldCheck className="h-64 w-64 text-brand-blue -rotate-12" />
          </div>

          <div className="mx-auto w-full max-w-[380px] relative z-10">
            <header className="mb-10 text-center md:text-left">
              <h1 className="font-heading text-4xl tracking-tight text-[color:var(--color-text)] mb-3">
                {copy.title}
              </h1>
              <p className="text-sm font-light text-[color:var(--color-text-muted)] leading-relaxed">
                {copy.subtitle}
              </p>
            </header>

            <section className="login-form-wrapper">
              {/* Aquí se inyecta tu formulario actual */}
              <LoginForm locale={locale} />
            </section>

            <footer className="mt-12 pt-8 border-t border-[color:var(--color-border)] text-center md:text-left">
              <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed">
                ¿Problemas para entrar? Contacta a nuestro equipo de <a href="/contact" className="text-brand-blue hover:text-brand-terra transition-colors font-medium">Concierge</a> para recuperar el acceso a tu cuenta.
              </p>
            </footer>
          </div>
        </div>

      </div>
    </main>
  );
}