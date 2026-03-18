// src/app/admin/deals/board/page.tsx
import 'server-only';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminDealsBoardClient } from './AdminDealsBoardClient';
import { LayoutDashboard, ShieldCheck, Terminal, Zap } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pipeline Board | Admin KCE',
  description: 'Gestión visual de oportunidades comerciales y velocidad de cierre para Knowing Cultures Enterprise.',
  robots: { index: false, follow: false },
};

/**
 * AdminDealsBoardPage:
 * Shell de servidor para el Tablero Kanban.
 * Garantiza acceso administrativo y despliega el motor de ventas.
 * Eliminamos headers redundantes para maximizar el espacio de trabajo de las columnas.
 */
export default async function AdminDealsBoardPage() {
  // 01. Seguridad de Capa 0
  await requireAdmin();

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 p-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 02. NODO DE IDENTIFICACIÓN SUTIL */}
      <div className="flex items-center justify-between px-2 opacity-50 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <Terminal className="h-3.5 w-3.5 text-brand-blue" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            Commercial Lane: /pipeline-board
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-tighter">
            Node Synchronized
          </span>
        </div>
      </div>

      {/* 03. MOTOR DEL TABLERO (CLIENTE INTERACTIVO) */}
      <section className="relative">
        {/* Acento lateral de integridad visual */}
        <div className="absolute -left-4 top-24 h-[calc(100%-6rem)] w-1 rounded-full bg-brand-yellow opacity-10" />
        
        {/* El cliente maneja el Kanban, los KPIs y la lógica de mando */}
        <AdminDealsBoardClient />
      </section>

      {/* 04. FOOTER DE CONFORMIDAD COMERCIAL */}
      <footer className="mt-12 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Sales Data
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <LayoutDashboard className="h-3.5 w-3.5" /> Kanban Engine v3.2
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Zap className="h-3.5 w-3.5" /> P77 Velocity Protocol
        </div>
      </footer>
      
    </main>
  );
}