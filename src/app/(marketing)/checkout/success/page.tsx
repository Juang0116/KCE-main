import 'server-only';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  ArrowRight, BadgeCheck, CalendarClock, Download, 
  MessageCircleMore, ReceiptText, ShieldCheck
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import BookingProgressRail from '@/features/bookings/components/BookingProgressRail';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import BookingTrustStrip from '@/features/bookings/components/BookingTrustStrip';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { toTourLike } from '@/features/tours/adapters';
import { getTourBySlug, listTours } from '@/features/tours/catalog.server';
import { SITE_URL, serverEnv } from '@/lib/env';
import { signLinkToken } from '@/lib/linkTokens.server';
import { getStripe } from '@/lib/stripe.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

// --- Helpers ---
const safeStr = (v: unknown) => typeof v === 'string' ? v.trim() : '';
const pickFirst = (v: string | string[] | undefined): string => Array.isArray(v) ? safeStr(v[0]) : safeStr(v);
const withLocale = (locale: string, href: string) => (!href.startsWith('/') || locale === 'es') ? href : `/${locale}${href}`;

function money(minor: number | null | undefined, currency = 'EUR', locale = 'es-CO') {
  if (minor == null) return '';
  const value = currency.toLowerCase() === 'clp' ? minor : minor / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(value);
}

