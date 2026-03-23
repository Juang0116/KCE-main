'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { 
  Download, Search, RefreshCw, 
  MapPin, TrendingUp, Clock, ArrowUpRight, 
  Filter, ShieldCheck, Sparkles, Phone, Mail,
  Terminal, Hash, Target, ChevronRight, Layout,
  Activity
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
  customers?: { email?: string | null; name?: string | null; phone?: string | null; country?: string | null } | null;
};

// --- HELPERS DE MONEDA ---
function money(minor: number | null, currency: string) {
  if (typeof minor !== 'number') return '—';
  const v = minor / 100;
  try {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: currency.toUpperCase(), 
      maximumFractionDigits: 0 
    }).format(v);
  } catch {
    return `${v.toFixed(0)} ${currency.toUpperCase()}`;
  }
}

const STAGES: DealStage[] = ['new', 'contacted', 'qualified', 'proposal', 'checkout', 'won', 'lost'];

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

  useEffect(() => { void load(); }, [load]);

  // --- TELEMETRÍA DE VENTAS ---
  const stats = useMemo(() => {
    const visible = items.reduce((sum, d) => sum + (d.amount_minor || 0), 0);
    const weighted = items.reduce((sum, d) => sum + Math.round(((d.amount_minor || 0) * d.probability) / 100), 0);
    const checkout = items.filter(d => d.stage === 'checkout').length;
    const hot = items.filter(d => ['qualified', 'proposal', 'checkout'].includes(d.stage)).length;
    return { visible, weighted, checkout, hot };
  }, [items]);

  const dealSignals = useMemo(() => [
    { label: 'Valor Nominal', value: money(stats.visible, items[0]?.currency || 'eur'), note: 'Pipeline bruto visible.' },
    { label: 'Pipeline Pesado', value: money(stats.weighted, items[0]?.currency || 'eur'), note: 'Ajustado por probabilidad.' },
    { label: 'En Checkout', value: String(stats.checkout), note: 'Link de pago activo.' },
    { label: 'Hot Deals', value: String(stats.hot), note: 'Alta tracción en embudo.' },
  ], [stats, items]);

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
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA EJECUTIVA */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <TrendingUp className="h-3.5 w-3.5" /> Commercial Revenue Lane
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tighter leading-none">
            Bandeja de <span className="text-brand-yellow italic font-light">Oportunidades</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2">
            Monitor centralizado de negociaciones. Identifica los hilos de alta temperatura y asegura que cada señal de interés se convierta en revenue para Knowing Cultures S.A.S.
          </p>
        </div>
        <div className="flex gap-4">
           <Button onClick={() => void load()} disabled={loading} variant="outline" className="h-12 rounded-full border-brand-dark/10 shadow-sm font-bold uppercase tracking-widest text-[10px] px-8 hover:bg-surface-2 transition-all">
             <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`} /> Sincronizar
           </Button>
        </div>
      </header>

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
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden relative flex flex-col">
        <div className="p-8 pb-10 bg-surface-2/30 border-b border-brand-dark/5 dark:border-white/5">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-end justify-between">
            <div className="grid gap-6 sm:grid-cols-2 w-full lg:w-3/5">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Filtrar por Estado</label>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40" />
                  <select 
                    className="w-full h-14 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm font-bold text-main outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner" 
                    value={stage} 
                    onChange={(e) => { setStage(e.target.value); }}
                  >
                    <option value="">Todas las Etapas</option>
                    {STAGES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Buscador Táctico</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
                  <input 
                    className="w-full h-14 pl-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm font-light text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30" 
                    value={q} 
                    onChange={(e) => setQ(e.target.value)} 
                    placeholder="Título, email o tour..." 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" className="h-14 rounded-2xl px-6 uppercase text-[10px] tracking-widest font-bold border border-transparent hover:bg-brand-blue/5">
                <a href={`/api/admin/deals/export?${new URLSearchParams({ stage, q }).toString()}`}>
                  <Download className="mr-2 h-4 w-4" /> Exportar CSV
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => setStage('')} className={`h-9 px-5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${stage === '' ? 'bg-brand-dark text-brand-yellow shadow-pop scale-105' : 'bg-surface border border-brand-dark/10 text-muted hover:bg-surface-2'}`}>
              Todos
            </button>
            {['new', 'qualified', 'proposal', 'checkout'].map((quick) => (
              <button key={quick} onClick={() => setStage(quick)} className={`h-9 px-5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${stage === quick ? 'bg-brand-blue text-white shadow-pop scale-105' : 'bg-surface border border-brand-dark/10 text-muted hover:bg-surface-2'}`}>
                {quick}
              </button>
            ))}
          </div>
        </div>

        {/* 04. TABLA MAESTRA DE DEALS (LA BÓVEDA) */}
        <div className="overflow-x-auto custom-scrollbar px-2 pb-6">
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
                <tr><td colSpan={5} className="px-8 py-40 text-center animate-pulse text-[11px] font-bold uppercase tracking-[0.5em] text-muted bg-surface">Interrogando al núcleo comercial...</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-40 text-center bg-surface">
                    <TrendingUp className="mx-auto h-16 w-16 text-brand-blue opacity-10 mb-6" />
                    <p className="text-xl font-heading text-main tracking-tight opacity-30">Pipeline en Silencio</p>
                    <p className="text-sm font-light text-muted mt-2 italic">No hay deals bajo el radar con los parámetros actuales.</p>
                  </td>
                </tr>
              ) : (
                items.map((d) => (
                  <tr key={d.id} className="group transition-colors hover:bg-surface-2/50 cursor-default bg-surface">
                    <td className="px-8 py-8 align-top">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-xl bg-brand-blue/10 border border-brand-blue/5 flex items-center justify-center text-brand-blue shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                            <Target className="h-5 w-5" />
                         </div>
                         <div>
                            <Link href={`/admin/deals/${d.id}`} className="font-heading text-xl text-main group-hover:text-brand-blue transition-colors leading-none tracking-tight flex items-center gap-2">
                              {d.title || 'Innominado'} <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                            </Link>
                            <div className="mt-2 flex items-center gap-3">
                              <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                                 <MapPin className="h-3 w-3 text-brand-blue opacity-40" /> {d.tour_slug || 'CUSTOM_TRIP'}
                              </span>
                              <span className="font-mono text-[9px] text-muted opacity-30 uppercase flex items-center gap-1">
                                 <Hash className="h-2.5 w-2.5" /> {d.id.slice(0, 8)}
                              </span>
                            </div>
                         </div>
                      </div>
                    </td>

                    <td className="px-8 py-8 align-top">
                      <div className="space-y-2">
                        <div className="font-medium text-main flex items-center gap-3">
                          <Mail className="h-4 w-4 text-brand-blue opacity-20" /> {d.customers?.name || d.customers?.email || d.leads?.email || <span className="opacity-20">—</span>}
                        </div>
                        <div className="text-[11px] font-mono text-muted flex items-center gap-3 opacity-60">
                           <Phone className="h-4 w-4 text-brand-blue opacity-10" /> {d.customers?.phone || d.leads?.whatsapp || 'Sin contacto'}
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-8 align-top text-center">
                      <div className={`font-heading text-2xl tracking-tighter ${d.amount_minor && d.amount_minor > 0 ? 'text-green-600 dark:text-green-400' : 'text-main opacity-20'}`}>
                        {money(d.amount_minor, d.currency)}
                      </div>
                      <div className="mt-3 relative">
                        <select 
                          className="h-8 rounded-lg border border-brand-dark/10 dark:border-white/10 bg-surface-2 px-3 text-[9px] font-bold uppercase tracking-widest text-muted outline-none cursor-pointer hover:border-brand-blue transition-all appearance-none pr-8 shadow-sm"
                          value={d.stage} 
                          onChange={(e) => void updateStage(d.id, e.target.value as DealStage)}
                        >
                          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 rotate-90 opacity-20 pointer-events-none" />
                      </div>
                    </td>

                    <td className="px-8 py-8 align-top text-center w-[220px]">
                      <div className="flex flex-col items-center">
                         <div className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 ${d.probability >= 70 ? 'text-green-600' : d.probability >= 30 ? 'text-amber-600' : 'text-red-500'}`}>
                           <Sparkles className="h-3.5 w-3.5" /> {d.probability}% Confianza
                         </div>
                         <div className="w-full bg-surface-2 h-2 mt-4 rounded-full overflow-hidden border border-brand-dark/5 shadow-inner p-0.5">
                           <div 
                             className={`h-full rounded-full transition-all duration-1000 ${d.probability >= 70 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : d.probability >= 30 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`} 
                             style={{ width: `${d.probability}%` }}
                           />
                         </div>
                      </div>
                    </td>

                    <td className="px-8 py-8 align-top text-right">
                      <div className="text-xs font-bold text-main">{new Date(d.updated_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</div>
                      <div className="mt-1.5 flex items-center justify-end gap-2 text-[10px] font-mono text-muted opacity-40 uppercase tracking-widest">
                         <Clock className="h-3.5 w-3.5 text-brand-blue opacity-50" /> {new Date(d.updated_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
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
      <footer className="pt-16 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> Commercial Integrity Active
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Terminal className="h-4 w-4 opacity-50" /> Pipeline Node v5.2
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Activity className="h-4 w-4" /> Live Market Signal
        </div>
      </footer>

    </div>
  );
}