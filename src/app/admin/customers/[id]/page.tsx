import 'server-only';
import type { Metadata } from 'next';
import { AdminCustomerClient } from './AdminCustomerClient';
import { ShieldCheck, Database } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Perfil 360 | Inteligencia de Cliente | KCE',
  description: 'Vista unificada de rastro digital, historial de reservas y eventos del sistema para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminCustomerPage:
 * Shell de servidor para la Bóveda de Identidad.
 * Delegamos el Header al cliente para mostrar el nombre dinámico del viajero.
 */
export default async function AdminCustomerPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-7xl space-y-4 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* COMPONENTE CLIENTE (Lógica interactiva y Perfil Detallado) */}
      <section className="relative">
        {/* Acento visual de la Bóveda */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
        
        {/* Pasamos el id correctamente al cliente */}
        <AdminCustomerClient id={id} />
      </section>

      {/* FOOTER TÁCTICO DE CONFORMIDAD */}
      <footer className="mt-12 flex flex-wrap items-center justify-center gap-6 border-t border-[color:var(--color-border)] pt-8 opacity-20 transition-opacity hover:opacity-50">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3 w-3" /> Core Identity Node v2.0
        </div>
        <div className="flex items-center gap-6 text-[10px] font-mono tracking-tighter uppercase">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3" /> P77 Integrity Verified
          </span>
          <span className="hidden sm:inline">|</span>
          <span>Privacy Level: Full Admin Access</span>
        </div>
      </footer>
      
    </main>
  );
}