/* src/app/admin/customers/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminCustomersClient } from './AdminCustomersClient';
import { Users, Terminal, ShieldCheck } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Customer Intelligence | KCE Ops',
  description:
    'Directorio maestro de identidades y análisis relacional para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

export default async function AdminCustomersPage() {
  // 🔒 Bloqueo de seguridad de grado administrativo
  await requireAdmin();

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
      {/* El componente cliente centraliza el Header de Inteligencia, 
          la Consola de Segmentos y la Bóveda de Identidades.
      */}
      <section className="relative">
        <AdminCustomersClient />
      </section>

      {/* FOOTER DE INFRAESTRUCTURA RELACIONAL */}
      <footer className="mt-12 flex flex-col items-center justify-between border-t border-brand-dark/10 pt-8 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Users className="h-3.5 w-3.5 text-brand-blue" /> IDENTITY CORE v5.1
        </div>

        <div className="mt-4 flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-muted sm:mt-0">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500 opacity-50" /> Relational-Integrity:
            Active
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
