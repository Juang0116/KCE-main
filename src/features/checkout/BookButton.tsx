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
          originCurrency: 'USD'
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
    <form onSubmit={onReserve} className="rounded-[var(--radius-2xl)] border border-brand-dark/10 bg-surface p-6 md:p-8 shadow-pop relative overflow-hidden group">
      {/* Línea de acento */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent" />
      
      <header className="mb-8 border-b border-brand-dark/5 pb-6">
         <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue mb-2">Reserva de Experiencia</p>
         <h3 className="font-heading text-2xl text-main tracking-tight">{tourTitle}</h3>
      </header>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-2">
               <Calendar className="size-3" /> Fecha
            </label>
            <input 
              type="date" 
              min={todayISO()} 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="w-full bg-surface-2 border border-brand-dark/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-2">
               <Users className="size-3" /> Viajeros
            </label>
            <input 
              type="number" 
              min="1" 
              max="20" 
              value={quantity} 
              onChange={e => setQuantity(e.target.value)}
              className="w-full bg-surface-2 border border-brand-dark/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <input 
            placeholder="Tu nombre completo" 
            value={name} 
            onChange={e => setName(e.target.value)}
            className="w-full bg-surface-2 border border-brand-dark/10 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none"
          />
          <input 
            type="email" 
            placeholder="tu@correo.com" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-surface-2 border border-brand-dark/10 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none"
          />
        </div>

        {/* CHECKBOX LEGAL OBLIGATORIO */}
        <div className="pt-4">
          <label className="flex items-start gap-3 cursor-pointer group/check">
            <div className="relative mt-1">
              <input 
                type="checkbox" 
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-5 w-5 rounded border border-brand-dark/20 bg-surface-2 peer-checked:bg-brand-blue peer-checked:border-brand-blue transition-all" />
              <ShieldCheck className="absolute inset-0 size-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity p-0.5" />
            </div>
            <span className="text-[11px] leading-relaxed text-muted font-light">
              Confirmo que he leído y acepto los <Link href="/terms" className="text-brand-blue font-bold hover:underline">Términos de Uso</Link> y la <Link href="/policies/cancellation" className="text-brand-blue font-bold hover:underline">Política de Cancelación</Link> de Knowing Cultures S.A.S.
            </span>
          </label>
        </div>
      </div>

      {err && <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">{err}</div>}

      <Button 
        type="submit" 
        disabled={loading || !acceptedTerms}
        className={`mt-8 w-full h-14 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-pop ${acceptedTerms ? 'bg-brand-blue text-white hover:bg-brand-dark' : 'bg-muted/20 text-muted cursor-not-allowed'}`}
      >
        {loading ? 'Preparando pasarela...' : 'Proceder al Pago'}
      </Button>

      <div className="mt-6 flex items-center justify-center gap-2 opacity-40">
         <Lock className="size-3" />
         <span className="text-[9px] font-bold uppercase tracking-widest text-muted">Pago Seguro vía Stripe</span>
      </div>
    </form>
  );
}