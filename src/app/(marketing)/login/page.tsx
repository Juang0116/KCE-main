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
  return (v === 'en' || v === 'fr' || v === 'de') ? (v as SupportedLocale) : 'es';
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
    <main className="min-h-screen bg-base flex items-center justify-center p-4 md:p-6 lg:p-10 animate-fade-in relative overflow-hidden">
      
      {/* Destellos ambientales (Glow) KCE */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-yellow/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-6xl rounded-[var(--radius-2xl)] border border-brand-dark/10 dark:border-white/10 bg-surface shadow-soft overflow-hidden flex flex-col md:flex-row relative z-10 transition-shadow duration-500 hover:shadow-pop">
        
        {/* Panel Izquierdo: Branding & Value Props (Inmersivo KCE) */}
        <div className="relative hidden md:flex md:w-5/12 flex-col justify-between p-12 lg:p-16 bg-brand-dark text-white overflow-hidden border-r border-brand-dark/10">
          {/* Capas de fondo sutiles */}
          <div className="absolute inset-0 opacity-30 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent" />
          
          <div className="relative z-10">
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-sm backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-yellow" /> Portal Seguro KCE
            </div>
            <h2 className="font-heading text-4xl lg:text-5xl leading-[1.05] drop-shadow-md tracking-tight">
              Tu viaje, <br/>
              <span className="text-brand-yellow font-light italic opacity-90">bajo control.</span>
            </h2>
            <p className="mt-6 text-base lg:text-lg font-light text-white/70 leading-relaxed max-w-sm">
              Gestiona cada detalle de tu experiencia, desde la inspiración inicial hasta tu voucher de reserva.
            </p>
          </div>

          <div className="relative z-10 mt-16 space-y-8">
            <div className="flex items-start gap-5 group">
              <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-all duration-300 group-hover:scale-110 group-hover:border-brand-yellow/30 group-hover:bg-brand-yellow/10">
                <CalendarDays className="h-5 w-5 text-brand-yellow" />
              </div>
              <div className="pt-1">
                <h3 className="font-heading text-lg text-white mb-1 tracking-tight">Reservas & Tickets</h3>
                <p className="text-xs font-light text-white/60 leading-relaxed">Acceso instantáneo a itinerarios y recibos de pago.</p>
              </div>
            </div>

            <div className="flex items-start gap-5 group">
              <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-all duration-300 group-hover:scale-110 group-hover:border-brand-blue/30 group-hover:bg-brand-blue/10">
                <LifeBuoy className="h-5 w-5 text-brand-blue" />
              </div>
              <div className="pt-1">
                <h3 className="font-heading text-lg text-white mb-1 tracking-tight">Soporte Directo</h3>
                <p className="text-xs font-light text-white/60 leading-relaxed">Contacto humano con el contexto exacto de tu viaje.</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-12 border-t border-white/10 mt-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
              Knowing Cultures Enterprise © 2026
            </p>
          </div>
        </div>

        {/* Panel Derecho: Formulario (Limpio y Editorial) */}
        <div className="w-full md:w-7/12 p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-surface relative">
          
          {/* Elemento decorativo sutil */}
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
            <ShieldCheck className="h-64 w-64 text-brand-blue -rotate-12" />
          </div>

          <div className="mx-auto w-full max-w-[400px] relative z-10">
            <header className="mb-12 text-center md:text-left">
              <h1 className="font-heading text-4xl md:text-5xl tracking-tight text-main mb-4">
                {copy.title}
              </h1>
              <p className="text-base font-light text-muted leading-relaxed">
                {copy.subtitle}
              </p>
            </header>

            <section className="login-form-wrapper">
              <LoginForm locale={locale} />
            </section>

            <footer className="mt-12 pt-8 border-t border-brand-dark/5 dark:border-white/5 text-center md:text-left">
              <p className="text-xs text-muted leading-relaxed">
                ¿Problemas para entrar? Contacta a nuestro equipo de <a href="/contact" className="text-brand-blue hover:text-brand-terra transition-colors font-bold uppercase tracking-widest text-[10px]">Concierge</a> para recuperar el acceso a tu cuenta.
              </p>
            </footer>
          </div>
        </div>

      </div>
    </main>
  );
}