/* src/app/admin/customers/[id]/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { AdminCustomerClient } from './AdminCustomerClient';
import { ShieldCheck, Database, Terminal } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Customer Intelligence | KCE Ops',
  description:
    'Vista unificada de rastro digital, historial de reservas y eventos del sistema para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminCustomerPage:
 * Shell de servidor para la Bóveda de Identidad.
 * Delegamos el Header al cliente para mostrar el nombre dinámico del viajero.
 */
export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-7xl space-y-4 p-4 pb-24 duration-1000 md:p-6">
      {/* COMPONENTE CLIENTE (Lógica interactiva y Perfil Detallado) */}
      <section className="relative">
        {/* Acento visual de la Bóveda - Amarillo KCE */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-20 dark:opacity-40" />

        {/* Pasamos el id correctamente al cliente interactivo */}
        <AdminCustomerClient id={id} />
      </section>

      {/* FOOTER TÁCTICO DE CONFORMIDAD (Estilo Ops Core) */}
      <footer className="mt-12 flex flex-col items-center justify-center gap-8 border-t border-brand-dark/10 pt-10 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Database className="h-3 w-3 text-brand-blue" /> Core Identity Node v2.0
        </div>

        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />

        <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-muted">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 opacity-50" /> P77 Integrity Verified
          </span>
          <span className="hidden opacity-30 sm:inline">|</span>
          <span className="flex items-center gap-2 text-brand-blue">
            <Terminal className="h-3 w-3" /> Access: Level 0
          </span>
        </div>
      </footer>
    </main>
  );
}
