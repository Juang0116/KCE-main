/* src/app/admin/reviews/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { 
  Star, 
  Terminal, 
  ShieldCheck, 
  Database, 
  MessageSquare, 
  Sparkles,
  UserCheck,
  Activity,
  Cpu
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminReviewsClient } from './AdminReviewsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reputation Vault | KCE Ops',
  description: 'Unidad de curación de reputación, moderación de testimonios y validación de social proof para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminReviewsPage:
 * Shell de servidor para la gestión de la reputación pública.
 * Establece la soberanía de marca antes de montar el motor de moderación dinámico.
 */
export default async function AdminReviewsPage() {
  // 🔒 Protocolo de seguridad: Verificación de nivel administrativo en el nodo raíz
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-12 p-4 md:p-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA DE ALTO MANDO (MISSION CONTROL) */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue backdrop-blur-xl shadow-inner">
            <Terminal className="h-4 w-4" /> Social Lane: /reputation-vault-01
          </div>
          <h1 className="font-heading text-5xl md:text-7xl text-main tracking-tighter leading-none">
            Curación de <span className="text-brand-yellow italic font-light">Feedback</span>
          </h1>
          <p className="text-lg text-muted font-light max-w-3xl leading-relaxed mt-2 border-l-2 border-brand-yellow/20 pl-6 italic">
            Unidad de gestión de reputación. Supervisa el flujo de testimonios, valida el material multimedia 
            y asegura que la prueba social de Knowing Cultures S.A.S. sea íntegra, veraz y de alta conversión.
          </p>
        </div>

        {/* Status de Confianza del Nodo (Widget Premium) */}
        <div className="flex items-center gap-6 bg-surface border border-brand-dark/5 dark:border-white/5 p-8 rounded-[2.5rem] shadow-pop group hover:border-brand-blue/20 transition-all relative overflow-hidden">
           <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:scale-110 transition-transform duration-700">
              <Cpu className="h-24 w-24 text-brand-blue" />
           </div>
           <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 shadow-inner transition-transform group-hover:rotate-12">
              <Star className="h-8 w-8 text-brand-yellow fill-brand-yellow animate-pulse" />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">Trust Signal</p>
              <p className="text-sm font-mono text-green-600 dark:text-green-400 font-bold uppercase tracking-widest">Reputation Sync Active</p>
           </div>
        </div>
      </header>

      {/* 02. TERMINAL DE MODERACIÓN DINÁMICA */}
      <section className="relative px-2">
         {/* Acento lateral de la Bóveda Reputation - Amarillo KCE */}
         <div className="absolute -left-6 top-24 h-[calc(100%-6rem)] w-1.5 rounded-full bg-brand-yellow opacity-20 dark:opacity-40" />

         <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner border border-brand-blue/5">
                  <MessageSquare className="h-6 w-6" />
               </div>
               <div>
                  <h2 className="font-heading text-3xl text-main tracking-tight uppercase leading-none">Review Triage Interface</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40 mt-1">Multi-Channel Feedback Moderation</p>
               </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 px-5 py-2 rounded-full bg-surface-2 border border-brand-dark/5">
               <Activity className="h-4 w-4 text-brand-blue animate-pulse" />
               <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">Social Trace Live</span>
            </div>
         </div>
         
         {/* El cliente maneja las pestañas, filtros y acciones de moderación */}
         <AdminReviewsClient />
      </section>

      {/* 03. FOOTER DE CONFORMIDAD TÉCNICA (Estilo Ops Core) */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Social Proof Verified
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <UserCheck className="h-4 w-4 opacity-50" /> Identity Node v2.1
        </div>
        
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Database className="h-4 w-4" /> Registry Integrity: 100%
        </div>
      </footer>
      
    </main>
  );
}