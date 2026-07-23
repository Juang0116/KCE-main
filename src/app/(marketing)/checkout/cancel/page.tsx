import type { Metadata } from 'next';
import Link from 'next/link';
import {
  XCircle,
  MessageCircle,
  ArrowRight,
  ShieldAlert,
  PhoneCall,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Pago Interrumpido | Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

export default async function CancelPage({ searchParams }: { searchParams: Promise<any> }) {
  const sp = await searchParams;
  const tourName = sp.tour || 'tu experiencia seleccionada';

  return (
    <main className="min-h-screen animate-fade-in bg-base pb-24">
      {/* HERO ERROR / CANCEL */}
      <section className="relative overflow-hidden border-b border-white/5 bg-brand-dark px-6 py-24 text-center text-white md:py-32">
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-red-500/5 blur-[120px]" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-red-400 backdrop-blur-md">
            <ShieldAlert className="h-3.5 w-3.5" /> Transacción Interrumpida
          </div>

          <h1 className="mb-10 font-heading text-5xl leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
            Tu reserva sigue <br />
            <span className="font-light italic text-brand-blue opacity-90">esperando por ti.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl font-light leading-relaxed text-white/60">
            El proceso de pago no se completó. No te preocupes, hemos guardado los detalles de tu
            itinerario para que no tengas que empezar de cero.
          </p>
        </div>
      </section>

      <div className="relative z-20 mx-auto -mt-16 max-w-4xl px-6">
        <div className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 text-center shadow-pop md:p-16">
          <div className="mx-auto flex max-w-2xl flex-col items-center space-y-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-brand-dark/5 bg-surface-2 text-brand-blue shadow-inner transition-transform duration-700 group-hover:scale-110">
              <HelpCircle className="h-10 w-10" />
            </div>

            <div>
              <h2 className="mb-4 font-heading text-3xl tracking-tight text-main">
                ¿Qué pudo haber pasado?
              </h2>
              <p className="text-base font-light leading-relaxed text-muted">
                La mayoría de las veces se trata de una validación de seguridad de tu banco para
                transacciones internacionales. Puedes intentar nuevamente o contactar con nuestro
                concierge para usar un método de pago alternativo.
              </p>
            </div>

            <div className="flex w-full flex-col gap-5 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="flex-1 rounded-full border-transparent bg-brand-blue py-8 text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:bg-brand-dark"
              >
                <Link
                  href={`/tours/${sp.slug || ''}`}
                  className="flex items-center justify-center gap-3"
                >
                  Reintentar Pago <RefreshCw className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="flex-1 rounded-full border-brand-dark/10 py-8 text-xs font-bold uppercase tracking-widest text-main transition-all hover:bg-surface-2"
              >
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
                  className="flex items-center justify-center gap-3"
                >
                  <MessageCircle className="size-4 text-green-500" /> Hablar con un Experto
                </a>
              </Button>
            </div>

            <footer className="w-full border-t border-brand-dark/5 pt-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-40">
                Knowing Cultures S.A.S. • Soporte Seguro
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
