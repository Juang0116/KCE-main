'use client';

/**
 * BookingWidget V2 — KCE
 * Soporta:
 *  - Tour individual (slug único) con rango de fechas
 *  - Combo multi-tour (hasta 3 tours) con rango de fechas por tour
 *  - Verificación de identidad integrada y obligatoria
 *  - exactOptionalPropertyTypes: true — sin `undefined` explícito
 */

import { Loader2, Lock, Plus, X, Tag, Calendar as CalendarIcon, Clock } from 'lucide-react';
import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { addDays, startOfToday, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { supabaseBrowser } from '@/lib/supabase/browser';
import IdentityUpload from '@/features/auth/IdentityUpload';

import { Button } from '@/components/ui/Button';
import OpenChatButton from '@/features/ai/OpenChatButton';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TourOption = {
  slug: string;
  title: string;
  price: number;
};

type BookingItem = {
  slug: string;
  title: string;
  price: number;
  dateRange?: DateRange | undefined;
};

type BookingWidgetProps = {
  slug: string;
  title: string;
  price: number;
  short?: string;
  availableTours?: readonly TourOption[];
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const COMBO_DISCOUNTS: Record<number, number> = {
  2: 0.1,
  3: 0.15,
};

const EUR_FORMATTER = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clampQty(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(1, Math.min(20, Math.round(n))) : 1;
}

function fmtEUR(minor: number): string {
  return EUR_FORMATTER.format(minor / 100);
}

function calcTotal(
  items: BookingItem[],
  qty: number,
): { subtotal: number; discount: number; total: number } {
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
  minSelectableDate,
  onRemove,
  onDateChange,
}: {
  item: BookingItem;
  index: number;
  qty: number;
  minSelectableDate: Date;
  onRemove: (slug: string) => void;
  onDateChange: (slug: string, range: DateRange | undefined) => void;
}) {
  const [showCalendar, setShowCalendar] = React.useState(false);

  React.useEffect(() => {
    if (showCalendar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCalendar]);

  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">
            Tour {index + 1}
          </span>
          <p className="text-sm font-medium leading-tight text-[color:var(--color-text)]">
            {item.title}
          </p>
          <p className="mt-0.5 text-xs text-[color:var(--color-text-muted)]">
            {fmtEUR(item.price)} × {qty} = {fmtEUR(item.price * qty)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.slug)}
          className="rounded-lg p-1 text-[color:var(--color-text-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-2">
        <div className="mb-1 block text-xs font-medium text-[color:var(--color-text)]">
          Fechas del viaje
        </div>
        <button
          type="button"
          onClick={() => setShowCalendar(true)}
          className="flex w-full items-center justify-between rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm outline-none transition-colors hover:border-brand-blue/50"
        >
          <span className="text-[color:var(--color-text)]">
            {item.dateRange?.from
              ? item.dateRange.to
                ? `${format(item.dateRange.from, 'dd MMM')} - ${format(item.dateRange.to, 'dd MMM')}`
                : format(item.dateRange.from, 'dd MMM yyyy')
              : 'Seleccionar fechas'}
          </span>
          <CalendarIcon className="size-4 text-[color:var(--color-text-muted)]" />
        </button>

        {showCalendar && (
          <div className="animate-in fade-in fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-[color:var(--color-border)] bg-white p-6 shadow-2xl dark:bg-slate-900">
              <div className="mb-4 flex w-full items-center justify-between border-b border-gray-100 pb-4 dark:border-white/10">
                <h4 className="text-sm font-bold text-[color:var(--color-text)]">
                  Selecciona tus fechas
                </h4>
                <button
                  type="button"
                  onClick={() => setShowCalendar(false)}
                  className="rounded-full p-2 hover:bg-gray-100"
                >
                  <X className="size-4" />
                </button>
              </div>
              <DayPicker
                mode="range"
                selected={item.dateRange}
                onSelect={(range) => onDateChange(item.slug, range)}
                disabled={{ before: minSelectableDate }}
                locale={es}
              />
              <div className="mt-6 flex w-full justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => onDateChange(item.slug, undefined)}
                  className="h-10 rounded-xl text-xs"
                >
                  Limpiar
                </Button>
                <Button
                  onClick={() => setShowCalendar(false)}
                  className="h-10 rounded-xl bg-brand-blue px-6 text-xs text-white"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
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
  const today = startOfToday();
  const minSelectableDate = addDays(today, 7);

  const [items, setItems] = React.useState<BookingItem[]>([{ slug, title, price }]);
  const [qty, setQty] = React.useState('2');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ESTADO DE IDENTIDAD
  const [identityStatus, setIdentityStatus] = React.useState<string>('none');
  const supabase = React.useMemo(() => supabaseBrowser(), []);

  const refreshIdentity = React.useCallback(async () => {
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await (supabase as any)
        .from('customers')
        .select('identity_status')
        .eq('id', user.id)
        .maybeSingle();
      setIdentityStatus(data?.identity_status || 'none');
    }
  }, [supabase]);

  React.useEffect(() => {
    refreshIdentity();
  }, [refreshIdentity]);

  const pathname = usePathname();
  const sp = useSearchParams();
  const qtyNumber = React.useMemo(() => clampQty(qty), [qty]);
  const pricing = React.useMemo(() => calcTotal(items, qtyNumber), [items, qtyNumber]);
  const isCombo = items.length > 1;

  const addableTours = React.useMemo(
    () => availableTours.filter((t) => !items.some((it) => it.slug === t.slug)),
    [availableTours, items],
  );

  function addTour(tour: TourOption) {
    if (items.length >= 3) return;
    setItems((prev) => [...prev, { slug: tour.slug, title: tour.title, price: tour.price }]);
  }

  function removeTour(tourSlug: string) {
    setItems((prev) => prev.filter((it) => it.slug !== tourSlug));
  }

  function updateDateRange(tourSlug: string, dateRange: DateRange | undefined) {
    setItems((prev) => prev.map((it) => (it.slug === tourSlug ? { ...it, dateRange } : it)));
  }

  const waHref = React.useMemo(() => {
    const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';
    if (!number) return '';
    const tourLines = items
      .map((it, i) => {
        const dates = it.dateRange?.from
          ? `${format(it.dateRange.from, 'dd/MM')} al ${it.dateRange.to ? format(it.dateRange.to, 'dd/MM') : '...'}`
          : 'Sin definir';
        return `Tour ${i + 1}: ${it.title} — Fechas: ${dates}`;
      })
      .join('\n');
    const msg = [
      `Hola KCE, quiero información.`,
      '',
      tourLines,
      '',
      `Personas: ${qtyNumber}`,
      '',
      '¿Me confirmas disponibilidad?',
    ].join('\n');
    return buildWhatsAppHref({
      number,
      message: msg,
      url: `${pathname ?? ''}${sp?.toString() ? `?${sp.toString()}` : ''}`,
    });
  }, [pathname, sp, items, qtyNumber]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);

    if (!name.trim()) return setError('Ingresa tu nombre completo.');
    if (!email.trim()) return setError('Ingresa un correo válido.');

    for (const it of items) {
      if (!it.dateRange?.from || !it.dateRange?.to)
        return setError(`Selecciona fechas para "${it.title}".`);
    }

    setPending(true);
    try {
      const body = isCombo
        ? {
            mode: 'combo',
            items: items.map((it) => ({
              slug: it.slug,
              start_date: it.dateRange!.from!.toISOString(),
              end_date: it.dateRange!.to!.toISOString(),
            })),
            guests: qtyNumber,
            customer: { name: name.trim(), email: email.trim() },
            currency: 'EUR',
          }
        : {
            tour: { slug: items[0]!.slug, title: items[0]!.title, short },
            quantity: qtyNumber,
            customer: { name: name.trim(), email: email.trim() },
            start_date: items[0]!.dateRange!.from!.toISOString(),
            end_date: items[0]!.dateRange!.to!.toISOString(),
            currency: 'EUR',
          };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || 'Error al iniciar el pago.');
      window.location.assign(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="text-xs text-[color:var(--color-text-muted)]">
            {isCombo ? 'Combo' : 'Desde'}
          </div>
          <div className="font-heading text-2xl text-brand-red">{fmtEUR(pricing.total)}</div>
          <div className="mt-0.5 text-xs text-[color:var(--color-text-muted)]">
            total · {qtyNumber} {qtyNumber === 1 ? 'persona' : 'personas'}
          </div>
        </div>
        {isCombo && (
          <div className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1">
            <Tag className="size-3 text-green-600" />
            <span className="text-[11px] font-bold text-green-700">
              −{Math.round((COMBO_DISCOUNTS[items.length] ?? 0) * 100)}% combo
            </span>
          </div>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-3"
        noValidate
      >
        <div className="space-y-2">
          {items.map((item, i) => (
            <ComboTourRow
              key={item.slug}
              item={item}
              index={i}
              qty={qtyNumber}
              minSelectableDate={minSelectableDate}
              onRemove={removeTour}
              onDateChange={updateDateRange}
            />
          ))}
        </div>

        {addableTours.length > 0 && items.length < 3 && (
          <div className="rounded-xl border border-dashed border-brand-blue/30 bg-brand-blue/5 p-3">
            <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-brand-blue">
              <Plus className="size-3" /> Agregar tour al combo
            </p>
            <div className="flex flex-col gap-1.5">
              {addableTours.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => addTour(t)}
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-left text-sm transition-colors hover:border-brand-blue/50"
                >
                  <span className="font-medium text-[color:var(--color-text)]">{t.title}</span>
                  <span className="ml-2 text-[color:var(--color-text-muted)]">
                    {fmtEUR(t.price)}/p
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-[color:var(--color-text)]">
            Nombre completo
            <input
              required
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              className="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-[color:var(--color-text)]">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              className="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2"
            />
          </label>
        </div>

        {/* ── SECCIÓN DE VERIFICACIÓN ── */}
        <div className="mt-6 space-y-4 border-t border-[color:var(--color-border)] pt-6">
          {(identityStatus === 'none' || identityStatus === 'rejected') && (
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                <p className="text-[11px] font-medium leading-relaxed text-amber-800 dark:text-amber-400">
                  <strong>Verificación necesaria:</strong> Requerimos una foto de tu ID o Pasaporte
                  para procesar la reserva por seguridad.
                </p>
              </div>
              <IdentityUpload onUploadSuccess={refreshIdentity} />
            </div>
          )}

          {identityStatus === 'pending' && (
            <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:bg-blue-950/20">
              <Clock className="size-4 text-blue-600" />
              <p className="text-[11px] text-blue-800">
                Documento en revisión. Puedes pagar, pero la reserva depende de la aprobación final.
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="h-12 w-full bg-brand-blue text-white hover:bg-brand-blue/90"
            disabled={pending || identityStatus === 'none' || identityStatus === 'rejected'}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              `Ir al pago seguro (${fmtEUR(pricing.total)})`
            )}
          </Button>
        </div>

        <OpenChatButton
          variant="outline"
          className="mt-2 w-full"
          addQueryParam
        >
          Hablar con nuestra IA
        </OpenChatButton>

        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium"
          >
            Consultar por WhatsApp
          </a>
        )}
      </form>
    </aside>
  );
}
