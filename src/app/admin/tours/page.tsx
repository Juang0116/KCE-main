/* src/app/admin/tours/page.tsx */
import type { Metadata } from 'next';
import { Compass, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Gestor de Tours | KCE Admin',
  robots: { index: false, follow: false },
};

export default function AdminToursPage() {
  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER DE LA PÁGINA */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-dark/5 dark:border-white/5 pb-8">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Compass className="h-3.5 w-3.5" /> Catálogo de Experiencias
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tight">
            Gestor de Tours
          </h1>
          <p className="mt-2 text-sm text-muted font-light max-w-xl">
            Crea, edita y organiza las expediciones que se mostrarán a los viajeros en la plataforma principal de Knowing Cultures.
          </p>
        </div>
        
        <Button className="rounded-full bg-brand-blue text-white hover:bg-brand-dark transition-all text-[10px] font-bold uppercase tracking-widest px-8 h-12 shadow-pop">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Tour
        </Button>
      </header>

      {/* BARRA DE FILTROS */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted opacity-50" />
          <input 
            type="text" 
            placeholder="Buscar expedición por nombre..." 
            className="w-full h-12 pl-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm text-main outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
          />
        </div>
        <Button variant="outline" className="h-12 rounded-2xl border-brand-dark/10 px-6 text-muted hover:text-main">
          <Filter className="h-4 w-4 mr-2" /> Filtrar
        </Button>
      </div>

      {/* ESTADO VACÍO (Empty State) */}
      <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-16 text-center shadow-soft flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-2 border border-brand-dark/5 mb-6 group hover:scale-110 transition-transform duration-500">
          <Compass className="h-10 w-10 text-brand-blue opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
        <h2 className="text-2xl font-heading text-main mb-3 tracking-tight">Tu catálogo está esperando</h2>
        <p className="text-muted font-light max-w-md mx-auto mb-10 leading-relaxed">
          Aún no has creado ninguna expedición. Comienza a diseñar tu primer tour para que los viajeros puedan descubrir la Colombia real.
        </p>
        <Button className="rounded-full bg-brand-dark text-brand-yellow hover:bg-brand-blue hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest px-8 h-12 shadow-lg">
          Crear mi primera experiencia
        </Button>
      </div>

    </div>
  );
}