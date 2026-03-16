'use client';

import { useEffect, useRef, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { Tag, RefreshCw, Plus, AlertCircle, Percent, DollarSign, MapPin, Globe, Activity } from 'lucide-react';

type Rule = {
  id: string;
  scope: 'tour' | 'tag' | 'city' | 'global';
  tour_id: string | null;
  tag: string | null;
  city: string | null;
  start_date: string | null;
  end_date: string | null;
  currency: string;
  kind: 'delta' | 'override';
  delta_minor: number;
  override_price_minor: number | null;
  priority: number;
  status: 'active' | 'paused' | 'archived';
};

type Payload = { items: Rule[] };

function isPayload(x: unknown): x is Payload {
  if (!x || typeof x !== 'object') return false;
  const o = x as { items?: unknown };
  return Array.isArray(o.items);
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const j = (await res.json()) as any;
      return String(j?.error || j?.message || res.statusText || 'Error');
    }
    const t = await res.text();
    return t ? t.slice(0, 300) : String(res.statusText || 'Error');
  } catch {
    return String(res.statusText || 'Error');
  }
}

function isScope(x: string): x is Rule['scope'] {
  return x === 'global' || x === 'city' || x === 'tag' || x === 'tour';
}

function fmtMoney(minor: number | null, cur: string) {
  if (typeof minor !== 'number') return '—';
  const v = minor / 100;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: cur.toUpperCase(), maximumFractionDigits: 0 }).format(v);
}

function badgeScope(scope: string) {
  const base = 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border shadow-sm';
  if (scope === 'global') return `${base} border-brand-blue/20 bg-brand-blue/10 text-brand-blue`;
  if (scope === 'city') return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  if (scope === 'tag') return `${base} border-purple-500/20 bg-purple-500/10 text-purple-700`;
  return `${base} border-amber-500/20 bg-amber-500/10 text-amber-700`;
}

function badgeStatus(status: string) {
  if (status === 'active') return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
  if (status === 'paused') return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
  return 'text-[var(--color-text)]/50 bg-[var(--color-surface-2)] border-[var(--color-border)]';
}

