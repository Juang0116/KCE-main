/* src/features/booking/BookingSidebar.tsx */
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Loader2 } from 'lucide-react';
import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import OpenChatButton from '@/features/ai/OpenChatButton';
import { formatCOP } from '@/utils/format';

type MiniTour = {
  slug?: string;
  title: string;
  short?: string;
  price: number;
};

type BookingSidebarProps = {
  tour: MiniTour;
  datePrefill?: string; // YYYY-MM-DD
  qtyPrefill?: string | number;
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const Schema = z.object({
  date: z
    .string()
    .min(1, 'Selecciona una fecha')
    .refine((v) => {
      const d = new Date(`${v}T00:00:00`);
      const t = new Date();
      t.setHours(0, 0, 0, 0);
      return !Number.isNaN(d.getTime()) && d >= t;
    }, 'Selecciona una fecha de hoy o futura'),
  people: z
    .number()
    .int('Debe ser entero')
    .min(1, 'Mínimo 1 persona')
    .max(12, 'Para 13+ contáctanos por chat'),
  name: z.string().min(2, 'Tu nombre'),
  email: z.string().email('Email inválido'),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^[+\d()\-.\s]{7,}$/.test(v), {
      message: 'Número no válido',
    }),
});

type FormValues = z.infer<typeof Schema>;

