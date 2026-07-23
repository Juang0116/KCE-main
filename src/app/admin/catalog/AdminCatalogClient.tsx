'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  Tag,
  RefreshCw,
  Plus,
  AlertCircle,
  Percent,
  MapPin,
  Globe,
  Activity,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Layers,
  ShieldCheck,
  MoreVertical,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TIPADO ---
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

function fmtMoney(minor: number | null, cur: string) {
  if (typeof minor !== 'number') return '—';
  const v = Math.abs(minor) / 100;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: cur.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(v);
}

// --- HELPER VISUAL PARA ALCANCE ---
function getScopeStyles(scope: string) {
  switch (scope) {
    case 'global':
      return { icon: Globe, color: 'text-brand-blue', bg: 'bg-brand-blue/10 border-brand-blue/20' };
    case 'city':
      return {
        icon: MapPin,
        color: 'text-emerald-600',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
      };
    case 'tag':
      return { icon: Tag, color: 'text-purple-600', bg: 'bg-purple-500/10 border-purple-500/20' };
    case 'tour':
      return {
        icon: ArrowUpRight,
        color: 'text-amber-600',
        bg: 'bg-amber-500/10 border-amber-500/20',
      };
    default:
      return { icon: Layers, color: 'text-muted', bg: 'bg-surface-2 border-brand-dark/10' };
  }
}

