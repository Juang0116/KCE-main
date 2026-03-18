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
    <main className="min-h-screen bg-[var(--color-bg)] pb-24">
      
      {/* HERO POLÍTICAS */}
      <section className="relative overflow-hidden bg-brand-blue px-6 py-20 md:py-28 text-center text-white shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[url('/brand/pattern.png')] bg-repeat"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow backdrop-blur-md">
            <ShieldCheck className="h-3 w-3" /> Compromiso KCE
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-6xl drop-shadow-md">
            Cancelación y cambios.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
            Reglas claras y directas. Queremos que reserves con la tranquilidad de saber exactamente cómo protegemos tu inversión.
          </p>
        </div>
      </section>

      {/* CONTENEDOR DE REGLAS */}
      <section className="mx-auto max-w-6xl px-6 -mt-10 relative z-20 space-y-8">
        
        {/* REGLAS DE TIEMPO (GRID 3 COL) */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { 
              icon: Clock, 
              title: '48+ horas', 
              copy: 'Cambios o cancelaciones con anticipación permiten gestionar reembolsos parciales o créditos para futuros viajes.',
              color: 'text-emerald-500'
            },
            { 
              icon: CalendarX, 
              title: 'Menos de 48h', 
              copy: 'Generalmente no reembolsable debido a la logística y compromiso con guías locales, pero evaluamos casos excepcionales.',
              color: 'text-amber-500'
            },
            { 
              icon: CloudLightning, 
              title: 'Clima / Fuerza Mayor', 
              copy: 'Si la seguridad se ve comprometida, reprogramamos sin costo o buscamos una alternativa equivalente de inmediato.',
              color: 'text-brand-blue'
            }
          ].map((item, idx) => (
            <div key={idx} className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xl transition-all hover:shadow-2xl">
              <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] ${item.color}`}>
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-xl text-brand-blue mb-3">{item.title}</h3>
              <p className="text-sm font-light leading-relaxed text-[var(--color-text)]/70">{item.copy}</p>
            </div>
          ))}
        </div>

        {/* RECOMENDACIÓN DESTACADA */}
        <div className="rounded-[3rem] border border-brand-yellow/20 bg-brand-yellow/5 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-inner">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-brand-yellow/20 text-brand-yellow">
            <Info className="h-8 w-8" />
          </div>
          <div className="text-center md:text-left">
            <h2 className="font-heading text-2xl text-brand-blue mb-2">Consejo KCE antes de reservar</h2>
            <p className="text-base font-light leading-relaxed text-[var(--color-text)]/70">
              Revisa siempre la sección de <strong>&quot;incluye / no incluye&quot;</strong> y los detalles logísticos del tour. Si tienes dudas sobre el ritmo o la dificultad física, escríbenos antes de pagar.
            </p>
          </div>
        </div>

        {/* DETALLES DE OPERACIÓN (GRID 2 COL) */}
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-brand-blue" />
              <h2 className="font-heading text-2xl text-brand-blue">Cómo solicitar cambios</h2>
            </div>
            <div className="space-y-4 text-sm font-light leading-relaxed text-[var(--color-text)]/70">
              <p>
                La vía más rápida es escribirnos por WhatsApp o email indicando tu <strong>Booking ID</strong> y la nueva fecha deseada.
              </p>
              <p>
                Siempre que la disponibilidad operativa lo permita, intentamos reprogramar tus experiencias sin fricción ni cargos adicionales.
              </p>
              <div className="rounded-2xl bg-[var(--color-surface-2)] p-4 border border-[var(--color-border)]">
                <p className="italic">
                  * En temporadas de alta demanda (puentes o festivos), algunos cambios pueden estar sujetos a ajustes de tarifa por parte de los proveedores.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[3rem] border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-10 shadow-inner">
            <div className="mb-6 flex items-center gap-3">
              <HelpCircle className="h-6 w-6 text-brand-blue/40" />
              <h2 className="font-heading text-2xl text-brand-blue/60">Nota sobre servicios con fecha</h2>
            </div>
            <div className="space-y-4 text-sm font-light leading-relaxed text-[var(--color-text)]/50">
              <p>
                Los tours son <strong>servicios de ocio programados para una fecha y hora específica</strong>.
              </p>
              <p>
                Debido a la naturaleza de la reserva de guías, transporte y permisos, el derecho de desistimiento/retracto estándar de compras por internet suele no aplicar a este tipo de contratos.
              </p>
              <p>
                Por esta razón, la claridad previa es nuestra mejor herramienta. No dudes en consultarnos cualquier detalle logístico.
              </p>
            </div>
          </div>
        </div>

        {/* CTA FINAL SOPORTE */}
        <div className="rounded-[3.5rem] border border-[var(--color-border)] bg-brand-dark p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[url('/brand/pattern.png')] bg-repeat"></div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl mb-6">¿Aún tienes dudas sobre una reserva?</h2>
            <p className="text-lg font-light text-white/70 mb-10 leading-relaxed">
              Nuestro equipo humano está disponible para explicarte las condiciones de cualquier ruta específica.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="rounded-full px-10 shadow-lg bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90">
                <Link href="/contact">Hablar con un experto <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-10 border-white/20 text-white hover:bg-white/5">
                <Link href="/faq">Ver Preguntas Frecuentes</Link>
              </Button>
            </div>
          </div>
        </div>

      </section>

      {/* Anchor target */}
      <div id="top" className="sr-only" />
    </main>
  );
}