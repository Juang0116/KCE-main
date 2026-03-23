/* src/app/admin/outbound/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminOutboundClient } from './AdminOutboundClient';
import { Send, Terminal, ShieldCheck } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Outbound Operations | KCE Ops',
  description: 'Gestión de comunicaciones salientes, automatización de mensajería y auditoría de atribución para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminOutboundPage:
 * Shell de servidor para el Centro de Outbound.
 * Delega la instrumentación táctica al componente cliente para gestión en tiempo real.
 */
export default async function AdminOutboundPage() {
  // 🔒 Validación de credenciales de nivel administrativo
  await requireAdmin();

  return (
    <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* El componente cliente centraliza el Header de Outbound, 
          el Workbench Táctico y la Bóveda de Transmisiones.
      */}
      <section className="relative">
        <AdminOutboundClient />
      </section>

      {/* FOOTER DE INFRAESTRUCTURA DE MENSAJERÍA */}
      <footer className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-8 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Send className="h-3.5 w-3.5 text-brand-blue" /> OUTBOUND CORE v3.1
        </div>
        
        <div className="flex items-center gap-6 text-[10px] font-mono text-muted tracking-widest uppercase mt-4 sm:mt-0">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 opacity-50 text-green-500" /> Relay-Integrity: Active
          </span>
          <span className="hidden sm:inline opacity-20">|</span>
          <span className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 opacity-50" /> Protocol: P77-Auth
          </span>
        </div>
      </footer>
      
    </main>
  );
}