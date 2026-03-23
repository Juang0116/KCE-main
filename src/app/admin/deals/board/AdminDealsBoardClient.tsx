'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';

import { adminFetch } from '@/lib/adminFetch.client';
import { AdminTourSelector } from '@/components/admin/AdminTourSelector';
import { loadCheckoutPreset, saveCheckoutPreset } from '@/components/admin/checkoutPreset';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Activity, RefreshCw, CheckCircle2, DollarSign, 
  Zap, Target, MapPin, Sparkles, TrendingUp, 
  ChevronRight, ClipboardCheck, Terminal, 
  ShieldCheck, Hash, User, Layout, CreditCard,
  Database // <--- Agrégalo aquí
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TIPADO DEL PIPELINE ---
type Deal = {
  id: string;
  title: string | null;
  stage: string | null;
  tour_slug: string | null;
  amount_minor: number | null;
  currency: string | null;
  updated_at: string | null;
  lead_id: string | null;
  customer_id: string | null;
  leads?: { email: string | null; whatsapp: string | null } | null;
  customers?: { email: string | null; name: string | null; phone: string | null; country: string | null } | null;
};

type CheckoutDraft = { slug: string; date: string; guests: number; email: string; };
type PlaybookInfo = { kind: string; tasksCreated: number; templates?: unknown; };

const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'checkout', 'won', 'lost'] as const;

