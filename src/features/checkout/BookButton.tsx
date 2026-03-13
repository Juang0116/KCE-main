// src/features/checkout/BookButton.tsx
'use client';

import * as React from 'react';

import { Button } from '@/components/ui/Button';

type Props = {
  tourSlug: string;
  tourTitle: string; // solo UI (no se envía al server)
  defaultDate?: string; // YYYY-MM-DD
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isValidYMD(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function isTodayOrFuture(v: string) {
  // Comparación lexicográfica válida para YYYY-MM-DD
  return isValidYMD(v) && v >= todayISO();
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function clampQty(n: number) {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(20, Math.round(n)));
}

export default function BookButton({ tourSlug, tourTitle, defaultDate }: Props) {
  const initialDate = isValidYMD(defaultDate || '') ? (defaultDate as string) : todayISO();

  const [date, setDate] = React.useState(initialDate);
  const [quantity, setQuantity] = React.useState<string>('1'); // ✅ sin any
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);
  const nameRef = React.useRef<HTMLInputElement | null>(null);
  const emailRef = React.useRef<HTMLInputElement | null>(null);
  const dateRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => () => abortRef.current?.abort(), []);

  function normalizeQtyInput(raw: string) {
    // permite '' mientras escribe
    const v = raw.trim();
    if (v === '') return '';
    // solo dígitos
    if (!/^\d+$/.test(v)) return '';
    const n = clampQty(Number(v));
    return String(n);
  }

  async function onReserve(e?: React.FormEvent) {
    e?.preventDefault?.();
    if (loading) return;

    setErr(null);

    const slug = String(tourSlug || '').trim();
    if (!slug) {
      setErr('Este tour no tiene identificador (slug).');
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setErr('Ingresa tu nombre.');
      nameRef.current?.focus();
      return;
    }
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setErr('Ingresa un correo válido.');
      emailRef.current?.focus();
      return;
    }
    if (!isTodayOrFuture(date)) {
      setErr('Selecciona una fecha válida (hoy o futura).');
      dateRef.current?.focus();
      return;
    }

    const qty = clampQty(Number(quantity || '1'));

    setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const locale =
        (typeof navigator !== 'undefined' &&
          (navigator.language || (navigator as any).userLanguage)) ||
        'es-CO';

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        keepalive: true,
        signal: ctrl.signal,
        body: JSON.stringify({
          tourSlug: slug,
          quantity: qty,
          customer: { email: cleanEmail, name: cleanName },
          date,
          locale,

          // Opcional: solo referencia (el server cobra en EUR si así lo defines)
          originCurrency: 'COP',
        }),
      });

      const data = (await res.json().catch(() => ({}))) as any;

      if (res.ok && typeof data?.url === 'string' && data.url) {
        window.location.assign(data.url);
        return;
      }

      setErr(
        typeof data?.error === 'string' && data.error
          ? data.error
          : 'No se pudo iniciar el checkout. Intenta de nuevo.',
      );
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setErr(e?.message || 'Error iniciando el checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onReserve}
      className="rounded-2xl border border-brand-dark/10 bg-[color:var(--color-surface)] p-4 shadow-soft"
      noValidate
      aria-describedby={err ? 'book-error' : undefined}
    >
      <div className="text-[color:var(--color-text)]/70 mb-2 text-sm">
        Reservar: <span className="text-[color:var(--color-text)]">{tourTitle}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label
          className="flex flex-col gap-1 text-sm"
          htmlFor="book-date"
        >
          <span className="text-[color:var(--color-text)]/70">Fecha</span>
          <input
            id="book-date"
            ref={dateRef}
            type="date"
            min={todayISO()}
            value={date}
            onChange={(e) => setDate(e.currentTarget.value)}
            className="
              rounded-xl border border-brand-dark/20 bg-transparent px-3 py-2 outline-none
              focus-visible:shadow-[var(--focus-ring)]
            "
            required
          />
        </label>

        <label
          className="flex flex-col gap-1 text-sm"
          htmlFor="book-qty"
        >
          <span className="text-[color:var(--color-text)]/70">Personas</span>
          <input
            id="book-qty"
            type="number"
            min={1}
            max={20}
            step={1}
            inputMode="numeric"
            pattern="[0-9]*"
            onWheel={(ev) => (ev.currentTarget as HTMLInputElement).blur()}
            value={quantity}
            onChange={(e) => setQuantity(normalizeQtyInput(e.currentTarget.value))}
            onBlur={() => setQuantity(String(clampQty(Number(quantity || '1'))))}
            className="
              rounded-xl border border-brand-dark/20 bg-transparent px-3 py-2 outline-none
              focus-visible:shadow-[var(--focus-ring)]
            "
          />
        </label>

        <label
          className="flex flex-col gap-1 text-sm sm:col-span-2"
          htmlFor="book-name"
        >
          <span className="text-[color:var(--color-text)]/70">Nombre</span>
          <input
            id="book-name"
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Tu nombre"
            autoComplete="name"
            className="
              rounded-xl border border-brand-dark/20 bg-transparent px-3 py-2 outline-none
              focus-visible:shadow-[var(--focus-ring)]
            "
            required
          />
        </label>

        <label
          className="flex flex-col gap-1 text-sm sm:col-span-2"
          htmlFor="book-email"
        >
          <span className="text-[color:var(--color-text)]/70">Correo</span>
          <input
            id="book-email"
            ref={emailRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            className="
              rounded-xl border border-brand-dark/20 bg-transparent px-3 py-2 outline-none
              focus-visible:shadow-[var(--focus-ring)]
            "
            required
          />
        </label>
      </div>

      {err && (
        <p
          id="book-error"
          role="alert"
          aria-live="assertive"
          className="mt-3 rounded-xl border border-brand-red/20 bg-red-50 px-3 py-2 text-sm text-[color:var(--color-text)]"
        >
          {err}
        </p>
      )}

      <Button
        type="submit"
        className="mt-4 w-full"
        isLoading={loading}
        disabled={loading}
        aria-busy={loading || undefined}
      >
        {loading ? 'Creando pago…' : 'Reservar'}
      </Button>

      <p className="text-[color:var(--color-text)]/60 mt-2 text-center text-xs">
        Serás llevado a Stripe para completar el pago.
      </p>
    </form>
  );
}
