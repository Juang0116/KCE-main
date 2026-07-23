'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Calendar, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Props = {
  tourSlug: string;
  tourTitle: string;
  defaultDate?: string;
};

// Helpers de validación
const todayISO = () => new Date().toISOString().split('T')[0];
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function BookButton({ tourSlug, tourTitle, defaultDate }: Props) {
  const id = React.useId();
  const [date, setDate] = React.useState(defaultDate || todayISO());
  const [quantity, setQuantity] = React.useState('1');
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [acceptedTerms, setAcceptedTerms] = React.useState(false); // VALIDACIÓN LEGAL
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onReserve(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !acceptedTerms) return;

    setErr(null);
    if (!name.trim()) return setErr('Por favor, dinos tu nombre.');
    if (!isValidEmail(email)) return setErr('Ingresa un correo electrónico válido.');

    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourSlug,
          quantity: Number(quantity),
          customer: { email, name },
          date,
          originCurrency: 'USD',
        }),
      });

      const data = await res.json();
      if (res.ok && data.url) {
        window.location.assign(data.url);
      } else {
        setErr(data.error || 'No se pudo iniciar el pago.');
      }
    } catch (e) {
      setErr('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onReserve}
      className="group relative overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-surface p-6 shadow-pop md:p-8"
    >
      {/* Línea de acento */}
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent" />

      <header className="mb-8 border-b border-brand-dark/5 pb-6">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
          Reserva de Experiencia
        </p>
        <h3 className="font-heading text-2xl tracking-tight text-main">{tourTitle}</h3>
      </header>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor={`${id}-date`}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted"
            >
              <Calendar className="size-3" /> Fecha
            </label>
            <input
              id={`${id}-date`}
              type="date"
              min={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-brand-dark/10 bg-surface-2 px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`${id}-quantity`}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted"
            >
              <Users className="size-3" /> Viajeros
            </label>
            <input
              id={`${id}-quantity`}
              type="number"
              min="1"
              max="20"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-brand-dark/10 bg-surface-2 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label
            htmlFor={`${id}-name`}
            className="block text-[10px] font-bold uppercase tracking-widest text-muted"
          >
            Nombre completo
          </label>
          <input
            id={`${id}-name`}
            placeholder="Tu nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-brand-dark/10 bg-surface-2 px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
          <label
            htmlFor={`${id}-email`}
            className="block text-[10px] font-bold uppercase tracking-widest text-muted"
          >
            Correo electrónico
          </label>
          <input
            id={`${id}-email`}
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-brand-dark/10 bg-surface-2 px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>

        {/* CHECKBOX LEGAL OBLIGATORIO */}
        <div className="pt-4">
          <label className="group/check flex cursor-pointer items-start gap-3">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-5 w-5 rounded border border-brand-dark/20 bg-surface-2 transition-all peer-checked:border-brand-blue peer-checked:bg-brand-blue" />
              <ShieldCheck className="absolute inset-0 size-5 p-0.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
            </div>
            <span className="text-[11px] font-light leading-relaxed text-muted">
              Confirmo que he leído y acepto los{' '}
              <Link
                href="/terms"
                className="font-bold text-brand-blue hover:underline"
              >
                Términos de Uso
              </Link>{' '}
              y la{' '}
              <Link
                href="/policies/cancellation"
                className="font-bold text-brand-blue hover:underline"
              >
                Política de Cancelación
              </Link>{' '}
              de Knowing Cultures S.A.S.
            </span>
          </label>
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-xs font-medium text-red-600">
          {err}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !acceptedTerms}
        className={`mt-8 h-14 w-full rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-pop transition-all ${acceptedTerms ? 'bg-brand-blue text-white hover:bg-brand-dark' : 'bg-muted/20 cursor-not-allowed text-muted'}`}
      >
        {loading ? 'Preparando pasarela...' : 'Proceder al Pago'}
      </Button>

      <div className="mt-6 flex items-center justify-center gap-2 opacity-40">
        <Lock className="size-3" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted">
          Pago Seguro vía Stripe
        </span>
      </div>
    </form>
  );
}
