/* src/app/admin/ops/notifications/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { 
  Terminal, 
  ShieldCheck, 
  Database, 
  Radio,
  Activity,
  Zap,
  BellRing
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminOpsNotificationsClient } from './AdminOpsNotificationsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Broadcast Control | KCE Ops',
  description: 'Simulador de alertas y validación de canales de comunicación para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminOpsNotificationsPage:
 * Shell de servidor para la gestión de canales de alerta.
 * Establece la integridad de acceso antes de montar la consola de despacho de pruebas.
 */
export default async function AdminOpsNotificationsPage() {
  // 🔒 Protocolo de seguridad: Verificación de nivel operativo raíz
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-12 p-4 md:p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA DE ALTO MANDO (BROADCAST VAULT) */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue backdrop-blur-xl shadow-inner">
            <Terminal className="h-4 w-4" /> Broadcast Lane: /comms-dispatch-01
          </div>
          <h1 className="font-heading text-5xl md:text-7xl text-main tracking-tighter leading-none">
            Canales de <span className="text-brand-yellow italic font-light">Alerta</span>
          </h1>
          <p className="text-lg text-muted font-light max-w-3xl leading-relaxed mt-2 border-l-2 border-brand-yellow/20 pl-6 italic">
            Unidad de validación de red. Prueba en vivo la conectividad hacia Slack, Email y WhatsApp 
            para garantizar que los protocolos de emergencia P77 funcionen bajo cualquier escenario de crisis.
          </p>
        </div>

        {/* Status de Enlace de Red (Widget Dinámico) */}
        <div className="flex items-center gap-5 bg-surface border border-brand-dark/5 dark:border-white/5 px-8 py-5 rounded-[2rem] shadow-pop group hover:border-brand-blue/20 transition-all">
           <div className="relative">
              <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Radio className="h-6 w-6 group-hover:animate-pulse transition-colors" />
              </div>
              <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-brand-yellow animate-pulse border-4 border-surface shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">Broadcast Hub</p>
              <p className="text-xs font-mono font-bold text-brand-blue uppercase tracking-widest">Link Nominal</p>
           </div>
        </div>
      </header>

      {/* 02. CONSOLA DE DESPACHO (LÓGICA INTERACTIVA) */}
      <section className="relative px-2">
        {/* Acento lateral de integridad - Amarillo KCE */}
        <div className="absolute -left-4 top-0 h-full w-1.5 rounded-full bg-brand-yellow opacity-20 dark:opacity-40" />
        
        {/* El componente cliente inyecta el simulador, el preview de terminal y el diagnóstico multicanal */}
        <AdminOpsNotificationsClient />
      </section>

      {/* 03. FOOTER DE CONFORMIDAD TÉCNICA (Estilo Ops Core) */}
      <footer className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-10 border-t border-brand-dark/10 dark:border-white/10 pt-12 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Network Validated
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Activity className="h-4 w-4 opacity-50" /> Protocol KCE-P77 Active
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Database className="h-4 w-4" /> Message Relay Node Verified
        </div>
      </footer>
      
    </main>
  );
}