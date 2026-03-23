/* src/app/admin/catalog/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { AdminCatalogClient } from './AdminCatalogClient';
import { Layers, ShieldCheck, Tag, Terminal } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Pricing & Catálogo | KCE Ops',
  description: 'Control de reglas de pricing dinámico y arquitectura de colecciones para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

/**
 * AdminCatalogPage:
 * Contenedor de nivel superior para el motor de inventario.
 * Este Server Component asegura que la lógica de reglas se cargue 
 * siempre de forma dinámica para reflejar los cambios de yield management.
 */
export default function AdminCatalogPage() {
  return (
    <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* COMPONENTE DE CLIENTE (Lógica interactiva de Reglas y Tablas) 
          Delegamos el Header Institucional a este componente para evitar duplicación visual.
      */}
      <section className="relative">
        {/* Acento visual de "Data Integrity" - Un toque de amarillo KCE */}
        <div className="absolute -left-4 top-0 h-full w-1 bg-brand-yellow rounded-full opacity-20 dark:opacity-40" />
        <AdminCatalogClient />
      </section>

      {/* FOOTER TÁCTICO DE SISTEMA */}
      <footer className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-brand-dark/10 dark:border-white/10 pt-8 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Layers className="h-3 w-3" /> Yield Engine v2.4
        </div>
        
        <div className="flex items-center gap-6 text-[10px] font-mono tracking-widest uppercase text-muted">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 opacity-50" /> Standard P77 Verified
          </span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span className="flex items-center gap-1.5">
            <Terminal className="h-3 w-3 opacity-50" /> Currency: Multi-FX Active
          </span>
        </div>
      </footer>
      
    </main>
  );
}