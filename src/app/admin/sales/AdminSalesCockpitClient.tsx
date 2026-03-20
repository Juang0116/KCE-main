'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';

import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { normalizePhone } from '@/lib/normalize';
import { 
  Bot, Briefcase, Copy, RefreshCw, Filter, Search, 
  ArrowRight, Zap, Target, DollarSign, Clock, MapPin, 
  CheckCircle2, Radio, Terminal, ShieldCheck, Layers,
  Smartphone, Mail, TrendingUp, AlertCircle, Focus,
  GanttChartSquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE INTELIGENCIA COMERCIAL ---
type Row = {
  id: string; stage: string | null; title: string | null; tour_slug: string | null;
  probability: number | null; amount_minor: number | null; currency: string | null;
  assigned_to: string | null; created_at: string | null; updated_at: string | null;
  age_days: number; stale_days: number; last_contact_at: string | null;
  contact_stale_days: number | null; locale?: string; open_tasks: number;
  overdue_tasks: number; score: number; risk: string[]; next_action: string;
  waiting_on?: 'agent' | 'customer' | null; waiting_days?: number | null;
  next_task: { id: string; title: string; due_at: string | null } | null;
  customer: { name: string | null; email: string | null; whatsapp: string | null };
};

// --- HELPERS VISUALES ---
function badgeStage(stage: string) {
  const v = (stage || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] border shadow-sm';
  if (v === 'proposal') return `${base} border-amber-500/20 bg-amber-500/5 text-amber-600`;
  if (v === 'checkout') return `${base} border-brand-blue/20 bg-brand-blue/5 text-brand-blue animate-pulse`;
  if (v === 'won') return `${base} border-emerald-500/20 bg-emerald-500/5 text-emerald-600`;
  if (v === 'lost') return `${base} border-rose-500/20 bg-rose-500/5 text-rose-600`;
  return `${base} border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]/40`;
}

function fmtMoneyMinor(minor: number | null, curr: string | null) {
  if (minor == null) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: curr || 'EUR', maximumFractionDigits: 0 }).format(minor / 100);
}

