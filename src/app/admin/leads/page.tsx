/* src/app/admin/leads/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminLeadsClient } from './AdminLeadsClient';
import { Users, Terminal, ShieldCheck } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lead Acquisition | KCE Ops',
  description:
    'Gestión táctica de prospectos y nutrición de señales de interés para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

export default async function AdminLeadsPage() {
  // 🔒 Blindaje de seguridad administrativo
  await requireAdmin();

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
      {/* El componente cliente centraliza el Header de Adquisición, 
          el Workbench Táctico y la Bóveda de Prospectos.
      */}
      <section className="relative">
        <AdminLeadsClient />
      </section>

      {/* FOOTER DE INFRAESTRUCTURA DE ADQUISICIÓN */}
      <footer className="mt-12 flex flex-col items-center justify-between border-t border-brand-dark/10 pt-8 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Users className="h-3.5 w-3.5 text-brand-blue" /> ACQUISITION CORE v4.4
        </div>

        <div className="mt-4 flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-muted sm:mt-0">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500 opacity-50" /> Lead-Integrity: Active
          </span>
          <span className="hidden opacity-20 sm:inline">|</span>
          <span className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 opacity-50" /> Sync: Validated
          </span>
        </div>
      </footer>
    </main>
  );
}
