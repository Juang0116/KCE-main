// src/app/admin/reviews/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { 
  Star, 
  Terminal, 
  ShieldCheck, 
  Database, 
  MessageSquare, 
  Sparkles,
  UserCheck
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminReviewsClient } from './AdminReviewsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reputation Center | Admin KCE',
  description: 'Unidad de curación de feedback y moderación de testimonios para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminReviewsPage:
 * Shell de servidor para la gestión de la reputación pública.
 * Establece la soberanía de marca antes de montar el cliente de moderación.
 */
export default async function AdminReviewsPage() {
  // Garantizar acceso administrativo en el nodo raíz
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1500px] space-y-12 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA DE ALTO MANDO (REPUTATION VAULT) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10 px-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Social Lane: /reputation-center
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight tracking-tight">
            Curación de <span className="text-brand-yellow italic font-light">Feedback</span>
          </h1>
          <p className="text-base text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Unidad de gestión de reputación. Supervisa el flujo de testimonios, valida el material multimedia 
            y asegura que la prueba social de KCE sea íntegra y de alta conversión.
          </p>
        </div>

        {/* Status de Confianza del Nodo */}
        <div className="flex items-center gap-6 bg-brand-blue/5 border border-brand-blue/10 p-6 rounded-[2.5rem] shadow-inner group">
           <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110">
              <Star className="h-6 w-6 text-brand-yellow fill-brand-yellow animate-pulse" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/60">Trust Signal</p>
              <p className="text-xs font-mono text-emerald-600 font-bold uppercase">Reputation Sync Active</p>
           </div>
        </div>
      </header>

      {/* 02. TERMINAL DE MODERACIÓN (CLIENT COMPONENT) */}
      <section className="relative pt-4">
         <div className="mb-8 flex items-center gap-4 px-2">
            <MessageSquare className="h-5 w-5 text-brand-blue opacity-30" />
            <h2 className="font-heading text-2xl text-brand-dark">Review Triage Interface</h2>
         </div>

         {/* Acento lateral de integridad de la Bóveda */}
         <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
         
         {/* El cliente maneja las pestañas de estado, las tarjetas de reseña y las acciones de API */}
         <AdminReviewsClient />
      </section>

      {/* FOOTER DE CONFORMIDAD TÉCNICA */}
      <footer className="mt-20 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Social Proof Verified
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <UserCheck className="h-3.5 w-3.5" /> Identity Node Active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> Registry Integrity: 100%
        </div>
      </footer>
      
    </main>
  );
}