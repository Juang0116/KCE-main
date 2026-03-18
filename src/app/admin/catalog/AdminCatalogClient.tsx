'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Tag, RefreshCw, Plus, AlertCircle, Percent, 
  MapPin, Globe, Activity, ArrowUpRight, 
  TrendingUp, TrendingDown, Layers, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
    maximumFractionDigits: 0 
  }).format(v);
}

function badgeScope(scope: string) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border shadow-sm';
  if (scope === 'global') return `${base} border-brand-blue/20 bg-brand-blue/5 text-brand-blue`;
  if (scope === 'city') return `${base} border-emerald-500/20 bg-emerald-500/5 text-emerald-700`;
  if (scope === 'tag') return `${base} border-purple-500/20 bg-purple-500/5 text-purple-700`;
  return `${base} border-amber-500/20 bg-amber-500/5 text-amber-700`;
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

  async function createRule() {
    setErr(null);
    const rawScopeInput = prompt('Alcance de la regla (global | city | tag | tour):', 'global');
    if (rawScopeInput === null) return; // User cancelled
    
    const rawScope = rawScopeInput.trim().toLowerCase();
    
    if (!rawScope || !['global', 'city', 'tag', 'tour'].includes(rawScope)) {
      alert('Scope inválido. Debe ser: global, city, tag o tour.');
      return;
    }

    const deltaStr = prompt('Variación de precio en céntimos (Ej: 5000 = +50 EUR, -5000 = -50 EUR)', '0');
    if (deltaStr === null) return; // User cancelled
    
    const delta = Number(deltaStr);
    if (Number.isNaN(delta)) {
      alert('Variación inválida. Debe ser un número.');
      return;
    }

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

      if (!res.ok) throw new Error('Error al crear la regla.');
      await refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error inesperado al crear');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [refresh]);

  const catalogSignals = [
    { label: 'Estrategias Activas', value: String(rules.filter(r => r.status === 'active').length), note: 'Modificadores en vivo.', icon: TrendingUp },
    { label: 'Cobertura Global', value: String(rules.filter(r => r.scope === 'global').length), note: 'Reglas raíz del sistema.', icon: Globe },
    { label: 'Filtro Dinámico', value: String(rules.filter(r => r.scope !== 'global').length), note: 'Segmentación activa.', icon: Layers }
  ];

  return (
    <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER TÁCTICO */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-10">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Percent className="h-3.5 w-3.5" /> Dynamic Pricing Engine
          </div>
          <h1 className="font-heading text-4xl text-brand-blue">Catálogo & <span className="text-brand-yellow italic font-light">Pricing</span></h1>
          <p className="mt-2 text-base text-[var(--color-text)]/50 font-light max-w-2xl leading-relaxed">
            Gestión de márgenes y reglas de negocio. Define variaciones estacionales o descuentos por categoría para optimizar el revenue.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-full shadow-sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
          </Button>
          <Button className="rounded-full shadow-xl" onClick={createRule} disabled={loading}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Regla
          </Button>
        </div>
      </header>

      {/* WORKBENCH DE REVENUE OPS */}
      <AdminOperatorWorkbench
        eyebrow="Yield Management"
        title="Control de Margen Unitario"
        description="Las reglas se aplican en cascada. Una regla de 'Tour' específico tiene prioridad sobre una 'Global'. Asegura que las fechas de fin coincidan con el cierre de temporada."
        actions={[{ href: '/admin/revenue', label: 'Ver Impacto Revenue', tone: 'primary' }]}
        signals={catalogSignals}
      />

      {/* LA BÓVEDA DE REGLAS */}
      <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl overflow-hidden relative">
        
        <div className="p-8 pb-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <Tag className="h-6 w-6 text-brand-blue/40" />
             <h2 className="font-heading text-2xl text-brand-blue">Directorio de Estrategias</h2>
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">
              <ShieldCheck className="h-3 w-3" /> P77 Integrity Verified
           </div>
        </div>

        {err && (
          <div className="mx-8 mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3 text-rose-700 animate-in zoom-in-95">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{err}</p>
          </div>
        )}

        <div className="overflow-x-auto px-6 pb-6">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm min-w-[1000px]">
              <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40">
                  <th className="px-8 py-6">Alcance (Scope)</th>
                  <th className="px-8 py-6">Objetivo Táctico</th>
                  <th className="px-8 py-6 text-right">Ajuste Dinámico</th>
                  <th className="px-8 py-6 text-right">Precio Fijo</th>
                  <th className="px-8 py-6 text-center">Prioridad</th>
                  <th className="px-8 py-6 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rules.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <Activity className="mx-auto h-12 w-12 text-brand-blue/10 mb-4" />
                      <p className="text-lg font-light text-[var(--color-text)]/30 italic">No hay reglas de pricing configuradas.</p>
                      <code className="mt-4 inline-block text-[10px] font-mono text-brand-blue/40 uppercase tracking-widest">Run SQL Script P77 to initialize</code>
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => {
                    const isPos = r.delta_minor > 0;
                    const isNeg = r.delta_minor < 0;
                    return (
                      <tr key={r.id} className="group transition-all hover:bg-brand-blue/[0.01]">
                        <td className="px-8 py-6 align-top">
                          <span className={badgeScope(r.scope)}>
                            {r.scope === 'global' && <Globe className="h-3 w-3" />}
                            {r.scope === 'city' && <MapPin className="h-3 w-3" />}
                            {r.scope === 'tag' && <Tag className="h-3 w-3" />}
                            {r.scope === 'tour' && <ArrowUpRight className="h-3 w-3" />}
                            {r.scope}
                          </span>
                          <div className="mt-2 font-mono text-[9px] text-[var(--color-text)]/20 uppercase tracking-tighter">ID: {r.id.slice(0,8)}</div>
                        </td>
                        <td className="px-8 py-6 align-top">
                          <div className="font-bold text-brand-blue group-hover:text-brand-yellow transition-colors truncate max-w-[200px]">
                            {r.city || r.tag || r.tour_id || 'Todo el Inventario'}
                          </div>
                          <div className="text-[10px] font-light text-[var(--color-text)]/40 mt-1">Regla de cascada activa</div>
                        </td>
                        <td className="px-8 py-6 align-top text-right">
                          {r.kind === 'delta' ? (
                            <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-sm font-bold border shadow-sm ${
                              isPos ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 
                              isNeg ? 'bg-rose-500/10 text-rose-700 border-rose-500/20' : 
                              'bg-[var(--color-surface-2)] text-[var(--color-text)]/40 border-[var(--color-border)]'
                            }`}>
                              {isPos ? <TrendingUp className="h-3.5 w-3.5" /> : isNeg ? <TrendingDown className="h-3.5 w-3.5" /> : null}
                              {isPos ? '+' : isNeg ? '-' : ''}{fmtMoney(r.delta_minor, r.currency)}
                            </div>
                          ) : (
                            <span className="text-[var(--color-text)]/20">—</span>
                          )}
                        </td>
                        <td className="px-8 py-6 align-top text-right">
                          {r.kind === 'override' && r.override_price_minor !== null ? (
                            <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-brand-blue/5 border border-brand-blue/10 text-brand-blue font-mono text-sm font-bold shadow-inner">
                              <ShieldCheck className="h-3.5 w-3.5 opacity-50" />
                              {fmtMoney(r.override_price_minor, r.currency)}
                            </div>
                          ) : (
                            <span className="text-[var(--color-text)]/20">—</span>
                          )}
                        </td>
                        <td className="px-8 py-6 align-top text-center">
                          <span className="inline-block rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-1.5 font-mono text-xs font-bold text-brand-blue/60 shadow-sm">
                            P{r.priority}
                          </span>
                        </td>
                        <td className="px-8 py-6 align-top text-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.1em] border shadow-sm ${
                            r.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                            r.status === 'paused' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                            'bg-[var(--color-surface-2)] text-[var(--color-text)]/30 border-[var(--color-border)]'
                          }`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${r.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`} />
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

        {/* NOTA AL PIE TÉCNICA */}
        <footer className="p-8 flex items-center justify-center gap-8 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/30 opacity-40">
           <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.3em] text-brand-blue">
             <Layers className="h-3 w-3" /> Cascade Logic v2.4
           </div>
           <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.3em] text-brand-blue">
             <TrendingUp className="h-3 w-3" /> Real-Time Delta FX
           </div>
        </footer>

      </section>
    </div>
  );
}