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
    <main className="space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 01. HEADER DE SECCIÓN */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-dark/5 dark:border-white/5 pb-8">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Map className="h-3.5 w-3.5" /> Organización de Catálogo
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tight">
            Categorías Temáticas
          </h1>
          <p className="mt-3 text-base text-muted font-light max-w-xl">
            Agrupa tus expediciones por estilos de viaje (Ej: Aventura, Cultura, Café, Lujo) para facilitar la navegación y el SEO de Knowing Cultures.
          </p>
        </div>
        
        <Button className="rounded-full bg-brand-blue text-white hover:bg-brand-dark shadow-pop transition-all text-[10px] font-bold uppercase tracking-widest px-8 h-12">
          <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
        </Button>
      </header>

      {/* 02. BARRA DE BÚSQUEDA TÁCTICA */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted opacity-50 group-focus-within:text-brand-blue group-focus-within:opacity-100 transition-all" />
          <input 
            type="text" 
            placeholder="Buscar categoría por nombre o tag..." 
            className="w-full h-12 pl-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm text-main outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-muted/30"
          />
        </div>
      </div>

      {/* 03. ESTADO VACÍO (EMPTY STATE PREMIUM) */}
      <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-16 text-center shadow-soft flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-blue opacity-10" />
        
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-2 border border-brand-dark/5 mb-8 group hover:scale-110 transition-all duration-500 shadow-inner">
          <Map className="h-10 w-10 text-brand-blue opacity-40 group-hover:opacity-100 group-hover:rotate-12 transition-all" />
        </div>
        
        <h2 className="text-2xl font-heading text-main mb-3 tracking-tight">Taxonomía en Blanco</h2>
        <p className="text-muted font-light max-w-md mx-auto mb-10 leading-relaxed">
          Todavía no has definido las etiquetas temáticas. Crea categorías para que tus clientes puedan filtrar los tours según sus pasiones e intereses.
        </p>
        
        <Button className="rounded-full bg-brand-dark text-brand-yellow hover:bg-brand-blue hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest px-10 h-14 shadow-lg active:scale-95">
          Crear mi primera categoría
        </Button>
      </div>

      {/* 04. FOOTER TÉCNICO DE SISTEMA */}
      <footer className="mt-16 flex items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-10 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3 w-3" /> Taxonomy Engine v1.0
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted tracking-widest uppercase">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 opacity-50" /> System Integrity: Nominal
          </span>
        </div>
      </footer>

    </main>
  );
}