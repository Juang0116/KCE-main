/* src/app/admin/qa/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import AdminQaClient from './AdminQaClient';
import { Rocket, Terminal, ShieldCheck } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Release Integrity | KCE Ops',
  description: 'Unidad de validación pre-vuelo, auditoría de infraestructura y verificación de flujo de revenue para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminQaPage:
 * Shell de servidor para el control de calidad y release.
 * Centraliza la validación sistémica antes del despliegue masivo de tráfico.
 */
export default async function AdminQaPage() {
  // 🔒 Validación de credenciales de nivel administrativo
  await requireAdmin();

  return (
    <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* El componente cliente centraliza el Score de Integridad, 
          el Auditor de APIs y el Debugger Forense de Revenue.
      */}
      <section className="relative">
        <AdminQaClient />
      </section>

      {/* FOOTER DE INFRAESTRUCTURA DE CALIDAD */}
      <footer className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-8 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Rocket className="h-3.5 w-3.5 text-brand-blue" /> RELEASE GATE v4.4
        </div>
        
        <div className="flex items-center gap-6 text-[10px] font-mono text-muted tracking-widest uppercase mt-4 sm:mt-0">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 opacity-50 text-emerald-500" /> System-Readiness: Verified
          </span>
          <span className="hidden sm:inline opacity-20">|</span>
          <span className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 opacity-50" /> Node: QA-Logic-01
          </span>
        </div>
      </footer>
      
    </main>
  );
}