/* src/app/admin/destinations/page.tsx */
import 'server-only';
import type { Metadata } from 'next';
import {
  MapPin,
  Plus,
  Search,
  Filter,
  Globe,
  Terminal,
  ShieldCheck,
  Sparkles,
  Activity,
  Zap,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Global Destinations | KCE Ops',
  description:
    'Gestión de la arquitectura geográfica y nodos territoriales para Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

export default function AdminDestinationsPage() {
  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-32 duration-1000">
      {/* 01. CABECERA INSTITUCIONAL */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Globe className="h-3.5 w-3.5" /> Geographic Authority Lane
          </div>
          <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-6xl">
            Gestor de <span className="font-light italic text-brand-yellow">Destinos</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base font-light leading-relaxed text-muted">
            Configuración de nodos territoriales y regiones de operación. Estos datos alimentan la
            lógica de recomendación de Knowing Cultures S.A.S.
          </p>
        </div>

        <div className="flex shrink-0 gap-4">
          <Button className="h-14 rounded-full bg-brand-dark px-10 text-xs font-bold uppercase tracking-widest text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95">
            <Plus className="mr-3 h-5 w-5" /> Nuevo Destino
          </Button>
        </div>
      </header>

      {/* 02. INSTRUMENTACIÓN DE BÚSQUEDA */}
      <section className="flex flex-col gap-4 sm:flex-row">
        <div className="group relative flex-1">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-blue opacity-40 transition-opacity group-focus-within:opacity-100" />
          <input
            type="text"
            placeholder="Buscar ciudad, región o territorio..."
            className="placeholder:text-muted/30 h-14 w-full rounded-2xl border border-brand-dark/10 bg-surface pl-14 text-sm text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
          />
        </div>
        <Button
          variant="outline"
          className="h-14 rounded-2xl border-brand-dark/10 bg-surface px-8 text-xs font-bold uppercase tracking-widest text-muted shadow-sm transition-all hover:bg-surface-2 hover:text-main"
        >
          <Filter className="mr-3 h-4 w-4" /> Filtrar Capas
        </Button>
      </section>

      {/* 03. BÓVEDA GEOGRÁFICA (ESTADO VACÍO LOOK) */}
      <section className="relative flex min-h-[500px] flex-col items-center justify-center overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-12 text-center shadow-soft dark:border-white/5 md:p-24">
        {/* Decoración de fondo técnica */}
        <div className="pointer-events-none absolute right-0 top-0 p-12 opacity-[0.02]">
          <Compass className="h-96 w-96 text-brand-blue" />
        </div>

        <div className="relative z-10">
          <div className="group mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-[2.5rem] border border-brand-blue/10 bg-brand-blue/5 shadow-inner transition-all duration-700 hover:scale-110">
            <MapPin className="h-12 w-12 text-brand-blue opacity-30 transition-all group-hover:scale-110 group-hover:opacity-100" />
          </div>

          <h2 className="mb-4 font-heading text-3xl tracking-tight text-main">
            Cartografía en Blanco
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-lg font-light italic leading-relaxed text-muted opacity-80">
            &quot;Sin destinos no hay historias. Inicia el despliegue geográfico para asociar
            experiencias a ubicaciones reales del territorio.&quot;
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button className="h-12 rounded-full bg-brand-dark px-10 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white">
              Establecer Primer Nodo
            </Button>
            <div className="flex items-center gap-3 rounded-full border border-brand-dark/5 bg-surface-2 px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-muted">
              <Activity className="h-3 w-3 animate-pulse text-brand-blue" /> Standby: GPS Locked
            </div>
          </div>
        </div>
      </section>

      {/* 04. FOOTER TÉCNICO DE SISTEMA */}
      <footer className="mt-20 flex flex-col items-center justify-between border-t border-brand-dark/10 pt-10 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3.5 w-3.5" /> Geographic Node v4.2
        </div>
        <div className="mt-4 flex items-center gap-8 font-mono text-[10px] uppercase tracking-widest text-muted sm:mt-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500 opacity-50" /> Map-Integrity:
            Validated
          </div>

          {/* ✅ FIX: Ahora el tag de cierre coincide correctamente con el de apertura */}
          <div className="hidden opacity-20 sm:inline">|</div>

          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-brand-yellow opacity-50" /> RAG-Knowledge: Ready
          </div>
        </div>
      </footer>
    </main>
  );
}
