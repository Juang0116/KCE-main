/* src/app/admin/deals/[id]/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { AdminDealDetailClient } from './AdminDealDetailClient';
import { ShieldCheck, Terminal, Target } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Closing Cabin | KCE Ops',
  description: 'Análisis forense y ejecución táctica de negociaciones para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminDealDetailPage:
 * Shell de servidor para la terminal de Deals.
 * Delegamos el Header al componente cliente para mostrar la identidad dinámica del negocio.
 */
export default async function AdminDealDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* COMPONENTE CLIENTE (Lógica de Timeline, Playback y Mando) */}
      <section className="relative">
        {/* Acento lateral de integridad visual - Amarillo KCE */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-20 dark:opacity-40" />
        
        {/* Pasamos el id correctamente al cliente interactivo */}
        <AdminDealDetailClient id={id} />
      </section>

      {/* FOOTER DE CONFORMIDAD TÉCNICA (Estilo Ops Core) */}
      <footer className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-10 border-t border-brand-dark/10 dark:border-white/10 pt-12 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3.5 w-3.5 text-brand-blue" /> Cognitive Close Node v2.1
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <ShieldCheck className="h-3.5 w-3.5 opacity-50" /> Negotiation Traceability
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Target className="h-3.5 w-3.5 fill-current opacity-70" /> P77 High-Impact Protocol
        </div>
      </footer>
      
    </main>
  );
}