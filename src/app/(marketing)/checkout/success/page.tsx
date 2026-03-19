import 'server-only';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { 
  ArrowRight, BadgeCheck, CalendarClock, Download, 
  MessageCircleMore, ReceiptText, ShieldCheck, Sparkles
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
  title: '¡Reserva Confirmada! | KCE Colombia',
  robots: { index: false, follow: false },
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
      <main className="mx-auto max-w-4xl px-6 py-32 text-center bg-[#FDFCFB] min-h-screen">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-[#004A7C]/5 text-[#004A7C] border border-[#004A7C]/10 mb-10">
          <BadgeCheck className="size-12 animate-pulse" />
        </div>
        <h1 className="font-heading text-5xl text-[#004A7C] tracking-tight">Sincronizando tu viaje...</h1>
        <p className="text-slate-500 max-w-md mx-auto mt-6 font-light text-lg">
          Estamos confirmando los últimos detalles con tu banco. No cierres esta pestaña.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-6 py-12 md:py-24 bg-[#FDFCFB] animate-fade-in">
      
      {/* SECCIÓN HERO ÉXITO - BRANDING KCE */}
      <section className="overflow-hidden rounded-[3rem] border border-slate-200 bg-white shadow-2xl">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          
          <div className="p-10 md:p-16 space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
              <ShieldCheck className="size-3.5" /> {paid ? 'Confirmación Exitosa' : 'Validando Transacción'}
            </div>
            
            <h1 className="font-heading text-5xl leading-[0.95] text-[#004A7C] md:text-7xl tracking-tighter">
              {paid ? (
                <>Tu viaje <br/><span className="text-[#F5A623] italic font-light">comienza aquí.</span></>
              ) : 'Validando lugar...'}
            </h1>
            
            <p className="max-w-xl text-lg font-light leading-relaxed text-slate-500">
              {paid 
                ? 'Todo está listo. Hemos enviado tu comprobante y detalles logísticos a tu correo. Ahora puedes gestionar tu reserva y prepararte para la experiencia.'
                : 'Estamos sincronizando tu pago. En unos segundos verás el acceso total a tu panel de control.'}
            </p>

            {/* RESUMEN TIPO TICKET */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-slate-100">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Ruta</span>
                <p className="font-heading text-[#004A7C] text-lg truncate">{tourTitle}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Fecha</span>
                <p className="font-heading text-slate-800 text-lg">{pickFirst(sp.date) || 'Por confirmar'}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Cupos</span>
                <p className="font-heading text-slate-800 text-lg">{pickFirst(sp.q) || '1'}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Inversión</span>
                <p className="font-heading text-[#004A7C] text-lg">{money(totalMinor, currency)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-5">
              <Button asChild size="lg" className="rounded-full px-10 bg-[#004A7C] hover:bg-[#003559] text-white shadow-xl h-14 text-[11px] font-bold uppercase tracking-widest">
                <Link href={manageUrl}>Abrir Panel de Control <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              {receiptUrl && (
                <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-8 border-slate-200 text-[#004A7C] text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50">
                  <a href={receiptUrl} target="_blank" rel="noopener noreferrer"><ReceiptText className="mr-2 size-4 text-[#F5A623]" /> Descargar Recibo</a>
                </Button>
              )}
            </div>
          </div>

          {/* SIDEBAR DE APOYO POST-VENTA */}
          <div className="bg-[#004A7C] p-10 md:p-16 text-white flex flex-col justify-between">
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/10 p-3 flex items-center justify-center">
                  <Sparkles className="size-8 text-[#F5A623]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#F5A623]">Concierge KCE</p>
                  <h3 className="font-heading text-2xl">Próximos pasos</h3>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex gap-5 group">
                  <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    <CalendarClock className="size-6 text-[#F5A623]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-widest mb-1">Agenda tu ruta</h4>
                    <p className="text-sm font-light text-blue-100/60 leading-relaxed">Sincroniza el tour con tu calendario personal desde el panel de reserva.</p>
                  </div>
                </div>
                <div className="flex gap-5 group">
                  <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    <Download className="size-6 text-[#F5A623]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-widest mb-1">Digital Voucher</h4>
                    <p className="text-sm font-light text-blue-100/60 leading-relaxed">No necesitas imprimir. Tu voucher digital es suficiente para el guía local.</p>
                  </div>
                </div>
              </div>

              {customerEmail && (
                <div className="pt-10 border-t border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Enviado a:</p>
                  <p className="font-heading text-xl text-white">{customerEmail}</p>
                </div>
              )}
            </div>

            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="mt-16 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#F5A623] hover:text-white transition-colors">
                <MessageCircleMore className="size-5" /> ¿Necesitas ayuda inmediata?
              </a>
            )}
          </div>
        </div>
      </section>

      {/* PROGRESO DE VIAJE */}
      <BookingProgressRail
        current={paid ? 2 : 1}
        steps={[
          { id: 'payment', label: 'Verificación', detail: 'Éxito' },
          { id: 'booking', label: 'Confirmación', detail: 'Recibida' },
          { id: 'prepare', label: 'Experiencia', detail: 'En camino' },
        ]}
      />

      {/* RECOMENDACIONES TIPO MAGAZINE */}
      {popular.length > 0 && (
        <section className="space-y-10 pt-10">
          <div className="flex items-end justify-between border-b border-slate-100 pb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5A623]">Inspiración</p>
              <h2 className="mt-3 font-heading text-4xl text-[#004A7C]">Completa tu itinerario</h2>
            </div>
            <Link href={withLocale(locale, '/tours')} className="text-[10px] font-bold uppercase tracking-widest text-[#004A7C] hover:text-[#F5A623]">Explorar todo</Link>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {popular.map((t) => (
              <Link key={t.slug} href={withLocale(locale, `/tours/${t.slug}`)} className="group rounded-[2.5rem] border border-slate-100 bg-white p-8 transition-all hover:-translate-y-2 hover:shadow-2xl">
                <p className="font-heading text-2xl text-[#004A7C] leading-tight group-hover:text-[#F5A623] transition-colors">{t.title}</p>
                <div className="mt-8 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.city}</span>
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-[#004A7C] group-hover:bg-[#004A7C] group-hover:text-white transition-all">
                    <ArrowRight className="size-4" />
                  </div>
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