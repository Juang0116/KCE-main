'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { 
  Download, Search, RefreshCw, 
  MapPin, TrendingUp, Clock, ArrowUpRight, 
  Filter, ShieldCheck, Sparkles, Phone, Mail
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
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  // UX Pro: Evita condiciones de carrera en búsquedas rápidas
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
    { label: 'Valor Nominal', value: money(stats.visible, items[0]?.currency || 'eur'), note: 'Suma bruta de deals visibles.' },
    { label: 'Pipeline Pesado', value: money(stats.weighted, items[0]?.currency || 'eur'), note: 'Valor ajustado por probabilidad.' },
    { label: 'A un Clic', value: String(stats.checkout), note: 'Oportunidades en etapa de pago.' },
    { label: 'Hot Deals', value: String(stats.hot), note: 'Tracción alta en el embudo.' },
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
      setItems(prev); // Revertir en caso de fallo
    }
  }

  return (
    <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA EJECUTIVA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <TrendingUp className="h-3.5 w-3.5" /> Commercial Revenue Lane
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue">
            Bandeja de <span className="text-brand-yellow italic font-light">Oportunidades</span>
          </h1>
          <p className="mt-4 text-base text-[var(--color-text)]/50 font-light max-w-2xl leading-relaxed">
            Monitor centralizado de negociaciones. Identifica los hilos de alta temperatura y asegura que cada señal de interés se convierta en revenue real.
          </p>
        </div>
      </header>

      {/* 02. WORKBENCH TÁCTICO */}
      <AdminOperatorWorkbench
        eyebrow="Negotiation Strategy"
        title="Gestiona la velocidad del Pipeline"
        description="Filtra por 'Hot Deals' para priorizar el seguimiento quirúrgico. Recuerda: etapa 'Checkout' es prioridad 0."
        actions={[
          { href: '/admin/revenue', label: 'Revenue Truth', tone: 'primary' },
          { href: '/admin/deals/board', label: 'Tablero Kanban' },
        ]}
        signals={dealSignals}
      />

      {/* 03. INSTRUMENTACIÓN DE FILTROS */}
      <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl overflow-hidden relative">
        <div className="p-8 pb-10 border-b border-[var(--color-border)]">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-end justify-between">
            <div className="grid gap-6 sm:grid-cols-2 w-full lg:w-3/5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Estado de la Señal</label>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30" />
                  <select 
                    className="w-full h-14 pl-12 pr-6 rounded-2xl border border-[var(--color-border)] bg-white text-sm font-bold text-brand-blue outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/5 transition-all" 
                    value={stage} 
                    onChange={(e) => setStage(e.target.value)}
                  >
                    <option value="">Todas las Etapas</option>
                    {STAGES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Buscador Táctico</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                  <input 
                    className="w-full h-14 pl-12 rounded-2xl border border-[var(--color-border)] bg-white text-sm font-light outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all" 
                    value={q} 
                    onChange={(e) => setQ(e.target.value)} 
                    placeholder="Título, email o tour..." 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => void load()} disabled={loading} variant="outline" className="h-14 rounded-2xl px-8 border-[var(--color-border)] shadow-sm font-bold uppercase tracking-widest text-[10px] bg-white">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
              </Button>
              <Button asChild variant="ghost" className="h-14 rounded-2xl px-6 uppercase text-[10px] tracking-widest font-bold border border-transparent hover:border-brand-blue/10">
                <a href={`/api/admin/deals/export?${new URLSearchParams({ stage, q }).toString()}`}>
                  <Download className="mr-2 h-4 w-4" /> CSV
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <button onClick={() => setStage('')} className={`h-9 px-5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${stage === '' ? 'bg-brand-dark text-brand-yellow shadow-lg' : 'bg-white border border-[var(--color-border)] text-[var(--color-text)]/40 hover:bg-brand-blue/5'}`}>
              Todos
            </button>
            {['new', 'qualified', 'proposal', 'checkout'].map((quick) => (
              <button key={quick} onClick={() => setStage(quick)} className={`h-9 px-5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${stage === quick ? 'bg-brand-blue text-white shadow-lg' : 'bg-white border border-[var(--color-border)] text-[var(--color-text)]/40 hover:bg-brand-blue/5'}`}>
                {quick}
              </button>
            ))}
          </div>
        </div>

        {/* 04. TABLA MAESTRA DE DEALS */}
        <div className="overflow-x-auto px-6 py-8">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-white overflow-hidden shadow-sm">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40">
                  <th className="px-8 py-6">Entidad de Oportunidad</th>
                  <th className="px-8 py-6">Voz del Cliente</th>
                  <th className="px-8 py-6 text-center">Monto Nominal</th>
                  <th className="px-8 py-6 text-center">Confianza</th>
                  <th className="px-8 py-6 text-right">Sincronización</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {loading && items.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-24 text-center animate-pulse text-xs font-bold uppercase tracking-widest text-brand-blue/20">Interrogando al núcleo comercial...</td></tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                      <TrendingUp className="mx-auto h-12 w-12 text-brand-blue/10 mb-6" />
                      <p className="text-lg font-light text-[var(--color-text)]/30 italic">No hay deals bajo el radar actual.</p>
                    </td>
                  </tr>
                ) : (
                  items.map((d) => (
                    <tr key={d.id} className="group transition-all hover:bg-brand-blue/[0.01]">
                      <td className="px-8 py-6 align-top">
                        <Link href={`/admin/deals/${d.id}`} className="font-heading text-lg text-brand-blue group-hover:text-brand-yellow transition-colors flex items-center gap-2">
                          {d.title || 'Innominado'} <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                        </Link>
                        <div className="mt-2 flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-brand-blue/40">
                             <MapPin className="h-3 w-3" /> {d.tour_slug || 'Tour N/A'}
                          </span>
                          <span className="font-mono text-[9px] text-[var(--color-text)]/20">#{d.id.slice(0, 8)}</span>
                        </div>
                      </td>

                      <td className="px-8 py-6 align-top">
                        <div className="font-medium text-brand-dark flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-brand-blue/30" /> {d.customers?.name || d.customers?.email || d.leads?.email || '—'}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-[var(--color-text)]/40">
                           <Phone className="h-3.5 w-3.5 text-brand-blue/20" /> {d.customers?.phone || d.leads?.whatsapp || 'Sin contacto'}
                        </div>
                      </td>

                      <td className="px-8 py-6 align-top text-center">
                        <div className={`font-heading text-xl ${d.amount_minor && d.amount_minor > 0 ? 'text-emerald-600' : 'text-[var(--color-text)]/20'}`}>
                          {money(d.amount_minor, d.currency)}
                        </div>
                        <div className="mt-1">
                          <select 
                            className="h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-[8px] font-bold uppercase tracking-widest text-brand-blue/60 outline-none cursor-pointer hover:border-brand-blue transition-colors"
                            value={d.stage} 
                            onChange={(e) => void updateStage(d.id, e.target.value as DealStage)}
                          >
                            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </td>

                      <td className="px-8 py-6 align-top text-center w-[200px]">
                        <div className="flex flex-col items-center">
                           <div className={`text-[11px] font-bold ${d.probability >= 70 ? 'text-emerald-600' : d.probability >= 30 ? 'text-amber-600' : 'text-rose-600'}`}>
                             {d.probability}% <span className="text-[9px] opacity-40 uppercase ml-1">Score</span>
                           </div>
                           <div className="w-full bg-brand-blue/[0.03] h-1.5 mt-3 rounded-full overflow-hidden border border-black/[0.03] shadow-inner">
                             <div 
                               className={`h-full transition-all duration-1000 ${d.probability >= 70 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : d.probability >= 30 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                               style={{ width: `${d.probability}%` }}
                             />
                           </div>
                        </div>
                      </td>

                      <td className="px-8 py-6 align-top text-right">
                        <div className="text-[10px] font-bold text-brand-dark/60">{new Date(d.updated_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</div>
                        <div className="mt-1 flex items-center justify-end gap-1.5 text-[9px] font-mono text-[var(--color-text)]/30 uppercase tracking-tighter">
                           <Clock className="h-3 w-3" /> {new Date(d.updated_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FOOTER DE INTEGRIDAD */}
      <footer className="pt-10 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> Commercial Integrity Active
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Pipeline Intelligence v2.8
        </div>
      </footer>

    </div>
  );
}