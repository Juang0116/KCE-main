import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminAiLabClient } from './AdminAiLabClient';
import { Cpu, Terminal } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Lab Sandbox | KCE Ops',
  description: 'Simulador de interacciones y validación de contexto para la IA de Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

export default async function AdminAiPage() {
  // Mantenemos la protección de ruta
  await requireAdmin();
  
  return (
    <main className="space-y-8">
      
      {/* Quitamos el antiguo <AdminPageHeader /> porque el Client Component 
        ya tiene su propio header premium integrado. 
      */}
      <section className="relative">
        <AdminAiLabClient />
      </section>

      {/* FOOTER TÁCTICO DE INFRAESTRUCTURA */}
      <footer className="mt-12 flex items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-8 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Cpu className="h-3 w-3" /> AI Core Lab v2.6
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted tracking-widest uppercase">
          <span className="flex items-center gap-1.5">
            <Terminal className="h-3 w-3 opacity-50" /> Environment: Sandbox
          </span>
        </div>
      </footer>
      
    </main>
  );
}