export default function BookingSidebar({ tour, datePrefill, qtyPrefill }: BookingSidebarProps) {
  const initialPeople = React.useMemo(() => {
    const raw =
      typeof qtyPrefill === 'number'
        ? qtyPrefill
        : qtyPrefill
          ? Number.parseInt(String(qtyPrefill), 10)
          : NaN;
    if (!Number.isFinite(raw) || raw <= 0) return 2;
    return Math.min(12, Math.max(1, raw));
  }, [qtyPrefill]);

  const initialDate = React.useMemo(() => {
    if (!datePrefill) return '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePrefill)) return '';
    return datePrefill;
  }, [datePrefill]);

  const {
    register,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { people: initialPeople, date: initialDate },
    mode: 'onSubmit',
  });

  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const people = watch('people') ?? initialPeople;
  const total = React.useMemo(
    () => Math.max(1, Number(people) || 1) * tour.price,
    [people, tour.price],
  );

  React.useEffect(() => {
    const keys = Object.keys(errors) as (keyof FormValues)[];
    if (keys.length > 0) setFocus(keys[0]!);
  }, [errors, setFocus]);

  React.useEffect(() => () => abortRef.current?.abort(), []);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (isSubmitting) return;
    setSubmitError(null);

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
        signal: ctrl.signal,
        body: JSON.stringify({
          tour,
          quantity: values.people,
          customer: { email: values.email, name: values.name },
          date: values.date,
          phone: values.phone && values.phone.trim() ? values.phone.trim() : undefined,
          currency: 'COP',
          locale,
        }),
      });

      const data = await res.json().catch(() => ({}) as any);
      if (res.ok && data?.url) {
        window.location.assign(String(data.url));
        return;
      }

      setSubmitError(
        data?.error || 'No pudimos iniciar el checkout. Intenta de nuevo o escríbenos por chat.',
      );
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.error(e);
      setSubmitError('Error de red. Verifica tu conexión e intenta nuevamente.');
    }
  };

  const errId = (name: keyof FormValues) => (errors[name] ? `${name}-error` : undefined);

  return (
    <aside className="rounded-2xl border border-brand-dark/15 dark:border-white/10 bg-surface p-5 shadow-soft">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-main opacity-70 text-sm">Desde</div>
          <div className="font-heading text-2xl text-brand-red">{formatCOP(tour.price)}</div>
        </div>
        <div
          className="text-right"
          aria-live="polite"
        >
          <div className="text-main opacity-60 text-xs">Total estimado</div>
          <div className="font-heading text-lg text-brand-blue">{formatCOP(total)}</div>
          <div className="text-main opacity-60 mt-0.5 text-[11px]">
            {formatCOP(tour.price)} x {Math.max(1, Number(people) || 1)}{' '}
            {Number(people) === 1 ? 'persona' : 'personas'}
          </div>
        </div>
      </div>

      {submitError && (
        <div
          id="checkout-error"
          role="alert"
          aria-live="assertive"
          className="mt-3 rounded-xl border border-red-500/20 bg-red-50 px-3 py-2 text-sm text-main"
        >
          {submitError}
        </div>
      )}

      <form
        className="mt-4 space-y-3"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-describedby={submitError ? 'checkout-error' : undefined}
      >
        <label
          className="text-main opacity-90 block text-sm font-medium"
          htmlFor="date"
        >
          Fecha
          <input
            id="date"
            type="date"
            min={todayISO()}
            autoComplete="off"
            className="mt-1 w-full rounded-xl border border-brand-dark/15 dark:border-white/10 px-3 py-2 text-main bg-surface focus:ring-2 focus:ring-brand-blue/30 outline-none transition-shadow"
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errId('date')}
            {...register('date')}
          />
          {errors.date && (
            <span
              id="date-error"
              className="text-xs text-brand-red"
            >
              {errors.date.message}
            </span>
          )}
        </label>

        <label
          className="text-main opacity-90 block text-sm font-medium"
          htmlFor="people"
        >
          Personas
          <input
            id="people"
            type="number"
            min={1}
            max={12}
            step={1}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
            className="mt-1 w-full rounded-xl border border-brand-dark/15 dark:border-white/10 px-3 py-2 text-main bg-surface focus:ring-2 focus:ring-brand-blue/30 outline-none transition-shadow"
            aria-invalid={Boolean(errors.people)}
            aria-describedby={errId('people')}
            {...register('people', { valueAsNumber: true })}
          />
          {errors.people && (
            <span
              id="people-error"
              className="text-xs text-brand-red"
            >
              {errors.people.message}
            </span>
          )}
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label
            className="text-main opacity-90 block text-sm font-medium"
            htmlFor="name"
          >
            Nombre
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-brand-dark/15 dark:border-white/10 px-3 py-2 text-main bg-surface focus:ring-2 focus:ring-brand-blue/30 outline-none transition-shadow"
              placeholder="Tu nombre"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errId('name')}
              {...register('name')}
            />
            {errors.name && (
              <span
                id="name-error"
                className="text-xs text-brand-red"
              >
                {errors.name.message}
              </span>
            )}
          </label>

          <label
            className="text-main opacity-90 block text-sm font-medium"
            htmlFor="email"
          >
            Email
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-brand-dark/15 dark:border-white/10 px-3 py-2 text-main bg-surface focus:ring-2 focus:ring-brand-blue/30 outline-none transition-shadow"
              placeholder="tucorreo@email.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errId('email')}
              {...register('email')}
            />
            {errors.email && (
              <span
                id="email-error"
                className="text-xs text-brand-red"
              >
                {errors.email.message}
              </span>
            )}
          </label>
        </div>

        <label
          className="text-main opacity-90 block text-sm font-medium"
          htmlFor="phone"
        >
          WhatsApp (opcional)
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="mt-1 w-full rounded-xl border border-brand-dark/15 dark:border-white/10 px-3 py-2 text-main bg-surface focus:ring-2 focus:ring-brand-blue/30 outline-none transition-shadow"
            placeholder="+57 300 000 0000"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errId('phone')}
            {...register('phone')}
          />
          {errors.phone && (
            <span
              id="phone-error"
              className="text-xs text-brand-red"
            >
              {errors.phone.message}
            </span>
          )}
        </label>

        <Button
          type="submit"
          className="w-full bg-brand-blue text-white hover:bg-brand-blue/90 border-transparent transition-colors mt-2"
          disabled={isSubmitting}
          aria-busy={isSubmitting || undefined}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2
                className="size-4 animate-spin"
                aria-hidden
              />
              Iniciando pago…
            </span>
          ) : (
            'Confirmar disponibilidad y pagar'
          )}
        </Button>

        <OpenChatButton
          variant="outline"
          className="w-full text-brand-blue border-brand-blue bg-transparent hover:bg-brand-blue/5 transition-colors"
          addQueryParam
        >
          Hablar con nuestra IA
        </OpenChatButton>

        <div className="text-main opacity-60 flex items-center justify-center gap-2 pt-2 text-xs">
          <Lock
            className="size-3.5"
            aria-hidden
          />
          <span>Pagos seguros con Stripe • Cancelación flexible según política</span>
        </div>
      </form>
    </aside>
  );
}