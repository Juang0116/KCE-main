/* src/app/admin/deals/board/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminDealsBoardClient } from './AdminDealsBoardClient';
import { TrendingUp, Terminal, ShieldCheck } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Revenue Board | KCE Ops',
  description: 'Gestión visual del pipeline de ventas y aceleración de checkout para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminDealsBoardPage:
 * Shell de servidor para el Tablero Kanban de Negocios.
 * Delegamos la interfaz al componente cliente para permitir drag-and-drop
 * y actualizaciones de estado en tiempo real.
 */
export default async function AdminDealsBoardPage() {
  // 🔒 Verificación de credenciales de nivel administrador
  await requireAdmin();

  return (
    <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* El componente cliente centraliza el Header Táctico,
          el Workbench de Operaciones y la grilla Kanban.
      */}
      <section className="relative">
        <AdminDealsBoardClient />
      </section>

      {/* FOOTER DE INFRAESTRUCTURA COMERCIAL */}
      <footer className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-8 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <TrendingUp className="h-3.5 w-3.5 text-brand-blue" /> REVENUE FLOW v5.2
        </div>
        
        <div className="flex items-center gap-6 text-[10px] font-mono text-muted tracking-widest uppercase mt-4 sm:mt-0">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 opacity-50 text-green-500" /> Transaction-Integrity: Verified
          </span>
          <span className="hidden sm:inline opacity-20">|</span>
          <span className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 opacity-50" /> Node: Pipeline-Master
          </span>
        </div>
      </footer>
      
    </main>
  );
}