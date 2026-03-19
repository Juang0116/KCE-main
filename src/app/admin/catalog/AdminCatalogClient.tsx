'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Tag, RefreshCw, Plus, AlertCircle, Percent, 
  MapPin, Globe, Activity, ArrowUpRight, 
  TrendingUp, TrendingDown, Layers, ShieldCheck, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AdminCard, AdminCardHeader, AdminCardTitle } from '@/components/admin/AdminCard';
import { AdminList, AdminListItem, ListCol, ListTitle, ListSubtitle } from '@/components/admin/AdminList';

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
    maximumFractionDigits: 0 
  }).format(v);
}

// --- HELPER VISUAL PARA ICONOS DE ALCANCE (SCOPE) ---
function getScopeIcon(scope: string) {
  switch (scope) {
    case 'global': return <Globe className="h-5 w-5 text-brand-blue" />;
    case 'city': return <MapPin className="h-5 w-5 text-emerald-600" />;
    case 'tag': return <Tag className="h-5 w-5 text-purple-600" />;
    case 'tour': return <ArrowUpRight className="h-5 w-5 text-amber-600" />;
    default: return <Layers className="h-5 w-5 text-[var(--color-text-muted)]" />;
  }
}

function getScopeBg(scope: string) {
  switch (scope) {
    case 'global': return 'bg-brand-blue/10 border-brand-blue/20';
    case 'city': return 'bg-emerald-500/10 border-emerald-500/20';
    case 'tag': return 'bg-purple-500/10 border-purple-500/20';
    case 'tour': return 'bg-amber-500/10 border-amber-500/20';
    default: return 'bg-[var(--color-surface-2)] border-[var(--color-border)]';
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

  async function createRule() {
    setErr(null);
    const rawScopeInput = prompt('Alcance de la regla (global | city | tag | tour):', 'global');
    if (rawScopeInput === null) return; 
    
    const rawScope = rawScopeInput.trim().toLowerCase();
    
    if (!rawScope || !['global', 'city', 'tag', 'tour'].includes(rawScope)) {
      alert('Scope inválido. Debe ser: global, city, tag o tour.');
      return;
    }

    const deltaStr = prompt('Variación de precio en céntimos (Ej: 5000 = +50 EUR, -5000 = -50 EUR)', '0');
    if (deltaStr === null) return; 
    
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
    <div className="space-y-8 w-full max-w-[var(--container-max)] mx-auto pb-24 animate-fade-in">
      
      {/* 01. HEADER TÁCTICO */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--color-border)] pb-8">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
            <Percent className="h-3.5 w-3.5" /> Dynamic Pricing Engine
          </div>
          <h1 className="font-heading text-4xl text-[var(--color-text)] tracking-tight">
            Catálogo & <span className="text-brand-terra">Pricing</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)] font-light max-w-2xl leading-relaxed">
            Gestión de márgenes y reglas de negocio. Define variaciones estacionales o descuentos por categoría para optimizar el revenue.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={refresh} disabled={loading} className="btn btn-outline text-xs bg-[var(--color-surface)] backdrop-blur-sm shadow-soft">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`} /> Sincronizar
          </button>
          <button onClick={createRule} disabled={loading} className="btn bg-brand-blue text-white text-xs shadow-pop hover:-translate-y-0.5 transition-transform">
            <Plus className="mr-2 h-4 w-4" /> Nueva Regla
          </button>
        </div>
      </header>

      {/* 02. WORKBENCH DE REVENUE OPS */}
      <AdminOperatorWorkbench
        eyebrow="Yield Management"
        title="Control de Margen Unitario"
        description="Las reglas se aplican en cascada. Una regla de 'Tour' específico tiene prioridad sobre una 'Global'. Asegura que las fechas coincidan con la temporada."
        actions={[{ href: '/admin/revenue', label: 'Ver Impacto Revenue', tone: 'primary' }]}
        signals={catalogSignals}
      />

      {/* 03. LA BÓVEDA DE REGLAS (Adiós Tabla Azul) */}
      <AdminCard noPadding className="overflow-hidden relative">
        
        {/* Header de la Tarjeta */}
        <div className="p-5 sm:p-6 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/30 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
               <Layers className="h-4 w-4 text-brand-blue" />
             </div>
             <div>
               <AdminCardTitle className="text-lg">Directorio de Estrategias</AdminCardTitle>
               <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1.5">
                 <ShieldCheck className="h-3 w-3 text-brand-blue" /> P77 Integrity Verified
               </p>
             </div>
           </div>
        </div>

        {err && (
          <div className="mx-6 mt-6 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-4 flex items-center gap-3 text-[var(--color-error)] animate-fade-in text-sm">
            <AlertCircle className="h-5 w-5 opacity-70" /> {err}
          </div>
        )}

        {/* Seamless List (Lista Continua) */}
        <div className="p-2 sm:p-4 min-h-[300px]">
          {rules.length === 0 && !loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)] opacity-60">
               <Activity className="h-10 w-10 mb-4 opacity-30" />
               <p className="text-sm font-medium">No hay reglas de pricing configuradas.</p>
               <code className="mt-3 rounded-md bg-[var(--color-surface-2)] px-2 py-1 text-[10px] font-mono border border-[var(--color-border)]">Run SQL Script P77 to initialize</code>
             </div>
          ) : (
            <AdminList>
              {rules.map((r) => {
                const isPos = r.delta_minor > 0;
                const isNeg = r.delta_minor < 0;
                
                return (
                  <AdminListItem key={r.id} interactive className="group px-4 xl:px-6">
                    
                    {/* Columna Izquierda: Identidad y Alcance */}
                    <div className="flex items-center gap-4 xl:w-2/5">
                      <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center border shadow-sm ${getScopeBg(r.scope)}`}>
                        {getScopeIcon(r.scope)}
                      </div>
                      <ListCol>
                        <ListTitle className="text-base group-hover:text-brand-blue transition-colors truncate">
                          {r.city || r.tag || r.tour_id || 'Todo el Inventario (Global)'}
                        </ListTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                            {r.scope}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--color-text-muted)] opacity-60">ID:{r.id.slice(0,6)}</span>
                        </div>
                      </ListCol>
                    </div>

                    {/* Columna Centro: Regla Financiera */}
                    <ListCol className="hidden md:flex xl:w-2/5 px-4 border-l border-[var(--color-border)]/50 border-dashed">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] opacity-70">
                          Modificador
                        </span>
                        
                        {r.kind === 'delta' ? (
                           <div className="flex items-center gap-2">
                             <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold font-mono border ${
                               isPos ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                               isNeg ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 
                               'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                             }`}>
                               {isPos ? <TrendingUp className="h-3 w-3 mr-1" /> : isNeg ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
                               {isPos ? '+' : isNeg ? '-' : ''}{fmtMoney(r.delta_minor, r.currency)}
                             </span>
                             <span className="text-xs text-[var(--color-text-muted)]">Ajuste Dinámico</span>
                           </div>
                        ) : r.kind === 'override' && r.override_price_minor !== null ? (
                           <div className="flex items-center gap-2">
                             <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold font-mono bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                               <ShieldCheck className="h-3 w-3 mr-1 opacity-70" />
                               {fmtMoney(r.override_price_minor, r.currency)}
                             </span>
                             <span className="text-xs text-[var(--color-text-muted)]">Precio Fijo Bloqueado</span>
                           </div>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)] opacity-50">—</span>
                        )}
                      </div>
                    </ListCol>

                    {/* Columna Derecha: Prioridad y Estado */}
                    <div className="flex items-center justify-between xl:justify-end xl:w-1/5 gap-4">
                      
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider border ${
                          r.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                          r.status === 'paused' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                          'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                        }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${r.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-current opacity-50'}`} />
                          {r.status}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--color-text-muted)] flex items-center gap-1">
                          Prioridad: <strong className="text-[var(--color-text)]">P{r.priority}</strong>
                        </span>
                      </div>

                      {/* Botón de acción oculto hasta el hover para mantener limpieza */}
                      <button className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-brand-blue hover:bg-brand-blue/10 transition-colors opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-5 h-5" />
                      </button>

                    </div>

                  </AdminListItem>
                );
              })}
            </AdminList>
          )}
        </div>

        {/* Footer Sutil */}
        <div className="p-4 flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/30">
           <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] opacity-60">
             <Layers className="h-3 w-3" /> Cascade Logic v2.4
           </div>
        </div>

      </AdminCard>
    </div>
  );
}