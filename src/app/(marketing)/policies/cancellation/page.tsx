import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Clock, CalendarX, CloudLightning, Info, 
  MessageSquare, ShieldCheck, ArrowRight, HelpCircle 
} from 'lucide-react';

import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Cancelación y cambios — KCE',
  description: 'Reglas claras sobre cancelaciones, reembolsos y cambios de fecha para tus experiencias en Colombia.',
};

export default function CancellationPolicyPage() {
  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] flex flex-col animate-fade-in" id="top">
      
      {/* 01. HERO POLÍTICAS (Editorial Parity - Limpio y Formal) */}
      <section className="relative w-full flex flex-col justify-center overflow-hidden bg-[color:var(--color-surface)] border-b border-[color:var(--color-border)] px-6 py-20 md:py-32 text-center">
        {/* Destello sutil de seguridad */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-brand-yellow/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm backdrop-blur-md">
            <ShieldCheck className="h-3 w-3" /> Compromiso KCE
          </div>
          
          <h1 className="font-heading text-4xl sm:text-5xl leading-tight md:text-6xl lg:text-7xl text-[color:var(--color-text)] drop-shadow-sm tracking-tight mb-6">
            Cancelación <br className="hidden sm:block" />
            <span className="text-brand-blue italic font-light">y cambios.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-[color:var(--color-text-muted)] md:text-xl">
            Reglas claras y directas. Queremos que reserves con la tranquilidad de saber exactamente cómo protegemos tu inversión.
          </p>
        </div>
      </section>

      {/* 02. CONTENEDOR DE REGLAS PRINCIPALES */}
      <section className="mx-auto w-full max-w-[var(--container-max)] px-6 py-20 flex flex-col gap-16 flex-1 relative z-20">
        
        {/* Reglas de Tiempo (Grid 3 Col - Glass Cards) */}
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { 
              icon: Clock, 
              title: '48+ horas', 
              copy: 'Cambios o cancelaciones con anticipación permiten gestionar reembolsos parciales o créditos para futuros viajes.',
              color: 'text-[color:var(--color-success)]',
              bg: 'bg-[color:var(--color-success)]/10',
              border: 'group-hover:border-[color:var(--color-success)]/30'
            },
            { 
              icon: CalendarX, 
              title: 'Menos de 48h', 
              copy: 'Generalmente no reembolsable debido a la logística y compromiso con guías locales, pero evaluamos casos excepcionales.',
              color: 'text-brand-terra',
              bg: 'bg-brand-terra/10',
              border: 'group-hover:border-brand-terra/30'
            },
            { 
              icon: CloudLightning, 
              title: 'Fuerza Mayor', 
              copy: 'Si la seguridad climática se ve comprometida, reprogramamos sin costo o buscamos una alternativa equivalente de inmediato.',
              color: 'text-brand-blue',
              bg: 'bg-brand-blue/10',
              border: 'group-hover:border-brand-blue/30'
            }
          ].map((item, idx) => (
            <div key={idx} className={`rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-soft transition-all duration-300 hover:shadow-md group ${item.border}`}>
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg} ${item.color} transition-transform duration-300 group-hover:scale-110`}>
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-2xl text-[color:var(--color-text)] mb-3">{item.title}</h3>
              <p className="text-sm font-light leading-relaxed text-[color:var(--color-text-muted)]">{item.copy}</p>
            </div>
          ))}
        </div>

        {/* Recomendación Destacada (Info Strip) */}
        <div className="rounded-[var(--radius-2xl)] border border-brand-yellow/30 bg-brand-yellow/5 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface)] border border-brand-yellow/20 text-brand-yellow shadow-sm">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-heading text-xl text-[color:var(--color-text)] mb-2">Consejo KCE antes de reservar</h2>
            <p className="text-sm font-light leading-relaxed text-[color:var(--color-text-muted)]">
              Revisa siempre la sección de <strong className="text-[color:var(--color-text)] font-medium">"Qué incluye / Qué no incluye"</strong> y los detalles logísticos del tour. Si tienes dudas sobre el ritmo o la dificultad física de la experiencia, escríbenos antes de procesar tu pago.
            </p>
          </div>
        </div>

        {/* Detalles de Operación (Grid 2 Col) */}
        <div className="grid gap-8 md:grid-cols-2 pt-8 border-t border-[color:var(--color-border)]">
          
          <div className="rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-10 shadow-soft">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/5 text-brand-blue">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl text-[color:var(--color-text)]">Cómo solicitar cambios</h2>
            </div>
            <div className="space-y-4 text-sm font-light leading-relaxed text-[color:var(--color-text-muted)]">
              <p>
                La vía más rápida es escribirnos por WhatsApp o email indicando tu <strong className="text-[color:var(--color-text)] font-medium">Booking ID</strong> y la nueva fecha deseada.
              </p>
              <p>
                Siempre que la disponibilidad operativa lo permita, intentamos reprogramar tus experiencias sin fricción ni cargos adicionales.
              </p>
              <div className="mt-6 rounded-xl bg-[color:var(--color-surface-2)]/50 p-4 border border-[color:var(--color-border)]">
                <p className="text-xs italic opacity-80">
                  * En temporadas de alta demanda (puentes o festivos), algunos cambios pueden estar sujetos a ajustes de tarifa por parte de los proveedores locales.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/30 p-8 md:p-10 shadow-inner group transition-colors hover:bg-[color:var(--color-surface)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-surface)] border border-[color:var(--color-border)] text-[color:var(--color-text-muted)] shadow-sm group-hover:text-brand-blue transition-colors">
                <HelpCircle className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl text-[color:var(--color-text)]">Nota sobre servicios con fecha</h2>
            </div>
            <div className="space-y-4 text-sm font-light leading-relaxed text-[color:var(--color-text-muted)]">
              <p>
                Los tours son <strong className="text-[color:var(--color-text)] font-medium">servicios de ocio programados para una fecha y hora específica</strong>.
              </p>
              <p>
                Debido a la naturaleza de la reserva de guías, transporte y permisos, el derecho de desistimiento o retracto estándar de compras por internet suele no aplicar a este tipo de contratos.
              </p>
              <p>
                Por esta razón, la claridad previa es nuestra mejor herramienta. No dudes en consultarnos cualquier detalle logístico antes de comprar.
              </p>
            </div>
          </div>

        </div>

      </section>

      {/* 03. CTA FINAL SOPORTE (Glassmorphism Premium) */}
      <section className="bg-[color:var(--color-surface-2)]/30 border-t border-[color:var(--color-border)] py-20 mt-auto">
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-12 md:p-16 shadow-soft text-center group">
            {/* Glow Dinámico */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-blue/5 rounded-full blur-[80px] pointer-events-none transition-transform duration-1000 group-hover:scale-150"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-brand-blue mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-[color:var(--color-text)] tracking-tight mb-4">¿Aún tienes dudas sobre una reserva?</h2>
              <p className="text-lg font-light text-[color:var(--color-text-muted)] leading-relaxed mb-10">
                Nuestro equipo humano está disponible para explicarte las condiciones específicas de cualquier ruta antes de que tomes una decisión.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" className="rounded-full bg-brand-blue text-white hover:bg-brand-blue/90 px-10 py-6 text-base shadow-pop hover:-translate-y-0.5 transition-transform w-full sm:w-auto">
                  <Link href="/contact">Hablar con un experto <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-[color:var(--color-border)] text-[color:var(--color-text)] bg-[color:var(--color-surface)] hover:bg-[color:var(--color-surface-2)] px-10 py-6 text-base transition-colors w-full sm:w-auto">
                  <Link href="/faq">Ver Preguntas Frecuentes</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}