/* src/app/admin/bookings/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminBookingsClient } from './AdminBookingsClient';
import { Banknote, Terminal } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Monitor de Reservas | KCE Ops',
  description: 'Gestión de cumplimiento y monitoreo de pagos para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

export default async function AdminBookingsPage() {
  // 🔒 Bloqueo de seguridad a nivel de servidor
  await requireAdmin();

  return (
    <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Delegamos el Header Táctico al Client Component para permitir 
          filtros interactivos y estados de sincronización en tiempo real.
      */}
      <section className="relative">
        <AdminBookingsClient />
      </section>

      {/* FOOTER DE INFRAESTRUCTURA OPERATIVA */}
      <footer className="mt-12 flex items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-8 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Banknote className="h-3 w-3" /> FULFILLMENT CORE v5.2
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted tracking-widest uppercase">
          <span className="flex items-center gap-1.5">
            <Terminal className="h-3 w-3 opacity-50" /> Ledger: Verified
          </span>
        </div>
      </footer>
      
    </main>
  );
}