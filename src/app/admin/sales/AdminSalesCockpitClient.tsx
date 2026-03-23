'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';

import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Bot, Copy, RefreshCw, Filter, Search, 
  Zap, Target, Clock, MapPin, Terminal, 
  ShieldCheck, Layers, Mail, TrendingUp, 
  Cpu, Layout, ChevronRight, UserCheck, Star
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
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm';
  if (v === 'proposal') return `${base} border-amber-500/20 bg-amber-500/5 text-amber-600`;
  if (v === 'checkout') return `${base} border-brand-blue/20 bg-brand-blue/5 text-brand-blue animate-pulse`;
  if (v === 'won') return `${base} border-green-500/20 bg-green-500/5 text-green-600`;
  if (v === 'lost') return `${base} border-red-500/20 bg-red-500/5 text-red-600`;
  return `${base} border-brand-dark/10 bg-surface-2 text-muted`;
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
  const [ticketsSummary, setTicketsSummary] = useState<any | null>(null);

  const fetchIt = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const p = new URLSearchParams(); 
      if (stage) p.set('stage', stage); 
      p.set('limit', '80');
      
      const [r, tr] = await Promise.all([
        adminFetch(`/api/admin/sales/cockpit?${p.toString()}`),
        adminFetch('/api/admin/tickets/summary')
      ]);
      
      const [j, tj] = await Promise.all([r.json(), tr.json()]);
      
      if (!r.ok) throw new Error(j?.error || 'Node_Fetch_Fail');
      setItems(j.items || []);
      if (tr.ok) setTicketsSummary(tj);
    } catch (e: any) { 
      setErr(e.message); 
    } finally { 
      setLoading(false); 
    }
  }, [stage]);

  useEffect(() => { void fetchIt(); }, [fetchIt]);

  const filteredItems = useMemo(() => {
    return items.filter(r => 
      !q || 
      `${r.title} ${r.customer?.name} ${r.id}`.toLowerCase().includes(q.toLowerCase())
    );
  }, [items, q]);

  const stats = useMemo(() => {
    return {
      total: filteredItems.length,
      hot: filteredItems.filter(r => r.score >= 75).length,
      checkout: filteredItems.filter(r => r.stage === 'checkout').length,
      stale: filteredItems.filter(r => r.stale_days >= 4).length,
      pipelineValue: filteredItems.reduce((acc, r) => acc + (r.amount_minor || 0), 0)
    };
  }, [filteredItems]);

  const founderLanes = useMemo(() => {
    const active = items.filter(r => !['won', 'lost'].includes(r.stage || ''));
    return [
      { id: 'sameDay', t: 'Presión Cierre', v: active.filter(r => ['proposal', 'checkout'].includes(r.stage || '')).length, c: 'text-red-600', i: Zap, h: '/admin/deals/board', bg: 'bg-red-500/5' },
      { id: 'within12h', t: 'Seguimiento Premium', v: active.filter(r => r.score >= 60).length, c: 'text-brand-yellow', i: Star, h: '/admin/tasks', bg: 'bg-brand-yellow/5' },
      { id: 'within2h', t: 'Riesgo Continuidad', v: (ticketsSummary?.counts?.open || 0), c: 'text-green-600', i: Bot, h: '/admin/tickets', bg: 'bg-green-500/5' },
      { id: 'hygiene', t: 'Higiene Nodo', v: active.filter(r => !r.next_task).length, c: 'text-brand-blue', i: Layers, h: '/admin/leads', bg: 'bg-brand-blue/5' },
    ];
  }, [items, ticketsSummary]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA DE MANDO COMERCIAL */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Terminal className="h-4 w-4" /> Cockpit Lane: /sales-intelligence-node
          </div>
          <h1 className="font-heading text-4xl md:text-7xl text-main tracking-tighter leading-none">
            Sales <span className="text-brand-yellow italic font-light">Cockpit</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2 italic">
            Consola táctica de conversión para Knowing Cultures S.A.S. Detecta hilos de alta probabilidad y garantiza la velocidad de flujo en el pipeline comercial.
          </p>
        </div>
        <div className="flex gap-4">
           <Button onClick={() => void fetchIt()} disabled={loading} variant="outline" className="rounded-full h-12 px-8 border-brand-dark/10 shadow-sm font-bold uppercase tracking-widest text-[10px] hover:bg-surface-2 transition-all">
             <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`} /> Sincronizar
           </Button>
           <Link href="/admin/deals/board">
              <Button className="h-12 px-8 rounded-full bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95">
                <Layout className="mr-2 h-4 w-4" /> Ver Kanban
              </Button>
           </Link>
        </div>
      </header>

      {/* 02. WORKBENCH DE SOBERANÍA */}
      <AdminOperatorWorkbench
        eyebrow="Conversion Sovereignty"
        title="Priorización de Energía de Cierre"
        description="El éxito de KCE no reside en el volumen, sino en la velocidad de respuesta. Usa el Score Predictivo para priorizar a los viajeros que están listos para el checkout hoy."
        actions={[
          { href: '/admin/deals/board', label: 'Tablero de Ventas', tone: 'primary' },
          { href: '/admin/revenue', label: 'Monitor de Ingresos' }
        ]}
        signals={[
          { label: 'Active Pipeline', value: fmtMoneyMinor(stats.pipelineValue, 'EUR'), note: 'Valor total en riesgo.' },
          { label: 'Hot Leads', value: String(stats.hot), note: 'Score de intención > 75%.' },
          { label: 'Checkout Live', value: String(stats.checkout), note: 'En espera de liquidación.' }
        ]}
      />

      {/* 03. ESTRATEGIA DE CARRILES (TACTICAL LANES) */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 px-2">
        {founderLanes.map((lane) => (
          <Link key={lane.id} href={lane.h} className="group relative rounded-[2.5rem] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 shadow-soft transition-all hover:shadow-pop hover:-translate-y-2 overflow-hidden">
             <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:scale-110 transition-transform duration-700">
                <lane.i className={`h-32 w-32 ${lane.c}`} />
             </div>
             
             <header className="flex items-center justify-between mb-8 relative z-10">
                <div className={`h-12 w-12 rounded-2xl ${lane.bg} flex items-center justify-center ${lane.c} shadow-inner`}>
                   <lane.i className="h-6 w-6" />
                </div>
                <div className="h-8 w-8 rounded-full bg-surface-2 border border-brand-dark/5 flex items-center justify-center text-muted opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                   <ChevronRight className="h-4 w-4" />
                </div>
             </header>
             
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted opacity-40 mb-3">{lane.t}</p>
                <div className={`text-6xl font-heading tracking-tighter ${lane.c}`}>{lane.v}</div>
             </div>
          </Link>
        ))}
      </section>

      {/* 04. LA BÓVEDA DE COMANDO (GRID & TABLE) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden relative flex flex-col">
        
        {/* FILTROS E INSTRUMENTACIÓN */}
        <div className="p-8 border-b border-brand-dark/5 dark:border-white/5 bg-surface-2/30 flex flex-col xl:flex-row items-center justify-between gap-8">
           <div className="flex flex-wrap items-center gap-3">
              <div className="h-10 px-4 rounded-xl bg-surface border border-brand-dark/5 flex items-center gap-3 shadow-inner mr-2">
                 <Filter className="h-4 w-4 text-brand-blue opacity-40" />
                 <span className="text-[9px] font-black text-muted uppercase tracking-widest">Filtros Tácticos</span>
              </div>
              {[
                { id: '', l: 'TODOS LOS ACTIVOS' },
                { id: 'qualified', l: 'QUALIFIED' },
                { id: 'proposal', l: 'PROPOSAL' },
                { id: 'checkout', l: 'CHECKOUT' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStage(f.id)}
                  className={`h-11 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    stage === f.id 
                      ? 'bg-brand-dark text-brand-yellow shadow-pop scale-105 ring-4 ring-brand-yellow/10' 
                      : 'bg-surface border border-brand-dark/10 text-muted hover:border-brand-blue/30 hover:text-main'
                  }`}
                >
                  {f.l}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-4 w-full xl:w-auto">
              <div className="relative group flex-1 xl:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-30 group-focus-within:opacity-100 transition-opacity" />
                <input 
                  value={q} 
                  onChange={(e) => setQ(e.target.value)} 
                  placeholder="ID de deal, tour o rastro de viajero..." 
                  className="w-full h-12 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm font-light text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30" 
                />
              </div>
              <Button className="h-12 rounded-full px-8 bg-brand-blue text-white font-bold uppercase tracking-widest text-[9px] shadow-soft hover:bg-brand-dark transition-all">
                <Bot className="mr-2 h-4 w-4" /> AI Auto-Pilot
              </Button>
           </div>
        </div>

        {/* TABLA FORENSE DE DEALS */}
        <div className="overflow-x-auto custom-scrollbar px-2 pb-6">
          <table className="w-full min-w-[1300px] text-left text-sm">
            <thead className="bg-surface border-b border-brand-dark/5 dark:border-white/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-6">Expediente del Deal</th>
                <th className="px-8 py-6">Fase Operativa</th>
                <th className="px-8 py-6 text-right">Latencia del Nodo</th>
                <th className="px-8 py-6 text-center">Inteligencia (Score)</th>
                <th className="px-8 py-6">Protocolo Siguiente</th>
                <th className="px-8 py-6 text-right">Mando Táctico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-40 text-center animate-pulse text-[11px] font-bold uppercase tracking-[0.5em] text-muted bg-surface">Sincronizando el Cockpit comercial...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-40 text-center bg-surface">
                     <TrendingUp className="mx-auto h-16 w-16 text-brand-blue opacity-10 mb-6" />
                     <p className="text-xl font-heading text-main tracking-tight opacity-30 uppercase">Sin Señales Activas</p>
                     <p className="text-sm font-light text-muted mt-2 italic">No hay tratos que coincidan con la instrumentación actual.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((r) => (
                  <tr key={r.id} className={`group transition-colors hover:bg-surface-2/50 cursor-default bg-surface ${r.overdue_tasks > 0 ? 'bg-red-500/[0.02]' : ''}`}>
                    
                    {/* Expediente */}
                    <td className="px-8 py-8 align-top">
                      <div className="flex flex-col gap-4">
                         <Link href={`/admin/deals/board?q=${r.id}`} className="font-heading text-2xl text-brand-blue hover:text-brand-yellow transition-colors block leading-none tracking-tighter uppercase">
                           {r.title || 'UNNAMED_DEAL'}
                         </Link>
                         <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                               <div className="h-7 w-7 rounded-lg bg-surface-2 border border-brand-dark/5 flex items-center justify-center shadow-inner">
                                  <MapPin className="h-3.5 w-3.5 text-brand-blue opacity-50" />
                               </div>
                               <span className="text-[10px] font-black text-main uppercase tracking-tighter">{r.tour_slug || 'CUSTOM_EXPERIENCE'}</span>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-surface-2 border border-brand-dark/5 w-fit">
                               <UserCheck className="h-3.5 w-3.5 text-muted opacity-40" />
                               <span className="text-[11px] font-mono font-bold text-muted">{r.customer?.name}</span>
                            </div>
                         </div>
                      </div>
                    </td>

                    {/* Fase */}
                    <td className="px-8 py-8 align-top">
                      <div className="flex flex-col gap-4">
                         {badgeStage(r.stage || '')}
                         {r.waiting_on && (
                           <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-blue/5 border border-brand-blue/10 text-[9px] font-black uppercase text-brand-blue w-fit">
                             <Clock className="h-3 w-3" /> Bloqueo: {r.waiting_on} ({r.waiting_days}d)
                           </div>
                         )}
                      </div>
                    </td>

                    {/* Latencia */}
                    <td className="px-8 py-8 align-top text-right">
                      <div className="space-y-2">
                        <div className="text-[10px] text-muted uppercase font-bold tracking-widest flex items-center justify-end gap-2">
                           Age: <span className="font-mono text-main bg-surface-2 px-2 py-0.5 rounded-md border border-brand-dark/5">{r.age_days}D</span>
                        </div>
                        <div className="text-[10px] text-muted uppercase font-bold tracking-widest flex items-center justify-end gap-2">
                           Stale: <span className={`font-mono px-2 py-0.5 rounded-md border ${r.stale_days > 4 ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-surface-2 text-main border-brand-dark/5'}`}>{r.stale_days}D</span>
                        </div>
                        <div className="text-[10px] text-brand-blue uppercase font-bold tracking-widest flex items-center justify-end gap-2">
                           Touch: <span className="font-mono font-black">{r.contact_stale_days ?? '—'}D</span>
                        </div>
                      </div>
                    </td>

                    {/* Intelligence Score */}
                    <td className="px-8 py-8 align-top text-center">
                      <div className="flex flex-col items-center gap-3">
                         <div className={`text-5xl font-heading tracking-tighter ${r.score >= 75 ? 'text-brand-blue drop-shadow-[0_0_10px_rgba(59,130,246,0.2)]' : r.score >= 50 ? 'text-brand-yellow' : 'text-muted opacity-30'}`}>
                           {r.score}
                         </div>
                         {r.risk.length > 0 && (
                           <div className="flex flex-wrap justify-center gap-1.5">
                             {r.risk.slice(0, 2).map(rk => (
                               <span key={rk} className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-700 text-[8px] font-black uppercase tracking-tighter border border-red-500/10">
                                  {rk}
                               </span>
                             ))}
                           </div>
                         )}
                      </div>
                    </td>

                    {/* Next Protocol */}
                    <td className="px-8 py-8 align-top max-w-[280px]">
                      <div className="flex flex-col gap-4">
                         <div className="text-[12px] font-light text-main leading-snug italic border-l-2 border-brand-blue/20 pl-4 py-1">
                           &quot;{r.next_task?.title || 'Definir Siguiente Maniobra...'}&quot;
                         </div>
                         <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-[9px] font-black uppercase tracking-widest text-brand-blue w-fit shadow-sm">
                            <Target className="h-3 w-3" /> {r.next_action}
                         </div>
                      </div>
                    </td>

                    {/* Acción Táctica */}
                    <td className="px-8 py-8 align-top text-right">
                      <div className="flex flex-col items-end gap-6">
                        <div className="text-3xl font-heading text-green-600 tracking-tighter drop-shadow-sm">{fmtMoneyMinor(r.amount_minor, r.currency)}</div>
                        <div className="flex gap-2">
                          <button onClick={() => { navigator.clipboard.writeText(r.id); }} className="h-10 w-10 rounded-xl border border-brand-dark/10 bg-surface flex items-center justify-center text-muted hover:text-brand-blue hover:border-brand-blue transition-all active:scale-90 shadow-sm"><Copy className="h-4 w-4" /></button>
                          <button onClick={() => void 0} className="h-10 px-6 rounded-xl bg-green-600 text-white text-[10px] font-black uppercase tracking-widest shadow-pop hover:bg-green-700 active:scale-95 transition-all">WA</button>
                          <button onClick={() => void 0} className="h-10 w-10 rounded-xl bg-brand-dark text-brand-yellow flex items-center justify-center hover:bg-brand-blue hover:text-white shadow-pop transition-all active:scale-95"><Mail className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Sales Data
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <TrendingUp className="h-4 w-4 opacity-50" /> Growth Engine v4.2
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Cpu className="h-4 w-4 animate-pulse" /> Predictive Logic Active
        </div>
      </footer>
    </div>
  );
}