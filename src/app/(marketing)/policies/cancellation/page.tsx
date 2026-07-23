/* src/app/(marketing)/policies/cancellation/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Clock,
  CalendarX,
  CloudLightning,
  Info,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  BadgeCheck,
  Headphones,
  Ban,
  RefreshCcw,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Política de Cancelación y Reembolsos | Knowing Cultures S.A.S.',
  description:
    'Reglas claras sobre cancelaciones, reembolsos (100% / 50%) y cambios de fecha para tus experiencias en Colombia.',
};

export default function CancellationPolicyPage() {
  return (
    <main
      className="flex min-h-screen animate-fade-in flex-col bg-base"
      id="top"
    >
      {/* 01. HERO POLÍTICAS (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden border-b border-white/5 bg-brand-dark px-6 py-24 text-center md:py-32">
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-yellow" /> Garantía de Transparencia
          </div>

          <h1 className="mb-8 font-heading text-5xl leading-[1.05] tracking-tight text-white md:text-7xl lg:text-8xl">
            Cancelación <br className="hidden sm:block" />
            <span className="font-light italic text-brand-yellow opacity-90">y reembolsos.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
            Reglas claras para una relación de confianza. En{' '}
            <span className="font-medium text-white">Knowing Cultures S.A.S.</span> protegemos tu
            inversión y aseguramos la viabilidad de nuestros anfitriones locales.
          </p>
        </div>
      </section>

      {/* BREADCRUMB SUTIL */}
      <div className="w-full border-b border-brand-dark/5 bg-surface px-6 py-4 dark:border-white/5">
        <div className="mx-auto flex max-w-[var(--container-max)] items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-80">
          <Link
            href="/"
            className="transition-colors hover:text-brand-blue"
          >
            Inicio
          </Link>
          <ArrowRight className="h-3 w-3 opacity-30" />
          <span className="text-main">Políticas de Cancelación</span>
        </div>
      </div>

      {/* 02. MATRIZ DE REEMBOLSOS (REGLAS DEL CONTRATO) */}
      <section className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-16 px-6 py-20 md:gap-24 md:py-32">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Clock,
              title: 'Más de 48h',
              badge: 'Reembolso 100%',
              copy: 'Cancelaciones con más de 48 horas de antelación permiten la devolución total de tu dinero o crédito para futuros viajes.',
              color: 'text-green-600',
              bg: 'bg-green-500/5',
              border: 'border-green-500/20',
            },
            {
              icon: Ban,
              title: '48h a 3h',
              badge: 'Reembolso 50%',
              copy: 'Dentro de este rango, se retiene el 50% para cubrir compromisos logísticos, honorarios de guías y bloqueos de transporte ya realizados.',
              color: 'text-brand-terra',
              bg: 'bg-brand-terra/5',
              border: 'border-brand-terra/20',
            },
            {
              icon: CalendarX,
              title: 'Menos de 3h',
              badge: 'Sin Reembolso',
              copy: 'Debido a la inmediatez y la imposibilidad de reasignar el cupo o el personal, las cancelaciones tardías o "No Show" no son reembolsables.',
              color: 'text-red-600',
              bg: 'bg-red-500/5',
              border: 'border-red-500/20',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`group rounded-[var(--radius-3xl)] border ${item.border} ${item.bg} p-10 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-xl`}
            >
              <div
                className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ${item.color} transition-transform duration-500 group-hover:rotate-3 group-hover:scale-110`}
              >
                <item.icon className="h-7 w-7" />
              </div>
              <div
                className={`mb-4 inline-block rounded-full border px-3 py-1 ${item.border} text-[9px] font-bold uppercase tracking-widest ${item.color} bg-white`}
              >
                {item.badge}
              </div>
              <h3 className="mb-4 font-heading text-3xl tracking-tight text-main">{item.title}</h3>
              <p className="text-sm font-light leading-relaxed text-muted">{item.copy}</p>
            </div>
          ))}
        </div>

        {/* REGLA DE FUERZA MAYOR (Elegante Wide Card) */}
        <div className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-blue/10 bg-brand-blue/[0.02] p-10 md:p-16">
          <div className="pointer-events-none absolute right-0 top-0 p-10 text-brand-blue opacity-[0.03] transition-transform duration-1000 group-hover:scale-110">
            <CloudLightning className="h-48 w-48" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-10 md:flex-row">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-brand-blue text-white shadow-pop">
              <RefreshCcw className="h-10 w-10" />
            </div>
            <div className="space-y-4">
              <h2 className="font-heading text-3xl tracking-tight text-main">
                Garantía por Fuerza Mayor
              </h2>
              <p className="max-w-3xl text-base font-light leading-relaxed text-muted">
                Si <strong className="font-bold text-main">Knowing Cultures S.A.S.</strong> debe
                cancelar una experiencia por condiciones climáticas extremas, cierre de vías o
                alteraciones del orden público, siempre te ofreceremos una{' '}
                <strong className="text-brand-blue">reprogramación inmediata</strong> o el reembolso
                del 100% de tu pago si no puedes ajustar tus fechas. Tu seguridad es innegociable.
              </p>
            </div>
          </div>
        </div>

        {/* DETALLES DE OPERACIÓN (Grid 2 Col) */}
        <div className="grid gap-12 border-t border-brand-dark/5 pt-12 md:grid-cols-2">
          <div className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft md:p-14">
            <div className="mb-8 flex items-center gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-blue/10 bg-brand-blue/5 text-brand-blue">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h2 className="font-heading text-3xl tracking-tight text-main">Gestión de Cambios</h2>
            </div>
            <div className="space-y-6 text-base font-light leading-relaxed text-muted">
              <p>
                La vía más efectiva para solicitar un cambio es a través de nuestro{' '}
                <strong>WhatsApp de Conciergerie</strong> o el panel de &quot;Mis Reservas&quot;.
              </p>
              <p>
                Intentamos gestionar cambios de fecha sin cargos adicionales siempre que la
                disponibilidad operativa lo permita. Recuerda que en temporadas altas (Diciembre,
                Semana Santa), los operadores locales pueden aplicar ajustes de tarifa.
              </p>
            </div>
          </div>

          <div className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface-2 p-10 shadow-inner transition-all hover:bg-surface md:p-14">
            <div className="mb-8 flex items-center gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-dark/10 bg-surface text-muted transition-colors group-hover:text-brand-blue">
                <BadgeCheck className="h-7 w-7" />
              </div>
              <h2 className="font-heading text-3xl tracking-tight text-main">
                Servicios con Fecha
              </h2>
            </div>
            <div className="space-y-6 text-base font-light leading-relaxed text-muted">
              <p>
                Nuestras experiencias son{' '}
                <strong className="font-bold text-main">servicios de ocio programados</strong> para
                fechas específicas.
              </p>
              <p>
                Debido a la reserva anticipada de personal y permisos legales en territorio
                colombiano, el derecho de retracto comercial ordinario no aplica una vez que el
                servicio ha entrado en el periodo de 48 horas previas al inicio.
              </p>
              <div className="border-t border-brand-dark/5 pt-4">
                <Link
                  href="/terms"
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-blue transition-colors hover:text-brand-dark"
                >
                  Leer Términos de Servicio <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 03. CTA FINAL SOPORTE (Premium Glassmorphism) */}
      <section className="mt-auto border-t border-brand-dark/5 bg-surface-2 py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="group relative overflow-hidden rounded-[var(--radius-[40px])] border border-brand-dark/5 bg-surface p-12 text-center shadow-pop md:p-24">
            {/* Brillo dinámico */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/5 blur-[100px] transition-transform duration-1000 group-hover:scale-150" />

            <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
              <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-[2rem] border border-brand-dark/5 bg-surface-2 text-brand-blue shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white">
                <Headphones className="h-10 w-10" />
              </div>
              <h2 className="mb-8 font-heading text-4xl tracking-tight text-main md:text-6xl">
                ¿Necesitas una excepción?
              </h2>
              <p className="mb-14 text-xl font-light leading-relaxed text-muted">
                Entendemos que los imprevistos suceden. Si tu caso es excepcional, nuestro equipo
                humano está listo para escucharte y buscar la mejor solución para tu viaje.
              </p>
              <div className="flex w-full flex-col justify-center gap-6 sm:w-auto sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full border-transparent bg-brand-blue px-14 py-8 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-pop transition-all hover:-translate-y-1 hover:bg-brand-dark"
                >
                  <Link
                    href="/contact"
                    className="flex items-center justify-center gap-3"
                  >
                    Hablar con Concierge <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-brand-dark/10 bg-surface px-14 py-8 text-xs font-bold uppercase tracking-[0.2em] text-main transition-all hover:-translate-y-1 hover:bg-surface-2"
                >
                  <Link href="/trust">Centro de Confianza</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marca de agua institucional sutil */}
      <div className="bg-surface-2 py-12 text-center opacity-30">
        <p className="text-[9px] font-bold uppercase tracking-[0.4em]">
          Knowing Cultures S.A.S. • 2026
        </p>
      </div>
    </main>
  );
}
