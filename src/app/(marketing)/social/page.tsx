/* src/app/(marketing)/social/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Share2,
  Globe,
  Play,
  BookOpen,
  ArrowRight,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Youtube,
  Instagram,
} from 'lucide-react';

import SocialLinks from '@/components/SocialLinks';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Redes y contenido — KCE',
  description: 'Canales oficiales de Knowing Cultures Enterprise: Historias y comunidad global.',
  robots: { index: false, follow: true },
};

export default function SocialPage() {
  return (
    <main className="min-h-screen animate-fade-in bg-base pb-24">
      {/* 01. HERO SOCIAL (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden border-b border-brand-dark/10 bg-brand-dark px-6 py-24 text-center md:py-32">
        {/* Glows de fondo */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-xl backdrop-blur-md">
            <Share2 className="h-3.5 w-3.5 text-brand-yellow" /> Canales Oficiales
          </div>

          <h1 className="mb-8 font-heading text-5xl leading-[1.05] tracking-tight text-white md:text-7xl lg:text-8xl">
            Redes & <br />
            <span className="font-light italic text-brand-yellow opacity-90">Contenido.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
            Sigue nuestra huella digital. Validamos cada historia y cada ruta a través de nuestras
            comunidades oficiales alrededor del mundo.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              className="h-auto rounded-full bg-brand-blue px-8 py-6 text-white shadow-pop transition-transform hover:-translate-y-1 hover:bg-brand-dark"
            >
              <Link
                href="/tours"
                className="text-xs font-bold uppercase tracking-widest"
              >
                Explorar Tours
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto rounded-full border-white/20 bg-white/5 px-8 py-6 text-white backdrop-blur-md transition-all hover:bg-white hover:text-brand-dark"
            >
              <Link
                href="/plan"
                className="text-xs font-bold uppercase tracking-widest"
              >
                Plan Personalizado
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 02. ÁREA DE CONTENIDO PRINCIPAL */}
      <section className="relative z-20 mx-auto -mt-16 max-w-[var(--container-max)] space-y-12 px-6 md:space-y-16">
        {/* TARJETA PRIMARIA: PRESENCIA GLOBAL */}
        <div className="group overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-soft dark:border-white/5">
          <div className="grid lg:grid-cols-[1fr_400px]">
            <div className="p-8 md:p-16 lg:p-20">
              <header className="mb-10 flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-blue/10 bg-brand-blue/5 text-brand-blue shadow-sm transition-transform duration-500 group-hover:scale-110">
                  <Globe className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="font-heading text-3xl tracking-tight text-main md:text-4xl">
                    Presencia Global
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
                    Comunidad KCE
                  </p>
                </div>
              </header>

              <p className="mb-12 max-w-2xl text-lg font-light leading-relaxed text-muted md:text-xl">
                Asegúrate de seguir nuestros perfiles oficiales. Si compartes un enlace de nuestra
                plataforma, el preview mostrará siempre nuestra identidad visual y sellos de
                seguridad.
              </p>

              <div className="animate-slide-up">
                <SocialLinks variant="solid" />
              </div>

              {/* Security/Tip Box */}
              <div className="mt-16 flex flex-col items-start gap-6 rounded-2xl border border-brand-yellow/20 bg-brand-yellow/[0.03] p-8 transition-all hover:bg-brand-yellow/[0.06] sm:flex-row">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-yellow text-brand-dark shadow-pop">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase italic tracking-widest text-brand-dark">
                    Tip de Compartido
                  </p>
                  <p className="text-sm font-light leading-relaxed text-muted">
                    Si el preview de un enlace no carga instantáneamente en WhatsApp o Instagram,
                    suele ser por la caché local. Prueba reenviar el link unos minutos después para
                    refrescar la meta-data oficial.
                  </p>
                </div>
              </div>
            </div>

            {/* SIDEBAR CTA (Trust Layer Premium) */}
            <div className="relative flex flex-col justify-center overflow-hidden bg-brand-dark p-12 text-white md:p-16">
              {/* Brillo decorativo */}
              <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-brand-blue/20 blur-[80px]" />

              <div className="relative z-10">
                <ShieldCheck className="mb-8 h-14 w-14 text-brand-yellow" />
                <h3 className="mb-6 font-heading text-3xl leading-tight tracking-tight">
                  Capa de <br />
                  <span className="font-light italic text-brand-yellow">Confianza.</span>
                </h3>
                <p className="mb-10 text-base font-light leading-relaxed text-white/60">
                  El contenido editorial en redes sirve para darte contexto e inspiración. Para una
                  recomendación técnica, nuestro equipo humano te espera en el portal.
                </p>
                <Button
                  asChild
                  className="group h-auto w-full rounded-full border border-transparent bg-brand-blue py-7 text-white shadow-pop transition-all hover:border-white/10 hover:bg-white hover:text-brand-dark"
                >
                  <Link
                    href="/contact"
                    className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest"
                  >
                    Hablar con Concierge{' '}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* EDITORIAL GRID (Blog & Vlog) */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* BLOG CARD */}
          <div className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-pop dark:border-white/5 md:p-14">
            <div className="absolute right-0 top-0 p-8 text-brand-blue opacity-[0.03] transition-transform duration-1000 group-hover:rotate-6 group-hover:scale-125">
              <BookOpen className="h-40 w-40" />
            </div>
            <div className="relative z-10">
              <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-blue/10 bg-brand-blue/5 text-brand-blue shadow-sm transition-all duration-500 group-hover:bg-brand-blue group-hover:text-white">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="mb-4 font-heading text-3xl tracking-tight text-main">
                Revista Editorial
              </h3>
              <p className="mb-10 max-w-xs text-base font-light leading-relaxed text-muted">
                Artículos profundos sobre cultura, gastronomía y consejos para viajar por Colombia
                con un propósito real.
              </p>
              <Button
                asChild
                variant="ghost"
                className="group/btn h-auto p-0 text-brand-blue hover:bg-transparent"
              >
                <Link
                  href="/blog"
                  className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest"
                >
                  Explorar Crónicas{' '}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
                </Link>
              </Button>
            </div>
          </div>

          {/* VLOG CARD */}
          <div className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-pop dark:border-white/5 md:p-14">
            <div className="absolute right-0 top-0 p-8 text-brand-terra opacity-[0.03] transition-transform duration-1000 group-hover:-rotate-6 group-hover:scale-125">
              <Play className="h-40 w-40" />
            </div>
            <div className="relative z-10">
              <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-terra/10 bg-brand-terra/5 text-brand-terra shadow-sm transition-all duration-500 group-hover:bg-brand-terra group-hover:text-white">
                <Play className="h-8 w-8" />
              </div>
              <h3 className="mb-4 font-heading text-3xl tracking-tight text-main">Vlog Visual</h3>
              <p className="mb-10 max-w-xs text-base font-light leading-relaxed text-muted">
                Historias grabadas en el terreno. La forma más inmersiva de sentir la energía de
                nuestras experiencias.
              </p>
              <Button
                asChild
                variant="ghost"
                className="group/btn h-auto p-0 text-brand-terra hover:bg-transparent"
              >
                <Link
                  href="/vlog"
                  className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest"
                >
                  Ver Expediciones{' '}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 03. FOOTER NAVEGACIÓN MINIMALISTA */}
        <footer className="mt-24 flex flex-wrap justify-center gap-10 border-t border-brand-dark/5 pb-8 pt-16 dark:border-white/5">
          {['Contacto', 'FAQ', 'Términos', 'Inicio'].map((item) => (
            <Link
              key={item}
              href={item === 'Inicio' ? '/' : `/${item.toLowerCase()}`}
              className="group relative text-[10px] font-bold uppercase tracking-[0.3em] text-muted transition-colors hover:text-brand-blue"
            >
              {item}
              <span className="absolute -bottom-2 left-0 h-px w-0 bg-brand-blue transition-all group-hover:w-full" />
            </Link>
          ))}
        </footer>
      </section>

      {/* Floating Support (Diseño KCE Boutique) */}
      <div className="fixed bottom-8 right-8 z-50 md:bottom-12 md:right-12">
        <Button
          asChild
          size="icon"
          className="h-16 w-16 rounded-[2rem] border-4 border-white bg-green-600 shadow-pop transition-all hover:-rotate-6 hover:scale-110 hover:bg-green-700 dark:border-brand-dark md:h-20 md:w-20"
        >
          <Link
            href="/contact"
            aria-label="Contact concierge"
          >
            <MessageCircle className="h-7 w-7 fill-current text-white md:h-9 md:w-9" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