export const metadata: Metadata = {
  title: '¡Reserva Confirmada! | KCE',
  robots: { index: false, follow: false },
  metadataBase: new URL((SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '')),
};

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<SearchParams> | SearchParams }) {
  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;
  const sessionId = pickFirst(sp.session_id);
  
  let receiptUrl = '', customerEmail = '', status: string = 'unknown';
  let totalMinor: number | null = null, currency = 'EUR', tourTitleFromStripe = '', tourSlugFromStripe = '';

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent.latest_charge'] });
      status = session.payment_status || 'unknown';
      currency = (session.currency || 'eur').toUpperCase();
      totalMinor = session.amount_total;
      customerEmail = safeStr(session.customer_details?.email);
      
      const charge = (session.payment_intent as any)?.latest_charge;
      receiptUrl = charge?.receipt_url || '';
      tourSlugFromStripe = safeStr(session.metadata?.tour_slug || session.metadata?.slug);
      tourTitleFromStripe = safeStr(session.metadata?.tour_title || session.metadata?.title);
    } catch (e) { console.error("Stripe retrieval error", e); }
  }

  const locale = pickFirst(sp.lang) || 'es';
  const tour = tourSlugFromStripe ? await getTourBySlug(tourSlugFromStripe) : null;
  const tourTitle = tour?.title || tourTitleFromStripe || 'Tu Experiencia KCE';
  
  const token = sessionId ? signLinkToken({ sessionId, secret: serverEnv.LINK_TOKEN_SECRET || '', ttlSeconds: 2592000 }) : '';
  const manageUrl = sessionId ? withLocale(locale, `/booking/${sessionId}?t=${token}`) : withLocale(locale, '/tours');
  const paid = status === 'paid';

  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: `¡Hola KCE! Acabo de confirmar mi reserva: ${tourTitle}. ID: ${sessionId?.slice(-6)}`,
  }) ?? undefined;

  const { items: popularItems } = await listTours({ limit: 3, sort: 'popular' });
  const popular = popularItems.map(toTourLike).filter(t => t.slug !== tourSlugFromStripe);

  if (!sessionId) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center space-y-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-brand-blue/5 text-brand-blue border border-brand-blue/10">
          <BadgeCheck className="size-10" />
        </div>
        <h1 className="font-heading text-4xl text-brand-blue">Buscando tu reserva...</h1>
        <p className="text-[var(--color-text)]/60 max-w-md mx-auto">
          Si acabas de completar el pago, espera un momento o contacta a soporte si el enlace no carga.
        </p>
        <Button asChild size="lg" className="rounded-full">
          <Link href="/tours">Explorar Catálogo</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-6 py-12 md:py-20">
      
      {/* SECCIÓN HERO ÉXITO */}
      <section className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          
          <div className="p-10 md:p-14 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
              <ShieldCheck className="size-3.5" /> {paid ? 'Pago Confirmado' : 'Procesando Pago'}
            </div>
            
            <h1 className="font-heading text-4xl leading-tight text-brand-blue md:text-5xl">
              {paid ? 'Tu viaje comienza aquí.' : 'Estamos validando tu lugar.'}
            </h1>
            
            <p className="max-w-xl text-lg font-light leading-relaxed text-[var(--color-text)]/70">
              {paid 
                ? 'Todo está listo. Hemos enviado los detalles a tu correo. Ahora puedes gestionar tu reserva, descargar tu voucher y prepararte para vivir KCE.'
                : 'Tu pago está en proceso de sincronización. No cierres esta ventana, en unos segundos verás el acceso a tu booking.'}
            </p>

            {/* RESUMEN RÁPIDO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-[var(--color-border)]">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-tighter text-[var(--color-text)]/40 font-bold">Experiencia</span>
                <p className="font-heading text-brand-blue truncate">{tourTitle}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-tighter text-[var(--color-text)]/40 font-bold">Fecha</span>
                <p className="font-heading text-brand-blue">{pickFirst(sp.date) || 'Por confirmar'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-tighter text-[var(--color-text)]/40 font-bold">Viajeros</span>
                <p className="font-heading text-brand-blue">{pickFirst(sp.q) || '1'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-tighter text-[var(--color-text)]/40 font-bold">Total</span>
                <p className="font-heading text-brand-blue">{money(totalMinor, currency)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full px-8 shadow-lg">
                <Link href={manageUrl}>Abrir Panel de Reserva <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              {receiptUrl && (
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <a href={receiptUrl} target="_blank" rel="noopener noreferrer"><ReceiptText className="mr-2 size-4" /> Recibo</a>
                </Button>
              )}
            </div>
          </div>

          {/* SIDEBAR CORPORATIVO */}
          <div className="bg-brand-blue p-10 md:p-14 text-white flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 p-2.5">
                  <Image src="/brand/logo.png" alt="KCE" width={40} height={40} className="object-contain brightness-0 invert" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Post-Checkout</p>
                  <h3 className="font-heading text-xl">Gestión Segura</h3>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 group">
                  <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-white/5 group-hover:bg-brand-yellow/20 transition-colors">
                    <CalendarClock className="size-5 text-brand-yellow" />
                  </div>
                  <p className="text-sm font-light text-white/70 leading-relaxed">Sincroniza tu itinerario con Google Calendar o iCal desde el panel.</p>
                </div>
                <div className="flex gap-4 group">
                  <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-white/5 group-hover:bg-brand-yellow/20 transition-colors">
                    <Download className="size-5 text-brand-yellow" />
                  </div>
                  <p className="text-sm font-light text-white/70 leading-relaxed">Descarga tu voucher digital para presentarlo el día de la experiencia.</p>
                </div>
              </div>

              {customerEmail && (
                <div className="pt-8 border-t border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Enviado a:</p>
                  <p className="font-heading text-lg">{customerEmail}</p>
                </div>
              )}
            </div>

            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="mt-12 inline-flex items-center gap-2 text-sm font-bold text-brand-yellow hover:opacity-80 transition-opacity">
                <MessageCircleMore className="size-5" /> ¿Dudas con tu pago? Escríbenos
              </a>
            )}
          </div>
        </div>
      </section>

      {/* FLUJO DE PROGRESO */}
      <BookingProgressRail
        current={paid ? 2 : 1}
        steps={[
          { id: 'payment', label: 'Pago', detail: 'Verificado' },
          { id: 'booking', label: 'Reserva', detail: 'Activa' },
          { id: 'prepare', label: 'Disfrutar', detail: 'Próximamente' },
        ]}
      />

      {/* ACCIONES DE COMANDO */}
      <LaunchCommandActionDeck
        eyebrow="Acceso rápido"
        title="Tu centro de control"
        description="Gestiona cada detalle de tu viaje desde un solo lugar seguro."
        actions={[
          { href: manageUrl, label: 'Mi Booking', detail: 'Voucher y detalles.', tone: 'primary' },
          { href: withLocale(locale, '/account/bookings'), label: 'Mis Viajes', detail: 'Historial completo.', tone: 'outline' },
          { href: withLocale(locale, '/contact'), label: 'Soporte', detail: 'Ayuda 24/7.', tone: 'outline' },
          { href: withLocale(locale, '/tours'), label: 'Explorar Más', detail: 'Próximo destino.', tone: 'outline' },
        ]}
      />

      {/* RECOMENDACIONES */}
      {popular.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-end justify-between px-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">Continuar explorando</p>
              <h2 className="mt-2 font-heading text-3xl text-brand-blue">Completa tu itinerario</h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {popular.map((t) => (
              <Link key={t.slug} href={withLocale(locale, `/tours/${t.slug}`)} className="group rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all hover:-translate-y-1 hover:shadow-xl">
                <p className="font-heading text-xl text-brand-blue group-hover:text-brand-blue/70">{t.title}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text)]/50 font-light">{t.city}</span>
                  <span className="font-bold text-brand-blue">Ver Tour</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <BookingTrustStrip />
    </main>
  );
}