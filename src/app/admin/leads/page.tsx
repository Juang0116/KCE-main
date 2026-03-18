// src/app/admin/leads/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { 
  ShieldCheck, 
  Sparkles, 
  Layers,
  Terminal,
  UserCheck
} from 'lucide-react';

import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminLeadsClient } from './AdminLeadsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Leads Vault | Admin KCE',
  description: 'Unidad de captura, calificación y conversión de prospectos para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/deals', label: 'Bandeja de Deals', tone: 'primary' as const },
  { href: '/admin/sales', label: 'Sales Cockpit' },
  { href: '/admin/customers', label: 'Directorio Clientes' },
  { href: '/admin/outbound', label: 'Follow-up Engine' },
];

const focusItems = [
  {
    label: '01 · qualify',
    title: 'Calificación de alta velocidad',
    body: 'Convierte la señal en movimiento. Un lead debe dejar la ambigüedad rápido: asígnale un dueño y decide si el camino es Deal o Nurture.',
    href: '/admin/deals',
    cta: 'Abrir Pipeline',
  },
  {
    label: '02 · protect',
    title: 'Blindar la intención fresca',
    body: 'Cuando el lead trae source y canal claro, acelera el handoff. No permitas que el interés muera en el ruido administrativo.',
    href: '/admin/sales',
    cta: 'Sales Handoff',
  },
  {
    label: '03 · verify',
    title: 'Trazabilidad de conversión',
    body: 'El éxito se mide cuando esta señal aparece en el Revenue Truth sin perder el contexto original del viajero capturado.',
    href: '/admin/revenue',
    cta: 'Verificar Revenue',
  },
];

const notes = [
  {
    title: 'Prioridad de Captura',
    body: 'Un siguiente paso claro hacia el pipeline importa más que recolectar metadatos infinitos.',
  },
  {
    title: 'Punto de Fricción',
    body: 'Evita dejar leads calificados "aparcados" sin una ruta clara hacia conversión o deals.',
  },
  {
    title: 'Estado de Éxito',
    body: 'Una mesa de entrada que se siente deliberada y conectada al resto del motor comercial premium.',
  },
];

export default async function AdminLeadsPage() {
  // 01. Seguridad de Capa 0
  await requireAdmin();

  return (
    <main className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 02. NODO DE IDENTIFICACIÓN SUTIL */}
      <div className="flex items-center justify-between px-4 opacity-50 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <Terminal className="h-3.5 w-3.5 text-brand-blue" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            Acquisition Lane: /leads-intake
          </span>
        </div>
        <div className="flex items-center gap-4 bg-brand-blue/5 border border-brand-blue/10 px-4 py-1.5 rounded-full">
           <UserCheck className="h-3 w-3 text-brand-blue" />
           <span className="text-[9px] font-mono text-brand-blue/60 uppercase tracking-tighter">
             Intake Node: Synchronized
           </span>
        </div>
      </div>

      {/* 03. CAPA ESTRATÉGICA (OPERATING READ) 
          Establece la visión sin duplicar títulos.
      */}
      <section className="pt-4">
        <AdminExecutivePanel
          eyebrow="lead operating read"
          title="Escritorio de calificación y handoff limpio"
          description="Prioriza la claridad operativa: clasifica la intención fresca, mueve los perfiles correctos al pipeline y protege los datos de origen del viajero."
          quickLinks={quickLinks}
          focusItems={focusItems}
          notes={notes}
        />
      </section>

      {/* 04. DECKS DE INFRAESTRUCTURA (SOPs) */}
      <div className="grid gap-6 md:grid-cols-2 opacity-80 hover:opacity-100 transition-opacity duration-500">
        <ReleaseGradeDeck
          compact
          title="Release-Grade Intake"
          description="Asegura que el flujo de calificación y los caminos de conversión se mantengan deliberados y escalables."
        />
        <GoLiveSimplificationDeck
          compact
          title="Simplificación de Entrada"
          description="Velocidad de respuesta: menos ruido visual, acciones más claras y un puente sólido entre señal y cierre."
        />
      </div>

      {/* 05. TERMINAL DE LEADS (CLIENTE INTERACTIVO) 
          Delegamos toda la interfaz táctica (Header, KPIs, Filtros y Tabla) al cliente.
      */}
      <section className="relative">
        {/* Acento lateral de integridad visual */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
        <AdminLeadsClient />
      </section>

      {/* 06. FOOTER DE CONFORMIDAD TÉCNICA */}
      <footer className="mt-16 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Acquisition Sovereignty
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> Intake Engine v3.0
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Zero-Loss Handoff Active
        </div>
      </footer>
      
    </main>
  );
}