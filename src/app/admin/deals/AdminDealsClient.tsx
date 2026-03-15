'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Download, Search, CheckCircle2, RefreshCw, Briefcase, MapPin } from 'lucide-react';

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
  customers?: { email?: string | null; name?: string | null; phone?: string | null; country?: string | null } | null;
};

function money(minor: number | null, currency: string) {
  if (typeof minor !== 'number') return '—';
  const v = minor / 100;
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(v);
  } catch {
    return `${v.toFixed(0)} ${currency.toUpperCase()}`;
  }
}

function badgeStage(stage: string) {
  const v = (stage || '').toLowerCase();
  const base = 'inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border';
  if (v === 'new') return `${base} border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
  if (v === 'contacted') return `${base} border-teal-500/20 bg-teal-500/10 text-teal-700`;
  if (v === 'qualified') return `${base} border-sky-500/20 bg-sky-500/10 text-sky-700`;
  if (v === 'proposal') return `${base} border-amber-500/20 bg-amber-500/10 text-amber-700`;
  if (v === 'checkout') return `${base} border-brand-blue/20 bg-brand-blue/10 text-brand-blue`;
  if (v === 'won') return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  if (v === 'lost') return `${base} border-rose-500/20 bg-rose-500/10 text-rose-700`;
  return `${base} border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
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

  const visibleValueMinor = useMemo(() => items.reduce((sum, d) => sum + (typeof d.amount_minor === 'number' ? d.amount_minor : 0), 0), [items]);
  const weightedValueMinor = useMemo(() => items.reduce((sum, d) => sum + (typeof d.amount_minor === 'number' ? Math.round((d.amount_minor * d.probability) / 100) : 0), 0), [items]);
  
  const checkoutCount = useMemo(() => items.filter((d) => d.stage === 'checkout').length, [items]);
  const hotDealCount = useMemo(() => items.filter((d) => ['qualified', 'proposal', 'checkout'].includes(d.stage)).length, [items]);
  
  const dealSignals = useMemo(() => [
    { label: 'Visible Value', value: money(visibleValueMinor, items[0]?.currency || 'eur'), note: 'Suma simple del valor de deals visibles.' },
    { label: 'Weighted Pipeline', value: money(weightedValueMinor, items[0]?.currency || 'eur'), note: 'Valor ajustado por probabilidad.' },
    { label: 'En Checkout', value: String(checkoutCount), note: 'Deals esperando el pago.' },
    { label: 'Hot Lanes', value: String(hotDealCount), note: 'Oportunidades calificadas o en propuesta.' },
  ], [checkoutCount, hotDealCount, items, visibleValueMinor, weightedValueMinor]);

  async function load() {
    setLoading(true); setError(null);
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
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function updateStage(id: string, nextStage: DealStage) {
    const prev = items;
    setItems((cur) => cur.map((d) => (d.id === id ? { ...d, stage: nextStage } : d)));
    try {
      const res = await adminFetch(`/api/admin/deals/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: nextStage }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to update deal');
    } catch (e: any) {
      setItems(prev); alert(e?.message || 'Error updating deal');
    }
  }

  return (
    <div className="space-y-10 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Bandeja de Deals</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Lista completa de oportunidades comerciales y negociaciones activas.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Pipeline Management"
        title="Mantén tu pipeline limpio"
        description="Esta es la vista de tabla global. Para trabajar el día a día y cerrar ventas más rápido, te sugerimos utilizar el Sales Cockpit o el Tablero Kanban."
        actions={[
          { href: '/admin/sales', label: 'Ir al Sales Cockpit', tone: 'primary' },
          { href: '/admin/deals/board', label: 'Ver Tablero Kanban' },
        ]}
        signals={dealSignals}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Filtros Principales */}
        <div className="flex flex-col xl:flex-row gap-4 xl:items-end justify-between mb-8 border-b border-[var(--color-border)] pb-8">
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto flex-1">
            <label className="text-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Etapa (Stage)</div>
              <select className="h-12 w-full sm:w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 font-semibold outline-none appearance-none cursor-pointer focus:border-brand-blue" value={stage} onChange={(e) => setStage(e.target.value)}>
                <option value="">Todas</option>
                {STAGES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </label>

            <label className="text-sm flex-1 sm:min-w-[300px]">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">Buscar Deal</div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text)]/40" />
                <input className="h-12 w-full pl-12 rounded-xl border border-[var(--color-border)] bg-transparent px-4 outline-none focus:border-brand-blue transition-colors" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Título, email, tour..." />
              </div>
            </label>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button onClick={load} disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-[10px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-md">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Cargando...' : 'Aplicar'}
            </button>
            <a href={exportUrl} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)]">
              <Download className="h-4 w-4" /> CSV
            </a>
          </div>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-medium text-rose-800">{error}</div>}

        {/* Filtros Rápidos */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button onClick={() => setStage('')} className={`rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${stage === '' ? 'bg-[var(--color-text)] text-[var(--color-surface)]' : 'border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/60 hover:bg-[var(--color-surface)]'}`}>
            Todos
          </button>
          {(['new', 'qualified', 'proposal', 'checkout'] as DealStage[]).map((quick) => (
            <button key={quick} onClick={() => setStage(quick)} className={`rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${stage === quick ? 'bg-brand-blue text-white shadow-sm' : 'border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/60 hover:bg-[var(--color-surface)]'}`}>
              {quick}
            </button>
          ))}
        </div>

        {/* Tabla Principal */}
        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-6 py-5">Info Deal</th>
                <th className="px-6 py-5">Contacto Cliente</th>
                <th className="px-6 py-5">Etapa (Stage)</th>
                <th className="px-6 py-5 text-right">Valor Negociado</th>
                <th className="px-6 py-5 text-center">Probabilidad</th>
                <th className="px-6 py-5 text-right">Actualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {loading && items.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[var(--color-text)]/40 font-medium">Buscando deals...</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Briefcase className="mx-auto h-12 w-12 text-[var(--color-text)]/10 mb-4" />
                    <div className="font-medium text-[var(--color-text)]/40">No hay deals para estos filtros.</div>
                  </td>
                </tr>
              ) : (
                items.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                    
                    <td className="px-6 py-5 align-top">
                      <Link href={`/admin/deals/${d.id}`} className="font-semibold text-brand-blue hover:underline line-clamp-1 max-w-[250px]">{d.title || 'Deal sin título'}</Link>
                      <div className="mt-1 text-[10px] font-mono text-[var(--color-text)]/40">ID: {d.id.slice(0, 8)}</div>
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                        <MapPin className="h-3 w-3"/> {d.tour_slug || '—'}
                      </div>
                    </td>

                    <td className="px-6 py-5 align-top">
                      <div className="font-medium text-[var(--color-text)]">{d.customers?.name || d.customers?.email || d.leads?.email || '—'}</div>
                      <div className="mt-1 text-[10px] text-[var(--color-text)]/60 font-mono">{d.customers?.phone || d.leads?.whatsapp || 'Sin Teléfono'}</div>
                    </td>

                    <td className="px-6 py-5 align-top">
                      <select className="h-10 w-full max-w-[160px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-brand-blue cursor-pointer transition-colors" value={d.stage} onChange={(e) => updateStage(d.id, e.target.value as DealStage)}>
                        {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="mt-2 text-[9px] uppercase tracking-widest text-[var(--color-text)]/40">Source: <span className="font-semibold">{d.source || '—'}</span></div>
                    </td>

                    <td className="px-6 py-5 align-top text-right">
                      <div className={`font-heading text-lg ${d.amount_minor && d.amount_minor > 0 ? 'text-emerald-600' : 'text-[var(--color-text)]/40'}`}>{money(d.amount_minor, d.currency)}</div>
                    </td>

                    <td className="px-6 py-5 align-top text-center">
                      <div className={`font-semibold ${d.probability >= 70 ? 'text-emerald-600' : d.probability >= 30 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {d.probability}%
                      </div>
                      <div className="w-full bg-[var(--color-surface-2)] h-1.5 mt-2 rounded-full overflow-hidden border border-[var(--color-border)]">
                        <div className={`h-full ${d.probability >= 70 ? 'bg-emerald-500' : d.probability >= 30 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${d.probability}%` }}></div>
                      </div>
                    </td>

                    <td className="px-6 py-5 align-top text-right">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-1">{new Date(d.updated_at).toLocaleDateString('es-ES')}</div>
                      <div className="font-mono text-[10px] text-[var(--color-text)]/40">{new Date(d.updated_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}