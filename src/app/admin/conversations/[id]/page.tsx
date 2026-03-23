/* src/app/admin/conversations/[id]/page.tsx */
import 'server-only';

import { AdminConversationClient } from './AdminConversationClient';
import type { Metadata } from 'next';
import { ShieldCheck, Terminal, Zap } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Consola de Mensajería | KCE Ops',
  description: 'Gestión de hilos de conversación y soporte inteligente para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminConversationPage:
 * Contenedor de servidor para la terminal de chat. 
 * Actúa como el Shell que recibe el ID de la sesión y monta el cliente interactivo.
 */
export default async function AdminConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-7xl space-y-4 p-4 md:p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* COMPONENTE DE CLIENTE (LÓGICA DE CHAT & HEADER DINÁMICO) */}
      <section className="relative min-h-[800px]">
        {/* Acento lateral de integridad visual - Amarillo KCE */}
        <div className="absolute -left-4 top-0 h-full w-1 rounded-full bg-brand-yellow opacity-20 dark:opacity-40" />
        
        {/* El cliente maneja su propio Header con la identidad del viajero */}
        <AdminConversationClient id={id} />
      </section>

      {/* FOOTER DE CONFORMIDAD TÉCNICA (Estilo Ops Core) */}
      <footer className="flex flex-col sm:flex-row items-center justify-center gap-8 border-t border-brand-dark/10 dark:border-white/10 pt-10 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.4em] text-muted">
          <ShieldCheck className="h-3 w-3 text-brand-blue" /> End-to-End Encryption
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3 w-3" /> Intelligence Node v2.0
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Zap className="h-3 w-3 fill-current" /> Protocol: Handoff-Safe
        </div>
      </footer>
      
    </main>
  );
}