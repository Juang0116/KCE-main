'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { adminFetch } from '@/lib/adminFetch.client';
import { AdminTourSelector } from '@/components/admin/AdminTourSelector';
import { loadCheckoutPreset, saveCheckoutPreset, ymdPlusDays } from '@/components/admin/checkoutPreset';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { Activity, RefreshCw, CheckCircle2, DollarSign, Bot, ArrowRight, Zap, Target, MapPin } from 'lucide-react';

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

function fmtMoney(amountMinor: number | null, currency: string | null) {
  if (amountMinor === null || amountMinor === undefined) return '—';
  const cur = (currency || 'EUR').toUpperCase();
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(0)} ${cur}`;
  }
}

function getEmailForDeal(d: Deal) { return d.customers?.email || d.leads?.email || ''; }

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

export function AdminDealsBoardClient() {
  const [items, setItems] = useState<Deal[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [checkoutOpen, setCheckoutOpen] = useState<Record<string, boolean>>({});
  const [checkoutDraft, setCheckoutDraft] = useState<Record<string, CheckoutDraft>>({});
  const [checkoutUrl, setCheckoutUrl] = useState<Record<string, string>>({});
  const [playbookInfo, setPlaybookInfo] = useState<Record<string, PlaybookInfo>>({});

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
    setCheckoutDraft((s) => {
      const cur = s[dealId] ?? fallback;
      return { ...s, [dealId]: { ...cur, ...patch } };
    });
  }

  async function createCheckoutLink(deal: Deal) {
    const draft = getDraftForDeal(deal);
    if (!draft.slug || !draft.date) { alert('Completa tour slug y fecha (YYYY-MM-DD).'); return; }
    try {
      const res = await fetch('/api/bot/create-checkout', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dealId: deal.id, slug: draft.slug, date: draft.date, guests: draft.guests, email: draft.email || undefined }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || !data?.url) throw new Error(data?.error || 'No se pudo crear checkout');
      const url = String(data.url);
      setCheckoutUrl((s) => ({ ...s, [deal.id]: url }));
      saveCheckoutPreset({ lastSlug: draft.slug, lastDate: draft.date, lastGuests: draft.guests });
      try { await navigator.clipboard.writeText(url); } catch {}
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error creando checkout');
    }
  }

  async function applyPlaybook(dealId: string, kind: 'followup_24h' | 'proposal' | 'checkout_push') {
    try {
      const res = await adminFetch(`/api/admin/deals/${encodeURIComponent(dealId)}/playbook`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind }),
      });
      if (!res.ok) { const msg = await readErrorMessage(res); throw new Error(msg || `HTTP ${res.status}`); }
      const data = (await res.json().catch(() => ({} as any))) as any;
      setPlaybookInfo((s) => ({ ...s, [dealId]: { kind, tasksCreated: Number(data?.tasksCreated ?? 0), templates: data?.templates } }));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error aplicando playbook'); }
  }

  const load = () => {
    setLoading(true); setErr(null);
    const params = new URLSearchParams(); params.set('limit', '100'); if (q.trim()) params.set('q', q.trim());
    fetch(`/api/admin/deals?${params.toString()}`, { cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error((j as any)?.error || `HTTP ${r.status}`);
        return j as any;
      })
      .then((j) => setItems(Array.isArray(j?.items) ? (j.items as Deal[]) : []))
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const byStage = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    for (const s of STAGES) map[s] = [];
    map.other = [];
    for (const d of items) {
      const st = String(d.stage ?? 'other');
      const bucket = map[st];
      if (bucket) bucket.push(d); else map.other.push(d);
    }
    for (const k of Object.keys(map)) {
      const bucket = map[k];
      if (!bucket) continue;
      bucket.sort((a, b) => {
        const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return tb - ta;
      });
    }
    return map;
  }, [items]);

  const move = async (id: string, stage: string) => {
    const prev = items;
    setItems((cur) => cur.map((d) => (d.id === id ? { ...d, stage } : d)));
    try {
      const res = await adminFetch(`/api/admin/deals/${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ stage }),
      });
      if (!res.ok) { const msg = await readErrorMessage(res); throw new Error(msg || `HTTP ${res.status}`); }
    } catch (e: unknown) {
      setItems(prev); setErr(e instanceof Error ? e.message : 'No se pudo mover el deal');
    }
  };

  const signals = useMemo(() => {
    const hot = (byStage['checkout']?.length || 0) + (byStage['proposal']?.length || 0);
    const pipelineValue = items.reduce((acc, curr) => acc + (curr.amount_minor || 0), 0);
    return [
      { label: 'Hot Deals', value: String(hot), note: 'Oportunidades en Checkout o Proposal.' },
      { label: 'Deals Visibles', value: String(items.length), note: 'Tratos en la vista actual.' },
      { label: 'Pipeline Value', value: fmtMoney(pipelineValue, 'EUR'), note: 'Valor acumulado visible.' }
    ];
  }, [byStage, items]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Tablero Kanban</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Vista rápida de flujo comercial y generación de links de pago.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Visual Sales Flow"
        title="Control de Pipeline en Tiempo Real"
        description="Genera links de checkout rápidamente, aplica playbooks de seguimiento en 1 clic y mueve deals entre etapas. Mantén el foco en las columnas de la derecha (Proposal y Checkout)."
        actions={[
          { href: '/admin/sales', label: 'Volver a Cockpit', tone: 'primary' },
          { href: '/admin/deals', label: 'Vista Lista' }
        ]}
        signals={signals}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[var(--color-border)] pb-6">
          <div className="relative w-full sm:w-96">
            <Target className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text)]/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título, tour, email..." className="w-full h-12 pl-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 outline-none focus:border-brand-blue transition-colors text-sm" />
          </div>
          <button onClick={load} disabled={loading} className="shrink-0 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-md">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {err && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}

        {/* Board */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {STAGES.map((stage) => {
            const columnDeals = byStage[stage] ?? [];
            const isHot = stage === 'checkout' || stage === 'proposal';

            return (
              <div key={stage} className={`flex-shrink-0 w-[340px] snap-center rounded-3xl border p-4 flex flex-col h-[75vh] min-h-[600px] ${isHot ? 'bg-brand-blue/5 border-brand-blue/20' : 'bg-[var(--color-surface-2)] border-[var(--color-border)]'}`}>
                
                {/* Header de Columna */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${isHot ? 'bg-brand-blue shadow-[0_0_8px_rgba(var(--color-brand-blue-rgb),0.5)]' : 'bg-[var(--color-text)]/20'}`}></div>
                    <div className={`font-heading text-lg capitalize tracking-wide ${isHot ? 'text-brand-blue' : 'text-[var(--color-text)]'}`}>{stage}</div>
                  </div>
                  <div className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[10px] font-bold border border-[var(--color-border)] shadow-sm">
                    {columnDeals.length}
                  </div>
                </div>

                {/* Lista de Deals */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                  {columnDeals.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[var(--color-text)]/40 font-medium italic border border-dashed border-[var(--color-border)] rounded-2xl">
                      Vacío
                    </div>
                  ) : null}

                  {columnDeals.map((d) => {
                    const open = checkoutOpen[d.id] ?? false;
                    const draft = getDraftForDeal(d);
                    const cu = checkoutUrl[d.id];
                    const pb = playbookInfo[d.id];

                    return (
                      <div key={d.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm transition hover:shadow-md hover:border-brand-blue/30 group">
                        
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Link href={`/admin/deals/${d.id}`} className="font-semibold text-[var(--color-text)] line-clamp-2 leading-tight group-hover:text-brand-blue transition-colors">
                            {d.title || 'Deal Sin Nombre'}
                          </Link>
                          <div className="font-mono text-[10px] text-[var(--color-text)]/30 shrink-0">#{d.id.slice(0, 6)}</div>
                        </div>

                        <div className="text-xs text-[var(--color-text)]/60 mb-3 space-y-1">
                          <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3"/> {d.tour_slug || 'Tour N/A'}</div>
                          <div className="font-mono text-[10px]">Mod: {d.updated_at ? new Date(d.updated_at).toLocaleDateString('es-ES') : '—'}</div>
                        </div>

                        <div className="font-heading text-lg text-emerald-600 mb-4">{fmtMoney(d.amount_minor, d.currency)}</div>

                        <div className="flex flex-col gap-2 pt-3 border-t border-[var(--color-border)]">
                          {/* Cambiar de Columna */}
                          <select className="w-full h-9 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-blue appearance-none cursor-pointer" value={String(d.stage ?? stage)} onChange={(e) => move(d.id, e.target.value)}>
                            {STAGES.map((s) => <option key={s} value={s}>→ Mover a {s}</option>)}
                          </select>

                          {/* Botones de Acción */}
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setCheckoutOpen((s) => ({ ...s, [d.id]: !(s[d.id] ?? false) }))} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-brand-dark px-2 text-[10px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-sm">
                              <DollarSign className="h-3 w-3"/> Pay Link
                            </button>
                            <button type="button" onClick={() => applyPlaybook(d.id, 'followup_24h')} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-brand-blue/20 bg-brand-blue/5 px-2 text-[10px] font-bold uppercase tracking-widest text-brand-blue transition hover:bg-brand-blue/10">
                              <Zap className="h-3 w-3"/> Playbook
                            </button>
                          </div>
                        </div>

                        {/* Generador de Checkout (Desplegable) */}
                        {open && (
                          <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 animate-fade-in">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">Generar Link de Pago</div>
                            
                            <div className="space-y-3">
                              <AdminTourSelector value={draft.slug} onChange={(slug) => patchDraft(d.id, { slug }, draft)} />
                              
                              <div>
                                <input type="date" value={draft.date} onChange={(e) => patchDraft(d.id, { date: e.target.value }, draft)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs outline-none focus:border-brand-blue mb-2" />
                                <div className="flex gap-1.5">
                                  {[0, 7, 14].map((dd) => (
                                    <button key={dd} type="button" onClick={() => patchDraft(d.id, { date: ymdPlusDays(dd) }, draft)} className="flex-1 h-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-bold transition hover:bg-[var(--color-surface-2)]">
                                      {dd === 0 ? 'Hoy' : `+${dd}d`}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-2 items-center">
                                <input type="number" min={1} max={20} value={String(draft.guests)} onChange={(e) => patchDraft(d.id, { guests: Number(e.target.value || 1) }, draft)} className="w-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs outline-none focus:border-brand-blue text-center" />
                                <div className="flex flex-1 gap-1.5">
                                  {[1, 2, 4, 6].map((n) => (
                                    <button key={n} type="button" onClick={() => patchDraft(d.id, { guests: n }, draft)} className="flex-1 h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-bold transition hover:bg-[var(--color-surface-2)]">
                                      {n}p
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <input value={draft.email} onChange={(e) => patchDraft(d.id, { email: e.target.value }, draft)} placeholder="Email del cliente (Opcional)" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs outline-none focus:border-brand-blue" />
                              
                              <button type="button" onClick={() => createCheckoutLink(d)} className="w-full h-9 rounded-xl bg-emerald-600 px-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-2 mt-2">
                                <DollarSign className="h-3 w-3"/> Generar Link
                              </button>
                            </div>
                          </div>
                        )}

                        {cu && (
                          <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 break-all font-mono animate-fade-in shadow-inner">
                            <span className="font-bold uppercase tracking-widest text-[9px] block mb-1">Copiado al portapapeles:</span>
                            {cu}
                          </div>
                        )}

                        {pb && (
                          <div className="mt-3 rounded-xl border border-brand-blue/30 bg-brand-blue/10 p-3 text-xs text-brand-blue animate-fade-in">
                            <div className="font-bold uppercase tracking-widest text-[9px] mb-1">Playbook Auto-Ejecutado:</div>
                            <b>{pb.kind}</b> — {pb.tasksCreated} tareas creadas.
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
    </div>
  );
}