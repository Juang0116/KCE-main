import type { Metadata } from 'next';
import Link from 'next/link';
import { XCircle, MessageCircle, ArrowRight, ShieldAlert, PhoneCall, HelpCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Pago Interrumpido | Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

export default async function CancelPage({ searchParams }: { searchParams: Promise<any> }) {
  const sp = await searchParams;
  const tourName = sp.tour || 'tu experiencia seleccionada';

  return (
    <main className="min-h-screen bg-base pb-24 animate-fade-in">
      
      {/* HERO ERROR / CANCEL */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center text-white border-b border-white/5">
        <div className="absolute top-0 left-1/2 w-full max-w-4xl h-80 bg-red-500/5 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-5xl flex flex-col items-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-red-400 backdrop-blur-md">
            <ShieldAlert className="h-3.5 w-3.5" /> Transacción Interrumpida
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[1.05] mb-10">
            Tu reserva sigue <br/>
            <span className="text-brand-blue italic font-light opacity-90">esperando por ti.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-xl font-light leading-relaxed text-white/60">
            El proceso de pago no se completó. No te preocupes, hemos guardado los detalles de tu itinerario para que no tengas que empezar de cero.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 -mt-16 relative z-20">
        <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 md:p-16 shadow-pop text-center group">
          
          <div className="flex flex-col items-center max-w-2xl mx-auto space-y-12">
             <div className="h-20 w-20 flex items-center justify-center rounded-3xl bg-surface-2 border border-brand-dark/5 text-brand-blue shadow-inner group-hover:scale-110 transition-transform duration-700">
                <HelpCircle className="h-10 w-10" />
             </div>
             
             <div>
                <h2 className="font-heading text-3xl text-main mb-4 tracking-tight">¿Qué pudo haber pasado?</h2>
                <p className="text-base font-light text-muted leading-relaxed">
                   La mayoría de las veces se trata de una validación de seguridad de tu banco para transacciones internacionales. Puedes intentar nuevamente o contactar con nuestro concierge para usar un método de pago alternativo.
                </p>
             </div>

             <div className="flex flex-col sm:flex-row gap-5 w-full">
                <Button asChild size="lg" className="flex-1 rounded-full py-8 bg-brand-blue text-white hover:bg-brand-dark shadow-pop transition-all text-xs font-bold uppercase tracking-widest border-transparent">
                  <Link href={`/tours/${sp.slug || ''}`} className="flex items-center justify-center gap-3">
                    Reintentar Pago <RefreshCw className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="flex-1 rounded-full py-8 border-brand-dark/10 text-main hover:bg-surface-2 transition-all text-xs font-bold uppercase tracking-widest">
                  <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`} className="flex items-center justify-center gap-3">
                    <MessageCircle className="size-4 text-green-500" /> Hablar con un Experto
                  </a>
                </Button>
             </div>

             <footer className="pt-10 border-t border-brand-dark/5 w-full">
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