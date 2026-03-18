import 'server-only';
import type { Metadata } from 'next';
import { 
  ShieldCheck, 
  Sparkles, 
  Database, 
  Layers 
} from 'lucide-react';

import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import { AdminCustomersClient } from './AdminCustomersClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Directorio Maestro | Admin KCE',
  description: 'Gestión centralizada de identidad, segmentación y ciclo de vida del viajero para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/deals', label: 'Sales Pipeline', tone: 'primary' as const },
  { href: '/admin/bookings', label: 'Bookings Log' },
  { href: '/admin/tickets', label: 'Support Queue' },
  { href: '/admin/content/posts', label: 'Authority Blog' },
  { href: '/admin/revenue', label: 'Revenue Truth' },
];

const focusItems = [
  {
    label: '01 · identify',
    title: 'Prioriza el rastro caliente',
    body: 'Los datos importan cuando mueven una reserva viva o un follow-up crítico. Empieza por los registros con actividad reciente en el monitor.',
    href: '/admin/deals',
    cta: 'Abrir Deals',
  },
  {
    label: '02 · segment',
    title: 'Segmentación con propósito',
    body: 'Crea grupos solo cuando simplifiquen el outreach. Menos ruido administrativo, más precisión en la comunicación bilingüe.',
    href: '/admin/customers',
    cta: 'Ver Directorio',
  },
  {
    label: '03 · protect',
    title: 'Integridad de la Verdad',
    body: 'El viajero debe sentir coherencia absoluta. Pagos, tickets y conversaciones deben contar la misma historia en cada touchpoint.',
    href: '/admin/bookings',
    cta: 'Validar Reservas',
  },
];

const notes = [
  {
    title: 'Prioridad de Datos',
    body: 'Clientes vinculados a revenue vivo mandan sobre la limpieza pasiva de la base de datos.',
  },
  {
    title: 'Higiene CRM',
    body: 'Evita segmentar sin un uso operativo claro dentro del ciclo comercial premium de KCE.',
  },
  {
    title: 'Estado Ideal',
    body: 'Un escritorio que se siente accionable, segmentado con intención y coherente.',
  },
];

export default function AdminCustomersPage() {
  return (
    <main className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CAPA ESTRATÉGICA (OPERATING READ) 
          Establece la visión y accesos rápidos sin redundancia de títulos.
      */}
      <section className="pt-4">
        <AdminExecutivePanel
          eyebrow="customer operating read"
          title="Escritorio de identidad, segmentación y continuidad"
          description="Transforma la base de datos en un sistema operativo. Identifica los registros que importan hoy y mantén la historia del cliente intacta en todo el Kernel."
          quickLinks={quickLinks}
          focusItems={focusItems}
          notes={notes}
        />
      </section>

      {/* 02. DECKS DE INFRAESTRUCTURA (SOPs) */}
      <div className="grid gap-6 md:grid-cols-2 opacity-70 hover:opacity-100 transition-opacity duration-500">
        <ReleaseGradeDeck
          compact
          title="Release-Grade Identity"
          description="Asegura que la identidad del cliente soporte la promesa premium desde el cierre hasta la entrega del tour."
        />
        <GoLiveSimplificationDeck
          compact
          title="Enfoque Operativo"
          description="Menos filtros abstractos, más contexto directo. Acceso instantáneo a los registros que mueven la aguja del negocio."
        />
      </div>

      {/* 03. UNIDAD DE INTELIGENCIA (CLIENTE INTERACTIVO) 
          El componente cliente maneja su propio Header Táctico y Tabla.
      */}
      <section className="relative">
        {/* Acento visual de la Bóveda */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
        <AdminCustomersClient />
      </section>

      {/* 04. FOOTER DE INTEGRIDAD TÉCNICA */}
      <footer className="mt-16 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Identity Protection Active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> CRM Layer v2.4
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> P77 Standard Verified
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Zero-Restart context
        </div>
      </footer>
      
    </main>
  );
}