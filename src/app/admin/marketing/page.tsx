/* src/app/admin/marketing/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminMarketingClient } from './AdminMarketingClient';
import { Megaphone, Terminal, ShieldCheck } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Growth Intelligence | KCE Ops',
  description: 'Análisis de atribución UTM, rendimiento de campañas y telemetría de conversión para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminMarketingPage:
 * Shell de servidor para el Centro de Inteligencia de Crecimiento.
 * Delegamos la instrumentación al componente cliente para análisis en tiempo real.
 */
export default async function AdminMarketingPage() {
  // 🔒 Validación de credenciales de nivel administrativo
  await requireAdmin();

  return (
    <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* El componente cliente centraliza el Header de Crecimiento, 
          el Workbench Operativo y la Bóveda de Atribución.
      */}
      <section className="relative">
        <AdminMarketingClient />
      </section>

      {/* FOOTER DE INFRAESTRUCTURA DE CRECIMIENTO */}
      <footer className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-8 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Megaphone className="h-3.5 w-3.5 text-brand-blue" /> GROWTH CORE v4.1
        </div>
        
        <div className="flex items-center gap-6 text-[10px] font-mono text-muted tracking-widest uppercase mt-4 sm:mt-0">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 opacity-50 text-green-500" /> Attribution-Integrity: Validated
          </span>
          <span className="hidden sm:inline opacity-20">|</span>
          <span className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 opacity-50" /> Node: Market-Intel-01
          </span>
        </div>
      </footer>
      
    </main>
  );
}