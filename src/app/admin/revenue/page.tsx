/* src/app/admin/revenue/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminRevenueOpsClient } from './AdminRevenueOpsClient';
import { TrendingUp, Terminal, ShieldCheck } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Revenue Intelligence | KCE Ops',
  description: 'Análisis de flujo de caja, optimización de conversión y telemetría de pipeline para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminRevenuePage:
 * Shell de servidor para el Centro de Inteligencia de Revenue.
 * Delegamos la instrumentación al componente cliente para análisis forense en tiempo real.
 */
export default async function AdminRevenuePage() {
  // 🔒 Validación de credenciales de nivel administrativo
  await requireAdmin();

  return (
    <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* El componente cliente centraliza el Header Financiero, 
          el Workbench de Optimización y el Neural Engine.
      */}
      <section className="relative">
        <AdminRevenueOpsClient />
      </section>

      {/* FOOTER DE INFRAESTRUCTURA FINANCIERA */}
      <footer className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-8 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <TrendingUp className="h-3.5 w-3.5 text-brand-blue" /> REVENUE CORE v2.4
        </div>
        
        <div className="flex items-center gap-6 text-[10px] font-mono text-muted tracking-widest uppercase mt-4 sm:mt-0">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 opacity-50 text-emerald-500" /> Fiscal-Integrity: Validated
          </span>
          <span className="hidden sm:inline opacity-20">|</span>
          <span className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 opacity-50" /> Node: Rev-Intel-01
          </span>
        </div>
      </footer>
      
    </main>
  );
}