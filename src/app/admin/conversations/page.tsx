/* src/app/admin/conversations/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import AdminConversationsClient from './AdminConversationsClient';
import { MessageSquare, Terminal } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Communication Hub | KCE Ops',
  description: 'Supervisión de flujos conversacionales y gestión de handoff para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

export default async function AdminConversationsPage() {
  // 🔒 Bloqueo de seguridad a nivel de servidor
  await requireAdmin();

  return (
    <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* El componente cliente maneja el Header Táctico, los Filtros 
          y la Bóveda de Mensajería para permitir interactividad en tiempo real.
      */}
      <section className="relative">
        <AdminConversationsClient />
      </section>

      {/* FOOTER DE INFRAESTRUCTURA DE COMUNICACIONES */}
      <footer className="mt-12 flex items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-8 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <MessageSquare className="h-3 w-3" /> COMMS CORE v4.1
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted tracking-widest uppercase">
          <span className="flex items-center gap-1.5">
            <Terminal className="h-3 w-3 opacity-50" /> Sync: Encrypted
          </span>
        </div>
      </footer>
      
    </main>
  );
}