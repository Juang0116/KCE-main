// src/app/admin/revenue/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { 
  Zap, TrendingUp, ShieldCheck, Target, 
  Terminal, Sparkles, Layers, Euro, 
  MousePointer2, Activity, Database,
  ArrowUpRight
} from 'lucide-react';

import { CommercialControlDeck } from '@/components/admin/CommercialControlDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import { AdminRevenueOpsClient } from './AdminRevenueOpsClient';
import { requireAdmin } from '@/lib/adminGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Revenue Operations | Bóveda KCE',
  description: 'Unidad de inteligencia financiera, optimización de pipeline y verdad del revenue para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/bookings', label: 'Bookings Node', tone: 'primary' as const, icon: ShieldCheck },
  { href: '/admin/qa', label: 'QA Pre-flight', icon: Terminal },
  { href: '/admin/templates', label: 'Message System', icon: Layers },
  { href: '/admin/outbound', label: 'Dispatch Center', icon: Activity },
  { href: '/admin/deals', label: 'Active Pipeline', icon: TrendingUp },
];

const focusItems = [
  {
    label: '01 · detect',
    title: 'Localizar la fuga más costosa',
    body: 'El revenue debe decirte dónde se estanca el capital ahora mismo: ¿propuesta, checkout o continuidad en la entrega?',
    href: '/admin/deals',
    cta: 'Auditar Deals',
  },
  {
    label: '02 · adjust',
    title: 'Ajustar una sola palanca a la vez',
    body: 'Modifica la plantilla, el CTA o la cadencia que coincida con el cuello de botella en lugar de abrir múltiples arreglos simultáneos.',
    href: '/admin/templates',
    cta: 'Ajustar Mensajes',
  },
  {
    label: '03 · verify',
    title: 'Confirmar integridad post-cobro',
    body: 'Los bookings y el acceso a la cuenta deben sostener la misma promesa premium que el checkout acaba de vender.',
    href: '/admin/bookings',
    cta: 'Verificar Entrega',
  },
];

const notes = [
  {
    title: 'Prioridad de Flujo',
    body: 'La fricción en el checkout importa más que cualquier optimización secundaria cuando el objetivo es el movimiento de caja.',
  },
  {
    title: 'Esfuerzo de Rescate',
    body: 'La recuperación de leads solo merece energía cuando hay un camino creíble para salvar el cierre o la reserva.',
  },
  {
    title: 'Ritmo Operativo',
    body: 'Lee el revenue en ciclos cortos durante el día para actuar antes de que el pipeline se enfríe.',
  },
];

export default async function AdminRevenueOpsPage() {
  await requireAdmin();

  return (
    <main className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE CONTROL DE CAPITAL (REVENUE VAULT) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10 px-2">
        <div className="space-y-3">
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Financial Lane: /revenue-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight tracking-tight">
            Revenue <span className="text-brand-yellow italic font-light">& Analytics</span>
          </h1>
          <p className="text-base text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Unidad de inteligencia comercial. Decodifica el flujo de caja, detecta anomalías en el pipeline 
            y asegura que cada interacción de KCE tenga un retorno medible.
          </p>
        </div>

        {/* Status de Pulso Financiero */}
        <div className="flex items-center gap-6 bg-brand-blue/5 border border-brand-blue/10 p-6 rounded-[2.5rem] shadow-inner group">
           <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110">
              <Zap className="h-6 w-6 text-brand-blue animate-pulse" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Capital Pulse</p>
              <p className="text-xs font-mono text-emerald-600 font-bold uppercase tracking-tighter">Verified Stream</p>
           </div>
        </div>
      </header>

      {/* 02. DECKS ESTRATÉGICOS */}
      <CommercialControlDeck
        eyebrow="Revenue Command"
        title="Soberanía de Ingresos"
        description="Revenue, bookings y QA deben contar la misma historia para que KCE pueda cobrar y entregar sin fricción sistémica."
        primaryHref="/admin/bookings"
        primaryLabel="Ver Bookings"
        secondaryHref="/admin/qa"
        secondaryLabel="Lanzar QA"
      />

      <AdminExecutivePanel
        eyebrow="revenue operating read"
        title="Escritorio ejecutivo para la toma de decisiones"
        description="Esta vista prioriza el movimiento: localiza la fuga de capital, ajusta la palanca correcta y verifica que la entrega premium sea impecable."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      {/* 03. DECKS DE INTEGRIDAD COMERCIAL */}
      <div className="grid gap-6 md:grid-cols-2 opacity-80 hover:opacity-100 transition-opacity duration-500">
        <ReleaseGradeDeck
          compact
          title="Revenue Release-Grade"
          description="Asegura que el flujo de pago y la persistencia del booking coincidan con el estándar premium de la marca."
        />
        <GoLiveSimplificationDeck
          compact
          title="Simplificación Operativa"
          description="Velocidad de decisión: menos ruido en el dashboard y un camino obvio desde la señal de datos hasta la acción."
        />
      </div>

      {/* 04. TERMINAL DINÁMICA (REVOPS CLIENT) */}
      <section className="relative pt-8">
        <div className="mb-8 flex items-center justify-between px-4">
           <div className="flex items-center gap-4">
             <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg">
                <Euro className="h-6 w-6" />
             </div>
             <h2 className="font-heading text-3xl text-brand-blue">Monitor de Inteligencia</h2>
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">
              <Sparkles className="h-3.5 w-3.5 text-brand-yellow" /> Neural Revenue Engine
           </div>
        </div>
        
        {/* Acento lateral de integridad de la Bóveda */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
        
        {/* El cliente maneja el pipeline, las etapas estancadas y las recomendaciones de IA */}
        <AdminRevenueOpsClient />
      </section>

      {/* FOOTER DE SOBERANÍA FINANCIERA */}
      <footer className="mt-20 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Revenue
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> Persistent Transaction Node
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <TrendingUp className="h-3.5 w-3.5" /> RevOps v4.2 Active
        </div>
      </footer>
      
    </main>
  );
}