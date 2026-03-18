import type { Metadata } from 'next';
import Link from 'next/link';
import { XCircle, MessageCircle, ShieldCheck, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';

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
  title: 'Pago interrumpido | KCE',
  description: 'Tu proceso de pago no se completó, pero tu itinerario sigue guardado. Retoma tu reserva ahora.',
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
  insufficient_funds: 'Fondos insuficientes en la cuenta seleccionada.',
  authentication_required: 'Se requería una validación adicional (OTP/Token).',
  popup_blocked: 'El navegador bloqueó la ventana de seguridad.',
  network: 'Hubo una interrupción en la conexión de red.',
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
    message: `Hola KCE, mi pago fue cancelado. Necesito ayuda para finalizar mi reserva de: ${matched?.title || tourParam || 'un tour'}.`,
    url: `${baseUrl}${retryHref}`,
  }) ?? undefined;

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 py-12 md:py-20">
      
      {/* CARD PRINCIPAL DE ESTADO */}
      <section className="overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          
          <div className="p-10 md:p-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/20 bg-brand-red/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-red">
              <XCircle className="size-3.5" /> Pago interrumpido
            </div>
            
            <h1 className="mt-6 font-heading text-4xl leading-tight text-brand-blue md:text-5xl">
              Tu reserva sigue esperando por ti.
            </h1>
            
            <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-[var(--color-text)]/70">
              {reasonText 
                ? `${reasonText} No te preocupes, el contexto de tu viaje está a salvo. Puedes reintentar ahora o pedir ayuda a nuestro equipo humano.`
                : 'El proceso de pago no se completó, pero aún estás a tiempo de asegurar tu lugar. Retoma el flujo o permítenos ayudarte personalmente.'}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full px-8 shadow-md">
                <Link href={retryHref}>
                  {matched ? `Reintentar: ${matched.title}` : 'Volver a Catálogo'} <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              
              {waHref && (
                <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                  <a href={waHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 size-4" /> WhatsApp Directo
                  </a>
                </Button>
              )}

              <OpenChatButton variant="outline" addQueryParam className="rounded-full h-12 px-6 border-brand-blue/20 text-brand-blue hover:bg-brand-blue/5">
                Consultar a IA KCE
              </OpenChatButton>
            </div>
          </div>

          <div className="flex flex-col justify-center border-t border-[var(--color-border)] bg-brand-blue p-10 text-white lg:border-l lg:border-t-0 md:p-14">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-8">KCE Concierge Support</p>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <ShieldCheck className="size-5 text-brand-yellow" />
                </div>
                <div>
                  <h3 className="font-heading text-xl text-white">Datos Protegidos</h3>
                  <p className="mt-1 text-sm font-light text-white/70 leading-relaxed">Tu selección de fecha y personas se mantiene activa para el siguiente intento.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <Sparkles className="size-5 text-brand-yellow" />
                </div>
                <div>
                  <h3 className="font-heading text-xl text-white">Atención Prioritaria</h3>
                  <p className="mt-1 text-sm font-light text-white/70 leading-relaxed">Si el error persiste, contáctanos y generaremos un link de pago privado para ti.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRESO DE RECUPERACIÓN */}
      <BookingProgressRail
        current={1}
        steps={[
          { id: 'intent', label: 'Selección', detail: 'Tour elegido' },
          { id: 'recover', label: 'Recuperación', detail: 'Estado actual' },
          { id: 'close', label: 'Confirmación', detail: 'Reserva final' },
        ]}
      />

      {/* RESUMEN DEL INTENTO */}
      {(tourParam || dateRaw || qty) && (
        <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 shadow-sm">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] pb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">Detalles de la sesión</p>
              <h2 className="mt-2 font-heading text-3xl text-brand-blue">Lo que estabas reservando</h2>
            </div>
            {reasonText && (
              <div className="flex items-center gap-2 rounded-xl bg-brand-red/5 px-4 py-2 text-sm font-medium text-brand-red border border-brand-red/10">
                <HelpCircle className="size-4" /> {reasonText}
              </div>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tourParam && (
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-3">Experiencia</dt>
                <dd className="font-heading text-xl text-brand-blue">
                  {matched ? matched.title : tourParam}
                </dd>
                {matched && <p className="mt-1 text-sm text-[var(--color-text)]/60">{matched.city}</p>}
              </div>
            )}

            {dateRaw && (
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-3">Fecha seleccionada</dt>
                <dd className="font-heading text-xl text-[var(--color-text)]">{formatISODatePretty(dateRaw)}</dd>
              </div>
            )}

            {qty && (
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-3">Asistentes</dt>
                <dd className="font-heading text-xl text-[var(--color-text)]">{qty} {qty === 1 ? 'Persona' : 'Personas'}</dd>
              </div>
            )}
          </div>

          <div className="mt-10 flex items-center justify-center border-t border-[var(--color-border)] pt-8">
            <Button asChild variant="ghost" className="text-brand-blue font-bold">
              <Link href={withLocale(l, '/contact')}>¿Problemas con tu tarjeta? Contacta a soporte</Link>
            </Button>
          </div>
        </section>
      )}

      <BookingTrustStrip />

      {/* ALTERNATIVAS */}
      <section className="space-y-8">
        <div className="flex items-end justify-between px-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">Inspiración</p>
            <h2 className="mt-2 font-heading text-3xl text-brand-blue">Explora otras rutas</h2>
          </div>
          <Link href={withLocale(l, '/tours')} className="text-sm font-bold text-brand-blue hover:underline">Ver todo el catálogo</Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {popular.map((tour) => (
            <Link
              key={tour.slug}
              href={withLocale(l, `/tours/${tour.slug}`)}
              className="group rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-brand-blue/20"
            >
              <p className="font-heading text-xl text-brand-blue group-hover:text-brand-blue/80 transition-colors">{tour.title}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-light text-[var(--color-text)]/50">{tour.city}</span>
                <span className="text-sm font-bold text-brand-blue">{formatCOP(tour.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}