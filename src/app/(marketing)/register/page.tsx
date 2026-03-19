import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { ShieldCheck, Star, Clock, Sparkles, ArrowRight } from 'lucide-react';

import RegisterForm from '@/features/auth/RegisterForm';
import { SITE_URL } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Únete a KCE | Crear cuenta',
  description: 'Crea tu cuenta en Knowing Cultures Enterprise y empieza a diseñar tu ruta ideal por Colombia.',
  robots: { index: false, follow: false },
  metadataBase: new URL(SITE_URL || 'https://kce.travel'),
};

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

async function resolveLocale(): Promise<SupportedLocale> {
  const [h, c] = await Promise.all([headers(), cookies()]);
  const v = (h.get('x-kce-locale') || c.get('kce.locale')?.value || '').toLowerCase();
  return (['en', 'fr', 'de'].includes(v)) ? (v as SupportedLocale) : 'es';
}

function getCopy(locale: SupportedLocale) {
  const dict = {
    en: { title: 'Create your account', subtitle: 'Join KCE to save your favorite tours, manage your bookings, and get faster support.' },
    fr: { title: 'Créez votre compte', subtitle: 'Rejoignez KCE pour sauvegarder vos visites préférées et gérer vos réservations.' },
    de: { title: 'Konto erstellen', subtitle: 'Treten Sie KCE bei, um Ihre Lieblingstouren zu speichern und Buchungen zu verwalten.' },
    es: { title: 'Únete a KCE', subtitle: 'Crea tu cuenta para guardar tus tours favoritos, gestionar reservas y recibir soporte prioritario.' }
  };
  return dict[locale] || dict.es;
}

export default async function RegisterPage() {
  const locale = await resolveLocale();
  const copy = getCopy(locale);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4 md:p-8 lg:p-12 animate-fade-in">
      <div className="w-full max-w-6xl min-h-[700px] rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-soft overflow-hidden flex flex-col md:flex-row">
        
        {/* PANEL IZQUIERDO: Branding & Trust (Editorial Style) */}
        <div className="relative hidden md:flex md:w-5/12 flex-col justify-between p-12 lg:p-16 bg-[var(--color-surface-2)] border-r border-[var(--color-border)] overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow shadow-sm">
              <Sparkles className="h-3 w-3" /> Membresía KCE
            </div>
            
            <h2 className="font-heading text-4xl lg:text-5xl leading-[1.1] text-[var(--color-text)] tracking-tight">
              Empieza tu viaje <br/>
              <span className="text-brand-blue italic font-light">hoy mismo.</span>
            </h2>
            
            <p className="mt-6 text-base font-light text-[var(--color-text-muted)] leading-relaxed max-w-xs">
              Diseñamos experiencias culturales auténticas. Al unirte, tendrás acceso total a nuestro ecosistema de planificación guiada.
            </p>
          </div>

          <div className="relative z-10 space-y-8 py-10">
            <div className="flex items-start gap-4 group">
              <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-brand-yellow shadow-sm group-hover:scale-110 transition-transform">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-[var(--color-text)]">Wishlist Personalizada</h3>
                <p className="text-xs font-light text-[var(--color-text-muted)] mt-1">Guarda y organiza tus tours favoritos a tu propio ritmo.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-brand-blue shadow-sm group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-[var(--color-text)]">Conserjería Local</h3>
                <p className="text-xs font-light text-[var(--color-text-muted)] mt-1">Soporte humano constante para resolver tus dudas de viaje.</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-[var(--color-border)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-50 italic">
              Knowing Cultures Enterprise · 2026
            </p>
          </div>
        </div>

        {/* PANEL DERECHO: El Formulario (Clean Focus) */}
        <div className="w-full md:w-7/12 p-8 md:p-16 lg:p-20 flex flex-col justify-center bg-[var(--color-surface)] relative">
          <div className="mx-auto w-full max-w-sm relative z-10">
            <header className="mb-10">
              <h1 className="font-heading text-4xl tracking-tight text-[var(--color-text)] mb-3">
                {copy.title}
              </h1>
              <p className="text-sm font-light text-[var(--color-text-muted)] leading-relaxed">
                {copy.subtitle}
              </p>
            </header>

            {/* Inyectamos el Formulario */}
            <div className="register-form-container animate-slide-up">
              <RegisterForm locale={locale} />
            </div>

            <footer className="mt-12 pt-8 border-t border-[var(--color-border)] text-center sm:text-left">
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                ¿Ya tienes cuenta? <a href="/login" className="text-brand-blue hover:text-brand-terra font-semibold transition-colors underline decoration-brand-blue/30 underline-offset-4 italic">Inicia sesión aquí</a>.
              </p>
              <p className="mt-4 text-[10px] text-[var(--color-text-muted)] opacity-60">
                Al registrarte, aceptas nuestros <a href="/terms" className="underline">Términos</a> y <a href="/privacy" className="underline">Política de Privacidad</a>.
              </p>
            </footer>
          </div>
        </div>

      </div>
    </main>
  );
}