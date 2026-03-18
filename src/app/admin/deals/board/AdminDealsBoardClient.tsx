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
  ChevronRight, ClipboardCheck
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

  // UX Pro: Control de peticiones concurrentes
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
      { label: 'Deals Activos', value: String(items.length), note: 'Oportunidades en tablero.' },
      { label: 'Pipeline Value', value: fmtMoney(totalValue, 'EUR'), note: 'Revenue potencial visible.' }
    ];
  }, [byStage, items]);

  return (
    <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <TrendingUp className="h-3.5 w-3.5" /> Commercial Revenue Unit
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue">
            Tablero <span className="text-brand-yellow italic font-light">Kanban</span>
          </h1>
          <p className="mt-4 text-base text-[var(--color-text)]/50 font-light max-w-2xl leading-relaxed">
            Gestión visual de flujos de alta conversión. Mueve la señal hacia la derecha para consolidar el revenue de KCE mediante el mando táctico.
          </p>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Sales Velocity Strategy"
        title="Arquitectura de Cierre"
        description="Presiona en los deals que ya tienen propuesta. El objetivo es reducir el tiempo entre el primer contacto y el link de pago activo."
        actions={[
          { href: '/admin/deals', label: 'Ver Lista Maestra' },
          { href: '/admin/revenue', label: 'Revenue Truth', tone: 'primary' }
        ]}
        signals={signals}
      />

      <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl relative overflow-hidden">
        
        {/* Barra de Filtros */}
        <div className="p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 mb-4 border-b border-[var(--color-border)] bg-white/50 backdrop-blur-sm rounded-t-[2.5rem]">
          <div className="relative w-full lg:w-1/2 group">
            <Target className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
            <input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Identificar deal, cliente o tour..." 
              className="w-full h-14 pl-14 rounded-2xl border border-[var(--color-border)] bg-white text-sm font-light outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all" 
            />
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={loading} className="rounded-full px-10 py-7 shadow-sm bg-white">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar Board
          </Button>
        </div>

        {/* Tablero Kanban */}
        <div className="flex gap-6 overflow-x-auto p-6 md:p-8 pb-12 snap-x custom-scrollbar min-h-[800px]">
          {STAGES.map((stage) => {
            const columnDeals = byStage[stage] ?? [];
            const isHot = ['checkout', 'proposal'].includes(stage);

            return (
              <div key={stage} className={`flex-shrink-0 w-[380px] snap-center rounded-[2.5rem] border p-5 flex flex-col transition-colors ${
                isHot ? 'bg-brand-blue/[0.03] border-brand-blue/10 shadow-inner' : 'bg-[var(--color-surface-2)] border-[var(--color-border)]'
              }`}>
                
                <header className="flex items-center justify-between mb-6 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${isHot ? 'bg-brand-blue animate-pulse' : 'bg-brand-blue/20'}`} />
                    <h3 className="font-heading text-xl capitalize text-brand-blue tracking-tight">{stage}</h3>
                  </div>
                  <div className="rounded-xl bg-white border border-[var(--color-border)] px-3 py-1.5 text-[10px] font-bold text-brand-blue/40 shadow-sm">
                    {columnDeals.length}
                  </div>
                </header>

                <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                  {columnDeals.map((d) => {
                    const isOpen = checkoutOpen[d.id] ?? false;
                    const draft = getDraftForDeal(d);
                    const hasLink = !!checkoutUrl[d.id];
                    const hasPB = !!playbookInfo[d.id];

                    return (
                      <div key={d.id} className="rounded-[2rem] border border-[var(--color-border)] bg-white p-6 shadow-sm transition-all hover:shadow-2xl hover:border-brand-blue/20 group">
                        
                        <header className="flex items-start justify-between gap-4 mb-4">
                          <Link href={`/admin/deals/${d.id}`} className="font-heading text-lg text-brand-blue group-hover:text-brand-yellow transition-colors leading-tight line-clamp-2">
                            {d.title || 'Manuscrito de Venta'}
                          </Link>
                          <span className="font-mono text-[9px] text-[var(--color-text)]/20 uppercase tracking-tighter shrink-0">#{d.id.slice(0,6)}</span>
                        </header>

                        <div className="space-y-2 mb-6 text-[10px] text-brand-blue/50 font-bold uppercase tracking-widest">
                           <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {d.tour_slug || 'Tour pendiente'}</div>
                        </div>

                        <div className="font-heading text-2xl text-emerald-600 mb-6">{fmtMoney(d.amount_minor, d.currency)}</div>

                        <div className="space-y-3 pt-5 border-t border-[var(--color-border)]">
                          <select 
                            className="w-full h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-blue/60 outline-none focus:border-brand-blue appearance-none cursor-pointer text-center" 
                            value={String(d.stage ?? stage)} 
                            onChange={(e) => void move(d.id, e.target.value)}
                          >
                            {STAGES.map((s) => <option key={s} value={s}>Mover a {s.toUpperCase()}</option>)}
                          </select>

                          <div className="flex gap-2">
                            <button onClick={() => setCheckoutOpen(s => ({ ...s, [d.id]: !isOpen }))} className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest transition-all ${isOpen ? 'bg-brand-blue text-white shadow-lg' : 'bg-brand-dark text-brand-yellow hover:scale-105'}`}>
                              <DollarSign className="h-3.5 w-3.5" /> {isOpen ? 'Cerrar' : 'Link Pago'}
                            </button>
                            <button onClick={() => void applyPlaybook(d.id, 'followup_24h')} className="flex-1 h-11 rounded-xl border border-brand-blue/20 bg-brand-blue/5 text-brand-blue flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest hover:bg-brand-blue/10">
                              <Sparkles className="h-3.5 w-3.5" /> Playbook
                            </button>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="mt-5 space-y-4 p-5 rounded-3xl bg-[var(--color-surface-2)] border border-[var(--color-border)] animate-in zoom-in-95 duration-300">
                             <AdminTourSelector value={draft.slug} onChange={(slug) => patchDraft(d.id, { slug }, draft)} />
                             <div className="grid grid-cols-2 gap-2">
                                <input type="date" value={draft.date} onChange={(e) => patchDraft(d.id, { date: e.target.value }, draft)} className="w-full h-11 rounded-xl border border-[var(--color-border)] bg-white px-3 text-xs outline-none" />
                                <div className="flex items-center bg-white border border-[var(--color-border)] rounded-xl overflow-hidden h-11">
                                   <input type="number" value={draft.guests} onChange={(e) => patchDraft(d.id, { guests: Number(e.target.value) }, draft)} className="w-full px-3 text-xs outline-none text-center font-bold" />
                                   <span className="pr-3 text-[9px] font-bold uppercase text-brand-blue/30">PAX</span>
                                </div>
                             </div>
                             <Button onClick={() => void createCheckoutLink(d)} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-6 text-[10px] font-bold uppercase tracking-widest text-white shadow-xl">
                               Generar & Copiar Link
                             </Button>
                          </div>
                        )}

                        {hasLink && (
                          <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                             <ClipboardCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                             <div className="overflow-hidden">
                                <p className="text-[9px] font-bold uppercase text-emerald-700 tracking-widest">Link Activo</p>
                                <p className="text-[10px] text-emerald-600/80 font-mono truncate mt-1">{checkoutUrl[d.id]}</p>
                             </div>
                          </div>
                        )}

                        {hasPB && playbookInfo[d.id] && (
                          <div className="mt-4 p-4 rounded-2xl bg-brand-blue/5 border border-brand-blue/10 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                             <CheckCircle2 className="h-4 w-4 text-brand-blue shrink-0 mt-0.5" />
                             <p className="text-[10px] text-brand-blue/70 font-medium leading-tight">
                                Protocolo <b>{playbookInfo[d.id]?.kind}</b> inyectado en el nodo.
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
      </div>

      <footer className="mt-12 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Zap className="h-3.5 w-3.5" /> Revenue Velocity Unit
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Activity className="h-3.5 w-3.5" /> Sales Intelligence Node
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> High-Conversion Flow
        </div>
      </footer>
    </div>
  );
}