export function AdminSalesCockpitClient() {
  const [stage, setStage] = useState<string>('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [autopilotBusy, setAutopilotBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [ticketsSummary, setTicketsSummary] = useState<any | null>(null);

  const fetchIt = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const p = new URLSearchParams(); if (stage) p.set('stage', stage); p.set('limit', '80');
      const [r, tr] = await Promise.all([
        adminFetch(`/api/admin/sales/cockpit?${p.toString()}`),
        adminFetch('/api/admin/tickets/summary')
      ]);
      const [j, tj] = await Promise.all([r.json(), tr.json()]);
      if (!r.ok) throw new Error(j?.error || 'Node_Fetch_Fail');
      setItems(j.items || []);
      if (tr.ok) setTicketsSummary(tj);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }, [stage]);

  useEffect(() => { fetchIt(); }, [fetchIt]);

  const stats = useMemo(() => {
    const f = items.filter(r => !q || `${r.title} ${r.customer?.name}`.toLowerCase().includes(q.toLowerCase()));
    return {
      total: f.length,
      hot: f.filter(r => r.score >= 75).length,
      checkout: f.filter(r => r.stage === 'checkout').length,
      stale: f.filter(r => r.stale_days >= 4).length,
      pipelineValue: f.reduce((acc, r) => acc + (r.amount_minor || 0), 0)
    };
  }, [items, q]);

  const founderLanes = useMemo(() => {
    const active = items.filter(r => !['won', 'lost'].includes(r.stage || ''));
    return [
      { id: 'sameDay', t: 'Presión Cierre', v: active.filter(r => ['proposal', 'checkout'].includes(r.stage || '')).length, c: 'text-rose-600', i: Zap, h: '/admin/deals/board' },
      { id: 'within12h', t: 'Seguimiento Premium', v: active.filter(r => r.score >= 60).length, c: 'text-amber-600', i: Target, h: '/admin/tasks' },
      { id: 'within2h', t: 'Riesgo Continuidad', v: (ticketsSummary?.counts?.open || 0), c: 'text-emerald-600', i: Radio, h: '/admin/tickets' },
      { id: 'hygiene', t: 'Higiene Nodo', v: active.filter(r => !r.next_task).length, c: 'text-brand-blue', i: Layers, h: '/admin/leads' },
    ];
  }, [items, ticketsSummary]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER DE MANDO COMERCIAL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Cockpit Lane: /sales-intelligence
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Sales <span className="text-brand-yellow italic font-light">Cockpit</span>
          </h1>
          <p className="mt-4 text-base text-[color:var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Consola táctica de conversión. Detecta los hilos de alta probabilidad, gestiona la 
            presión de cierre y garantiza que ningún deal se enfríe en el pipeline de KCE.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchIt} disabled={loading} variant="outline" className="h-12 px-6 rounded-2xl border-brand-dark/10 shadow-sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
          </Button>
          <Link href="/admin/deals/board">
            <Button variant="primary" className="h-12 px-8 rounded-2xl bg-brand-dark text-brand-yellow shadow-xl hover:scale-105 transition-transform">
              <GanttChartSquare className="mr-2 h-4 w-4" /> Ver Kanban
            </Button>
          </Link>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Conversion Sovereignty"
        title="Priorización de Energía de Cierre"
        description="El éxito de KCE no depende del volumen, sino de la velocidad. Usa el Score de Inteligencia para decidir qué viajero merece una llamada o un mensaje personalizado ahora mismo."
        signals={[
          { label: 'Pipeline_Active', value: fmtMoneyMinor(stats.pipelineValue, 'EUR'), note: 'Valor total en juego.' },
          { label: 'Hot_Leads', value: String(stats.hot), note: 'Deals con score > 75%.' },
          { label: 'Checkout_Live', value: String(stats.checkout), note: 'Esperando pago final.' }
        ]}
      />

      {/* 1. ESTRATEGIA DE CARRILES (Lanes) */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {founderLanes.map((lane) => (
          <Link key={lane.id} href={lane.h} className="group relative rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-sm transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-brand-blue/20">
             <div className="flex items-center justify-between mb-6">
                <div className="h-10 w-10 rounded-2xl bg-brand-blue/5 text-brand-blue flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-all">
                   <lane.i className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-[color:var(--color-text)]/50 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" />
             </div>
             <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/30 mb-2">{lane.t}</p>
             <div className={`text-5xl font-heading tracking-tighter ${lane.c}`}>{lane.v}</div>
          </Link>
        ))}
      </section>

      {/* 2. TABLA DE COMANDO (BÓVEDA) */}
      <section className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl overflow-hidden relative">
        
        {/* INSTRUMENTACIÓN DE FILTROS */}
        <div className="p-8 border-b border-[color:var(--color-border)] flex flex-col xl:flex-row items-center justify-between gap-6">
           <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-4 w-4 text-brand-blue mr-2" />
              {[
                { id: '', l: 'TODOS LOS ACTIVOS' },
                { id: 'qualified', l: 'QUALIFIED' },
                { id: 'proposal', l: 'PROPOSAL' },
                { id: 'checkout', l: 'CHECKOUT' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStage(f.id)}
                  className={`h-10 px-6 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                    stage === f.id ? 'bg-brand-dark text-brand-yellow shadow-lg scale-105' : 'bg-[color:var(--color-surface)] border border-[color:var(--color-border)] text-[color:var(--color-text)]/40 hover:text-brand-blue'
                  }`}
                >
                  {f.l}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-4 w-full xl:w-auto">
              <div className="relative group flex-1 xl:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                <input 
                  value={q} 
                  onChange={(e) => setQ(e.target.value)} 
                  placeholder="Buscar rastro de deal o viajero..." 
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-sm font-light outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all" 
                />
              </div>
              <Button onClick={() => void 0} variant="outline" className="h-12 rounded-2xl border-brand-blue/20 text-brand-blue font-bold uppercase tracking-widest text-[9px]">
                <Bot className="mr-2 h-4 w-4" /> AI Auto-Pilot
              </Button>
           </div>
        </div>

        {/* DATA GRID */}
        <div className="overflow-x-auto p-6">
           <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden shadow-sm">
             <table className="w-full min-w-[1200px] text-left text-sm border-separate border-spacing-0">
               <thead className="bg-[color:var(--color-surface-2)]">
                 <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/40">
                   <th className="px-8 py-6 rounded-tl-[2.5rem]">Expediente del Deal</th>
                   <th className="px-8 py-6">Estado Actual</th>
                   <th className="px-8 py-6 text-right">Métricas de Latencia</th>
                   <th className="px-8 py-6 text-center">Score & Riesgo</th>
                   <th className="px-8 py-6">Next Protocol</th>
                   <th className="px-8 py-6 text-right rounded-tr-[2.5rem]">Acción Táctica</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-black/[0.03]">
                 {loading ? (
                   <tr><td colSpan={6} className="px-8 py-24 text-center animate-pulse text-xs font-bold uppercase tracking-widest text-brand-blue/20">Interrogando la base comercial...</td></tr>
                 ) : items.length === 0 ? (
                   <tr><td colSpan={6} className="px-8 py-32 text-center text-[color:var(--color-text)]/50 italic">Sin señales registradas.</td></tr>
                 ) : (
                   items.map((r) => (
                     <tr key={r.id} className={`group transition-all hover:bg-brand-blue/[0.01] ${r.overdue_tasks > 0 ? 'bg-rose-500/[0.02]' : ''}`}>
                       <td className="px-8 py-6 align-top">
                         <Link href={`/admin/deals/${r.id}`} className="font-heading text-lg text-brand-blue hover:underline block mb-2 leading-tight uppercase tracking-tighter">{r.title || 'NULL_DEAL'}</Link>
                         <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-[color:var(--color-text)]/60"><MapPin className="h-3 w-3 opacity-30" /> {r.tour_slug || 'CUSTOM_PLAN'}</div>
                            <div className="text-[10px] font-mono text-[color:var(--color-text)]/40 italic">{r.customer?.name} / {r.customer?.email?.slice(0, 15)}...</div>
                         </div>
                       </td>

                       <td className="px-8 py-6 align-top">
                         <div className="mb-3">{badgeStage(r.stage || '')}</div>
                         {r.waiting_on && (
                           <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md border border-brand-blue/10 bg-brand-blue/5 text-[8px] font-bold uppercase text-brand-blue">
                             Esperando: {r.waiting_on} ({r.waiting_days}d)
                           </div>
                         )}
                       </td>

                       <td className="px-8 py-6 align-top text-right space-y-1">
                         <div className="text-[10px] text-[color:var(--color-text)]/40 uppercase font-bold tracking-widest">Edad: <span className="font-mono text-[color:var(--color-text)]">{r.age_days}d</span></div>
                         <div className="text-[10px] text-[color:var(--color-text)]/40 uppercase font-bold tracking-widest">Stale: <span className="font-mono text-[color:var(--color-text)]">{r.stale_days}d</span></div>
                         <div className="text-[10px] text-brand-blue uppercase font-bold tracking-widest">Touch: <span className="font-mono">{r.contact_stale_days ?? '—'}d</span></div>
                       </td>

                       <td className="px-8 py-6 align-top text-center">
                         <div className={`text-3xl font-heading ${r.score >= 75 ? 'text-brand-blue' : r.score >= 50 ? 'text-amber-500' : 'text-[color:var(--color-text)]/50'}`}>{r.score}</div>
                         {r.risk.length > 0 && (
                           <div className="mt-3 flex flex-wrap justify-center gap-1">
                             {r.risk.slice(0, 2).map(rk => <span key={rk} className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 text-[7px] font-bold uppercase border border-rose-500/20">{rk}</span>)}
                           </div>
                         )}
                       </td>

                       <td className="px-8 py-6 align-top">
                         <div className="text-[11px] font-bold text-[color:var(--color-text)] mb-2 leading-tight line-clamp-2 italic">"{r.next_task?.title || 'Definir Siguiente Paso'}"</div>
                         <div className="text-[9px] font-bold uppercase tracking-widest text-brand-blue bg-brand-blue/5 px-2 py-1 rounded-md w-max border border-brand-blue/10">{r.next_action}</div>
                       </td>

                       <td className="px-8 py-6 align-top text-right">
                         <div className="flex flex-col items-end gap-4">
                           <div className="text-2xl font-heading text-emerald-600 tracking-tighter">{fmtMoneyMinor(r.amount_minor, r.currency)}</div>
                           <div className="flex gap-2">
                             <button onClick={() => void 0} className="h-10 w-10 rounded-xl border border-[color:var(--color-border)] flex items-center justify-center text-brand-blue hover:bg-brand-blue hover:text-white transition-all"><Copy className="h-4 w-4" /></button>
                             <button onClick={() => void 0} className="h-10 px-4 rounded-xl bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-emerald-600">WA</button>
                             <button onClick={() => void 0} className="h-10 w-10 rounded-xl bg-brand-blue text-white flex items-center justify-center hover:bg-brand-blue/90 shadow-lg"><Mail className="h-4 w-4" /></button>
                           </div>
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

      <footer className="mt-12 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Sales
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <TrendingUp className="h-3.5 w-3.5" /> Growth Engine v4.2
        </div>
      </footer>
    </div>
  );
}