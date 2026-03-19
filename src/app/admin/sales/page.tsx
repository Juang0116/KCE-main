// src/app/admin/sales/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  Briefcase, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  Target, 
  MousePointer2, 
  TrendingUp, 
  Layers, 
  Clock,
  Sparkles,
  ArrowUpRight,
  GanttChartSquare
} from 'lucide-react';

import { CommercialControlDeck } from '@/components/admin/CommercialControlDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import { AdminSalesCockpitClient } from './AdminSalesCockpitClient';
import { requireAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sales Cockpit | Admin KCE',
  description: 'Unidad de cierre comercial y gestión de soberanía del pipeline para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/deals', label: 'Active Deals', tone: 'primary' as const },
  { href: '/admin/revenue', label: 'Revenue Truth' },
  { href: '/admin/outbound', label: 'Dispatch Center' },
  { href: '/admin/templates', label: 'Playbook System' },
  { href: '/admin/tickets', label: 'Support Queue' },
];

const focusItems = [
  {
    label: '01 · close',
    title: 'Priorizar Cierres Inmediatos',
    body: 'Proposal y Checkout merecen Founder Pressure hoy. El objetivo es mover caja, no limpiar el listado general.',
    href: '/admin/revenue',
    cta: 'Revisar Revenue',
  },
  {
    label: '02 · rescue',
    title: 'Rescatar Deals Enfriándose',
    body: 'Si el rastro de contacto supera los 4 días, usa el Dispatch Center inmediatamente antes de que el lead se pierda.',
    href: '/admin/outbound',
    cta: 'Abrir Outbound',
  },
  {
    label: '03 · protect',
    title: 'Asegurar Continuidad Post-Cierre',
    body: 'La promesa premium debe sostenerse tras el pago. Verifica el handoff entre Ventas y Soporte sin reiniciar el contexto.',
    href: '/admin/tickets',
    cta: 'Protección de Handoff',
  },
];

const notes = [
  {
    title: 'Ganar hoy',
    body: 'Una acción de cierre real vale más que diez contactos suaves en deals fríos.',
  },
  {
    title: 'Ritmo diario',
    body: 'Inicia el bloque con el deal más caliente y termínalo con el rescate más frío ya programado.',
  },
];

/**
 * AdminSalesPage:
 * Shell de servidor para el control comercial de KCE.
 * Establece el marco de soberanía sobre el pipeline antes de montar el motor táctico.
 */
export default async function AdminSalesPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-12 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE ALTO MANDO (SALES HQ) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10 px-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Commercial Lane: /sales-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight tracking-tight">
            Sales <span className="text-brand-yellow italic font-light">Cockpit</span>
          </h1>
          <p className="text-base text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Consola central de conversión. Decodifica la intención del viajero, gestiona la 
            presión de cierre y garantiza la continuidad premium en el pipeline de KCE.
          </p>
        </div>

        {/* Status de Pulso Comercial */}
        <div className="flex items-center gap-6 bg-brand-blue/5 border border-brand-blue/10 p-6 rounded-[2.5rem] shadow-inner group">
           <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110">
              <TrendingUp className="h-6 w-6 text-brand-blue" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Sales Momentum</p>
              <p className="text-xs font-mono text-emerald-600 font-bold uppercase">Growth Node Active</p>
           </div>
        </div>
      </header>

      {/* 02. NAVEGACIÓN TÁCTICA Y ESTRATEGIA */}
      <CommercialControlDeck
        eyebrow="Sales Command"
        title="Soberanía de Cierre"
        description="Ventas no es un dashboard, es un carril de decisión. Cierra lo que mueve caja, rescata lo que se enfría y protege la reserva."
        primaryHref="/admin/deals"
        primaryLabel="Operar Deals"
        secondaryHref="/admin/revenue"
        secondaryLabel="Ver Revenue Truth"
      />

      <AdminExecutivePanel
        eyebrow="sales operating read"
        title="Escritorio táctico para la toma de decisiones decisivas"
        description="Esta vista prioriza el movimiento sobre el ruido. Localiza el deal estancado, aplica el Founder Move y verifica la continuidad premium."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      {/* 03. CARRILES DE ACCIÓN RÁPIDA (FOUNDER LANES) */}
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { t: 'Mismo día', c: 'Deals en checkout con tarea vencida.', h: '/admin/deals', i: Clock, color: 'text-rose-600' },
          { t: '≤12h', c: 'Contacto premium y handoff desde chat.', h: '/admin/tasks', i: Target, color: 'text-amber-600' },
          { t: '≤2h', c: 'Continuidad post-compra sensible.', h: '/admin/tickets', i: Briefcase, color: 'text-emerald-600' },
          { t: 'Operador', c: 'Higiene de leads y sistema.', h: '/admin/leads', i: MousePointer2, color: 'text-brand-blue' },
        ].map((lane) => (
          <Link
            key={lane.t}
            href={lane.h}
            className="group rounded-[2rem] border border-[var(--color-border)] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:border-brand-blue/20"
          >
            <header className="flex justify-between items-center mb-4">
               <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue/40">Founder Lane</div>
               <lane.i className={`h-4 w-4 ${lane.color} opacity-30 group-hover:opacity-100 transition-opacity`} />
            </header>
            <h2 className={`font-heading text-2xl ${lane.color}`}>{lane.t}</h2>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-text)]/50 italic">{lane.c}</p>
          </Link>
        ))}
      </section>

      {/* 04. DECKS DE INTEGRIDAD (RELEASE GRADE) */}
      <div className="grid gap-6 md:grid-cols-2 opacity-80 hover:opacity-100 transition-opacity duration-500">
        <ReleaseGradeDeck
          compact
          title="Sales Release-Grade"
          description="Asegura que cada acción de cierre refuerce el sistema premium de KCE."
        />
        <GoLiveSimplificationDeck
          compact
          title="Simplificación de Foco"
          description="Menos dashboard repetido, más velocidad desde la señal hasta el dinero."
        />
      </div>

      {/* 05. TERMINAL DINÁMICA (CLIENT COMPONENT) */}
      <section className="relative pt-8">
        <div className="mb-8 flex items-center gap-4 px-4">
           <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
           </div>
           <h2 className="font-heading text-3xl text-brand-blue">Live Sales Intelligence</h2>
        </div>
        
        {/* Acento lateral de integridad de la Bóveda */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
        
        {/* El cliente maneja el cockpit interactivo, filtros, autopilot y tabla de deals */}
        <AdminSalesCockpitClient />
      </section>

      {/* 06. FOOTER DE SOBERANÍA COMERCIAL */}
      <footer className="mt-20 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Sales
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> Conversion Engine v4.2
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <TrendingUp className="h-3.5 w-3.5" /> Growth Sovereignty
        </div>
      </footer>
      
    </main>
  );
}