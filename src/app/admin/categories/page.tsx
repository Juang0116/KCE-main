/* src/app/admin/categories/page.tsx */
import type { Metadata } from 'next';
import { Map, Plus, Search, Terminal, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Categorías | KCE Ops',
  description: 'Gestión de taxonomía y estilos de viaje para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

export default function AdminCategoriesPage() {
  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 space-y-8 pb-24 duration-700">
      {/* 01. HEADER DE SECCIÓN */}
      <header className="flex flex-col justify-between gap-6 border-b border-brand-dark/5 pb-8 dark:border-white/5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Map className="h-3.5 w-3.5" /> Organización de Catálogo
          </div>
          <h1 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
            Categorías Temáticas
          </h1>
          <p className="mt-3 max-w-xl text-base font-light text-muted">
            Agrupa tus expediciones por estilos de viaje (Ej: Aventura, Cultura, Café, Lujo) para
            facilitar la navegación y el SEO de Knowing Cultures.
          </p>
        </div>

        <Button className="h-12 rounded-full bg-brand-blue px-8 text-[10px] font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:bg-brand-dark">
          <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
        </Button>
      </header>

      {/* 02. BARRA DE BÚSQUEDA TÁCTICA */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <div className="group relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted opacity-50 transition-all group-focus-within:text-brand-blue group-focus-within:opacity-100" />
          <input
            type="text"
            placeholder="Buscar categoría por nombre o tag..."
            className="placeholder:text-muted/30 h-12 w-full rounded-2xl border border-brand-dark/10 bg-surface pl-12 text-sm text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
          />
        </div>
      </div>

      {/* 03. ESTADO VACÍO (EMPTY STATE PREMIUM) */}
      <div className="relative flex min-h-[450px] flex-col items-center justify-center overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-16 text-center shadow-soft dark:border-white/5">
        {/* Decoración de fondo */}
        <div className="absolute left-0 top-0 h-1 w-full bg-brand-blue opacity-10" />

        <div className="group mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-brand-dark/5 bg-surface-2 shadow-inner transition-all duration-500 hover:scale-110">
          <Map className="h-10 w-10 text-brand-blue opacity-40 transition-all group-hover:rotate-12 group-hover:opacity-100" />
        </div>

        <h2 className="mb-3 font-heading text-2xl tracking-tight text-main">Taxonomía en Blanco</h2>
        <p className="mx-auto mb-10 max-w-md font-light leading-relaxed text-muted">
          Todavía no has definido las etiquetas temáticas. Crea categorías para que tus clientes
          puedan filtrar los tours según sus pasiones e intereses.
        </p>

        <Button className="h-14 rounded-full bg-brand-dark px-10 text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-lg transition-all hover:bg-brand-blue hover:text-white active:scale-95">
          Crear mi primera categoría
        </Button>
      </div>

      {/* 04. FOOTER TÉCNICO DE SISTEMA */}
      <footer className="mt-16 flex items-center justify-between border-t border-brand-dark/10 pt-10 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3 w-3" /> Taxonomy Engine v1.0
        </div>
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-muted">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 opacity-50" /> System Integrity: Nominal
          </span>
        </div>
      </footer>
    </main>
  );
}