export function AdminCatalogClient() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reqIdRef = useRef(0);

  async function refresh() {
    setErr(null);
    setLoading(true);
    const myReqId = ++reqIdRef.current;

    try {
      const res = await adminFetch('/api/admin/catalog/pricing-rules');
      if (myReqId !== reqIdRef.current) return;
      if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const data: unknown = await res.json();
      if (!isPayload(data)) throw new Error('Respuesta inesperada del servidor (payload inválido).');
      setRules(data.items ?? []);
    } catch (e: unknown) {
      if (myReqId !== reqIdRef.current) return;
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }

  async function createRule() {
    setErr(null);
    const rawScope = (prompt('Alcance de la regla (global | city | tag | tour):', 'global') || '').trim();
    if (!rawScope) return;
    if (!isScope(rawScope)) {
      setErr('Scope inválido. Usa: global | city | tag | tour');
      return;
    }

    const deltaStr = prompt('Variación de precio en céntimos (Ej: 5000 = +50 EUR, -5000 = -50 EUR)', '0');
    if (!deltaStr) return;
    const delta = Number(deltaStr);

    try {
      setLoading(true);
      const res = await adminFetch('/api/admin/catalog/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: rawScope,
          delta_minor: Number.isFinite(delta) ? delta : 0,
          currency: 'EUR',
          kind: 'delta',
          priority: 100,
          status: 'active',
        }),
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new Error(msg || `HTTP ${res.status}`);
      }
      await refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const catalogSignals = [
    { label: 'Reglas Activas', value: String(rules.filter(r => r.status === 'active').length), note: 'Modificadores de precio en curso.' },
    { label: 'Globales', value: String(rules.filter(r => r.scope === 'global').length), note: 'Afectan todo el inventario KCE.' },
    { label: 'Targeted', value: String(rules.filter(r => r.scope !== 'global').length), note: 'Reglas por ciudad, tag o tour.' }
  ];

  return (
    <section className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Catálogo & Pricing</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Motor dinámico de precios. Ajusta márgenes por temporada, ciudad o estilo de tour.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Revenue Engine"
        title="Yield Management en Tiempo Real"
        description="Aplica recargos temporales por alta demanda en una ciudad o lanza descuentos masivos usando etiquetas. Las reglas de prioridad más alta sobreescriben al resto."
        actions={[
          { href: '/admin/revenue', label: 'Ver Impacto en Revenue', tone: 'primary' },
        ]}
        signals={catalogSignals}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Panel de Control */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
          <div className="flex items-center gap-3">
            <Tag className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Reglas de Precios (Rules)</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={refresh} disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-transparent px-5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface-2)] disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/> Sync
            </button>
            <button onClick={createRule} disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-[10px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-md">
              <Plus className="h-4 w-4"/> Añadir Regla
            </button>
          </div>
        </div>

        {err && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}

        {/* Tabla */}
        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-6 py-5">Alcance (Scope)</th>
                <th className="px-6 py-5">Objetivo (Target)</th>
                <th className="px-6 py-5 text-right">Ajuste (Delta)</th>
                <th className="px-6 py-5 text-right">Fijo (Override)</th>
                <th className="px-6 py-5 text-center">Prioridad</th>
                <th className="px-6 py-5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {loading && rules.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-sm font-medium text-[var(--color-text)]/40">Cargando catálogo...</td></tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Activity className="mx-auto h-12 w-12 text-[var(--color-text)]/10 mb-4" />
                    <div className="text-sm font-medium text-[var(--color-text)]/40">No hay reglas configuradas.</div>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">Para activar disponibilidad y reglas por defecto, ejecuta el Script SQL P77.</div>
                  </td>
                </tr>
              ) : (
                rules.map((r) => {
                  const isPos = r.delta_minor > 0;
                  const isNeg = r.delta_minor < 0;
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                      <td className="px-6 py-5 align-top">
                        <span className={badgeScope(r.scope)}>
                          {r.scope === 'global' && <Globe className="h-3 w-3" />}
                          {r.scope === 'city' && <MapPin className="h-3 w-3" />}
                          {r.scope === 'tag' && <Tag className="h-3 w-3" />}
                          {r.scope === 'tour' && <Activity className="h-3 w-3" />}
                          {r.scope}
                        </span>
                        <div className="mt-2 text-[9px] font-mono text-[var(--color-text)]/30 uppercase tracking-widest">ID: {r.id.slice(0,8)}</div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="font-semibold text-[var(--color-text)]">{r.city || r.tag || r.tour_id || 'Todo el inventario'}</div>
                      </td>
                      <td className="px-6 py-5 align-top text-right">
                        <div className="font-mono text-sm">
                          {r.kind === 'delta' ? (
                            <span className={`px-3 py-1.5 rounded-xl font-bold border ${isPos ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20' : isNeg ? 'text-rose-700 bg-rose-500/10 border-rose-500/20' : 'text-[var(--color-text)]/50 bg-[var(--color-surface-2)] border-[var(--color-border)]'}`}>
                              {isPos ? '+' : ''}{fmtMoney(r.delta_minor, r.currency)}
                            </span>
                          ) : (
                            <span className="text-[var(--color-text)]/30">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top text-right">
                        <div className="font-mono text-sm">
                          {r.kind === 'override' && r.override_price_minor !== null ? (
                            <span className="px-3 py-1.5 rounded-xl font-bold text-brand-blue bg-brand-blue/10 border border-brand-blue/20">
                              {fmtMoney(r.override_price_minor, r.currency)} (Fijo)
                            </span>
                          ) : (
                            <span className="text-[var(--color-text)]/30">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top text-center">
                        <span className="font-mono font-bold text-[var(--color-text)]/60 bg-[var(--color-surface-2)] px-3 py-1 rounded-lg border border-[var(--color-border)]">P{r.priority}</span>
                      </td>
                      <td className="px-6 py-5 align-top text-center">
                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${badgeStatus(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}