import 'server-only';
import type { Metadata } from 'next';
import { AdminDealDetailClient } from './AdminDealDetailClient';
import { ShieldCheck, Terminal, Target } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Cabina de Cierre | Admin KCE',
  description: 'Análisis forense y ejecución táctica de negociaciones para Knowing Cultures Enterprise.',
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
    <main className="mx-auto max-w-7xl space-y-6 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* COMPONENTE CLIENTE (Lógica de Timeline, Playback y Mando) */}
      <section className="relative">
        {/* Acento lateral de integridad visual */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
        
        {/* Pasamos el id correctamente al cliente */}
        <AdminDealDetailClient id={id} />
      </section>

      {/* FOOTER DE CONFORMIDAD TÉCNICA */}
      <footer className="mt-16 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Terminal className="h-3.5 w-3.5" /> Cognitive Close Node v2.1
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Negotiation Traceability Active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Target className="h-3.5 w-3.5" /> P77 High-Impact Protocol
        </div>
      </footer>
      
    </main>
  );
}