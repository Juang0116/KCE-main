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
  Cpu,
} from 'lucide-react';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminReviewsClient } from './AdminReviewsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reputation Vault | KCE Ops',
  description:
    'Unidad de curación de reputación, moderación de testimonios y validación de social proof para Knowing Cultures S.A.S.',
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
    <main className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-[1500px] space-y-12 p-4 pb-24 duration-1000 md:p-6">
      {/* 01. CABECERA DE ALTO MANDO (MISSION CONTROL) */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 px-2 pb-10 dark:border-white/5 lg:flex-row lg:items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue shadow-inner backdrop-blur-xl">
            <Terminal className="h-4 w-4" /> Social Lane: /reputation-vault-01
          </div>
          <h1 className="font-heading text-5xl leading-none tracking-tighter text-main md:text-7xl">
            Curación de <span className="font-light italic text-brand-yellow">Feedback</span>
          </h1>
          <p className="mt-2 max-w-3xl border-l-2 border-brand-yellow/20 pl-6 text-lg font-light italic leading-relaxed text-muted">
            Unidad de gestión de reputación. Supervisa el flujo de testimonios, valida el material
            multimedia y asegura que la prueba social de Knowing Cultures S.A.S. sea íntegra, veraz
            y de alta conversión.
          </p>
        </div>

        {/* Status de Confianza del Nodo (Widget Premium) */}
        <div className="group relative flex items-center gap-6 overflow-hidden rounded-[2.5rem] border border-brand-dark/5 bg-surface p-8 shadow-pop transition-all hover:border-brand-blue/20 dark:border-white/5">
          <div className="absolute -right-4 -top-4 opacity-[0.02] transition-transform duration-700 group-hover:scale-110">
            <Cpu className="h-24 w-24 text-brand-blue" />
          </div>
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 shadow-inner transition-transform group-hover:rotate-12">
            <Star className="h-8 w-8 animate-pulse fill-brand-yellow text-brand-yellow" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
              Trust Signal
            </p>
            <p className="font-mono text-sm font-bold uppercase tracking-widest text-green-600 dark:text-green-400">
              Reputation Sync Active
            </p>
          </div>
        </div>
      </header>

      {/* 02. TERMINAL DE MODERACIÓN DINÁMICA */}
      <section className="relative px-2">
        {/* Acento lateral de la Bóveda Reputation - Amarillo KCE */}
        <div className="absolute -left-6 top-24 h-[calc(100%-6rem)] w-1.5 rounded-full bg-brand-yellow opacity-20 dark:opacity-40" />

        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-blue/5 bg-brand-blue/10 text-brand-blue shadow-inner">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading text-3xl uppercase leading-none tracking-tight text-main">
                Review Triage Interface
              </h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40">
                Multi-Channel Feedback Moderation
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-3 rounded-full border border-brand-dark/5 bg-surface-2 px-5 py-2 sm:flex">
            <Activity className="h-4 w-4 animate-pulse text-brand-blue" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
              Social Trace Live
            </span>
          </div>
        </div>

        {/* El cliente maneja las pestañas, filtros y acciones de moderación */}
        <AdminReviewsClient />
      </section>

      {/* 03. FOOTER DE CONFORMIDAD TÉCNICA (Estilo Ops Core) */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Social Proof Verified
        </div>

        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />

        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <UserCheck className="h-4 w-4 opacity-50" /> Identity Node v2.1
        </div>

        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />

        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Database className="h-4 w-4" /> Registry Integrity: 100%
        </div>
      </footer>
    </main>
  );
}
