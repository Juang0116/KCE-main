'use client';

/**
 * BookingWidget V2 — KCE
 * Soporta:
 *  - Tour individual (slug único) con fecha única
 *  - Combo multi-tour (hasta 3 tours) con fecha por tour
 *  - Descuento automático: 10% con 2 tours, 15% con 3 tours
 *  - exactOptionalPropertyTypes: true — sin `undefined` explícito
 */

import { Loader2, Lock, Plus, X, Tag } from 'lucide-react';
import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import OpenChatButton from '@/features/ai/OpenChatButton';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TourOption = {
  slug: string;
  title: string;
  price: number; // minor units EUR
};

type BookingItem = {
  slug: string;
  title: string;
  price: number;
  date: string;
};

type BookingWidgetProps = {
  slug: string;
  title: string;
  price: number; // minor units (EUR cents)
  short?: string;
  /** Tours adicionales disponibles para armar combo (excluye el tour actual) */
  availableTours?: readonly TourOption[];
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const COMBO_DISCOUNTS: Record<number, number> = {
  2: 0.10, // 10% por 2 tours
  3: 0.15, // 15% por 3 tours
};

const EUR_FORMATTER = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function isValidFutureDate(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const d = new Date(`${ymd}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(d.getTime()) && d >= today;
}

function clampQty(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(1, Math.min(20, Math.round(n))) : 1;
}

function fmtEUR(minor: number): string {
  return EUR_FORMATTER.format(minor / 100);
}

function calcTotal(items: BookingItem[], qty: number): { subtotal: number; discount: number; total: number } {
  const subtotal = items.reduce((acc, it) => acc + it.price * qty, 0);
  const rate = COMBO_DISCOUNTS[items.length] ?? 0;
  const discount = Math.round(subtotal * rate);
  return { subtotal, discount, total: subtotal - discount };
}

// ─── Subcomponente: fila de tour en combo ─────────────────────────────────────

function ComboTourRow({
  item,
  index,
  qty,
  onRemove,
  onDateChange,
}: {
  item: BookingItem;
  index: number;
  qty: number;
  onRemove: (slug: string) => void;
  onDateChange: (slug: string, date: string) => void;
}) {
  const id = `combo-date-${item.slug}`;
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">
            Tour {index + 1}
          </span>
          <p className="text-sm font-medium text-[color:var(--color-text)] leading-tight">{item.title}</p>
          <p className="text-xs text-[color:var(--color-text-muted)] mt-0.5">
            {fmtEUR(item.price)} × {qty} = {fmtEUR(item.price * qty)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.slug)}
          aria-label={`Eliminar ${item.title}`}
          className="p-1 rounded-lg hover:bg-red-50 text-[color:var(--color-text-muted)] hover:text-red-500 transition-colors"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <label className="text-xs font-medium text-[color:var(--color-text)]" htmlFor={id}>
        Fecha
        <input
          id={id}
          type="date"
          min={todayISO()}
          value={item.date}
          onChange={(e) => onDateChange(item.slug, e.currentTarget.value)}
          className="mt-1 w-full rounded-xl border border-[color:var(--color-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30 text-[color:var(--color-text)] bg-[color:var(--color-surface)] transition-shadow"
        />
      </label>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function BookingWidget({
  slug,
  title,
  price,
  short,
  availableTours = [],
}: BookingWidgetProps) {
  const today = todayISO();

  // Estado principal
  const [items, setItems] = React.useState<BookingItem[]>([
    { slug, title, price, date: '' },
  ]);
  const [qty, setQty] = React.useState('2');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pathname = usePathname();
  const sp = useSearchParams();

  const qtyNumber = React.useMemo(() => clampQty(qty), [qty]);
  const pricing = React.useMemo(() => calcTotal(items, qtyNumber), [items, qtyNumber]);
  const isCombo = items.length > 1;
  const discountRate = COMBO_DISCOUNTS[items.length] ?? 0;

  // Tours disponibles para agregar (excluye los ya seleccionados)
  const addableTours = React.useMemo(
    () => availableTours.filter((t) => !items.some((it) => it.slug === t.slug)),
    [availableTours, items],
  );

  const abortRef = React.useRef<AbortController | null>(null);
  const nameRef = React.useRef<HTMLInputElement | null>(null);
  const emailRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => () => abortRef.current?.abort(), []);

  // Handlers de combo
  function addTour(tour: TourOption) {
    if (items.length >= 3) return;
    setItems((prev) => [...prev, { slug: tour.slug, title: tour.title, price: tour.price, date: '' }]);
  }

  function removeTour(tourSlug: string) {
    setItems((prev) => prev.filter((it) => it.slug !== tourSlug));
  }

  function updateDate(tourSlug: string, date: string) {
    setItems((prev) => prev.map((it) => (it.slug === tourSlug ? { ...it, date } : it)));
  }

  // WhatsApp fallback
  const waHref = React.useMemo(() => {
    const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';
    if (!number) return '';
    const base = process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ?? 'Hola KCE, quiero información.';
    const url = `${pathname ?? ''}${sp?.toString() ? `?${sp.toString()}` : ''}`;
    const tourLines = items.map((it, i) => `Tour ${i + 1}: ${it.title} — Fecha: ${it.date || '__-__-__'}`).join('\n');
    const msg = [base, '', tourLines, '', `Personas: ${qtyNumber}`, '', '¿Me confirmas disponibilidad?'].join('\n');
    return buildWhatsAppHref({ number, message: msg, url });
  }, [pathname, sp, items, qtyNumber]);

  // Submit
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Ingresa tu nombre completo.');
      nameRef.current?.focus();
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresa un correo válido.');
      emailRef.current?.focus();
      return;
    }
    for (const it of items) {
      if (!isValidFutureDate(it.date)) {
        setError(`Selecciona una fecha válida para "${it.title}".`);
        return;
      }
    }

    setPending(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const locale =
        typeof navigator !== 'undefined'
          ? (navigator.language ?? 'es-ES')
          : 'es-ES';

      // Payload: si es combo enviamos `items[]`, si es simple enviamos el formato legacy
      const body = isCombo
        ? {
            mode: 'combo',
            items: items.map((it) => ({ slug: it.slug, date: it.date })),
            guests: qtyNumber,
            customer: { name: name.trim(), email: email.trim() },
            ...(phone.trim() ? { phone: phone.trim() } : {}),
            currency: 'EUR',
            locale,
          }
        : {
            tour: { slug: items[0]!.slug, title: items[0]!.title, short },
            quantity: qtyNumber,
            customer: { name: name.trim(), email: email.trim() },
            date: items[0]!.date,
            ...(phone.trim() ? { phone: phone.trim() } : {}),
            currency: 'EUR',
            locale,
          };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        keepalive: true,
        signal: ctrl.signal,
        body: JSON.stringify(body),
      });

      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? 'No pudimos iniciar el pago. Intenta de nuevo.');
      }
      window.location.assign(data.url);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Error inesperado. Intenta más tarde.');
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">

      {/* ── Precios ── */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[color:var(--color-text-muted)] text-xs">
            {isCombo ? 'Combo' : 'Desde'}
          </div>
          <div className="font-heading text-2xl text-brand-red">
            {fmtEUR(pricing.total)}
          </div>
          <div className="text-[color:var(--color-text-muted)] text-xs mt-0.5">
            total · {qtyNumber} {qtyNumber === 1 ? 'persona' : 'personas'}
          </div>
        </div>

        {isCombo && discountRate > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1">
            <Tag className="size-3 text-green-600" aria-hidden />
            <span className="text-[11px] font-bold text-green-700 dark:text-green-400">
              −{Math.round(discountRate * 100)}% combo
            </span>
          </div>
        )}
      </div>

      {isCombo && (
        <div className="text-xs text-[color:var(--color-text-muted)] mb-3 space-y-0.5">
          <div>Subtotal: {fmtEUR(pricing.subtotal)}</div>
          <div className="text-green-600">Descuento: −{fmtEUR(pricing.discount)}</div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-3 rounded-xl border border-red-500/20 bg-red-50 px-3 py-2 text-sm text-[color:var(--color-text)]"
        >
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3" noValidate>

        {/* ── Tours en el combo ── */}
        <div className="space-y-2">
          {items.map((item, i) => (
            <ComboTourRow
              key={item.slug}
              item={item}
              index={i}
              qty={qtyNumber}
              onRemove={removeTour}
              onDateChange={updateDate}
            />
          ))}
        </div>

        {/* ── Agregar tour al combo ── */}
        {addableTours.length > 0 && items.length < 3 && (
          <div className="rounded-xl border border-dashed border-brand-blue/30 bg-brand-blue/5 p-3">
            <p className="text-xs font-semibold text-brand-blue mb-2 flex items-center gap-1">
              <Plus className="size-3" aria-hidden /> Agregar tour al combo
              {items.length === 1 && (
                <span className="font-normal text-[color:var(--color-text-muted)]">
                  — ahorra hasta 15%
                </span>
              )}
            </p>
            <div className="flex flex-col gap-1.5">
              {addableTours.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => addTour(t)}
                  className="w-full text-left rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm hover:border-brand-blue/50 hover:bg-brand-blue/5 transition-colors"
                >
                  <span className="font-medium text-[color:var(--color-text)]">{t.title}</span>
                  <span className="ml-2 text-[color:var(--color-text-muted)]">{fmtEUR(t.price)}/p</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Personas ── */}
        <label className="text-[color:var(--color-text)] block text-sm font-medium" htmlFor="wgt-qty">
          Personas
          <input
            id="wgt-qty"
            type="number"
            min={1}
            max={20}
            step={1}
            inputMode="numeric"
            pattern="[0-9]*"
            value={qty}
            onChange={(e) => setQty(e.currentTarget.value)}
            onBlur={() => setQty(String(clampQty(qty)))}
            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
            className="mt-1 w-full rounded-xl border border-[color:var(--color-border)] px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue/30 text-[color:var(--color-text)] bg-[color:var(--color-surface-2)] transition-shadow"
            disabled={pending}
          />
        </label>

        {/* ── Nombre + Email ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-[color:var(--color-text)] block text-sm font-medium" htmlFor="wgt-name">
            Nombre completo
            <input
              id="wgt-name"
              ref={nameRef}
              required
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-[color:var(--color-border)] px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue/30 text-[color:var(--color-text)] bg-[color:var(--color-surface-2)] transition-shadow"
              disabled={pending}
            />
          </label>

          <label className="text-[color:var(--color-text)] block text-sm font-medium" htmlFor="wgt-email">
            Email
            <input
              id="wgt-email"
              ref={emailRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-[color:var(--color-border)] px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue/30 text-[color:var(--color-text)] bg-[color:var(--color-surface-2)] transition-shadow"
              disabled={pending}
            />
          </label>
        </div>

        {/* ── WhatsApp ── */}
        <label className="text-[color:var(--color-text)] block text-sm font-medium" htmlFor="wgt-phone">
          WhatsApp (opcional)
          <input
            id="wgt-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
            autoComplete="tel"
            placeholder="+57 300 000 0000"
            className="mt-1 w-full rounded-xl border border-[color:var(--color-border)] px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue/30 text-[color:var(--color-text)] bg-[color:var(--color-surface-2)] transition-shadow"
            disabled={pending}
          />
        </label>

        {/* ── CTA Pago ── */}
        <Button
          type="submit"
          className="w-full bg-brand-blue text-white hover:bg-brand-blue/90 border-transparent transition-colors mt-2"
          disabled={pending}
          aria-busy={pending || undefined}
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Procesando…
            </span>
          ) : isCombo ? (
            `Reservar combo (${fmtEUR(pricing.total)})`
          ) : (
            'Ir al pago seguro'
          )}
        </Button>

        {/* ── CTA IA ── */}
        <OpenChatButton
          variant="outline"
          className="w-full text-brand-blue border-brand-blue bg-transparent hover:bg-brand-blue/5 transition-colors"
          addQueryParam
        >
          Hablar con nuestra IA
        </OpenChatButton>

        {/* ── Trust strip ── */}
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-3 mt-4">
          <div className="text-[color:var(--color-text-muted)] flex items-center justify-center gap-2 text-xs">
            <Lock className="size-3.5" aria-hidden />
            <span>Pagos seguros con Stripe · Total final visible en pasarela</span>
          </div>
          <ul className="mt-3 grid gap-2 text-xs text-[color:var(--color-text-muted)]">
            <li>• Confirmación inmediata después del pago</li>
            <li>• Factura PDF + link de booking seguro</li>
            <li>• Soporte por WhatsApp o chat</li>
          </ul>
        </div>

        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-xl border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-2)]"
          >
            Consultar por WhatsApp
          </a>
        )}
      </form>
    </aside>
  );
}
