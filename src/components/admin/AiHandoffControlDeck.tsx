'use client';

import Link from "next/link";
import { Bot, UserCheck, Zap, ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Props = {
  eyebrow?: string;
  title?: string;
  description?: string;
};

const pillars = [
  {
    title: 'Capture',
    icon: UserCheck,
    copy: 'Cada conversación útil debe salir con lead guardado o con intención explícita de seguimiento.',
  },
  {
    title: 'Handoff',
    icon: Zap,
    copy: 'Cuando el viajero pide ayuda humana, IA, tickets y CRM deben compartir el mismo contexto.',
  },
  {
    title: 'Recover',
    icon: Bot,
    copy: 'Si no compró hoy, la señal tiene que caer en sales, deals o sequence sin perder velocidad.',
  },
];

export function AiHandoffControlDeck({
  eyebrow = 'AI → CRM Bridge',
  title = 'AI Handoff Command Desk',
  description = 'Coordina la transición entre concierge, lead capture, soporte humano y seguimiento comercial para que ninguna intención útil se pierda.',
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-brand-2xl border border-white/10 bg-brand-dark text-white shadow-hard">
      {/* Capa de fondo con gradiente de marca */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/90 via-brand-dark to-brand-dark opacity-95" />
      
      <div className="relative z-10 grid gap-8 px-6 py-8 md:grid-cols-[1.4fr_1fr] md:px-10 md:py-12">
        
        {/* Lado Izquierdo: Estrategia */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
            <Zap className="h-3 w-3 text-brand-yellow" />
            {eyebrow}
          </div>

          <div className="max-w-xl space-y-4">
            <h2 className="font-heading text-3xl font-bold leading-tight md:text-5xl">
              {title}
            </h2>
            <p className="text-base leading-relaxed text-white/70 md:text-lg">
              {description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {pillars.map((pillar) => (
              <article 
                key={pillar.title} 
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10 hover:shadow-soft"
              >
                <pillar.icon className="h-5 w-5 text-brand-yellow transition-transform group-hover:scale-110" />
                <h3 className="mt-3 text-xs font-bold uppercase tracking-widest text-white">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-[13px] leading-snug text-white/60">
                  {pillar.copy}
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* Lado Derecho: Flujo Operativo */}
        <div className="flex flex-col rounded-brand-lg border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:p-8">
          <header className="mb-6 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
              Operational Lane
            </span>
            <LayoutDashboard className="h-4 w-4 text-white/30" />
          </header>

          <div className="space-y-4">
            {[
              "Descubrir intención en chat y guardar contacto válido.",
              "Crear ticket o deal cuando pida ayuda humana o muestre intención de compra.",
              "Releer la señal en sales/tickets y confirmar follow-up."
            ].map((step, i) => (
              <div 
                key={i}
                className="flex items-start gap-4 rounded-xl border border-white/5 bg-black/20 p-4 transition-transform hover:translate-x-1"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow/20 text-[11px] font-bold text-brand-yellow">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-white/80">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <Button asChild className="bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90">
              <Link href="/admin/ai">Abrir IA</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Link href="/admin/tickets">Tickets</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Link href="/admin/leads">Leads</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Link href="/admin/sales">Sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}