export function AdminCatalogClient() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const reqIdRef = useRef(0);

  const refresh = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const myReqId = ++reqIdRef.current;
    try {
      const res = await adminFetch('/api/admin/catalog/pricing-rules');
      if (myReqId !== reqIdRef.current) return;
      if (!res.ok) throw new Error(`Falla de sincronización (HTTP ${res.status})`);
      const data: unknown = await res.json();
      if (!isPayload(data)) throw new Error('Respuesta de catálogo inválida.');
      setRules(data.items ?? []);
    } catch (e: unknown) {
      if (myReqId !== reqIdRef.current) return;
      setErr(e instanceof Error ? e.message : 'Error al cargar reglas');
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function createRule() {
    setErr(null);
    const rawScopeInput = prompt('Alcance de la regla (global | city | tag | tour):', 'global');
    if (rawScopeInput === null) return;
    const rawScope = rawScopeInput.trim().toLowerCase();
    if (!['global', 'city', 'tag', 'tour'].includes(rawScope)) {
      alert('Scope inválido.');
      return;
    }
    const deltaStr = prompt('Variación de precio en céntimos (Ej: 5000 = +50 EUR)', '0');
    if (deltaStr === null) return;
    const delta = Number(deltaStr);
    if (Number.isNaN(delta)) return;

    try {
      setLoading(true);
      const res = await adminFetch('/api/admin/catalog/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: rawScope,
          delta_minor: delta,
          currency: 'EUR',
          kind: 'delta',
          priority: 100,
          status: 'active',
        }),
      });
      if (!res.ok) throw new Error('Error al crear la regla.');
      await refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  const catalogSignals = [
    {
      label: 'Estrategias Activas',
      value: String(rules.filter((r) => r.status === 'active').length),
      note: 'Modificadores en vivo.',
      icon: TrendingUp,
    },
    {
      label: 'Cobertura Global',
      value: String(rules.filter((r) => r.scope === 'global').length),
      note: 'Reglas raíz del sistema.',
      icon: Globe,
    },
    {
      label: 'Segmentación',
      value: String(rules.filter((r) => r.scope !== 'global').length),
      note: 'Filtros dinámicos.',
      icon: Layers,
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10 pb-24 duration-700">
      {/* 01. HEADER TÁCTICO */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Percent className="h-3.5 w-3.5" /> Dynamic Pricing Engine
          </div>
          <h1 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
            Catálogo & <span className="font-light italic text-brand-yellow">Pricing</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base font-light leading-relaxed text-muted">
            Gestión de márgenes y reglas de negocio. Define variaciones estacionales o ajustes por
            categoría para optimizar el revenue de Knowing Cultures.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={refresh}
            disabled={loading}
            className="h-12 rounded-full border-brand-dark/10 px-6 shadow-sm transition-all hover:bg-surface-2"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`}
            />{' '}
            Sincronizar
          </Button>
          <Button
            onClick={createRule}
            disabled={loading}
            className="h-12 rounded-full bg-brand-dark px-8 text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva Regla
          </Button>
        </div>
      </header>

      {/* 02. WORKBENCH DE REVENUE OPS */}
      <AdminOperatorWorkbench
        eyebrow="Yield Management"
        title="Control de Margen Unitario"
        description="Las reglas se aplican en cascada (Prioridad). Una regla de 'Tour' específico anula una 'Global'. Asegura la coherencia de fechas para evitar solapamientos."
        actions={[{ href: '/admin/revenue', label: 'Ver Impacto Real', tone: 'primary' }]}
        signals={catalogSignals}
      />

      {/* 03. LA BÓVEDA DE REGLAS */}
      <section className="flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
        <div className="bg-surface-2/30 flex items-center justify-between border-b border-brand-dark/5 p-8 pb-6 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-heading text-2xl tracking-tight text-main">
                Directorio de Estrategias
              </h2>
              <p className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                <ShieldCheck className="h-3 w-3 text-brand-blue" /> P77 Integrity Protocol Active
              </p>
            </div>
          </div>
        </div>

        {err && (
          <div className="animate-in fade-in mx-8 mt-6 flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-50 p-5 text-red-700 shadow-sm dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-bold">{err}</p>
          </div>
        )}

        <div className="min-h-[400px] p-2 sm:p-4">
          {rules.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="relative mb-6">
                <Activity className="h-16 w-16 text-brand-blue opacity-10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 animate-pulse text-brand-blue opacity-20" />
                </div>
              </div>
              <p className="font-heading text-xl tracking-tight text-main opacity-40">
                Sin Reglas Configuradas
              </p>
              <p className="mx-auto mt-2 max-w-xs text-sm font-light italic text-muted">
                Inicia el despliegue de estrategias dinámicas usando el botón superior.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((r) => {
                const isPos = r.delta_minor > 0;
                const isNeg = r.delta_minor < 0;
                const { icon: ScopeIcon, color: scopeColor, bg: scopeBg } = getScopeStyles(r.scope);

                return (
                  <div
                    key={r.id}
                    className="hover:bg-surface-2/50 group relative flex flex-col justify-between gap-6 rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface p-6 transition-all duration-300 hover:shadow-soft dark:border-white/5 md:flex-row md:items-center"
                  >
                    {/* Identidad y Alcance */}
                    <div className="flex items-center gap-5 md:w-1/3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${scopeBg}`}
                      >
                        <ScopeIcon className={`h-6 w-6 ${scopeColor}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold uppercase tracking-widest text-main transition-colors group-hover:text-brand-blue">
                          {r.city || r.tag || r.tour_id || 'Global Inventory'}
                        </div>
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className="rounded border border-brand-dark/5 bg-surface-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted dark:border-white/5">
                            {r.scope}
                          </span>
                          <span className="font-mono text-[10px] text-muted opacity-40">
                            #{r.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Regla Financiera */}
                    <div className="flex flex-1 items-center gap-4 px-6 md:border-l md:border-dashed md:border-brand-dark/5 md:dark:border-white/5">
                      <div className="flex flex-col">
                        <span className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
                          Modificador
                        </span>
                        {r.kind === 'delta' ? (
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center rounded-xl border px-4 py-1.5 font-mono text-sm font-bold shadow-sm ${
                                isPos
                                  ? 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400'
                                  : isNeg
                                    ? 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400'
                                    : 'border-brand-dark/10 bg-surface-2 text-muted dark:border-white/10'
                              }`}
                            >
                              {isPos ? (
                                <TrendingUp className="mr-2 h-3.5 w-3.5" />
                              ) : isNeg ? (
                                <TrendingDown className="mr-2 h-3.5 w-3.5" />
                              ) : null}
                              {isPos ? '+' : isNeg ? '-' : ''}
                              {fmtMoney(r.delta_minor, r.currency)}
                            </span>
                            <span className="text-xs font-light italic text-muted">
                              Ajuste Dinámico
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center rounded-xl border border-brand-blue/20 bg-brand-blue/10 px-4 py-1.5 font-mono text-sm font-bold text-brand-blue shadow-sm">
                              <ShieldCheck className="mr-2 h-3.5 w-3.5 opacity-70" />
                              {fmtMoney(r.override_price_minor, r.currency)}
                            </span>
                            <span className="text-xs font-light italic text-muted">
                              Precio Fijo Bloqueado
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Estado y Prioridad */}
                    <div className="flex items-center justify-between gap-6 md:w-1/4 md:justify-end">
                      <div className="flex flex-col items-end">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm ${
                            r.status === 'active'
                              ? 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400'
                              : r.status === 'paused'
                                ? 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-brand-yellow'
                                : 'border-brand-dark/10 bg-surface-2 text-muted'
                          }`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${r.status === 'active' ? 'animate-pulse bg-green-500' : 'bg-current opacity-50'}`}
                          />
                          {r.status}
                        </span>
                        <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                          Prioridad{' '}
                          <strong className="font-bold text-main">Lvl-{r.priority}</strong>
                        </div>
                      </div>

                      <button className="rounded-xl p-2.5 text-muted opacity-0 transition-all hover:bg-brand-blue/5 hover:text-brand-blue group-hover:opacity-100">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer de Consola */}
        <footer className="bg-surface-2/30 flex items-center justify-between border-t border-brand-dark/5 p-5 dark:border-white/5">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.3em] text-muted opacity-60">
            <Terminal className="h-3.5 w-3.5" /> Cascade Engine v2.4 • Active
          </div>
          <div className="font-mono text-[9px] uppercase text-muted opacity-40">
            Auth: System_Admin_Role_0
          </div>
        </footer>
      </section>
    </div>
  );
}
