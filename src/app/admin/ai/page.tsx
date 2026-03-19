import 'server-only';
import type { Metadata } from 'next';
import { 
  Bot, ArrowUpRight, Clock, Map, 
  Layers, Target, ShieldCheck, 
  MessageSquare, UserCheck, Zap, LayoutDashboard
} from 'lucide-react';

import { AdminAiLabClient } from './AdminAiLabClient';
import { AiHandoffControlDeck } from '@/components/admin/AiHandoffControlDeck';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Inteligencia Operativa | Admin KCE',
  description: 'Centro de control de IA, handoff comercial y mapas de continuidad para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

export default function AdminAiPage() {
  return (
    <main className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* CABECERA DE ALTO NIVEL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
             <Bot className="h-3.5 w-3.5" /> Cognitive Engine Dashboard
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue">Inteligencia <span className="text-brand-yellow italic font-light">Boutique</span></h1>
          <p className="mt-4 text-base text-[var(--color-text)]/50 font-light leading-relaxed">
            Supervisión del núcleo <code className="font-mono text-brand-blue">/api/ai</code>. Aquí se calibra la frontera entre la automatización autónoma y el servicio humano de guante blanco.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full border-brand-blue/20 text-brand-blue hover:bg-brand-blue/5">
            <a href="/admin/ai/playbook" className="flex items-center gap-2">
              <Layers className="h-4 w-4" /> AI Playbook
            </a>
          </Button>
          <Button asChild className="rounded-full shadow-xl">
            <a href="/admin/tickets" className="flex items-center gap-2">
               Tus Tickets <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </header>

      {/* CONTROL DE HANDOFF (DINÁMICO) */}
      <section className="relative">
         <div className="absolute -left-4 top-0 h-full w-1 bg-brand-yellow rounded-full opacity-20" />
         <AiHandoffControlDeck />
      </section>

      {/* BLOQUES ESTRATÉGICOS (BLUEPRINTS) */}
      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* Mapa de Continuidad */}
        <section className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
             <Target className="h-40 w-40 text-brand-blue" />
          </div>
          <header className="mb-10 flex items-center justify-between border-b border-[var(--color-border)] pb-6">
            <div>
              <h2 className="font-heading text-2xl text-brand-blue">Continuidad Comercial</h2>
              <p className="text-xs text-[var(--color-text)]/40 mt-1 uppercase tracking-widest font-bold">Sales Continuity Map</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
               <ShieldCheck className="h-5 w-5" />
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { t: 'Chat Concierge', c: 'Orienta, recomienda tours y captura intención sin fricción.' },
              { t: 'Punto de Contacto', c: 'Recibe contexto de ciudad y fechas para no repetir preguntas.' },
              { t: 'Gestión CRM', c: 'Leads y Deals listos para seguimiento comercial estratégico.' },
              { t: 'Founder Lane', c: 'Escalamiento directo a fundadores en casos de alta fidelidad.' },
            ].map((item, i) => (
              <article key={i} className="rounded-2xl bg-[var(--color-surface-2)] p-6 border border-[var(--color-border)] transition-all hover:border-brand-blue/20 group">
                <h4 className="text-sm font-bold text-brand-blue mb-2">{item.t}</h4>
                <p className="text-xs font-light leading-relaxed text-[var(--color-text)]/60">{item.c}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Ventanas de Respuesta */}
        <section className="rounded-[3rem] border border-[var(--color-border)] bg-brand-dark p-8 md:p-12 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Clock className="h-40 w-40 text-brand-yellow" />
          </div>
          <header className="mb-10 flex items-center justify-between border-b border-white/10 pb-6">
            <div>
              <h2 className="font-heading text-2xl">Ventanas de Respuesta</h2>
              <p className="text-xs text-brand-yellow mt-1 uppercase tracking-widest font-bold">Founder Response Ops</p>
            </div>
          </header>

          <div className="grid gap-4">
            {[
              { t: 'Prioridad Alta (≤2h)', c: 'Bookings, post-compra o clientes esperando checkout.', lane: 'Founder Lane' },
              { t: 'Prioridad Media (≤12h)', c: 'Planes personalizados y leads calificados por IA.', lane: 'Sales Lane' },
              { t: 'Prioridad Estándar (Día)', c: 'Consultas generales y discovery de catálogo.', lane: 'Operator Lane' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl bg-white/5 p-5 border border-white/10 hover:bg-white/10 transition-all">
                <div>
                  <h4 className="text-sm font-bold text-brand-yellow">{item.t}</h4>
                  <p className="text-xs font-light text-white/50 mt-1">{item.c}</p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 whitespace-nowrap ml-4">{item.lane}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4 bg-brand-yellow/10 border border-brand-yellow/20 p-5 rounded-[2rem]">
             <Map className="h-6 w-6 text-brand-yellow shrink-0" />
             <p className="text-[11px] font-light leading-relaxed text-brand-yellow/80">
                <strong className="block text-xs uppercase tracking-widest mb-1">Nota Territorial:</strong>
                Bogotá (Cerrar rápido) · Caldas (Contexto propio) · Cartagena (Sembrar intención futura).
             </p>
          </div>
        </section>

      </div>

      {/* SOURCE → LANE PLAYBOOK (GRILLA TÁCTICA) */}
      <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 md:p-16 shadow-inner overflow-hidden relative">
        <div className="relative z-10 max-w-4xl mx-auto text-center mb-16">
          <h2 className="font-heading text-3xl text-brand-blue mb-4 text-center">Handoff Map Playbook</h2>
          <p className="text-base font-light text-[var(--color-text)]/50 leading-relaxed">
            Cada origen de datos debe terminar en el carril correcto. Evita que chat, plan y contacto abran continuidad a ciegas.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4 relative z-10">
          {[
            { s: 'Chat IA', l: '≤12h', c: 'Resumen útil y derivación a contacto o plan.', h: '/admin/ai' },
            { s: 'Plan IA', l: '≤12h', c: 'Caso con presupuesto y fechas; seguimiento comercial.', h: '/admin/tasks' },
            { s: 'Contacto', l: '≤2h', c: 'Ticket + Deal cuando el caso pide mano humana inmediata.', h: '/admin/tickets' },
            { s: 'Booking', l: '≤2h', c: 'Resolver con rapidez para proteger confianza post-compra.', h: '/admin/bookings' },
          ].map((step, i) => (
            <a key={i} href={step.h} className="group flex flex-col justify-between rounded-[2.5rem] border border-[var(--color-border)] bg-white p-8 transition-all hover:shadow-2xl hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-blue px-2.5 py-1 rounded-full bg-brand-blue/5 border border-brand-blue/10">{step.l}</span>
                  <ArrowUpRight className="h-4 w-4 text-brand-blue/20 group-hover:text-brand-blue transition-colors" />
                </div>
                <h4 className="font-heading text-lg text-brand-blue mb-3">{step.s}</h4>
                <p className="text-xs font-light leading-relaxed text-[var(--color-text)]/50">{step.c}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* LABORATORIO EXPERIMENTAL (AI LAB) */}
      <section className="pt-12">
        {/* Renderizamos el cliente directamente, aprovechando su propia UI táctica */}
        <AdminAiLabClient />
      </section>

      {/* FOOTER DE ESTÁNDARES */}
      <footer className="mt-16 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-30">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
          <ShieldCheck className="h-3 w-3" /> Zero-Restart Policy
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
          <Target className="h-3 w-3" /> Context Preservation
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
          <Zap className="h-3 w-3" /> Response Authority
        </div>
      </footer>
      
    </main>
  );
}