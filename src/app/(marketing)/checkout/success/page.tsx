import 'server-only';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldCheck, CalendarClock, Download, MessageCircleMore, ReceiptText, Sparkles, MapPin, Users, Wallet, ArrowRight, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getStripe } from '@/lib/stripe.server';
import { EmailConfirmationAuto } from '@/features/checkout/EmailConfirmationAuto';

export const metadata: Metadata = {
  title: '¡Reserva Confirmada! | Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<any> }) {
  const sp = await searchParams;
  const sessionId = sp.session_id;
  
  // Lógica de recuperación de Stripe simplificada para el ejemplo
  const stripe = getStripe();
  const session = sessionId ? await stripe.checkout.sessions.retrieve(sessionId) : null;
  const paid = session?.payment_status === 'paid';
  const tourTitle = session?.metadata?.tour_title || 'Tu Experiencia KCE';

  return (
    <main className="min-h-screen bg-base pb-24 animate-fade-in">
      
      {/* HERO DARK DE BIENVENIDA */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center text-white border-b border-white/5">
        <div className="absolute top-0 left-1/2 w-full max-w-4xl h-80 bg-brand-blue/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-5xl flex flex-col items-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-green-400 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5" /> Pago Validado por Knowing Cultures S.A.S.
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[1.05] mb-10">
            Tu viaje <br/>
            <span className="text-brand-yellow font-light italic opacity-90">comienza aquí.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-xl font-light leading-relaxed text-white/60">
            El contrato de servicio ha sido perfeccionado. Hemos enviado tu voucher oficial y factura legal a tu correo electrónico.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[var(--container-max)] px-6 -mt-16 relative z-20">
        <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 md:p-16 lg:p-20 shadow-pop overflow-hidden group">
          
          <div className="grid lg:grid-cols-[1fr_380px] gap-16">
            
            {/* IZQUIERDA: DETALLES */}
            <div className="space-y-12">
               <header className="flex items-center gap-6 border-b border-brand-dark/5 pb-10">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/5 border border-brand-blue/10 text-brand-blue">
                    <BookmarkCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="font-heading text-3xl text-main tracking-tight">Ficha de Reserva</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">ID: {sessionId?.slice(-8)}</p>
                  </div>
               </header>

               <div className="grid sm:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted font-bold">
                       <MapPin className="size-3 text-brand-blue" /> Experiencia
                    </span>
                    <p className="font-heading text-2xl text-main leading-tight">{tourTitle}</p>
                  </div>
                  <div className="space-y-3">
                    <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted font-bold">
                       <CalendarClock className="size-3 text-brand-blue" /> Fecha
                    </span>
                    <p className="font-heading text-2xl text-main leading-tight">{sp.date || 'Confirmada'}</p>
                  </div>
                  <div className="space-y-3">
                    <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted font-bold">
                       <Users className="size-3 text-brand-blue" /> Cupos
                    </span>
                    <p className="font-heading text-2xl text-main leading-tight">{sp.q || '1'} Viajeros</p>
                  </div>
                  <div className="space-y-3">
                    <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted font-bold">
                       <Wallet className="size-3 text-brand-blue" /> Estado
                    </span>
                    <p className="font-heading text-2xl text-green-600 leading-tight">Confirmado</p>
                  </div>
               </div>

               <EmailConfirmationAuto sessionId={sessionId} paid={paid} />

               <div className="pt-8 flex flex-wrap gap-4">
                  <Button asChild size="lg" className="rounded-full px-12 py-8 bg-brand-blue text-white hover:bg-brand-dark transition-all text-xs font-bold uppercase tracking-widest shadow-pop">
                    <Link href={`/booking/${sessionId}`}>Gestionar Reserva <ArrowRight className="ml-3 size-4" /></Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full px-10 py-8 border-brand-dark/10 text-main hover:bg-surface-2 transition-all text-xs font-bold uppercase tracking-widest">
                    <Link href="/tours">Explorar más</Link>
                  </Button>
               </div>
            </div>

            {/* DERECHA: PRÓXIMOS PASOS (Sidebar Dark) */}
            <aside className="bg-brand-dark p-12 rounded-[var(--radius-2xl)] text-white relative overflow-hidden flex flex-col justify-between">
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               
               <div className="relative z-10 space-y-12">
                  <header>
                    <Sparkles className="size-10 text-brand-yellow mb-6" />
                    <h3 className="font-heading text-2xl tracking-tight leading-tight">Próximos Pasos</h3>
                  </header>

                  <ul className="space-y-10">
                    <li className="flex gap-5 group">
                       <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-brand-yellow/50 transition-colors">
                          <Download className="size-5 text-brand-yellow" />
                       </div>
                       <p className="text-sm font-light text-white/60 leading-relaxed">Descarga tu <strong>Voucher Digital</strong>. La sostenibilidad es clave; no necesitas imprimirlo.</p>
                    </li>
                    <li className="flex gap-5 group">
                       <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-brand-yellow/50 transition-colors">
                          <MessageCircleMore className="size-5 text-brand-yellow" />
                       </div>
                       <p className="text-sm font-light text-white/60 leading-relaxed">Nuestro concierge te escribirá vía WhatsApp 24h antes para coordinar el punto de encuentro exacto.</p>
                    </li>
                  </ul>
               </div>

               <div className="relative z-10 mt-16 pt-10 border-t border-white/5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20">Knowing Cultures S.A.S. • 2026</p>
               </div>
            </aside>

          </div>
        </div>
      </div>
    </main>
  );
}