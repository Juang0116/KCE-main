// src/app/admin/deals/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { 
  ShieldCheck, 
  Sparkles, 
  Layers,
  Terminal
} from 'lucide-react';

import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminDealsClient } from './AdminDealsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pipeline Maestro | Admin KCE',
  description: 'Control de flujo comercial y aceleración de cierre para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/deals/board', label: 'Tablero Kanban', tone: 'primary' as const },
  { href: '/admin/sales', label: 'Sales Cockpit' },
  { href: '/admin/outbound', label: 'Outbound Desk' },
  { href: '/admin/revenue', label: 'Revenue Truth' },
];

const focusItems = [
  {
    label: '01 · close',
    title: 'Presiona el cashflow inmediato',
    body: 'Los carriles de Qualified, Proposal y Checkout mandan. Son el camino más corto entre el interés del viajero y el ingreso real.',
    href: '/admin/revenue',
    cta: 'Ver Verdad de Revenue',
  },
  {
    label: '02 · rescue',
    title: 'Rescate táctico de señales',
    body: 'Usa el follow-up y el outbound solo donde el timing y la intención del viajero sugieran un camino de cierre realista.',
    href: '/admin/outbound',
    cta: 'Abrir Outbound',
  },
  {
    label: '03 · verify',
    title: 'Alineación de entrega',
    body: 'Un deal solo está sano si Ventas y Bookings leen la misma realidad. Evita la deriva de información post-cierre.',
    href: '/admin/sales',
    cta: 'Sales Handoff',
  },
];

const notes = [
  {
    title: 'Prioridad de Hoy',
    body: 'Pocos movimientos decisivos en el checkout valen más que una limpieza lenta de todo el pipeline.',
  },
  {
    title: 'Higiene CRM',
    body: 'Nunca dejes un deal en Proposal sin un dueño asignado o un siguiente paso claro definido.',
  },
  {
    title: 'Estado de Éxito',
    body: 'Un escritorio de deals eficiente se siente como movimiento hacia adelante controlado y predecible.',
  },
];

export default async function AdminDealsPage() {
  // 01. Seguridad de Capa 0
  await requireAdmin();

  return (
    <main className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 02. NODO DE IDENTIFICACIÓN SUTIL */}
      <div className="flex items-center justify-between px-4 opacity-50 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <Terminal className="h-3.5 w-3.5 text-brand-blue" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            Commercial Lane: /deals-vault
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-tighter">
            Pipeline Engine Active
          </span>
        </div>
      </div>

      {/* 03. CAPA ESTRATÉGICA (OPERATING READ) 
          Centralizamos la visión aquí. Eliminamos headers redundantes.
      */}
      <section className="pt-4">
        <AdminExecutivePanel
          eyebrow="deals operating read"
          title="Escritorio de presión y velocidad de cierre"
          description="Este panel prioriza la claridad del operador: presiona los pagos activos, rescata el interés genuino y mantén la coherencia con el equipo de operaciones."
          quickLinks={quickLinks}
          focusItems={focusItems}
          notes={notes}
        />
      </section>

      {/* 04. DECKS DE INFRAESTRUCTURA (SOPs) */}
      <div className="grid gap-6 md:grid-cols-2 opacity-70 hover:opacity-100 transition-opacity duration-500">
        <ReleaseGradeDeck
          compact
          title="Release-Grade Sales"
          description="Asegura que la presión en checkout y propuesta refuerce el estándar premium de Knowing Cultures."
        />
        <GoLiveSimplificationDeck
          compact
          title="Simplificación de Flujo"
          description="Menos dispersión visual y un camino obvio desde la etapa de interés hasta la ejecución del tour."
        />
      </div>

      {/* 05. MONITOR DE OPERACIONES (CLIENTE INTERACTIVO) 
          Delegamos toda la interfaz táctica (Header, KPIs y Tabla) al cliente.
      */}
      <section className="relative">
        {/* Acento lateral de integridad visual */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
        <AdminDealsClient />
      </section>

      {/* 06. FOOTER DE CONFORMIDAD TÉCNICA */}
      <footer className="mt-16 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Commercial Data Sovereignty
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> Pipeline Engine v2.8
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Intelligence unit active
        </div>
      </footer>
      
    </main>
  );
}