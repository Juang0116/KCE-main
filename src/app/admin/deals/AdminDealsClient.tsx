'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Download, Search, CheckCircle2, RefreshCw } from 'lucide-react';

type DealStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'checkout' | 'won' | 'lost';

type DealRow = {
  id: string;
  tour_slug: string | null;
  title: string;
  stage: DealStage;
  amount_minor: number | null;
  currency: string;
  probability: number;
  assigned_to: string | null;
  notes: string | null;
  source: string | null;
  updated_at: string;
  created_at: string;
  leads?: { email?: string | null; whatsapp?: string | null } | null;
  customers?: {
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    country?: string | null;
  } | null;
};

function money(minor: number | null, currency: string) {
  if (typeof minor !== 'number') return '—';
  const v = minor / 100;
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0
    }).format(v);
  } catch {
    return `${v.toFixed(0)} ${currency.toUpperCase()}`;
  }
}

function badgeStage(stage: string) {
  const v = (stage || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest';
  if (v === 'new') return `${base} border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
  if (v === 'contacted') return `${base} border border-teal-500/20 bg-teal-500/10 text-teal-700`;
  if (v === 'qualified') return `${base} border border-sky-500/20 bg-sky-500/10 text-sky-700`;
  if (v === 'proposal') return `${base} border border-amber-500/20 bg-amber-500/10 text-amber-700`;
  if (v === 'checkout') return `${base} border border-brand-blue/20 bg-brand-blue/10 text-brand-blue`;
  if (v === 'won') return `${base} border border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  if (v === 'lost') return `${base} border border-rose-500/20 bg-rose-500/10 text-rose-700`;
  return `${base} border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
}

const STAGES: DealStage[] = ['new', 'contacted', 'qualified', 'proposal', 'checkout', 'won', 'lost'];

export function AdminDealsClient() {
  const [items, setItems] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (stage) params.set('stage', stage);
    if (q.trim()) params.set('q', q.trim());
    const qs = params.toString();
    return `/api/admin/deals/export${qs ? `?${qs}` : ''}`;
  }, [stage, q]);

  const visibleValueMinor = useMemo(
    () => items.reduce((sum, d) => sum + (typeof d.amount_minor === 'number' ? d.amount_minor : 0), 0),
    [items],
  );
  const weightedValueMinor = useMemo(
    () =>
      items.reduce(
        (sum, d) => sum + (typeof d.amount_minor === 'number' ? Math.round((d.amount_minor * d.probability) / 100) : 0),
        0,
      ),
    [items],
  );
  const checkoutCount = useMemo(() => items.filter((d) => d.stage === 'checkout').length, [items]);
  const hotDealCount = useMemo(
    () => items.filter((d) => ['qualified', 'proposal', 'checkout'].includes(d.stage)).length,
    [items],
  );
  
  const dealSignals = useMemo(
    () => [
      {
        label: 'Visible value',
        value: money(visibleValueMinor, items[0]?.currency || 'eur'),
        note: 'Suma simple de los deals visibles bajo estos filtros.',
      },
      {
        label: 'Weighted pipeline',
        value: money(weightedValueMinor, items[0]?.currency || 'eur'),
        note: 'Valor del pipeline ajustado por la probabilidad de cierre.',
      },
      {
        label: 'Checkout now',
        value: String(checkoutCount),
        note: 'Deals en etapa de pago esperando confirmación.',
      },
      {
        label: 'Hot lanes',
        value: String(hotDealCount),
        note: 'Deals calificados, en propuesta o checkout.',
      },
    ],
    [checkoutCount, hotDealCount, items, visibleValueMinor, weightedValueMinor],
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (stage) params.set('stage', stage);
      if (q.trim()) params.set('q', q.trim());
      params.set('limit', '50');

      const res = await adminFetch(`/api/admin/deals?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to load deals');
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStage(id: string, nextStage: DealStage) {
    const prev = items;
    setItems((cur) => cur.map((d) => (d.id === id ? { ...d, stage: nextStage } : d)));
    try {
      const res = await adminFetch(`/api/admin/deals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to update deal');
    } catch (e: any) {
      setItems(prev);
      alert(e?.message || 'Error updating deal');
    }
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Bandeja de Deals</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Supervisa, edita y cambia el estado de todas las negociaciones activas.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="deals workbench"
        title="Prioriza los tratos más cercanos al cierre"
        description="Aplica presión a los carriles de 'Proposal' y 'Checkout' primero. Rescata solo las oportunidades viables y mantén siempre claro el próximo paso a seguir."
        actions={[
          { href: '/admin/deals/board', label: 'Kanban board', tone: 'primary' },
          { href: '/admin/sales', label: 'Sales Cockpit' },
          { href: '/admin/outbound', label: 'Outbound' },
        ]}
        signals={dealSignals}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Filtros Principales */}
        <div className="flex flex-col xl:flex-row gap-4 xl:items-end justify-between mb-8 border-b border-[var(--color-border)] pb-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Etapa Comercial</div>
              <select
                className="h-12 w-full sm:w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 font-semibold outline-none appearance-none"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                <option value="">Todas</option>
                {STAGES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </label>

            <label className="text-sm flex-1 sm:min-w-[300px]">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Buscar Deal</div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text)]/40" />
                <input
                  className="h-12 w-full pl-12 rounded-xl border border-[var(--color-border)] bg-transparent px-4 outline-none focus:border-brand-blue transition-colors"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Título, email, tour slug..."
                />
              </div>
            </label>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button onClick={load} disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Cargando...' : 'Aplicar'}
            </button>
            <a href={exportUrl} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-xs font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)]">
              <Download className="h-4 w-4" /> CSV
            </a>
          </div>
        </div>

        {/* Filtros Rápidos (Pills) */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button onClick={() => setStage('')} className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${stage === '' ? 'bg-[var(--color-text)] text-[var(--color-surface)] border-[var(--color-text)]' : 'border-[var(--color-border)] text-[var(--color-text)]/60 hover:bg-black/5'}`}>
            Todos
          </button>
          {(['new', 'qualified', 'proposal', 'checkout'] as DealStage[]).map((quick) => (
            <button key={quick} onClick={() => setStage(quick)} className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${stage === quick ? 'bg-brand-blue text-white border-brand-blue shadow-sm' : 'border-[var(--color-border)] text-[var(--color-text)]/60 hover:bg-black/5'}`}>
              {quick}
            </button>
          ))}
        </div>

        {error ? <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{error}</div> : null}

        {/* Tabla */}
        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-6 py-5">Deal</th>
                <th className="px-6 py-5">Contacto</th>
                <th className="px-6 py-5">Estado Rápido</th>
                <th className="px-6 py-5 text-right">Valor</th>
                <th className="px-6 py-5 text-right">Probabilidad</th>
                <th className="px-6 py-5">Actualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm text-[var(--color-text)]/40">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--color-text)]/10 mb-4" />
                    No se encontraron deals con estos filtros.
                  </td>
                </tr>
              ) : null}

              {items.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                  <td className="px-6 py-5 align-top">
                    <Link href={`/admin/deals/${d.id}`} className="font-heading text-lg text-brand-blue hover:underline">
                      {d.title}
                    </Link>
                    <div className="mt-1 text-xs text-[var(--color-text)]/60">
                      {d.tour_slug ? <span className="font-mono bg-[var(--color-surface-2)] px-2 py-0.5 rounded-md border border-[var(--color-border)]">{d.tour_slug}</span> : '—'}
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-[var(--color-text)]/30">ID: {d.id.slice(0, 8)}</div>
                  </td>

                  <td className="px-6 py-5 align-top">
                    <div className="font-medium text-[var(--color-text)]">
                      {d.customers?.name || d.customers?.email || d.leads?.email || '—'}
                    </div>
                    <div className="mt-1 text-xs text-[var(--color-text)]/60">
                      {d.customers?.phone || d.leads?.whatsapp || 'Sin teléfono'}
                    </div>
                  </td>

                  <td className="px-6 py-5 align-top">
                    <select
                      className="h-10 w-full max-w-[160px] rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-blue transition-colors cursor-pointer"
                      value={d.stage}
                      onChange={(e) => updateStage(d.id, e.target.value as DealStage)}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-[var(--color-text)]/40 flex items-center gap-1">
                      Origen: <span className="font-semibold">{d.source || '—'}</span>
                    </div>
                  </td>

                  <td className="px-6 py-5 align-top text-right">
                    <div className="font-heading text-lg text-[var(--color-text)]">{money(d.amount_minor, d.currency)}</div>
                  </td>

                  <td className="px-6 py-5 align-top text-right">
                    <div className={`font-semibold ${d.probability >= 70 ? 'text-emerald-600' : 'text-[var(--color-text)]/60'}`}>
                      {d.probability}%
                    </div>
                  </td>

                  <td className="px-6 py-5 align-top text-xs text-[var(--color-text)]/60">
                    {new Date(d.updated_at).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-text)]/50 font-light">
          💡 <strong>Tip Comercial:</strong> Para automatizar el flujo, la Inteligencia Artificial de KCE crea deals automáticamente cuando detecta intención real de reserva en las conversaciones (proposal/checkout).
        </p>
      </div>
    </div>
  );
}