import type { Metadata } from 'next';
import Link from 'next/link';
import { XCircle, MessageCircle, ShieldCheck, Sparkles, ArrowRight, HelpCircle, PhoneCall } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import OpenChatButton from '@/features/ai/OpenChatButton';
import BookingProgressRail from '@/features/bookings/components/BookingProgressRail';
import BookingTrustStrip from '@/features/bookings/components/BookingTrustStrip';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { TOURS } from '@/features/tours/data.mock';
import { SITE_URL } from '@/lib/env';
import { formatCOP, formatISODatePretty } from '@/utils/format';

type SearchParams = Record<string, string | string[] | undefined>;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const baseUrl = (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

export const metadata: Metadata = {
  title: 'Pago interrumpido | KCE Colombia',
  description: 'Tu proceso de pago no se completó, pero tu itinerario sigue guardado.',
  robots: { index: false, follow: false },
};

const pick = (v?: string | string[]) => (Array.isArray(v) ? (v[0] ?? '') : (v ?? ''));
const safeDecode = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };
const clampText = (s: string, max = 120) => (s.length > max ? s.slice(0, max) : s);

const REASON_COPY: Record<string, string> = {
  expired: 'La sesión de pago ha expirado por seguridad.',
  session_expired: 'La sesión ha expirado.',
  user_canceled: 'El proceso fue cancelado manualmente.',
  canceled: 'El proceso fue cancelado.',
  bank_declined: 'Tu entidad bancaria declinó la transacción.',
  insufficient_funds: 'Fondos insuficientes en la cuenta.',
  authentication_required: 'Se requería una validación adicional (Token).',
  popup_blocked: 'El navegador bloqueó la ventana de seguridad.',
  network: 'Hubo una interrupción en la conexión.',
};

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (!locale || locale === 'es') return href;
  return `/${locale}${href}`;
}

