import 'server-only';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ShieldCheck,
  CalendarClock,
  Download,
  MessageCircleMore,
  ReceiptText,
  Sparkles,
  MapPin,
  Users,
  Wallet,
  ArrowRight,
  BookmarkCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getStripe } from '@/lib/stripe.server';
import { EmailConfirmationAuto } from '@/features/checkout/EmailConfirmationAuto';

export const metadata: Metadata = {
  title: '¡Reserva Confirmada! | Knowing Cultures S.A.S.',
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const sp = await searchParams;
  const sessionId = sp.session_id;

  // Lógica de recuperación de Stripe simplificada para el ejemplo
  const stripe = getStripe();
  const session = sessionId ? await stripe.checkout.sessions.retrieve(sessionId) : null;
  const paid = session?.payment_status === 'paid';
  const tourTitle = session?.metadata?.tour_title || 'Tu Experiencia KCE';

  return (
    <main className="min-h-screen animate-fade-in bg-base pb-24">
      {/* HERO DARK DE BIENVENIDA */}
      <section className="relative overflow-hidden border-b border-white/5 bg-brand-dark px-6 py-24 text-center text-white md:py-32">
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-green-400 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5" /> Pago Validado por Knowing Cultures S.A.S.
          </div>

          <h1 className="mb-10 font-heading text-5xl leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
            Tu viaje <br />
            <span className="font-light italic text-brand-yellow opacity-90">comienza aquí.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl font-light leading-relaxed text-white/60">
            El contrato de servicio ha sido perfeccionado. Hemos enviado tu voucher oficial y
            factura legal a tu correo electrónico.
          </p>
        </div>
      </section>

      <div className="relative z-20 mx-auto -mt-16 max-w-[var(--container-max)] px-6">
        <div className="group overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop md:p-16 lg:p-20">
          <div className="grid gap-16 lg:grid-cols-[1fr_380px]">
            {/* IZQUIERDA: DETALLES */}
            <div className="space-y-12">
              <header className="flex items-center gap-6 border-b border-brand-dark/5 pb-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-blue/10 bg-brand-blue/5 text-brand-blue">
                  <BookmarkCheck className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="font-heading text-3xl tracking-tight text-main">
                    Ficha de Reserva
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                    ID: {sessionId?.slice(-8)}
                  </p>
                </div>
              </header>

              <div className="grid gap-10 sm:grid-cols-2">
                <div className="space-y-3">
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                    <MapPin className="size-3 text-brand-blue" /> Experiencia
                  </span>
                  <p className="font-heading text-2xl leading-tight text-main">{tourTitle}</p>
                </div>
                <div className="space-y-3">
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                    <CalendarClock className="size-3 text-brand-blue" /> Fecha
                  </span>
                  <p className="font-heading text-2xl leading-tight text-main">
                    {sp.date || 'Confirmada'}
                  </p>
                </div>
                <div className="space-y-3">
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                    <Users className="size-3 text-brand-blue" /> Cupos
                  </span>
                  <p className="font-heading text-2xl leading-tight text-main">
                    {sp.q || '1'} Viajeros
                  </p>
                </div>
                <div className="space-y-3">
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                    <Wallet className="size-3 text-brand-blue" /> Estado
                  </span>
                  <p className="font-heading text-2xl leading-tight text-green-600">Confirmado</p>
                </div>
              </div>

              <EmailConfirmationAuto
                sessionId={sessionId}
                paid={paid}
              />

              <div className="flex flex-wrap gap-4 pt-8">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-brand-blue px-12 py-8 text-xs font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:bg-brand-dark"
                >
                  <Link href={`/booking/${sessionId}`}>
                    Gestionar Reserva <ArrowRight className="ml-3 size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-brand-dark/10 px-10 py-8 text-xs font-bold uppercase tracking-widest text-main transition-all hover:bg-surface-2"
                >
                  <Link href="/tours">Explorar más</Link>
                </Button>
              </div>
            </div>

            {/* DERECHA: PRÓXIMOS PASOS (Sidebar Dark) */}
            <aside className="relative flex flex-col justify-between overflow-hidden rounded-[var(--radius-2xl)] bg-brand-dark p-12 text-white">
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-brand-blue/20 blur-3xl" />

              <div className="relative z-10 space-y-12">
                <header>
                  <Sparkles className="mb-6 size-10 text-brand-yellow" />
                  <h3 className="font-heading text-2xl leading-tight tracking-tight">
                    Próximos Pasos
                  </h3>
                </header>

                <ul className="space-y-10">
                  <li className="group flex gap-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors group-hover:border-brand-yellow/50">
                      <Download className="size-5 text-brand-yellow" />
                    </div>
                    <p className="text-sm font-light leading-relaxed text-white/60">
                      Descarga tu <strong>Voucher Digital</strong>. La sostenibilidad es clave; no
                      necesitas imprimirlo.
                    </p>
                  </li>
                  <li className="group flex gap-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors group-hover:border-brand-yellow/50">
                      <MessageCircleMore className="size-5 text-brand-yellow" />
                    </div>
                    <p className="text-sm font-light leading-relaxed text-white/60">
                      Nuestro concierge te escribirá vía WhatsApp 24h antes para coordinar el punto
                      de encuentro exacto.
                    </p>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 mt-16 border-t border-white/5 pt-10">
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20">
                  Knowing Cultures S.A.S. • 2026
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
