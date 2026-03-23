/* src/app/admin/agents/page.tsx */
import 'server-only';
import AdminAgentsClient from './AdminAgentsClient';
import { Bot } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = { 
  title: 'Fuerza Laboral IA | KCE Ops',
  description: 'Supervisión de la fuerza laboral sintética y automatización de procesos de Knowing Cultures S.A.S.'
};

/**
 * AdminAgentsPage:
 * Este es un Server Component que actúa como contenedor de seguridad.
 * Asegura que el cliente solo se cargue si el usuario tiene privilegios 
 * de administrador (gestionado por el middleware y layouts superiores).
 */
export default async function AdminAgentsPage() {
  return (
    <main className="space-y-8">
      {/* Mantenemos el Server Component ligero. 
        El AdminAgentsClient ya maneja su propio header táctico 
        para permitir estados de carga y feedback en tiempo real.
      */}
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <AdminAgentsClient />
      </section>

      {/* Footer Técnico sutil de Administración */}
      <footer className="mt-12 flex items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-8 opacity-40">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
          <Bot className="h-3 w-3" /> Autonomous Engine v2.0
        </div>
        <div className="text-[10px] font-mono text-muted uppercase tracking-widest">
          REF: AGENT_CONTROL_LANE_PROD
        </div>
      </footer>
    </main>
  );
}