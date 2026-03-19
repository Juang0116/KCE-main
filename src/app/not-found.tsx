import Link from 'next/link';
import { MapPinned, ArrowRight, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4 font-body text-[var(--color-text)]">
      <main className="w-full max-w-2xl">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-soft md:p-14">
          
          {/* Decoración sutil de fondo */}
          <div className="absolute -right-8 -top-8 text-brand-blue/5">
            <MapPinned size={200} strokeWidth={1} />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/5 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-brand-blue font-bold">
              Error 404
            </div>
            
            <h1 className="mt-6 font-heading text-4xl text-brand-blue md:text-5xl lg:text-6xl">
              Parece que te has <br />
              <span className="text-[var(--color-text-muted)]">salido del mapa</span>
            </h1>
            
            <p className="mt-6 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
              La ruta que buscas no existe o ha sido movida a un nuevo destino. No te preocupes, todos los grandes exploradores se pierden de vez en cuando.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/tours"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3.5 text-sm font-bold text-white shadow-soft transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Search className="h-4 w-4" />
                Explorar experiencias
                <ArrowRight className="h-4 w-4" />
              </Link>
              
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white/50 px-6 py-3.5 text-sm font-bold backdrop-blur-sm transition-colors hover:bg-slate-50"
              >
                <Home className="h-4 w-4" />
                Ir al inicio
              </Link>
            </div>
          </div>
        </div>

        {/* Enlaces de ayuda rápida */}
        <div className="mt-8 flex justify-center gap-8 text-xs font-medium text-[var(--color-text-muted)]">
          <Link href="/contact" className="hover:text-brand-blue transition-colors underline-offset-4 hover:underline">
            Soporte 24/7
          </Link>
          <Link href="/booking/status" className="hover:text-brand-blue transition-colors underline-offset-4 hover:underline">
            Estado de reserva
          </Link>
          <Link href="/about" className="hover:text-brand-blue transition-colors underline-offset-4 hover:underline">
            Sobre KCE
          </Link>
        </div>
      </main>
    </div>
  );
}