/* src/features/bookings/BookingsView.tsx */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { ArrowRight, CalendarPlus, ExternalLink, FileDown, LifeBuoy, ReceiptText, ShieldCheck, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

type BookingItem = {
  id: string;
  status: string | null;
  date: string | null;
  persons: number | null;
  total: number | null;
  currency: string | null;
  stripe_session_id: string | null;
  created_at: string | null;
  tour: {
    id: string;
    title: string | null;
    slug: string | null;
    city: string | null;
    cover_image: string | null;
  } | null;
};

function fmtMoney(minor: number | null, currency: string | null): string {
  if (minor == null) return '';
  const cur = (currency || 'EUR').toUpperCase();
  const major = minor / 100;
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: cur }).format(major);
  } catch {
    return `${major.toFixed(2)} ${cur}`;
  }
}

function badge(status: string | null): { label: string; className: string } {
  const s = (status || '').toLowerCase();
  if (s === 'paid' || s === 'pagado')
    return {
      label: 'Pagado',
      className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    };
  if (s === 'pending')
    return { label: 'Pendiente', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' };
  if (s === 'canceled' || s === 'cancelled')
    return { label: 'Cancelado', className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' };
  return {
    label: status || '—',
    className: 'bg-black/10 text-[color:var(--color-text)]/75 dark:bg-white/10',
  };
}

export default function BookingsView() {
  const [items, setItems] = React.useState<BookingItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = React.useState<string | null>(null);
  const [supportFor, setSupportFor] = React.useState<string | null>(null);
  const [supportMessage, setSupportMessage] = React.useState('');
  const [supportSending, setSupportSending] = React.useState(false);
  const [supportResult, setSupportResult] = React.useState<string | null>(null);
  const pathname = usePathname();
  const localePrefix = React.useMemo(() => {
    const seg = (pathname || '').split('/')[1] || '';
    return ['es', 'en', 'fr', 'de'].includes(seg) ? `/${seg}` : '';
  }, [pathname]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const sb = supabaseBrowser();
      if (!sb) {
        setErr(
          'No se pudo inicializar Supabase en el navegador. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        );
        return;
      }
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setErr('Necesitas iniciar sesión para ver tus reservas.');
        setItems([]);
        return;
      }

      const res = await fetch('/api/account/bookings', {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErr(body?.message || 'No pudimos cargar tus reservas.');
        setItems([]);
        return;
      }
      const json = (await res.json()) as { items: BookingItem[] };
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch (e: any) {
      setErr(e?.message || 'Error de red. Intenta nuevamente.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function sendSupport(bookingId: string) {
    setSupportResult(null);
    setSupportSending(true);
    try {
      const sb = supabaseBrowser();
      if (!sb) {
        setErr(
          'No se pudo inicializar Supabase en el navegador. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        );
        return;
      }
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setSupportResult('Necesitas iniciar sesión para pedir soporte.');
        return;
      }
      const msg = supportMessage.trim();
      if (msg.length < 10) {
        setSupportResult('Cuéntanos un poco más (mínimo 10 caracteres).');
        return;
      }
      const res = await fetch('/api/account/tickets', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId, subject: 'Soporte (Cuenta)', message: msg }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setSupportResult(body?.message || 'No pudimos crear tu ticket. Intenta nuevamente.');
        return;
      }
      setSupportResult('Listo ✅ Creamos tu ticket. Te responderemos pronto.');
      setSupportMessage('');
      setSupportFor(null);
    } catch (e: any) {
      setSupportResult(e?.message || 'Error de red. Intenta nuevamente.');
    } finally {
      setSupportSending(false);
    }
  }

  async function downloadForAccount(sessionId: string, kind: 'invoice' | 'calendar', mode: 'open' | 'download' = 'open') {
    const key = `${sessionId}:${kind}`;
    setDownloadingKey(key);
    setErr(null);

    try {
      const sb = supabaseBrowser();
      if (!sb) {
        throw new Error('Supabase no está disponible en este navegador.');
      }

      // Always fetch a fresh token in case the in-memory state is stale/expired.
      const { data } = await sb.auth.getSession();
      if (!data.session) {
        throw new Error('Necesitas iniciar sesión para descargar archivos.');
      }

      const url =
        kind === 'invoice'
          ? `/api/account/invoice/${encodeURIComponent(sessionId)}?download=${mode === 'download' ? '1' : '0'}`
          : `/api/account/calendar/${encodeURIComponent(sessionId)}`;

      // Open a first-party endpoint. It validates the logged-in user and then redirects
      // to the signed public download URL. This avoids blob-based downloads which often
      // trigger “not secure download” warnings on mobile browsers.
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      if (!w) {
        throw new Error(
          'Tu navegador bloqueó el pop-up. Habilita ventanas emergentes e inténtalo otra vez.',
        );
      }
    } catch (e: any) {
      setErr(e?.message || 'Error descargando el archivo.');
    } finally {
      setDownloadingKey((cur) => (cur === key ? null : cur));
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-[color:var(--color-surface-2)]">
        <p className="text-[color:var(--color-text)]/70 text-sm">Cargando tus reservas…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6">
        <p className="text-sm text-rose-700 dark:text-rose-300">{err}</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => void load()}>Reintentar</Button>
          <Button
            asChild
            variant="outline"
          >
            <Link href={`${localePrefix}/tours`}>Ver tours</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-[color:var(--color-surface-2)]">
        <h2 className="font-heading text-lg">Aún no tienes reservas</h2>
        <p className="text-[color:var(--color-text)]/70 mt-2 text-sm">
          Explora nuestros tours y reserva cuando estés listo.
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link href={`${localePrefix}/tours`}>Explorar tours</Link>
          </Button>
        </div>
      </div>
    );
  }

  const paidCount = items.filter((item) => ['paid', 'pagado', 'succeeded'].includes((item.status || '').toLowerCase())).length;
  const invoiceReady = items.filter((item) => item.status === 'paid' && item.stripe_session_id).length;

  return (
    <div className="grid gap-5">
      <section className="rounded-[1.75rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">account command deck</p>
            <h2 className="mt-2 font-heading text-2xl text-brand-blue">Tus reservas ya están dentro de una ruta de seguimiento clara</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-brand-blue">
            delivery ready
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">reservas</p>
            <p className="mt-2 font-heading text-3xl text-brand-blue">{items.length}</p>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/68">Historial visible desde tu cuenta.</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">pagadas</p>
            <p className="mt-2 font-heading text-3xl text-brand-blue">{paidCount}</p>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/68">Compras confirmadas y listas para gestionar.</p>
          </div>
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">assets listos</p>
            <p className="mt-2 font-heading text-3xl text-brand-blue">{invoiceReady}</p>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/68">Facturas y calendario listos para abrir.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-brand-blue/10 bg-[linear-gradient(135deg,rgba(12,31,69,0.96),rgba(24,92,194,0.9))] p-5 text-white shadow-soft">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/72">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              booking continuity
            </div>
            <h3 className="mt-4 font-heading text-2xl text-white">Mantén factura, booking y soporte dentro del mismo hilo</h3>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Si necesitas reabrir una reserva, descargar activos o pedir ayuda, esta cuenta debería sentirse como tu centro operativo y no como una lista aislada.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild className="bg-[color:var(--color-surface)] text-brand-blue hover:shadow-pop">
                <Link href={`${localePrefix}/tours`}>Explorar más tours</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                <Link href={`${localePrefix}/account/support`}>Ir a soporte</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
              <div className="flex items-center gap-3 text-brand-blue">
                <ReceiptText className="size-4" aria-hidden="true" />
                <p className="text-sm font-semibold">Descargas listas</p>
              </div>
              <p className="mt-2 text-sm text-[color:var(--color-text)]/68">Usa la factura PDF y el calendario sin perder el contexto de la reserva.</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
              <div className="flex items-center gap-3 text-brand-blue">
                <LifeBuoy className="size-4" aria-hidden="true" />
                <p className="text-sm font-semibold">Ayuda humana</p>
              </div>
              <p className="mt-2 text-sm text-[color:var(--color-text)]/68">Si algo falla, abre soporte desde la reserva correcta y acelera la resolución.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div className="rounded-[1.4rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="flex items-center gap-3 text-brand-blue">
              <Sparkles className="size-4" aria-hidden="true" />
              <p className="text-sm font-semibold">Ruta premium post-compra</p>
            </div>
            <p className="mt-2 text-sm text-[color:var(--color-text)]/68">Desde aquí deberías poder confirmar assets, abrir soporte y volver al catálogo sin perder continuidad.</p>
          </div>
          <div className="rounded-[1.4rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="flex items-center gap-3 text-brand-blue">
              <ExternalLink className="size-4" aria-hidden="true" />
              <p className="text-sm font-semibold">Atajos útiles</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`${localePrefix}/account/support`} className="inline-flex items-center rounded-full border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold text-brand-blue transition hover:-translate-y-px hover:bg-brand-blue/5">Soporte</Link>
              <Link href={`${localePrefix}/wishlist`} className="inline-flex items-center rounded-full border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold text-brand-blue transition hover:-translate-y-px hover:bg-brand-blue/5">Wishlist</Link>
              <Link href={`${localePrefix}/tours`} className="inline-flex items-center rounded-full border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold text-brand-blue transition hover:-translate-y-px hover:bg-brand-blue/5">Más tours</Link>
            </div>
          </div>
          <div className="rounded-[1.4rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
            <div className="flex items-center gap-3 text-brand-blue">
              <ShieldCheck className="size-4" aria-hidden="true" />
              <p className="text-sm font-semibold">Confianza operativa</p>
            </div>
            <p className="mt-2 text-sm text-[color:var(--color-text)]/68">Si alguna reserva no coincide con lo que recibiste, vuelve a soporte con el contexto del booking correcto.</p>
          </div>
        </div>
      </section>
      {items.map((b) => {
        const bdg = badge(b.status);
        const title = b.tour?.title || 'Tour';
        const slug = b.tour?.slug || null;
        const city = b.tour?.city || null;
        const img = b.tour?.cover_image || null;

        return (
          <div
            key={b.id}
            className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white/60 p-5 shadow-sm dark:border-white/10 dark:bg-[color:var(--color-surface-2)] md:flex-row md:items-center"
          >
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-24 overflow-hidden rounded-xl bg-black/5 dark:bg-white/10">
                {img ? (
                  <Image
                    src={img}
                    alt={title}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-heading text-base">{title}</h3>
                  <span
                    className={['rounded-full px-2 py-0.5 text-xs font-medium', bdg.className].join(
                      ' ',
                    )}
                  >
                    {bdg.label}
                  </span>
                </div>
                <p className="text-[color:var(--color-text)]/65 mt-1 text-xs">
                  {city ? <span>{city} · </span> : null}
                  {b.date ? <span>Fecha: {b.date} · </span> : null}
                  {typeof b.persons === 'number' ? <span>Personas: {b.persons}</span> : null}
                </p>
                <p className="text-[color:var(--color-text)]/80 mt-1 text-sm">
                  {fmtMoney(b.total, b.currency)}
                </p>
                <p className="text-[color:var(--color-text)]/55 mt-1 text-[11px]">
                  Ref: {b.id.slice(0, 8)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:ml-auto">
              {slug ? (
                <Button
                  asChild
                  variant="outline"
                >
                  <Link href={`${localePrefix}/tours/${slug}`}>Ver tour</Link>
                </Button>
              ) : null}

              {b.stripe_session_id ? (
                <Button
                  asChild
                  variant="outline"
                >
                  <Link href={`/booking/${encodeURIComponent(b.stripe_session_id)}?from=account`}>
                    Booking center
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : null}

              {b.status === 'paid' && b.stripe_session_id ? (
                <>
                  <Button
                    variant="outline"
                    disabled={downloadingKey === `${b.stripe_session_id}:invoice`}
                    onClick={() => void downloadForAccount(b.stripe_session_id!, 'invoice', 'open')}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    {downloadingKey === `${b.stripe_session_id}:invoice`
                      ? 'Descargando…'
                      : 'Abrir factura'}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={downloadingKey === `${b.stripe_session_id}:calendar`}
                    onClick={() => void downloadForAccount(b.stripe_session_id!, 'calendar')}
                  >
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    {downloadingKey === `${b.stripe_session_id}:calendar`
                      ? 'Generando…'
                      : 'Calendario'}
                  </Button>
                </>
              ) : null}

              <Button
                variant="outline"
                onClick={() => {
                  setSupportResult(null);
                  setSupportFor((prev) => (prev === b.id ? null : b.id));
                }}
              >
                Soporte
              </Button>
            </div>

            {supportFor === b.id ? (
              <div className="w-full rounded-xl border border-black/10 bg-white/60 p-4 text-sm shadow-sm dark:border-white/10 dark:bg-[color:var(--color-surface-1)] md:ml-auto md:w-[460px]">
                <p className="font-medium">¿Qué pasó con esta reserva?</p>
                <p className="text-[color:var(--color-text)]/70 mt-1 text-xs">
                  Cuéntanos el problema y lo resolvemos. Esta solicitud queda asociada a tu booking.
                </p>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Ej: No pude ver la factura / necesito cambiar fecha / tengo una duda del punto de encuentro…"
                  className="mt-3 w-full rounded-xl border border-black/10 bg-white/70 p-3 text-sm outline-none ring-0 focus:border-black/20 dark:border-white/10 dark:bg-black/20"
                  rows={4}
                />
                {supportResult ? (
                  <p className="text-[color:var(--color-text)]/75 mt-2 text-xs">{supportResult}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    disabled={supportSending}
                    onClick={() => void sendSupport(b.id)}
                  >
                    {supportSending ? 'Enviando…' : 'Enviar a soporte'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSupportFor(null);
                      setSupportResult(null);
                      setSupportMessage('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
