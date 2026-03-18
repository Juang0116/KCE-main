import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { ShieldCheck, Star, Clock, Sparkles } from 'lucide-react';

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
  const h = await headers();
  const c = await cookies();
  const v = (h.get('x-kce-locale') || c.get('kce.locale')?.value || '').toLowerCase();
  return v === 'en' || v === 'fr' || v === 'de' ? v : 'es';
}

function getCopy(locale: SupportedLocale) {
  switch (locale) {
    case 'en': return { title: 'Create your account', subtitle: 'Join KCE to save your favorite tours, manage your bookings, and get faster support.' };
    case 'fr': return { title: 'Créez votre compte', subtitle: 'Rejoignez KCE pour sauvegarder vos visites préférées, gérer vos réservations et obtenir une assistance plus rapide.' };
    case 'de': return { title: 'Konto erstellen', subtitle: 'Treten Sie KCE bei, um Ihre Lieblingstouren zu speichern, Buchungen zu verwalten und schnelleren Support zu erhalten.' };
    default: return { title: 'Únete a KCE', subtitle: 'Crea tu cuenta para guardar tus tours favoritos, gestionar reservas y recibir soporte prioritario.' };
  }
}

export default async function RegisterPage() {
  const locale = await resolveLocale();
  const copy = getCopy(locale);

  return (
    <main className="min-h-[90vh] bg-[var(--color-bg)] flex items-center justify-center p-4 md:p-10 pb-24">
      <div className="w-full max-w-5xl rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-500 hover:shadow-brand-blue/5">
        
        {/* Panel Izquierdo: Promesa de Valor */}
        <div className="relative hidden md:flex md:w-5/12 flex-col justify-between p-12 bg-brand-dark text-white overflow-hidden">
          {/* Fondo con textura cultural sutil */}
          <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-soft-light"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-dark via-brand-dark/90 to-brand-blue/40"></div>
          
          <div className="relative z-10">
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md shadow-sm">
              <Sparkles className="h-3 w-3" /> Membresía KCE
            </div>
            <h2 className="font-heading text-4xl lg:text-5xl leading-[1.1] drop-shadow-lg">
              Empieza tu viaje <br/>
              <span className="text-brand-yellow font-light italic">hoy mismo.</span>
            </h2>
            <p className="mt-6 text-base font-light text-white/70 leading-relaxed max-w-xs">
              Diseñamos experiencias culturales auténticas. Al unirte, tendrás acceso total a nuestro ecosistema de planificación guiada.
            </p>
          </div>

          <div className="relative z-10 mt-12 space-y-8">
            <div className="flex items-start gap-4 group">
              <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-colors group-hover:bg-brand-yellow/20">
                <Star className="h-5 w-5 text-brand-yellow" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-white">Wishlist Personalizada</h3>
                <p className="text-xs font-light text-white/50 mt-1">Guarda y organiza tus tours favoritos a tu propio ritmo.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-colors group-hover:bg-brand-yellow/20">
                <ShieldCheck className="h-5 w-5 text-brand-yellow" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-white">Conserjería Local</h3>
                <p className="text-xs font-light text-white/50 mt-1">Soporte humano constante para resolver tus dudas de viaje.</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-10 border-t border-white/10 mt-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 italic">
              Knowing Cultures Enterprise · 2026
            </p>
          </div>
        </div>

        {/* Panel Derecho: Formulario */}
        <div className="w-full md:w-7/12 p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-[var(--color-surface)] relative">
          <div className="mx-auto w-full max-w-sm relative z-10">
            <header className="mb-10 text-center md:text-left">
              <h1 className="font-heading text-4xl tracking-tight text-brand-blue mb-4">
                {copy.title}
              </h1>
              <p className="text-sm font-light text-[var(--color-text)]/60 leading-relaxed">
                {copy.subtitle}
              </p>
            </header>

            <section className="register-form-wrapper">
              <RegisterForm locale={locale} />
            </section>

            <footer className="mt-12 pt-8 border-t border-[var(--color-border)] text-center md:text-left">
              <p className="text-xs text-[var(--color-text)]/40 leading-relaxed">
                ¿Ya tienes cuenta? <a href="/login" className="text-brand-blue hover:underline font-medium">Inicia sesión aquí</a>. <br/>
                Al registrarte, aceptas nuestros términos de servicio y políticas de privacidad.
              </p>
            </footer>
          </div>
        </div>

      </div>
    </main>
  );
}