/* src/app/(marketing)/register/page.tsx */
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { ShieldCheck, Star, Clock, Sparkles, ArrowRight, UserPlus } from 'lucide-react';

import RegisterForm from '@/features/auth/RegisterForm';
import { SITE_URL } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Únete a KCE | Crear cuenta',
  description:
    'Crea tu cuenta en Knowing Cultures Enterprise y empieza a diseñar tu ruta ideal por Colombia.',
  robots: { index: false, follow: false },
  metadataBase: new URL(SITE_URL || 'https://kce.travel'),
};

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

async function resolveLocale(): Promise<SupportedLocale> {
  const [h, c] = await Promise.all([headers(), cookies()]);
  const v = (h.get('x-kce-locale') || c.get('kce.locale')?.value || '').toLowerCase();
  return ['en', 'fr', 'de'].includes(v) ? (v as SupportedLocale) : 'es';
}

function getCopy(locale: SupportedLocale) {
  const dict = {
    en: {
      title: 'Create your account',
      subtitle:
        'Join KCE to save your favorite tours, manage your bookings, and get faster support.',
    },
    fr: {
      title: 'Créez votre compte',
      subtitle: 'Rejoignez KCE pour sauvegarder vos visites préférées et gérer vos réservations.',
    },
    de: {
      title: 'Konto erstellen',
      subtitle:
        'Treten Sie KCE bei, um Ihre Lieblingstouren zu speichern und Buchungen zu verwalten.',
    },
    es: {
      title: 'Únete a KCE',
      subtitle:
        'Crea tu cuenta para guardar tus tours favoritos, gestionar reservas y recibir soporte prioritario.',
    },
  };
  return dict[locale] || dict.es;
}

export default async function RegisterPage() {
  const locale = await resolveLocale();
  const copy = getCopy(locale);

  return (
    <main className="relative flex min-h-screen animate-fade-in items-center justify-center overflow-hidden bg-base p-4 md:p-8 lg:p-12">
      {/* Destellos ambientales de marca */}
      <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-brand-yellow/5 blur-[120px]" />

      <div className="relative z-10 flex min-h-[750px] w-full max-w-6xl flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-surface shadow-pop dark:border-white/10 md:flex-row">
        {/* PANEL IZQUIERDO: Branding & Trust (Editorial Dark) */}
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-brand-dark/10 bg-brand-dark p-12 text-white md:flex md:w-5/12 lg:p-16">
          {/* Fondo sutil inmersivo */}
          <div className="absolute inset-0 scale-110 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent" />

          <div className="relative z-10">
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-brand-yellow" /> Membresía de Viajero
            </div>

            <h2 className="font-heading text-4xl leading-[1.05] tracking-tight lg:text-5xl">
              Empieza tu viaje <br />
              <span className="font-light italic text-brand-yellow opacity-90">hoy mismo.</span>
            </h2>

            <p className="mt-8 max-w-xs text-base font-light leading-relaxed text-white/70 lg:text-lg">
              Diseñamos experiencias culturales auténticas. Al unirte, tendrás acceso total a
              nuestro ecosistema de planificación personalizada.
            </p>
          </div>

          <div className="relative z-10 space-y-10 py-12">
            <div className="group flex items-start gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 group-hover:scale-110 group-hover:border-brand-yellow/30 group-hover:bg-brand-yellow/10">
                <Star className="h-6 w-6 text-brand-yellow" />
              </div>
              <div className="pt-1">
                <h3 className="font-heading text-xl tracking-tight text-white">
                  Wishlist Personalizada
                </h3>
                <p className="mt-1 text-sm font-light leading-relaxed text-white/50">
                  Guarda y organiza tus tours favoritos para armar tu ruta ideal.
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 group-hover:scale-110 group-hover:border-brand-blue/30 group-hover:bg-brand-blue/10">
                <ShieldCheck className="h-6 w-6 text-brand-blue" />
              </div>
              <div className="pt-1">
                <h3 className="font-heading text-xl tracking-tight text-white">Conciergerie KCE</h3>
                <p className="mt-1 text-sm font-light leading-relaxed text-white/50">
                  Asistencia humana directa para resolver dudas antes y después de reservar.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 border-t border-white/10 pt-10">
            <p className="text-[10px] font-bold uppercase italic tracking-[0.4em] text-white/30">
              Knowing Cultures Enterprise · Colombia 2026
            </p>
          </div>
        </div>

        {/* PANEL DERECHO: El Formulario (Foco y Limpieza) */}
        <div className="relative flex w-full flex-col justify-center bg-surface p-8 md:w-7/12 md:p-16 lg:p-24">
          {/* Elemento decorativo fantasma */}
          <div className="pointer-events-none absolute right-0 top-0 p-12 opacity-[0.03]">
            <UserPlus className="h-64 w-64 -rotate-12 text-brand-blue" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[420px]">
            <header className="mb-12 text-center md:text-left">
              <h1 className="mb-4 font-heading text-4xl leading-tight tracking-tight text-main md:text-5xl">
                {copy.title}
              </h1>
              <p className="text-base font-light leading-relaxed text-muted">{copy.subtitle}</p>
            </header>

            {/* Componente del Formulario */}
            <div className="register-form-container">
              <RegisterForm locale={locale} />
            </div>

            <footer className="mt-12 border-t border-brand-dark/5 pt-8 text-center dark:border-white/5 md:text-left">
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted">
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    href="/login"
                    className="ml-1 text-[10px] font-bold uppercase tracking-widest text-brand-blue transition-colors hover:text-brand-dark"
                  >
                    Inicia sesión aquí
                  </Link>
                </p>
                <p className="mx-auto max-w-xs text-[10px] leading-relaxed text-muted opacity-50 md:mx-0">
                  Al registrarte, confirmas que has leído y aceptas nuestros{' '}
                  <Link
                    href="/terms"
                    className="underline hover:text-brand-blue"
                  >
                    Términos de Servicio
                  </Link>{' '}
                  y nuestra{' '}
                  <Link
                    href="/privacy"
                    className="underline hover:text-brand-blue"
                  >
                    Política de Privacidad
                  </Link>
                  .
                </p>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
