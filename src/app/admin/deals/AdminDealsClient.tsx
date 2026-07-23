'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Download,
  Search,
  RefreshCw,
  MapPin,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Filter,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  Terminal,
  Hash,
  Target,
  ChevronRight,
  Layout,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TIPADO DEL MOTOR COMERCIAL ---
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

// --- HELPERS DE MONEDA ---
function money(minor: number | null, currency: string) {
  if (typeof minor !== 'number') return '—';
  const v = minor / 100;
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `${v.toFixed(0)} ${currency.toUpperCase()}`;
  }
}

const STAGES: DealStage[] = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'checkout',
  'won',
  'lost',
];

export function AdminDealsClient() {
  const [items, setItems] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<string>('');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const myReqId = ++reqIdRef.current;

    try {
      const params = new URLSearchParams();
      if (stage) params.set('stage', stage);
      if (q.trim()) params.set('q', q.trim());
      params.set('limit', '50');

      const res = await adminFetch(`/api/admin/deals?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));

      if (myReqId !== reqIdRef.current) return;
      if (!res.ok) throw new Error(data?.error || 'Falla en el pipeline');

      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e: unknown) {
      if (myReqId !== reqIdRef.current) return;
      setError(e instanceof Error ? e.message : 'Error de sincronización');
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }, [stage, q]);

  useEffect(() => {
    void load();
  }, [load]);

  // --- TELEMETRÍA DE VENTAS ---
  const stats = useMemo(() => {
    const visible = items.reduce((sum, d) => sum + (d.amount_minor || 0), 0);
    const weighted = items.reduce(
      (sum, d) => sum + Math.round(((d.amount_minor || 0) * d.probability) / 100),
      0,
    );
    const checkout = items.filter((d) => d.stage === 'checkout').length;
    const hot = items.filter((d) => ['qualified', 'proposal', 'checkout'].includes(d.stage)).length;
    return { visible, weighted, checkout, hot };
  }, [items]);

  const dealSignals = useMemo(
    () => [
      {
        label: 'Valor Nominal',
        value: money(stats.visible, items[0]?.currency || 'eur'),
        note: 'Pipeline bruto visible.',
      },
      {
        label: 'Pipeline Pesado',
        value: money(stats.weighted, items[0]?.currency || 'eur'),
        note: 'Ajustado por probabilidad.',
      },
      { label: 'En Checkout', value: String(stats.checkout), note: 'Link de pago activo.' },
      { label: 'Hot Deals', value: String(stats.hot), note: 'Alta tracción en embudo.' },
    ],
    [stats, items],
  );

  async function updateStage(id: string, nextStage: DealStage) {
    const prev = [...items];
    setItems((cur) => cur.map((d) => (d.id === id ? { ...d, stage: nextStage } : d)));
    try {
      const res = await adminFetch(`/api/admin/deals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems(prev);
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-32 duration-1000">
      {/* 01. CABECERA EJECUTIVA */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <TrendingUp className="h-3.5 w-3.5" /> Commercial Revenue Lane
          </div>
          <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-5xl">
            Bandeja de <span className="font-light italic text-brand-yellow">Oportunidades</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base font-light leading-relaxed text-muted">
            Monitor centralizado de negociaciones. Identifica los hilos de alta temperatura y
            asegura que cada señal de interés se convierta en revenue para Knowing Cultures S.A.S.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => void load()}
            disabled={loading}
            variant="outline"
            className="h-12 rounded-full border-brand-dark/10 px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-surface-2"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`}
            />{' '}
            Sincronizar
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* 02. WORKBENCH TÁCTICO */}
      <AdminOperatorWorkbench
        eyebrow="Negotiation Strategy"
        title="Velocidad del Pipeline"
        description="Filtra por 'Hot Deals' para priorizar el seguimiento quirúrgico. Recuerda: los hilos en etapa 'Checkout' son prioridad 0 para el flujo de caja."
        actions={[
          { href: '/admin/revenue', label: 'Análisis de Revenue', tone: 'primary' },
          { href: '/admin/deals/board', label: 'Tablero Kanban' },
        ]}
        signals={dealSignals}
      />

      {/* 03. INSTRUMENTACIÓN DE FILTROS */}
      <section className="relative flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
        <div className="bg-surface-2/30 border-b border-brand-dark/5 p-8 pb-10 dark:border-white/5">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="grid w-full gap-6 sm:grid-cols-2 lg:w-3/5">
              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                  Filtrar por Estado
                </label>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue opacity-40" />
                  <select
                    className="h-14 w-full cursor-pointer appearance-none rounded-2xl border border-brand-dark/10 bg-surface pl-12 pr-6 text-sm font-bold text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                    value={stage}
                    onChange={(e) => {
                      setStage(e.target.value);
                    }}
                  >
                    <option value="">Todas las Etapas</option>
                    {STAGES.map((s) => (
                      <option
                        key={s}
                        value={s}
                      >
                        {s.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                  Buscador Táctico
                </label>
                <div className="group relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue opacity-40 transition-opacity group-focus-within:opacity-100" />
                  <input
                    className="placeholder:text-muted/30 h-14 w-full rounded-2xl border border-brand-dark/10 bg-surface pl-12 text-sm font-light text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Título, email o tour..."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                asChild
                variant="ghost"
                className="h-14 rounded-2xl border border-transparent px-6 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-blue/5"
              >
                <a href={`/api/admin/deals/export?${new URLSearchParams({ stage, q }).toString()}`}>
                  <Download className="mr-2 h-4 w-4" /> Exportar CSV
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => setStage('')}
              className={`h-9 rounded-full px-5 text-[10px] font-bold uppercase tracking-widest transition-all ${stage === '' ? 'scale-105 bg-brand-dark text-brand-yellow shadow-pop' : 'border border-brand-dark/10 bg-surface text-muted hover:bg-surface-2'}`}
            >
              Todos
            </button>
            {['new', 'qualified', 'proposal', 'checkout'].map((quick) => (
              <button
                key={quick}
                onClick={() => setStage(quick)}
                className={`h-9 rounded-full px-5 text-[10px] font-bold uppercase tracking-widest transition-all ${stage === quick ? 'scale-105 bg-brand-blue text-white shadow-pop' : 'border border-brand-dark/10 bg-surface text-muted hover:bg-surface-2'}`}
              >
                {quick}
              </button>
            ))}
          </div>
        </div>

        {/* 04. TABLA MAESTRA DE DEALS (LA BÓVEDA) */}
        <div className="custom-scrollbar overflow-x-auto px-2 pb-6">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-5">Entidad & Oportunidad</th>
                <th className="px-8 py-5">Voz del Cliente</th>
                <th className="px-8 py-5 text-center">Monto Nominal</th>
                <th className="px-8 py-5 text-center">Score de Confianza</th>
                <th className="px-8 py-5 text-right">Mando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
              {loading && items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="animate-pulse bg-surface px-8 py-40 text-center text-[11px] font-bold uppercase tracking-[0.5em] text-muted"
                  >
                    Interrogando al núcleo comercial...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="bg-surface px-8 py-40 text-center"
                  >
                    <TrendingUp className="mx-auto mb-6 h-16 w-16 text-brand-blue opacity-10" />
                    <p className="font-heading text-xl tracking-tight text-main opacity-30">
                      Pipeline en Silencio
                    </p>
                    <p className="mt-2 text-sm font-light italic text-muted">
                      No hay deals bajo el radar con los parámetros actuales.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-surface-2/50 group cursor-default bg-surface transition-colors"
                  >
                    <td className="px-8 py-8 align-top">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-blue/5 bg-brand-blue/10 text-brand-blue shadow-inner transition-transform group-hover:scale-105">
                          <Target className="h-5 w-5" />
                        </div>
                        <div>
                          <Link
                            href={`/admin/deals/${d.id}`}
                            className="flex items-center gap-2 font-heading text-xl leading-none tracking-tight text-main transition-colors group-hover:text-brand-blue"
                          >
                            {d.title || 'Innominado'}{' '}
                            <ChevronRight className="h-4 w-4 translate-x-[-4px] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                          </Link>
                          <div className="mt-2 flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                              <MapPin className="h-3 w-3 text-brand-blue opacity-40" />{' '}
                              {d.tour_slug || 'CUSTOM_TRIP'}
                            </span>
                            <span className="flex items-center gap-1 font-mono text-[9px] uppercase text-muted opacity-30">
                              <Hash className="h-2.5 w-2.5" /> {d.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-8 align-top">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 font-medium text-main">
                          <Mail className="h-4 w-4 text-brand-blue opacity-20" />{' '}
                          {d.customers?.name || d.customers?.email || d.leads?.email || (
                            <span className="opacity-20">—</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px] text-muted opacity-60">
                          <Phone className="h-4 w-4 text-brand-blue opacity-10" />{' '}
                          {d.customers?.phone || d.leads?.whatsapp || 'Sin contacto'}
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-8 text-center align-top">
                      <div
                        className={`font-heading text-2xl tracking-tighter ${d.amount_minor && d.amount_minor > 0 ? 'text-green-600 dark:text-green-400' : 'text-main opacity-20'}`}
                      >
                        {money(d.amount_minor, d.currency)}
                      </div>
                      <div className="relative mt-3">
                        <select
                          className="h-8 cursor-pointer appearance-none rounded-lg border border-brand-dark/10 bg-surface-2 px-3 pr-8 text-[9px] font-bold uppercase tracking-widest text-muted shadow-sm outline-none transition-all hover:border-brand-blue dark:border-white/10"
                          value={d.stage}
                          onChange={(e) => void updateStage(d.id, e.target.value as DealStage)}
                        >
                          {STAGES.map((s) => (
                            <option
                              key={s}
                              value={s}
                            >
                              {s}
                            </option>
                          ))}
                        </select>
                        <ChevronRight className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-90 opacity-20" />
                      </div>
                    </td>

                    <td className="w-[220px] px-8 py-8 text-center align-top">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest ${d.probability >= 70 ? 'text-green-600' : d.probability >= 30 ? 'text-amber-600' : 'text-red-500'}`}
                        >
                          <Sparkles className="h-3.5 w-3.5" /> {d.probability}% Confianza
                        </div>
                        <div className="mt-4 h-2 w-full overflow-hidden rounded-full border border-brand-dark/5 bg-surface-2 p-0.5 shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${d.probability >= 70 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : d.probability >= 30 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`}
                            style={{ width: `${d.probability}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-8 text-right align-top">
                      <div className="text-xs font-bold text-main">
                        {new Date(d.updated_at).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </div>
                      <div className="mt-1.5 flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-widest text-muted opacity-40">
                        <Clock className="h-3.5 w-3.5 text-brand-blue opacity-50" />{' '}
                        {new Date(d.updated_at).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* FOOTER DE INTEGRIDAD TÉCNICA */}
      <footer className="flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Commercial Integrity Active
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Terminal className="h-4 w-4 opacity-50" /> Pipeline Node v5.2
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Activity className="h-4 w-4" /> Live Market Signal
        </div>
      </footer>
    </div>
  );
}
