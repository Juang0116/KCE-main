/* src/app/admin/destinations/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import { 
  MapPin, Plus, Search, Filter, 
  Globe, Terminal, ShieldCheck, 
  Sparkles, Activity, Zap, Compass 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Global Destinations | KCE Ops',
  description: 'Gestión de la arquitectura geográfica y nodos territoriales para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

export default function AdminDestinationsPage() {
  return (
    <main className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Globe className="h-3.5 w-3.5" /> Geographic Authority Lane
          </div>
          <h1 className="font-heading text-4xl md:text-6xl text-main tracking-tighter leading-none">
            Gestor de <span className="text-brand-yellow italic font-light">Destinos</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2">
            Configuración de nodos territoriales y regiones de operación. Estos datos alimentan la lógica de recomendación de Knowing Cultures S.A.S.
          </p>
        </div>
        
        <div className="flex gap-4 shrink-0">
          <Button className="rounded-full bg-brand-dark text-brand-yellow hover:bg-brand-blue hover:text-white transition-all text-xs font-bold uppercase tracking-widest px-10 h-14 shadow-pop active:scale-95">
            <Plus className="mr-3 h-5 w-5" /> Nuevo Destino
          </Button>
        </div>
      </header>

      {/* 02. INSTRUMENTACIÓN DE BÚSQUEDA */}
      <section className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
          <input 
            type="text" 
            placeholder="Buscar ciudad, región o territorio..." 
            className="w-full h-14 pl-14 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30"
          />
        </div>
        <Button variant="outline" className="h-14 rounded-2xl border-brand-dark/10 bg-surface px-8 text-xs font-bold uppercase tracking-widest text-muted hover:bg-surface-2 hover:text-main shadow-sm transition-all">
          <Filter className="h-4 w-4 mr-3" /> Filtrar Capas
        </Button>
      </section>

      {/* 03. BÓVEDA GEOGRÁFICA (ESTADO VACÍO LOOK) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-12 md:p-24 text-center shadow-soft flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
        {/* Decoración de fondo técnica */}
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
          <Compass className="h-96 w-96 text-brand-blue" />
        </div>

        <div className="relative z-10">
          <div className="flex h-28 w-28 items-center justify-center rounded-[2.5rem] bg-brand-blue/5 border border-brand-blue/10 mb-8 mx-auto group hover:scale-110 transition-all duration-700 shadow-inner">
            <MapPin className="h-12 w-12 text-brand-blue opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          </div>
          
          <h2 className="text-3xl font-heading text-main mb-4 tracking-tight">Cartografía en Blanco</h2>
          <p className="text-muted font-light max-w-lg mx-auto mb-12 leading-relaxed text-lg italic opacity-80">
            &quot;Sin destinos no hay historias. Inicia el despliegue geográfico para asociar experiencias a ubicaciones reales del territorio.&quot;
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <Button className="rounded-full bg-brand-dark text-brand-yellow hover:bg-brand-blue hover:text-white transition-all text-[10px] font-bold uppercase tracking-[0.2em] px-10 h-12 shadow-pop">
               Establecer Primer Nodo
             </Button>
             <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-surface-2 border border-brand-dark/5 text-[9px] font-bold uppercase tracking-widest text-muted">
                <Activity className="h-3 w-3 text-brand-blue animate-pulse" /> Standby: GPS Locked
             </div>
          </div>
        </div>
      </section>

      {/* 04. FOOTER TÉCNICO DE SISTEMA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-10 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3.5 w-3.5" /> Geographic Node v4.2
        </div>
        <div className="flex items-center gap-8 text-[10px] font-mono tracking-widest uppercase text-muted mt-4 sm:mt-0">
           <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 opacity-50 text-green-500" /> Map-Integrity: Validated
           </div>
           
           {/* ✅ FIX: Ahora el tag de cierre coincide correctamente con el de apertura */}
           <div className="hidden sm:inline opacity-20">|</div> 
           
           <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 opacity-50 text-brand-yellow" /> RAG-Knowledge: Ready
           </div>
        </div>
      </footer>

    </main>
  );
}