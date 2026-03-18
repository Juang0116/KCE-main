// src/app/admin/ops/notifications/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { 
  BellRing, 
  Terminal, 
  ShieldCheck, 
  Database, 
  Radio,
  Activity
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminOpsNotificationsClient } from './AdminOpsNotificationsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Notification Center | Ops KCE',
  description: 'Simulador de alertas y validación de canales de comunicación para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminOpsNotificationsPage:
 * Shell de servidor para la gestión de canales de alerta.
 * Establece la integridad de acceso antes de montar la consola de despacho de pruebas.
 */
export default async function AdminOpsNotificationsPage() {
  // Garantizar acceso administrativo en el nodo de servidor
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-10 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE ALTO MANDO (BROADCAST VAULT) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-8 px-2">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Broadcast Lane: /ops-notifications
          </div>
          <h1 className="font-heading text-4xl text-brand-blue tracking-tight">
            Canales de <span className="text-brand-yellow italic font-light">Alerta</span>
          </h1>
          <p className="text-sm text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Unidad de validación de red. Prueba en vivo la conectividad hacia Slack, Email y WhatsApp 
            para garantizar que los protocolos de emergencia de KCE funcionen bajo cualquier escenario.
          </p>
        </div>

        {/* Status de Enlace de Red */}
        <div className="flex items-center gap-4 bg-brand-blue/5 border border-brand-blue/10 px-6 py-3 rounded-2xl shadow-inner group">
           <div className="relative">
              <Radio className="h-5 w-5 text-brand-blue group-hover:animate-pulse transition-colors" />
              <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-brand-yellow animate-pulse" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Broadcast Hub</p>
              <p className="text-[9px] font-mono text-brand-blue/40 uppercase">Ready for Transmission</p>
           </div>
        </div>
      </header>

      {/* 02. CONSOLA DE DESPACHO (CLIENT COMPONENT) */}
      <section className="relative">
        {/* Acento lateral de integridad de la Bóveda */}
        <div className="absolute -left-4 top-0 h-full w-1 rounded-full bg-brand-yellow opacity-10" />
        
        {/* El cliente inyecta el simulador de alertas, el preview de terminal y el diagnóstico */}
        <AdminOpsNotificationsClient />
      </section>

      {/* FOOTER DE CONFORMIDAD TÉCNICA */}
      <footer className="mt-12 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 transition-opacity hover:opacity-50 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Network
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Activity className="h-3.5 w-3.5" /> Alerts v2.1 Active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> Relay node verified
        </div>
      </footer>
      
    </main>
  );
}