// --- HELPERS ---
function fmtMoney(amountMinor: number | null, currency: string | null) {
  if (amountMinor === null || amountMinor === undefined) return '—';
  const cur = (currency || 'EUR').toUpperCase();
  try {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: cur, 
      maximumFractionDigits: 0 
    }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(0)} ${cur}`;
  }
}

function getEmailForDeal(d: Deal) { return d.customers?.email || d.leads?.email || ''; }

export function AdminDealsBoardClient() {
  const [items, setItems] = useState<Deal[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Estados de Operación Local
  const [checkoutOpen, setCheckoutOpen] = useState<Record<string, boolean>>({});
  const [checkoutDraft, setCheckoutDraft] = useState<Record<string, CheckoutDraft>>({});
  const [checkoutUrl, setCheckoutUrl] = useState<Record<string, string>>({});
  const [playbookInfo, setPlaybookInfo] = useState<Record<string, PlaybookInfo>>({});

  const reqIdRef = useRef(0);

  const load = useCallback(async () => {
    setLoading(true); 
    setErr(null);
    const myReqId = ++reqIdRef.current;

    try {
      const params = new URLSearchParams({ limit: '100' });
      if (q.trim()) params.set('q', q.trim());
      const res = await adminFetch(`/api/admin/deals?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      
      if (myReqId !== reqIdRef.current) return;
      if (!res.ok) throw new Error(json?.error || 'Falla de conexión con el Pipeline');
      
      setItems(Array.isArray(json?.items) ? (json.items as Deal[]) : []);
    } catch (e: unknown) {
      if (myReqId !== reqIdRef.current) return;
      setErr(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }, [q]);

  useEffect(() => { void load(); }, [load]);

  // --- LÓGICA DE CHECKOUT ---
  function getDraftForDeal(d: Deal): CheckoutDraft {
    const preset = loadCheckoutPreset();
    const existing = checkoutDraft[d.id];
    return {
      slug: existing?.slug ?? d.tour_slug ?? preset.lastSlug ?? '',
      date: existing?.date ?? preset.lastDate ?? '',
      guests: existing?.guests ?? preset.lastGuests ?? 1,
      email: existing?.email ?? getEmailForDeal(d),
    };
  }

  function patchDraft(dealId: string, patch: Partial<CheckoutDraft>, fallback: CheckoutDraft) {
    setCheckoutDraft((s) => ({ ...s, [dealId]: { ...(s[dealId] ?? fallback), ...patch } }));
  }

  async function createCheckoutLink(deal: Deal) {
    const draft = getDraftForDeal(deal);
    if (!draft.slug || !draft.date) { alert('Criterios incompletos (Tour/Fecha).'); return; }
    try {
      const res = await fetch('/api/bot/create-checkout', {
        method: 'POST', 
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          dealId: deal.id, 
          slug: draft.slug, 
          date: draft.date, 
          guests: draft.guests, 
          email: draft.email || undefined 
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || 'Error al generar link');
      
      setCheckoutUrl((s) => ({ ...s, [deal.id]: data.url }));
      saveCheckoutPreset({ lastSlug: draft.slug, lastDate: draft.date, lastGuests: draft.guests });
      
      try { await navigator.clipboard.writeText(data.url); } catch {}
    } catch (e: unknown) { 
      alert(e instanceof Error ? e.message : 'Error de transmisión'); 
    }
  }

  // --- LÓGICA DE AUTOMATIZACIÓN ---
  async function applyPlaybook(dealId: string, kind: 'followup_24h' | 'proposal' | 'checkout_push') {
    try {
      const res = await adminFetch(`/api/admin/deals/${encodeURIComponent(dealId)}/playbook`, {
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify({ kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Playbook error');
      setPlaybookInfo((s) => ({ ...s, [dealId]: { kind, tasksCreated: Number(data?.tasksCreated ?? 0) } }));
    } catch (e: unknown) { 
      alert(e instanceof Error ? e.message : 'Error al inyectar protocolo'); 
    }
  }

  const byStage = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    for (const s of STAGES) map[s] = [];
    map.other = [];
    for (const d of items) {
      const st = d.stage || 'other';
      if (map[st]) map[st].push(d); else map.other.push(d);
    }
    return map;
  }, [items]);

  const move = async (id: string, stage: string) => {
    const prev = [...items];
    setItems((cur) => cur.map((d) => (d.id === id ? { ...d, stage } : d)));
    try {
      const res = await adminFetch(`/api/admin/deals/${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error();
    } catch { setItems(prev); }
  };

  const signals = useMemo(() => {
    const hot = (byStage['checkout']?.length || 0) + (byStage['proposal']?.length || 0);
    const totalValue = items.reduce((acc, curr) => acc + (curr.amount_minor || 0), 0);
    return [
      { label: 'Hot Pipeline', value: String(hot), note: 'Foco en cierre inmediato.' },
      { label: 'Deals Activos', value: String(items.length), note: 'En tablero táctico.' },
      { label: 'Value POTENTIAL', value: fmtMoney(totalValue, 'EUR'), note: 'Revenue total visible.' }
    ];
  }, [byStage, items]);

  return (
    <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <TrendingUp className="h-3.5 w-3.5" /> Commercial Revenue Unit
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tighter">
            Tablero <span className="text-brand-blue italic font-light">Kanban</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed">
            Gestión visual de flujos de alta conversión para Knowing Cultures S.A.S. Mueve la señal hacia la derecha para consolidar la liquidez del negocio.
          </p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" onClick={() => void load()} disabled={loading} className="rounded-full h-12 px-8 border-brand-dark/10 hover:bg-surface-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm">
             <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`} /> Sincronizar Board
           </Button>
        </div>
      </header>

      {/* 02. ESTRATEGIA OPERATIVA */}
      <AdminOperatorWorkbench
        eyebrow="Sales Velocity Strategy"
        title="Arquitectura de Cierre"
        description="Prioriza los hilos en Proposal y Checkout. El objetivo es reducir drásticamente el tiempo de respuesta entre el primer contacto y la confirmación de pago."
        actions={[
          { href: '/admin/deals', label: 'Lista Maestra' },
          { href: '/admin/revenue', label: 'Análisis de Revenue', tone: 'primary' }
        ]}
        signals={signals}
      />

      {/* TABLERO KANBAN */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop relative overflow-hidden flex flex-col">
        
        {/* Barra de Filtros Interna */}
        <div className="p-8 bg-surface-2/30 border-b border-brand-dark/5 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative w-full lg:w-1/2 group">
            <Target className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
            <input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Filtro por deal, viajero o tour..." 
              className="w-full h-14 pl-14 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm font-light text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30" 
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-brand-blue/5 border border-brand-blue/10">
             <div className="h-1.5 w-1.5 rounded-full bg-brand-blue animate-pulse" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/70">Board Synced</span>
          </div>
        </div>

        {/* Grilla Kanban */}
        <div className="flex gap-8 overflow-x-auto p-8 pb-12 snap-x custom-scrollbar min-h-[850px] bg-surface-2/10">
          {STAGES.map((stage) => {
            const columnDeals = byStage[stage] ?? [];
            const isHot = ['checkout', 'proposal'].includes(stage);

            return (
              <div key={stage} className={`flex-shrink-0 w-[400px] snap-center rounded-[2.5rem] border p-6 flex flex-col transition-all duration-500 ${
                isHot ? 'bg-brand-blue/[0.03] border-brand-blue/20 shadow-inner ring-1 ring-brand-blue/5' : 'bg-surface border-brand-dark/5 dark:border-white/5'
              }`}>
                
                <header className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-4">
                    <div className={`h-2.5 w-2.5 rounded-full ${isHot ? 'bg-brand-blue animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-muted opacity-30'}`} />
                    <h3 className="font-heading text-2xl capitalize text-main tracking-tight">{stage}</h3>
                  </div>
                  <div className="h-7 px-3 rounded-lg bg-surface border border-brand-dark/10 dark:border-white/10 flex items-center justify-center text-[10px] font-bold text-muted shadow-sm">
                    {columnDeals.length}
                  </div>
                </header>

                <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                  {columnDeals.map((d) => {
                    const isOpen = checkoutOpen[d.id] ?? false;
                    const draft = getDraftForDeal(d);
                    const hasLink = !!checkoutUrl[d.id];
                    const hasPB = !!playbookInfo[d.id];

                    return (
                      <div key={d.id} className="rounded-[2.2rem] border border-brand-dark/5 dark:border-white/5 bg-surface p-7 shadow-soft transition-all hover:shadow-pop hover:-translate-y-1 hover:border-brand-blue/20 group animate-in fade-in duration-500">
                        
                        <header className="flex items-start justify-between gap-4 mb-5">
                          <Link href={`/admin/deals/${d.id}`} className="font-heading text-xl text-main group-hover:text-brand-blue transition-colors leading-tight line-clamp-2 tracking-tight">
                            {d.title || 'Draft de Venta'}
                          </Link>
                          <div className="h-8 w-8 rounded-xl bg-brand-dark/5 dark:bg-white/5 flex items-center justify-center text-muted group-hover:bg-brand-blue group-hover:text-white transition-all shadow-inner">
                             <ChevronRight className="h-4 w-4" />
                          </div>
                        </header>

                        <div className="flex flex-col gap-3 mb-6">
                           <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                             <MapPin className="h-4 w-4 text-brand-blue opacity-50" /> {d.tour_slug || 'ASIGNAR TOUR'}
                           </div>
                           <div className="flex items-center gap-3 text-[10px] font-mono text-muted opacity-40 uppercase">
                             <Hash className="h-3 w-3" /> {d.id.slice(0,8)}
                           </div>
                        </div>

                        <div className="flex items-end justify-between mb-8">
                           <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-muted opacity-40 mb-1">Valor Estimado</p>
                              <div className="font-heading text-3xl text-green-600 dark:text-green-400 tracking-tighter">{fmtMoney(d.amount_minor, d.currency)}</div>
                           </div>
                           <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] font-bold text-main flex items-center gap-1.5 bg-surface-2 px-2 py-1 rounded-lg border border-brand-dark/5">
                                 <User className="h-3 w-3 opacity-40" /> {d.customers?.name?.split(' ')[0] || d.leads?.email?.split('@')[0] || 'Voyager'}
                              </span>
                           </div>
                        </div>

                        {/* ACCIONES TÁCTICAS */}
                        <div className="space-y-3 pt-6 border-t border-brand-dark/5 dark:border-white/5">
                          <div className="relative">
                            <select 
                              className="w-full h-11 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 px-5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted outline-none focus:ring-2 focus:ring-brand-blue/20 appearance-none cursor-pointer text-center hover:bg-surface-2/80 transition-colors" 
                              value={String(d.stage ?? stage)} 
                              onChange={(e) => void move(d.id, e.target.value)}
                            >
                              {STAGES.map((s) => <option key={s} value={s}>MOVER A {s.toUpperCase()}</option>)}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 rotate-90 opacity-30" />
                          </div>

                          <div className="flex gap-2">
                            <button onClick={() => setCheckoutOpen(s => ({ ...s, [d.id]: !isOpen }))} className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm ${isOpen ? 'bg-brand-blue text-white ring-4 ring-brand-blue/10' : 'bg-brand-dark text-brand-yellow hover:bg-brand-blue hover:text-white active:scale-95'}`}>
                              <CreditCard className="h-4 w-4" /> {isOpen ? 'CANCELAR' : 'DESPLEGAR PAGO'}
                            </button>
                            <button onClick={() => void applyPlaybook(d.id, 'followup_24h')} className="w-12 h-12 rounded-xl border border-brand-dark/10 bg-surface text-muted flex items-center justify-center hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all shadow-sm active:scale-95">
                              <Sparkles className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* MÓDULO DE DESPLIEGUE DE CHECKOUT */}
                        {isOpen && (
                          <div className="mt-6 space-y-4 p-6 rounded-[2rem] bg-surface-2 border border-brand-dark/10 dark:border-white/10 animate-in zoom-in-95 duration-300 shadow-inner">
                             <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted opacity-60 mb-1">
                               <Terminal className="h-3 w-3" /> Transacción en Configuración
                             </div>
                             <AdminTourSelector value={draft.slug} onChange={(slug) => patchDraft(d.id, { slug }, draft)} />
                             <div className="grid grid-cols-2 gap-3">
                                <input type="date" value={draft.date} onChange={(e) => patchDraft(d.id, { date: e.target.value }, draft)} className="w-full h-11 rounded-xl border border-brand-dark/10 bg-surface px-4 text-xs outline-none focus:ring-2 focus:ring-brand-blue/20" />
                                <div className="flex items-center bg-surface border border-brand-dark/10 rounded-xl overflow-hidden h-11">
                                   <input type="number" value={draft.guests} onChange={(e) => patchDraft(d.id, { guests: Number(e.target.value) }, draft)} className="w-full px-4 text-xs outline-none text-center font-bold text-main" />
                                   <span className="pr-4 text-[9px] font-bold uppercase text-muted opacity-30">PAX</span>
                                </div>
                             </div>
                             <Button onClick={() => void createCheckoutLink(d)} className="w-full rounded-xl bg-green-600 hover:bg-green-700 h-12 text-[10px] font-bold uppercase tracking-widest text-white shadow-pop transition-all active:scale-95">
                               Generar Transacción
                             </Button>
                          </div>
                        )}

                        {/* FEEDBACK DE ACCIONES */}
                        {hasLink && (
                          <div className="mt-5 p-5 rounded-2xl bg-green-500/5 border border-green-500/20 flex items-start gap-4 animate-in slide-in-from-top-2">
                             <ClipboardCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                             <div className="overflow-hidden">
                                <p className="text-[10px] font-bold uppercase text-green-700 dark:text-green-400 tracking-widest">Link Generado & Copiado</p>
                                <p className="text-[10px] text-green-600/70 font-mono truncate mt-1.5 bg-green-500/5 p-1 rounded">
                                  {checkoutUrl[d.id]}
                                </p>
                             </div>
                          </div>
                        )}

                        {hasPB && playbookInfo[d.id] && (
                          <div className="mt-5 p-5 rounded-2xl bg-brand-blue/5 border border-brand-blue/20 flex items-start gap-4 animate-in slide-in-from-top-2">
                             <CheckCircle2 className="h-5 w-5 text-brand-blue shrink-0 mt-0.5" />
                             <p className="text-[10px] text-brand-blue/80 font-medium leading-relaxed">
                                Protocolo <b>{playbookInfo[d.id]?.kind.toUpperCase()}</b> inyectado. {playbookInfo[d.id]?.tasksCreated} tareas tácticas creadas.
                             </p>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER DE INFRAESTRUCTURA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Zap className="h-4 w-4 text-brand-blue" /> Revenue Velocity Unit
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-yellow" /> Commercial Integrity
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Database className="h-4 w-4 text-brand-blue" /> Pipeline Core v5.2
        </div>
      </footer>

    </div>
  );
}