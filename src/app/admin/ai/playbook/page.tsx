import 'server-only';
import type { Metadata } from 'next';
import { AdminAiPlaybookClient } from './AdminAiPlaybookClient';
import { Sparkles, Terminal } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Playbook IA | KCE Ops',
  description: 'Gestión de alineación cognitiva y base de conocimiento para la inteligencia artificial de Knowing Cultures S.A.S.',
  robots: { index: false, follow: false }, // 🔒 Excelente práctica de seguridad SEO
};

/**
 * AdminAiPlaybookPage:
 * Contenedor de nivel superior para la gestión del "cerebro" de la IA.
 * Este Server Component prepara el contexto de seguridad y SEO antes de 
 * montar el cliente interactivo.
 */
export default function AdminAiPlaybookPage() {
  return (
    <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Delegamos el Header Táctico y toda la interactividad al Client Component 
        para evitar duplicación visual y mantener la arquitectura limpia.
      */}
      <section className="relative">
        <AdminAiPlaybookClient />
      </section>

      {/* FOOTER TÁCTICO DE INFRAESTRUCTURA */}
      <footer className="mt-12 flex items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-8 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Sparkles className="h-3 w-3" /> Cognitive Kernel v1.8
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted tracking-widest uppercase">
          <span className="flex items-center gap-1.5">
            <Terminal className="h-3 w-3 opacity-50" /> Endpoint: /api/ai/context
          </span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span className="hidden sm:inline text-brand-blue">Status: RAG-Ready</span>
        </div>
      </footer>
      
    </main>
  );
}