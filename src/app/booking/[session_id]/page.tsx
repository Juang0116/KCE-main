import 'server-only';
import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import BookingActionBar from '@/features/bookings/components/BookingActionBar';
import BookingProgressRail from '@/features/bookings/components/BookingProgressRail';
import BookingTrustStrip from '@/features/bookings/components/BookingTrustStrip';
import LaunchCommandActionDeck from '@/features/bookings/components/LaunchCommandActionDeck';
import LaunchTrustRail from '@/features/marketing/LaunchTrustRail';
import { formatCurrencyEUR, formatDuration } from '@/utils/format';
import {
  ArrowRight,
  CalendarPlus2,
  Download,
  MessageCircleMore,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SupportedLocale = 'es' | 'en' | 'fr' | 'de';

type BookingPayload = {
  ok: boolean;
  requestId?: string;
  error?: string;
  booking?: {
    id: string;
    session_id: string;
    status?: string | null;
    tour_id?: string | null;
    tour_slug?: string | null;
    tour_title?: string | null;
    tour_city?: string | null;
    tour_image?: string | null;
    duration_hours?: number | null;
    amount_total?: number | null;
    currency?: string | null;
    customer_name?: string | null;
    customer_email?: string | null;
    created_at?: string | null;
  };
};

async function resolveLocale(): Promise<SupportedLocale> {
  const c = await cookies();
  const v = (c.get('kce.locale')?.value || '').toLowerCase();
  return (['en', 'fr', 'de'].includes(v)) ? (v as SupportedLocale) : 'es';
}

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

function safeStr(v: string | null | undefined): string {
  return (v ?? '').trim();
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function fetchBooking(sessionId: string, token: string | null): Promise<BookingPayload> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const url = new URL(`/api/booking/${encodeURIComponent(sessionId)}`, base);
  if (token) url.searchParams.set('t', token);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) return { ok: false, error: `Failed to load booking (${res.status})` };
  return (await res.json()) as BookingPayload;
}

export default async function BookingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ session_id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const locale = await resolveLocale();
  const { session_id } = await params;
  const sParams = await searchParams;

  const token = typeof sParams.t === 'string' ? sParams.t : null;
  const id = safeStr(session_id);

  if (!id) redirect(withLocale(locale, '/'));

  const payload = await fetchBooking(id, token);
  const booking = payload.booking;

  if (!payload.ok || !booking) {
    return (
      <main className="mx-auto max-w-[var(--container-max)] px-4 py-10">
        <div className="overflow-hidden rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] shadow-soft">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 md:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-brand-blue/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-brand-blue">
                <ShieldCheck className="size-4" />
                booking access
              </div>
              <h1 className="mt-5 font-heading text-3xl text-brand-blue md:text-4xl">No pudimos cargar tu compra</h1>
              <p className="mt-3 text-sm text-[color:var(--color-text-muted)]">
                {payload.error || 'Intenta recargar o contacta a soporte.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg"><Link href={withLocale(locale, '/tours')}>Explorar tours</Link></Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Lógica de URLs y formateo
  const title = safeStr(booking.tour_title) || 'Tu experiencia en KCE';
  const tourHref = booking.tour_slug ? withLocale(locale, `/tours/${booking.tour_slug}`) : withLocale(locale, '/tours');
  const img = safeStr(booking.tour_image) || '/images/hero-kce.jpg';
  const city = safeStr(booking.tour_city) || 'Colombia';
  const amount = booking.amount_total ?? null;
  const invoiceUrl = `/api/invoice/${id}${token ? `?t=${token}` : ''}`;
  const calendarUrl = `/api/calendar/${id}${token ? `?t=${token}` : ''}`;

  return (
    <main className="mx-auto max-w-[var(--container-max)] space-y-8 px-4 py-10">
      {/* Hero de Éxito */}
      <section className="overflow-hidden rounded-[2rem] border border-brand-blue/12 bg-[color:var(--color-surface)] shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-8 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-emerald-700">
              <ShieldCheck className="size-4" />
              compra confirmada
            </div>
            <h1 className="mt-5 font-heading text-3xl text-brand-blue md:text-5xl">Tu reserva ya está lista</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--color-text-muted)] md:text-base">
              Aquí queda centralizada tu experiencia: resumen, factura, calendario y soporte. No necesitas buscar más.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" rightIcon={<ArrowRight className="size-4" />}>
                <Link href={tourHref}>Ver detalles del tour</Link>
              </Button>
              <Button asChild variant="outline" size="lg" leftIcon={<ReceiptText className="size-4" />}>
                <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">Ver factura</a>
              </Button>
            </div>
          </div>

          <div className="border-t border-brand-blue/10 bg-brand-blue p-8 text-white lg:border-l lg:border-t-0 md:p-10">
             <div className="flex items-center gap-3">
               <Image src={img} alt={title} width={72} height={72} className="size-16 rounded-2xl object-cover border border-white/10" />
               <div>
                 <p className="text-xs uppercase tracking-[0.22em] text-white/65">booking suite</p>
                 <p className="font-heading text-2xl">Centro post-compra</p>
               </div>
             </div>
             {/* ... resto del contenido del aside azul ... */}
          </div>
        </div>
      </section>

      <BookingProgressRail current={2} steps={[
          { id: 'paid', label: 'Pagado', detail: 'Compra registrada.' },
          { id: 'manage', label: 'Gestionar', detail: 'Factura y calendario.' },
          { id: 'prepare', label: 'Prepararte', detail: 'Centro operativo listo.' },
      ]} />

      <BookingTrustStrip />

      {/* Trust Rail con la variante correcta */}
      <LaunchTrustRail locale={locale} variant="postpurchase" />
    </main>
  );
}