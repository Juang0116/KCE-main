// src/app/admin/outbound/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { 
  Send, Zap, MessageSquare, Target, 
  Terminal, ShieldCheck, Sparkles, 
  Layers, MousePointer2, TrendingUp,
  Mail, Smartphone, MessageCircle
} from 'lucide-react';

import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import GoLiveSimplificationDeck from '@/components/admin/GoLiveSimplificationDeck';
import ReleaseGradeDeck from '@/components/admin/ReleaseGradeDeck';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminOutboundClient } from './AdminOutboundClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Outbound Vault | Despacho KCE',
  description: 'Unidad de comunicaciones salientes y presión de cierre para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/admin/sales', label: 'Sales Cockpit', tone: 'primary' as const, icon: MousePointer2 },
  { href: '/admin/deals', label: 'Active Pipeline', icon: TrendingUp },
  { href: '/admin/templates', label: 'Message System', icon: Layers },
  { href: '/admin/revenue', label: 'Revenue Truth', icon: Zap },
];

const focusItems = [
  {
    label: '01 · reply',
    title: 'Priorizar hilos activos',
    body: 'Las respuestas y objeciones en vivo merecen el primer bloque operativo. No limpies la cola general si hay una conversación caliente.',
    href: '/admin/sales',
    cta: 'Abrir Sales Cockpit',
  },
  {
    label: '02 · rescue',
    title: 'Rescatar envíos con señal',
    body: 'Recuperar mensajes fallidos solo cuando el interés del viajero sea real. Cambia el ángulo, el canal o el timing antes de reintentar.',
    href: '/admin/templates',
    cta: 'Ajustar Plantillas',
  },
  {
    label: '03 · confirm',
    title: 'Verificar impacto en cierre',
    body: 'El outbound no es ruido: tras el envío, confirma si la señal movió el deal hacia la confianza de reserva o el pago real.',
    href: '/admin/revenue',
    cta: 'Verificar Revenue',
  },
];

const notes = [
  {
    title: 'Ganar hoy',
    body: 'Una respuesta real o un checkout recuperado valen más que 100 mensajes genéricos en la cola.',
  },
  {
    title: 'Evitar hoy',
    body: 'No satures canales si el problema es una oferta débil o un mal "fit" de tiempo del viajero.',
  },
  {
    title: 'Cerrar hoy',
    body: 'Este escritorio debe sentirse como un motor de cierre disciplinado, no como una bandeja de entrada ruidosa.',
  },
];

export default async function AdminOutboundPage() {
  await requireAdmin();

  return (
    <main className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE CONTROL DE COMUNICACIONES */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8 px-2">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Dispatch Lane: /communication-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue">
            Outbound <span className="text-brand-yellow italic font-light">& Despacho</span>
          </h1>
          <p className="mt-4 text-base text-[var(--color-text)]/50 font-light max-w-2xl italic">
            Nodo central de comunicaciones salientes. Gestiona la presión de cierre, rescata leads enfriados 
            y alinea el mensaje con la Verdad del Revenue.
          </p>
        </div>

        {/* Status de Pulso de Dispatch */}
        <div className="flex items-center gap-4 bg-brand-blue/5 border border-brand-blue/10 px-6 py-3 rounded-2xl shadow-inner group">
           <div className="relative">
              <Send className="h-5 w-5 text-brand-blue group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-brand-yellow animate-pulse" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Dispatch Hub</p>
              <p className="text-[9px] font-mono text-brand-blue/40 uppercase">Ready for Transmission</p>
           </div>
        </div>
      </header>

      {/* 02. ESTRATEGIA EJECUTIVA */}
      <AdminExecutivePanel
        eyebrow="outbound operating read"
        title="Escritorio de despacho para hilos de alto valor"
        description="Outbound prioriza la claridad de decisión: trabaja los hilos que pueden cerrar hoy y confirma el impacto real en el pipeline comercial."
        quickLinks={quickLinks}
        focusItems={focusItems}
        notes={notes}
      />

      <AdminOperatorWorkbench
        eyebrow="messaging loop"
        title="Protege el Momentum"
        description="Mueve los hilos activos, repara envíos fallidos con intención y empuja el checkout solo donde el mensaje aún puede cambiar el resultado."
        actions={[
          { href: '/admin/templates', label: 'Refinar Copy', tone: 'primary' },
          { href: '/admin/sequences', label: 'Ajustar Secuencias' },
          { href: '/admin/deals', label: 'Contexto de Pipeline' },
        ]}
        signals={[
          { label: 'respuestas', value: 'first', note: 'Las conversaciones activas tienen prioridad total sobre la cola fría.' },
          { label: 'checkout', value: 'tight', note: 'Usa mensajes directos para eliminar la fricción final del viajero.' },
          { label: 'recovery', value: 'smart', note: 'Rescata solo lo que mantiene señal y fit con el tiempo del tour.' },
          { label: 'loop', value: 'closed', note: 'Tras la acción, audita en Revenue si el mensaje movió la aguja.' },
        ]}
      />

      {/* 03. DECKS DE DISCIPLINA MENSAJERÍA */}
      <div className="grid gap-6 md:grid-cols-2 opacity-80 hover:opacity-100 transition-opacity duration-500">
        <ReleaseGradeDeck
          compact
          title="Release-Grade Outbound"
          description="Asegura que cada envío mantenga el estándar premium de KCE antes de escalar el volumen de la cola."
        />
        <GoLiveSimplificationDeck
          compact
          title="Simplificación de Cola"
          description="Velocidad de triaje: menos ruido en el dashboard y un camino más corto del envío al resultado comercial."
        />
      </div>

      {/* 04. TERMINAL DINÁMICA (BÓVEDA CLIENTE) */}
      <section className="relative pt-8">
        <div className="mb-8 flex items-center justify-between px-4">
           <div className="flex items-center gap-4">
             <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg">
                <MessageCircle className="h-6 w-6" />
             </div>
             <h2 className="font-heading text-3xl text-brand-blue">Monitor de Transmisión</h2>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">
                <Mail className="h-3.5 w-3.5" /> Email Node
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">
                <Smartphone className="h-3.5 w-3.5" /> WhatsApp Node
              </div>
           </div>
        </div>
        
        {/* Acento lateral de la Bóveda */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
        
        {/* El cliente maneja la tabla de mensajes, reintentos y atribución */}
        <AdminOutboundClient />
      </section>

      {/* FOOTER DE INTEGRIDAD */}
      <footer className="mt-16 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Dispatch
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> Outbound Engine v3.1
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Close Intelligence Active
        </div>
      </footer>
      
    </main>
  );
}