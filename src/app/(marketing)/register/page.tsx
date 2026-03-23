/* src/app/(marketing)/register/page.tsx */
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { ShieldCheck, Star, Clock, Sparkles, ArrowRight, UserPlus } from 'lucide-react';

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
    <main className="min-h-screen bg-base flex items-center justify-center p-4 md:p-8 lg:p-12 animate-fade-in relative overflow-hidden">
      
      {/* Destellos ambientales de marca */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-6xl min-h-[750px] rounded-[var(--radius-2xl)] border border-brand-dark/10 dark:border-white/10 bg-surface shadow-pop overflow-hidden flex flex-col md:flex-row relative z-10">
        
        {/* PANEL IZQUIERDO: Branding & Trust (Editorial Dark) */}
        <div className="relative hidden md:flex md:w-5/12 flex-col justify-between p-12 lg:p-16 bg-brand-dark text-white overflow-hidden border-r border-brand-dark/10">
          {/* Fondo sutil inmersivo */}
          <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent" />
          
          <div className="relative z-10">
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-brand-yellow" /> Membresía de Viajero
            </div>
            
            <h2 className="font-heading text-4xl lg:text-5xl leading-[1.05] tracking-tight">
              Empieza tu viaje <br/>
              <span className="text-brand-yellow italic font-light opacity-90">hoy mismo.</span>
            </h2>
            
            <p className="mt-8 text-base lg:text-lg font-light text-white/70 leading-relaxed max-w-xs">
              Diseñamos experiencias culturales auténticas. Al unirte, tendrás acceso total a nuestro ecosistema de planificación personalizada.
            </p>
          </div>

          <div className="relative z-10 space-y-10 py-12">
            <div className="flex items-start gap-6 group">
              <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-yellow/10 group-hover:border-brand-yellow/30">
                <Star className="h-6 w-6 text-brand-yellow" />
              </div>
              <div className="pt-1">
                <h3 className="font-heading text-xl text-white tracking-tight">Wishlist Personalizada</h3>
                <p className="text-sm font-light text-white/50 mt-1 leading-relaxed">Guarda y organiza tus tours favoritos para armar tu ruta ideal.</p>
              </div>
            </div>

            <div className="flex items-start gap-6 group">
              <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-blue/10 group-hover:border-brand-blue/30">
                <ShieldCheck className="h-6 w-6 text-brand-blue" />
              </div>
              <div className="pt-1">
                <h3 className="font-heading text-xl text-white tracking-tight">Conciergerie KCE</h3>
                <p className="text-sm font-light text-white/50 mt-1 leading-relaxed">Asistencia humana directa para resolver dudas antes y después de reservar.</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-10 border-t border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30 italic">
              Knowing Cultures Enterprise · Colombia 2026
            </p>
          </div>
        </div>

        {/* PANEL DERECHO: El Formulario (Foco y Limpieza) */}
        <div className="w-full md:w-7/12 p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-surface relative">
          
          {/* Elemento decorativo fantasma */}
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
            <UserPlus className="h-64 w-64 text-brand-blue -rotate-12" />
          </div>

          <div className="mx-auto w-full max-w-[420px] relative z-10">
            <header className="mb-12 text-center md:text-left">
              <h1 className="font-heading text-4xl md:text-5xl tracking-tight text-main mb-4 leading-tight">
                {copy.title}
              </h1>
              <p className="text-base font-light text-muted leading-relaxed">
                {copy.subtitle}
              </p>
            </header>

            {/* Componente del Formulario */}
            <div className="register-form-container">
              <RegisterForm locale={locale} />
            </div>

            <footer className="mt-12 pt-8 border-t border-brand-dark/5 dark:border-white/5 text-center md:text-left">
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted">
                  ¿Ya tienes una cuenta?{' '}
                  <Link 
                    href="/login" 
                    className="text-brand-blue hover:text-brand-dark font-bold uppercase tracking-widest text-[10px] transition-colors ml-1"
                  >
                    Inicia sesión aquí
                  </Link>
                </p>
                <p className="text-[10px] text-muted opacity-50 leading-relaxed max-w-xs mx-auto md:mx-0">
                  Al registrarte, confirmas que has leído y aceptas nuestros{' '}
                  <Link href="/terms" className="underline hover:text-brand-blue">Términos de Servicio</Link>{' '}
                  y nuestra{' '}
                  <Link href="/privacy" className="underline hover:text-brand-blue">Política de Privacidad</Link>.
                </p>
              </div>
            </footer>
          </div>
        </div>

      </div>
    </main>
  );
}