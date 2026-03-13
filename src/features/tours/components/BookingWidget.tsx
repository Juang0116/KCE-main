// src/features/tours/components/BookingWidget.tsx
'use client';

import { Loader2, Lock } from 'lucide-react';
import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import OpenChatButton from '@/features/ai/OpenChatButton';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';

type BookingWidgetProps = {
  slug: string;
  title: string;
  short?: string;
  price: number; // minor units (EUR cents) por persona (solo UI). El backend debe validar precio real.
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isValidFutureDate(ymd: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const d = new Date(`${ymd}T00:00:00`);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return !Number.isNaN(d.getTime()) && d >= t;
}

function clampQty(raw: string) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(20, Math.round(n)));
}

export default function BookingWidget({ slug, title, short, price }: BookingWidgetProps) {
  const [date, setDate] = React.useState('');
  const [qty, setQty] = React.useState<string>('2'); // string para UX (no “salta” al escribir)
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [pending, setPending] = React.useState(false);

  const pathname = usePathname();
  const sp = useSearchParams();

  const qtyNumber = React.useMemo(() => clampQty(qty), [qty]);

  const _waHref = React.useMemo(() => {
    const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
    const baseMsg =
      process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ||
      'Hola KCE, quiero información sobre un tour.';
    const url = `${pathname || ''}${sp?.toString() ? `?${sp.toString()}` : ''}`;

    const safeDate = date && isValidFutureDate(date) ? date : '';
    const safeQty = qtyNumber ? String(qtyNumber) : '';

    const msg = [
      baseMsg,
      '',
      `Quiero reservar el tour: ${title}`,
      `Fecha: ${safeDate || '____-__-__'}`,
      `Personas: ${safeQty || '__'}`,
      '',
      '¿Me confirmas disponibilidad y qué incluye?',
    ].join('\n');

    return buildWhatsAppHref({ number, message: msg, url });
  }, [pathname, sp, date, qtyNumber, title]);
  const [error, setError] = React.useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);
  const nameRef = React.useRef<HTMLInputElement | null>(null);
  const emailRef = React.useRef<HTMLInputElement | null>(null);
  const dateRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Formatter EUR reutilizable (minor units)
  const formatter = React.useMemo(
    () =>
      new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const unitLabel = React.useMemo(() => formatter.format(price / 100), [formatter, price]);

  const total = React.useMemo(() => qtyNumber * price, [qtyNumber, price]);

  const totalLabel = React.useMemo(() => formatter.format(total / 100), [formatter, total]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;

    setError(null);

    // Validaciones rápidas (UX)
    if (!name.trim() || name.trim().length < 2) {
      setError('Ingresa tu nombre.');
      nameRef.current?.focus();
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresa un correo válido.');
      emailRef.current?.focus();
      return;
    }
    if (!isValidFutureDate(date)) {
      setError('Selecciona una fecha válida (hoy o futura).');
      dateRef.current?.focus();
      return;
    }

    const quantity = clampQty(qty);

    setPending(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const locale =
        typeof navigator !== 'undefined'
          ? navigator.language || (navigator as any).userLanguage || 'es-ES'
          : 'es-ES';

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        keepalive: true,
        signal: ctrl.signal,
        body: JSON.stringify({
          // Importante: el server debe resolver precio/slug de forma autoritativa.
          tour: { slug, title, short },
          quantity,
          customer: { name: name.trim(), email: email.trim() },
          date, // YYYY-MM-DD
          phone: phone.trim() ? phone.trim() : undefined,
          currency: 'EUR',
          locale,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'No pudimos iniciar el pago. Intenta de nuevo.');
      }

      // Stripe Checkout: es mejor redirección completa
      window.location.assign(data.url);
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Error inesperado. Intenta más tarde.');
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="rounded-2xl border border-brand-dark/10 bg-[color:var(--color-surface)] p-5 shadow-soft">
      {/* Header precios */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[color:var(--color-text)]/70 text-sm">Desde</div>
          <div className="font-heading text-2xl text-brand-red">{unitLabel}</div>
          <div className="text-[color:var(--color-text)]/60 mt-0.5 text-xs">por persona</div>
        </div>

        <div
          className="text-right"
          aria-live="polite"
        >
          <div className="text-[color:var(--color-text)]/60 text-xs">Total estimado</div>
          <div className="font-heading text-lg text-brand-blue">{totalLabel}</div>
          <div className="text-[color:var(--color-text)]/60 mt-0.5 text-[11px]">
            {unitLabel} × {qtyNumber} {qtyNumber === 1 ? 'persona' : 'personas'}
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-3 rounded-xl border border-brand-red/20 bg-red-50 px-3 py-2 text-sm text-[color:var(--color-text)]"
        >
          {error}
        </div>
      )}

      {/* Formulario */}
      <form
        onSubmit={onSubmit}
        className="mt-4 space-y-3"
        noValidate
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label
            className="text-[color:var(--color-text)]/80 block text-sm"
            htmlFor="name"
          >
            Nombre completo
            <input
              id="name"
              ref={nameRef}
              required
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-brand-dark/15 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue/30"
              disabled={pending}
            />
          </label>

          <label
            className="text-[color:var(--color-text)]/80 block text-sm"
            htmlFor="email"
          >
            Email
            <input
              id="email"
              ref={emailRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-brand-dark/15 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue/30"
              disabled={pending}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label
            className="text-[color:var(--color-text)]/80 block text-sm"
            htmlFor="date"
          >
            Fecha
            <input
              id="date"
              ref={dateRef}
              type="date"
              required
              min={todayISO()}
              value={date}
              onChange={(e) => setDate(e.currentTarget.value)}
              className="mt-1 w-full rounded-xl border border-brand-dark/15 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue/30"
              disabled={pending}
            />
          </label>

          <label
            className="text-[color:var(--color-text)]/80 block text-sm"
            htmlFor="qty"
          >
            Personas
            <input
              id="qty"
              type="number"
              min={1}
              max={20}
              step={1}
              inputMode="numeric"
              pattern="[0-9]*"
              value={qty}
              onChange={(e) => setQty(e.currentTarget.value)}
              onBlur={() => setQty(String(clampQty(qty)))} // normaliza al salir
              onWheel={(ev) => (ev.currentTarget as HTMLInputElement).blur()}
              className="mt-1 w-full rounded-xl border border-brand-dark/15 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue/30"
              disabled={pending}
            />
          </label>
        </div>

        <label
          className="text-[color:var(--color-text)]/80 block text-sm"
          htmlFor="phone"
        >
          WhatsApp (opcional)
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
            autoComplete="tel"
            placeholder="+57 300 000 0000"
            className="mt-1 w-full rounded-xl border border-brand-dark/15 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue/30"
            disabled={pending}
          />
        </label>

        <Button
          type="submit"
          className="w-full"
          variant="secondary"
          isLoading={pending}
          disabled={pending}
          aria-busy={pending || undefined}
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2
                className="size-4 animate-spin"
                aria-hidden
              />
              Procesando…
            </span>
          ) : (
            'Ir al pago seguro'
          )}
        </Button>

        {/* CTA secundaria: IA */}
        <OpenChatButton
          variant="accent"
          className="w-full"
          addQueryParam
        >
          Hablar con nuestra IA
        </OpenChatButton>

        <div className="rounded-2xl border border-brand-dark/10 bg-black/5 px-3 py-3">
          <div className="text-[color:var(--color-text)]/60 flex items-center justify-center gap-2 text-xs">
            <Lock
              className="size-3.5"
              aria-hidden
            />
            <span>Pagos seguros con Stripe • Verás el total final en la pasarela</span>
          </div>

          <ul className="mt-3 grid gap-2 text-xs text-[color:var(--color-text)]/70">
            <li>• Confirmación inmediata después del pago</li>
            <li>• Factura en PDF y link de booking seguro</li>
            <li>• Soporte por WhatsApp o chat si necesitas cambios</li>
          </ul>
        </div>

        {_waHref ? (
          <a
            href={_waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-xl border border-brand-dark/15 px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-black/5"
          >
            Consultar antes de pagar por WhatsApp
          </a>
        ) : null}
      </form>
    </aside>
  );
}