export default async function CancelPage({ searchParams }: { searchParams?: Promise<SearchParams> | SearchParams }) {
  const sp = (await Promise.resolve(searchParams ?? {})) as SearchParams;
  const locale = clampText(pick(sp.l).trim().toLowerCase(), 5);
  const l = /^(es|en|fr|de)$/.test(locale) ? locale : 'es';

  const tourParamRaw = clampText(pick(sp.tour).trim(), 200);
  const tourParam = tourParamRaw ? safeDecode(tourParamRaw) : '';
  const dateRaw = pick(sp.date).trim();
  const qtyStr = pick(sp.q).trim();
  const parsedQty = Number.parseInt(qtyStr, 10);
  const qty = Number.isFinite(parsedQty) ? Math.max(1, parsedQty) : undefined;

  const reasonKey = pick(sp.reason).trim().toLowerCase();
  const reasonText = REASON_COPY[reasonKey] || null;

  const matched = TOURS.find((t) => t.slug === tourParam || t.title.toLowerCase() === tourParam.toLowerCase());
  const popular = TOURS.filter((t) => (matched ? t.slug !== matched.slug : true)).slice(0, 3);

  const retryHref = (() => {
    if (!matched) return withLocale(l, '/tours');
    const u = new URL(withLocale(l, `/tours/${matched.slug}`), 'http://local');
    if (dateRaw) u.searchParams.set('date', dateRaw);
    if (qty) u.searchParams.set('q', String(qty));
    return `${u.pathname}${u.search}`;
  })();

  const waHref = buildWhatsAppHref({
    number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    message: `Hola KCE, mi pago de "${matched?.title || tourParam || 'un tour'}" falló. Me gustaría recibir un link de pago directo.`,
    url: `${baseUrl}${retryHref}`,
  }) ?? undefined;

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-6 py-12 md:py-20 animate-fade-in bg-[#FDFCFB]">
      
      {/* 01. MAIN STATUS CARD - PREMIUM LOOK */}
      <section className="overflow-hidden rounded-[3rem] border border-slate-200 bg-white shadow-2xl">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          
          <div className="p-10 md:p-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">
              <XCircle className="size-3.5" /> Estado: Interrumpido
            </div>
            
            <h1 className="mt-8 font-heading text-4xl leading-[1.1] text-[#004A7C] md:text-6xl tracking-tighter">
              Tu reserva sigue <br/>
              <span className="text-[#F5A623] italic font-light">esperando por ti.</span>
            </h1>
            
            <p className="mt-8 max-w-lg text-lg font-light leading-relaxed text-slate-500">
              {reasonText 
                ? `${reasonText} No te preocupes, hemos guardado tu selección de itinerario para que no tengas que empezar de cero.`
                : 'El proceso de pago no se completó, pero aún estás a tiempo de asegurar tu lugar. Retoma el flujo o permítenos ayudarte personalmente.'}
            </p>

            <div className="mt-12 flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full px-10 bg-[#004A7C] hover:bg-[#003559] text-white shadow-lg transition-all text-[11px] font-bold uppercase tracking-widest h-14">
                <Link href={retryHref}>
                  {matched ? `Reintentar ahora` : 'Volver a Catálogo'} <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              
              {waHref && (
                <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-14 border-[#004A7C]/20 text-[#004A7C] hover:bg-slate-50 text-[11px] font-bold uppercase tracking-widest">
                  <a href={waHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 size-4 text-[#F5A623]" /> Asistencia Humana
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* SIDEBAR DE CONFIANZA */}
          <div className="flex flex-col justify-center bg-[#004A7C] p-10 text-white lg:p-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#F5A623] mb-10">KCE Concierge Support</p>
            
            <div className="space-y-10">
              <div className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <ShieldCheck className="size-6 text-[#F5A623]" />
                </div>
                <div>
                  <h3 className="font-heading text-xl text-white">Seguridad Total</h3>
                  <p className="mt-2 text-sm font-light text-blue-100/60 leading-relaxed">Tu transacción es protegida. Si el banco bloqueó el pago, suele ser una medida de seguridad de tu tarjeta.</p>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <PhoneCall className="size-6 text-[#F5A623]" />
                </div>
                <div>
                  <h3 className="font-heading text-xl text-white">¿Pago Manual?</h3>
                  <p className="mt-2 text-sm font-light text-blue-100/60 leading-relaxed">Podemos enviarte un link de pago alternativo o aceptar transferencia directa si prefieres.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02. RESUMEN DEL INTENTO - DISEÑO TIPO FICHA */}
      {(tourParam || dateRaw || qty) && (
        <section className="rounded-[3rem] border border-slate-100 bg-white p-10 md:p-16 shadow-sm">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b border-slate-50 pb-10">
            <div className="max-w-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5A623]">Tu Selección</p>
              <h2 className="mt-3 font-heading text-4xl text-[#004A7C] tracking-tight">Detalles de tu próxima aventura</h2>
            </div>
            {reasonText && (
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-6 py-3 text-sm font-bold text-slate-500 border border-slate-100">
                <HelpCircle className="size-4 text-[#F5A623]" /> Error: {reasonKey}
              </div>
            )}
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Experiencia</span>
              <p className="font-heading text-2xl text-[#004A7C]">{matched ? matched.title : tourParam}</p>
              {matched && <p className="text-sm font-light text-slate-400">{matched.city}, Colombia</p>}
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fecha</span>
              <p className="font-heading text-2xl text-slate-800">{dateRaw ? formatISODatePretty(dateRaw) : 'Pendiente'}</p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Viajeros</span>
              <p className="font-heading text-2xl text-slate-800">{qty || 1} {qty === 1 ? 'Explorador' : 'Exploradores'}</p>
            </div>
          </div>
        </section>
      )}

      <BookingTrustStrip />

      {/* 03. ALTERNATIVAS - ESTILO REVISTA */}
      <section className="pt-12">
        <div className="flex items-end justify-between px-2 mb-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5A623]">Inspiración</p>
            <h2 className="mt-3 font-heading text-4xl text-[#004A7C]">¿Prefieres otra ruta?</h2>
          </div>
          <Link href={withLocale(l, '/tours')} className="text-xs font-bold uppercase tracking-widest text-[#004A7C] border-b border-[#F5A623] pb-1 hover:text-[#F5A623] transition-colors">
            Ver Catálogo Completo
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {popular.map((tour) => (
            <Link
              key={tour.slug}
              href={withLocale(l, `/tours/${tour.slug}`)}
              className="group rounded-[2.5rem] border border-slate-100 bg-white p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-[#004A7C]/10"
            >
              <p className="font-heading text-xl text-[#004A7C] leading-tight group-hover:text-[#F5A623] transition-colors">{tour.title}</p>
              <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{tour.city}</span>
                <span className="text-sm font-bold text-[#004A7C] bg-slate-50 px-3 py-1 rounded-full">{formatCOP(tour.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}