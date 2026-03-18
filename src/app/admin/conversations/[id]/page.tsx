import 'server-only';

import { AdminConversationClient } from './AdminConversationClient';
import type { Metadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Consola de Mensajería | Admin KCE',
  description: 'Gestión de hilos de conversación y soporte inteligente para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminConversationPage:
 * Contenedor de servidor para la terminal de chat. 
 * Actúa como el Shell que recibe el ID de la sesión y monta el cliente interactivo.
 * Eliminamos el nav redundante para evitar duplicación con el header del cliente.
 */
export default async function AdminConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-7xl space-y-4 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* COMPONENTE DE CLIENTE (LÓGICA DE CHAT & HEADER DINÁMICO) */}
      <section className="relative min-h-[800px]">
        {/* Acento lateral de integridad visual */}
        <div className="absolute -left-4 top-0 h-full w-1 rounded-full bg-brand-yellow opacity-10" />
        
        {/* El cliente maneja su propio Header con la identidad del viajero */}
        <AdminConversationClient id={id} />
      </section>

      {/* FOOTER DE CONFORMIDAD TÉCNICA */}
      <footer className="flex flex-wrap items-center justify-center gap-6 border-t border-[var(--color-border)] pt-8 opacity-20 transition-opacity hover:opacity-50">
        <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          End-to-End Encryption Active
        </div>
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-blue" />
        <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          KCE Intelligence Node v2.0
        </div>
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-blue" />
        <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          Protocol: Handoff-Safe
        </div>
      </footer>
      
    </main>
  );
}