/* src/app/(marketing)/policies/cancellation/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Clock, CalendarX, CloudLightning, Info, 
  MessageSquare, ShieldCheck, ArrowRight, HelpCircle,
  BadgeCheck, Headphones, Ban, RefreshCcw
} from 'lucide-react';

import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Política de Cancelación y Reembolsos | Knowing Cultures S.A.S.',
  description: 'Reglas claras sobre cancelaciones, reembolsos (100% / 50%) y cambios de fecha para tus experiencias en Colombia.',
};

export default function CancellationPolicyPage() {
  return (
    <main className="min-h-screen bg-base flex flex-col animate-fade-in" id="top">
      
      {/* 01. HERO POLÍTICAS (ADN KCE PREMIUM) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center border-b border-white/5">
        <div className="absolute top-0 left-1/2 w-full max-w-4xl h-80 bg-brand-blue/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-5xl flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-sm backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-yellow" /> Garantía de Transparencia
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white tracking-tight leading-[1.05] mb-8">
            Cancelación <br className="hidden sm:block" />
            <span className="text-brand-yellow font-light italic opacity-90">y reembolsos.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg md:text-xl font-light leading-relaxed text-white/70">
            Reglas claras para una relación de confianza. En <span className="text-white font-medium">Knowing Cultures S.A.S.</span> protegemos tu inversión y aseguramos la viabilidad de nuestros anfitriones locales.
          </p>
        </div>
      </section>

      {/* BREADCRUMB SUTIL */}
      <div className="w-full bg-surface border-b border-brand-dark/5 dark:border-white/5 py-4 px-6">
        <div className="mx-auto max-w-[var(--container-max)] flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-80">
          <Link href="/" className="hover:text-brand-blue transition-colors">Inicio</Link>
          <ArrowRight className="h-3 w-3 opacity-30" />
          <span className="text-main">Políticas de Cancelación</span>
        </div>
      </div>

      {/* 02. MATRIZ DE REEMBOLSOS (REGLAS DEL CONTRATO) */}
      <section className="mx-auto w-full max-w-[var(--container-max)] px-6 py-20 md:py-32 flex flex-col gap-16 md:gap-24">
        
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { 
              icon: Clock, 
              title: 'Más de 48h', 
              badge: 'Reembolso 100%',
              copy: 'Cancelaciones con más de 48 horas de antelación permiten la devolución total de tu dinero o crédito para futuros viajes.',
              color: 'text-green-600',
              bg: 'bg-green-500/5',
              border: 'border-green-500/20'
            },
            { 
              icon: Ban, 
              title: '48h a 3h', 
              badge: 'Reembolso 50%',
              copy: 'Dentro de este rango, se retiene el 50% para cubrir compromisos logísticos, honorarios de guías y bloqueos de transporte ya realizados.',
              color: 'text-brand-terra',
              bg: 'bg-brand-terra/5',
              border: 'border-brand-terra/20'
            },
            { 
              icon: CalendarX, 
              title: 'Menos de 3h', 
              badge: 'Sin Reembolso',
              copy: 'Debido a la inmediatez y la imposibilidad de reasignar el cupo o el personal, las cancelaciones tardías o "No Show" no son reembolsables.',
              color: 'text-red-600',
              bg: 'bg-red-500/5',
              border: 'border-red-500/20'
            }
          ].map((item, idx) => (
            <div key={idx} className={`group rounded-[var(--radius-3xl)] border ${item.border} ${item.bg} p-10 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-xl`}>
              <div className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ${item.color} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                <item.icon className="h-7 w-7" />
              </div>
              <div className={`inline-block mb-4 px-3 py-1 rounded-full border ${item.border} text-[9px] font-bold uppercase tracking-widest ${item.color} bg-white`}>
                {item.badge}
              </div>
              <h3 className="font-heading text-3xl text-main tracking-tight mb-4">{item.title}</h3>
              <p className="text-sm font-light leading-relaxed text-muted">{item.copy}</p>
            </div>
          ))}
        </div>

        {/* REGLA DE FUERZA MAYOR (Elegante Wide Card) */}
        <div className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-blue/10 bg-brand-blue/[0.02] p-10 md:p-16 group">
           <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-brand-blue pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <CloudLightning className="h-48 w-48" />
           </div>
           
           <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
              <div className="h-20 w-20 shrink-0 flex items-center justify-center rounded-3xl bg-brand-blue text-white shadow-pop">
                 <RefreshCcw className="h-10 w-10" />
              </div>
              <div className="space-y-4">
                 <h2 className="font-heading text-3xl text-main tracking-tight">Garantía por Fuerza Mayor</h2>
                 <p className="text-base font-light text-muted leading-relaxed max-w-3xl">
                    Si <strong className="text-main font-bold">Knowing Cultures S.A.S.</strong> debe cancelar una experiencia por condiciones climáticas extremas, cierre de vías o alteraciones del orden público, siempre te ofreceremos una <strong className="text-brand-blue">reprogramación inmediata</strong> o el reembolso del 100% de tu pago si no puedes ajustar tus fechas. Tu seguridad es innegociable.
                 </p>
              </div>
           </div>
        </div>

        {/* DETALLES DE OPERACIÓN (Grid 2 Col) */}
        <div className="grid gap-12 md:grid-cols-2 pt-12 border-t border-brand-dark/5">
          
          <div className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 md:p-14 shadow-soft">
            <div className="mb-8 flex items-center gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/5 border border-brand-blue/10 text-brand-blue">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h2 className="font-heading text-3xl text-main tracking-tight">Gestión de Cambios</h2>
            </div>
            <div className="space-y-6 text-base font-light leading-relaxed text-muted">
              <p>
                La vía más efectiva para solicitar un cambio es a través de nuestro <strong>WhatsApp de Conciergerie</strong> o el panel de "Mis Reservas".
              </p>
              <p>
                Intentamos gestionar cambios de fecha sin cargos adicionales siempre que la disponibilidad operativa lo permita. Recuerda que en temporadas altas (Diciembre, Semana Santa), los operadores locales pueden aplicar ajustes de tarifa.
              </p>
            </div>
          </div>

          <div className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface-2 p-10 md:p-14 shadow-inner transition-all hover:bg-surface">
            <div className="mb-8 flex items-center gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface border border-brand-dark/10 text-muted transition-colors group-hover:text-brand-blue">
                <BadgeCheck className="h-7 w-7" />
              </div>
              <h2 className="font-heading text-3xl text-main tracking-tight">Servicios con Fecha</h2>
            </div>
            <div className="space-y-6 text-base font-light leading-relaxed text-muted">
              <p>
                Nuestras experiencias son <strong className="text-main font-bold">servicios de ocio programados</strong> para fechas específicas. 
              </p>
              <p>
                Debido a la reserva anticipada de personal y permisos legales en territorio colombiano, el derecho de retracto comercial ordinario no aplica una vez que el servicio ha entrado en el periodo de 48 horas previas al inicio.
              </p>
              <div className="pt-4 border-t border-brand-dark/5">
                 <Link href="/terms" className="text-xs font-bold uppercase tracking-widest text-brand-blue hover:text-brand-dark transition-colors flex items-center gap-2">
                   Leer Términos de Servicio <ArrowRight className="h-3 w-3" />
                 </Link>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* 03. CTA FINAL SOPORTE (Premium Glassmorphism) */}
      <section className="bg-surface-2 border-t border-brand-dark/5 py-24 md:py-32 mt-auto">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-[var(--radius-[40px])] border border-brand-dark/5 bg-surface p-12 md:p-24 text-center shadow-pop group">
            {/* Brillo dinámico */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none transition-transform duration-1000 group-hover:scale-150" />
            
            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-surface-2 border border-brand-dark/5 text-brand-blue mb-10 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white">
                <Headphones className="h-10 w-10" />
              </div>
              <h2 className="font-heading text-4xl md:text-6xl text-main tracking-tight mb-8">¿Necesitas una excepción?</h2>
              <p className="text-xl font-light text-muted leading-relaxed mb-14">
                Entendemos que los imprevistos suceden. Si tu caso es excepcional, nuestro equipo humano está listo para escucharte y buscar la mejor solución para tu viaje.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6 w-full sm:w-auto">
                <Button asChild size="lg" className="rounded-full bg-brand-blue text-white hover:bg-brand-dark px-14 py-8 text-xs font-bold uppercase tracking-[0.2em] shadow-pop transition-all hover:-translate-y-1 border-transparent">
                  <Link href="/contact" className="flex items-center justify-center gap-3">Hablar con Concierge <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-brand-dark/10 text-main bg-surface hover:bg-surface-2 px-14 py-8 text-xs font-bold uppercase tracking-[0.2em] transition-all hover:-translate-y-1">
                  <Link href="/trust">Centro de Confianza</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marca de agua institucional sutil */}
      <div className="py-12 text-center bg-surface-2 opacity-30">
         <p className="text-[9px] font-bold uppercase tracking-[0.4em]">Knowing Cultures S.A.S. • 2026</p>
      </div>

    </main>
  );
}