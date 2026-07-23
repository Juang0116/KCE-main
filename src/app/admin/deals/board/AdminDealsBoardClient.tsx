'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';

import { adminFetch } from '@/lib/adminFetch.client';
import { AdminTourSelector } from '@/components/admin/AdminTourSelector';
import { loadCheckoutPreset, saveCheckoutPreset } from '@/components/admin/checkoutPreset';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  Zap,
  Target,
  MapPin,
  Sparkles,
  TrendingUp,
  ChevronRight,
  ClipboardCheck,
  Terminal,
  ShieldCheck,
  Hash,
  User,
  Layout,
  CreditCard,
  Database, // <--- Agrégalo aquí
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
  customers?: {
    email: string | null;
    name: string | null;
    phone: string | null;
    country: string | null;
  } | null;
};

type CheckoutDraft = { slug: string; date: string; guests: number; email: string };
type PlaybookInfo = { kind: string; tasksCreated: number; templates?: unknown };

const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'checkout', 'won', 'lost'] as const;

// --- HELPERS ---
function fmtMoney(amountMinor: number | null, currency: string | null) {
  if (amountMinor === null || amountMinor === undefined) return '—';
  const cur = (currency || 'EUR').toUpperCase();
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(0)} ${cur}`;
  }
}

function getEmailForDeal(d: Deal) {
  return d.customers?.email || d.leads?.email || '';
}

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

  useEffect(() => {
    void load();
  }, [load]);

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
    if (!draft.slug || !draft.date) {
      alert('Criterios incompletos (Tour/Fecha).');
      return;
    }
    try {
      const res = await fetch('/api/bot/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          slug: draft.slug,
          date: draft.date,
          guests: draft.guests,
          email: draft.email || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || 'Error al generar link');

      setCheckoutUrl((s) => ({ ...s, [deal.id]: data.url }));
      saveCheckoutPreset({ lastSlug: draft.slug, lastDate: draft.date, lastGuests: draft.guests });

      try {
        await navigator.clipboard.writeText(data.url);
      } catch {}
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error de transmisión');
    }
  }

  // --- LÓGICA DE AUTOMATIZACIÓN ---
  async function applyPlaybook(
    dealId: string,
    kind: 'followup_24h' | 'proposal' | 'checkout_push',
  ) {
    try {
      const res = await adminFetch(`/api/admin/deals/${encodeURIComponent(dealId)}/playbook`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Playbook error');
      setPlaybookInfo((s) => ({
        ...s,
        [dealId]: { kind, tasksCreated: Number(data?.tasksCreated ?? 0) },
      }));
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
      if (map[st]) map[st].push(d);
      else map.other.push(d);
    }
    return map;
  }, [items]);

  const move = async (id: string, stage: string) => {
    const prev = [...items];
    setItems((cur) => cur.map((d) => (d.id === id ? { ...d, stage } : d)));
    try {
      const res = await adminFetch(`/api/admin/deals/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems(prev);
    }
  };

  const signals = useMemo(() => {
    const hot = (byStage['checkout']?.length || 0) + (byStage['proposal']?.length || 0);
    const totalValue = items.reduce((acc, curr) => acc + (curr.amount_minor || 0), 0);
    return [
      { label: 'Hot Pipeline', value: String(hot), note: 'Foco en cierre inmediato.' },
      { label: 'Deals Activos', value: String(items.length), note: 'En tablero táctico.' },
      {
        label: 'Value POTENTIAL',
        value: fmtMoney(totalValue, 'EUR'),
        note: 'Revenue total visible.',
      },
    ];
  }, [byStage, items]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-24 duration-1000">
      {/* 01. CABECERA INSTITUCIONAL */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <TrendingUp className="h-3.5 w-3.5" /> Commercial Revenue Unit
          </div>
          <h1 className="font-heading text-4xl tracking-tighter text-main md:text-5xl">
            Tablero <span className="font-light italic text-brand-blue">Kanban</span>
          </h1>
          <p className="max-w-2xl text-base font-light leading-relaxed text-muted">
            Gestión visual de flujos de alta conversión para Knowing Cultures S.A.S. Mueve la señal
            hacia la derecha para consolidar la liquidez del negocio.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => void load()}
            disabled={loading}
            className="h-12 rounded-full border-brand-dark/10 px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-surface-2"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`}
            />{' '}
            Sincronizar Board
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
          { href: '/admin/revenue', label: 'Análisis de Revenue', tone: 'primary' },
        ]}
        signals={signals}
      />

      {/* TABLERO KANBAN */}
      <section className="relative flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
        {/* Barra de Filtros Interna */}
        <div className="bg-surface-2/30 flex flex-col items-center justify-between gap-6 border-b border-brand-dark/5 p-8 dark:border-white/5 md:flex-row">
          <div className="group relative w-full lg:w-1/2">
            <Target className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-blue opacity-40 transition-opacity group-focus-within:opacity-100" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtro por deal, viajero o tour..."
              className="placeholder:text-muted/30 h-14 w-full rounded-2xl border border-brand-dark/10 bg-surface pl-14 text-sm font-light text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
            />
          </div>
          <div className="flex items-center gap-3 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-4 py-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-blue" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/70">
              Board Synced
            </span>
          </div>
        </div>

        {/* Grilla Kanban */}
        <div className="custom-scrollbar bg-surface-2/10 flex min-h-[850px] snap-x gap-8 overflow-x-auto p-8 pb-12">
          {STAGES.map((stage) => {
            const columnDeals = byStage[stage] ?? [];
            const isHot = ['checkout', 'proposal'].includes(stage);

            return (
              <div
                key={stage}
                className={`flex w-[400px] flex-shrink-0 snap-center flex-col rounded-[2.5rem] border p-6 transition-all duration-500 ${
                  isHot
                    ? 'border-brand-blue/20 bg-brand-blue/[0.03] shadow-inner ring-1 ring-brand-blue/5'
                    : 'border-brand-dark/5 bg-surface dark:border-white/5'
                }`}
              >
                <header className="mb-8 flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${isHot ? 'animate-pulse bg-brand-blue shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-muted opacity-30'}`}
                    />
                    <h3 className="font-heading text-2xl capitalize tracking-tight text-main">
                      {stage}
                    </h3>
                  </div>
                  <div className="flex h-7 items-center justify-center rounded-lg border border-brand-dark/10 bg-surface px-3 text-[10px] font-bold text-muted shadow-sm dark:border-white/10">
                    {columnDeals.length}
                  </div>
                </header>

                <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto pr-2">
                  {columnDeals.map((d) => {
                    const isOpen = checkoutOpen[d.id] ?? false;
                    const draft = getDraftForDeal(d);
                    const hasLink = !!checkoutUrl[d.id];
                    const hasPB = !!playbookInfo[d.id];

                    return (
                      <div
                        key={d.id}
                        className="animate-in fade-in group rounded-[2.2rem] border border-brand-dark/5 bg-surface p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-brand-blue/20 hover:shadow-pop dark:border-white/5"
                      >
                        <header className="mb-5 flex items-start justify-between gap-4">
                          <Link
                            href={`/admin/deals/${d.id}`}
                            className="line-clamp-2 font-heading text-xl leading-tight tracking-tight text-main transition-colors group-hover:text-brand-blue"
                          >
                            {d.title || 'Draft de Venta'}
                          </Link>
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-dark/5 text-muted shadow-inner transition-all group-hover:bg-brand-blue group-hover:text-white dark:bg-white/5">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </header>

                        <div className="mb-6 flex flex-col gap-3">
                          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">
                            <MapPin className="h-4 w-4 text-brand-blue opacity-50" />{' '}
                            {d.tour_slug || 'ASIGNAR TOUR'}
                          </div>
                          <div className="flex items-center gap-3 font-mono text-[10px] uppercase text-muted opacity-40">
                            <Hash className="h-3 w-3" /> {d.id.slice(0, 8)}
                          </div>
                        </div>

                        <div className="mb-8 flex items-end justify-between">
                          <div>
                            <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-muted opacity-40">
                              Valor Estimado
                            </p>
                            <div className="font-heading text-3xl tracking-tighter text-green-600 dark:text-green-400">
                              {fmtMoney(d.amount_minor, d.currency)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="flex items-center gap-1.5 rounded-lg border border-brand-dark/5 bg-surface-2 px-2 py-1 text-[10px] font-bold text-main">
                              <User className="h-3 w-3 opacity-40" />{' '}
                              {d.customers?.name?.split(' ')[0] ||
                                d.leads?.email?.split('@')[0] ||
                                'Voyager'}
                            </span>
                          </div>
                        </div>

                        {/* ACCIONES TÁCTICAS */}
                        <div className="space-y-3 border-t border-brand-dark/5 pt-6 dark:border-white/5">
                          <div className="relative">
                            <select
                              className="hover:bg-surface-2/80 h-11 w-full cursor-pointer appearance-none rounded-xl border border-brand-dark/10 bg-surface-2 px-5 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-muted outline-none transition-colors focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                              value={String(d.stage ?? stage)}
                              onChange={(e) => void move(d.id, e.target.value)}
                            >
                              {STAGES.map((s) => (
                                <option
                                  key={s}
                                  value={s}
                                >
                                  MOVER A {s.toUpperCase()}
                                </option>
                              ))}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2 rotate-90 opacity-30" />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setCheckoutOpen((s) => ({ ...s, [d.id]: !isOpen }))}
                              className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all ${isOpen ? 'bg-brand-blue text-white ring-4 ring-brand-blue/10' : 'bg-brand-dark text-brand-yellow hover:bg-brand-blue hover:text-white active:scale-95'}`}
                            >
                              <CreditCard className="h-4 w-4" />{' '}
                              {isOpen ? 'CANCELAR' : 'DESPLEGAR PAGO'}
                            </button>
                            <button
                              onClick={() => void applyPlaybook(d.id, 'followup_24h')}
                              className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-dark/10 bg-surface text-muted shadow-sm transition-all hover:border-brand-blue hover:bg-brand-blue hover:text-white active:scale-95"
                            >
                              <Sparkles className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* MÓDULO DE DESPLIEGUE DE CHECKOUT */}
                        {isOpen && (
                          <div className="animate-in zoom-in-95 mt-6 space-y-4 rounded-[2rem] border border-brand-dark/10 bg-surface-2 p-6 shadow-inner duration-300 dark:border-white/10">
                            <div className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                              <Terminal className="h-3 w-3" /> Transacción en Configuración
                            </div>
                            <AdminTourSelector
                              value={draft.slug}
                              onChange={(slug) => patchDraft(d.id, { slug }, draft)}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="date"
                                value={draft.date}
                                onChange={(e) => patchDraft(d.id, { date: e.target.value }, draft)}
                                className="h-11 w-full rounded-xl border border-brand-dark/10 bg-surface px-4 text-xs outline-none focus:ring-2 focus:ring-brand-blue/20"
                              />
                              <div className="flex h-11 items-center overflow-hidden rounded-xl border border-brand-dark/10 bg-surface">
                                <input
                                  type="number"
                                  value={draft.guests}
                                  onChange={(e) =>
                                    patchDraft(d.id, { guests: Number(e.target.value) }, draft)
                                  }
                                  className="w-full px-4 text-center text-xs font-bold text-main outline-none"
                                />
                                <span className="pr-4 text-[9px] font-bold uppercase text-muted opacity-30">
                                  PAX
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={() => void createCheckoutLink(d)}
                              className="h-12 w-full rounded-xl bg-green-600 text-[10px] font-bold uppercase tracking-widest text-white shadow-pop transition-all hover:bg-green-700 active:scale-95"
                            >
                              Generar Transacción
                            </Button>
                          </div>
                        )}

                        {/* FEEDBACK DE ACCIONES */}
                        {hasLink && (
                          <div className="animate-in slide-in-from-top-2 mt-5 flex items-start gap-4 rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                            <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
                                Link Generado & Copiado
                              </p>
                              <p className="mt-1.5 truncate rounded bg-green-500/5 p-1 font-mono text-[10px] text-green-600/70">
                                {checkoutUrl[d.id]}
                              </p>
                            </div>
                          </div>
                        )}

                        {hasPB && playbookInfo[d.id] && (
                          <div className="animate-in slide-in-from-top-2 mt-5 flex items-start gap-4 rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-5">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                            <p className="text-[10px] font-medium leading-relaxed text-brand-blue/80">
                              Protocolo <b>{playbookInfo[d.id]?.kind.toUpperCase()}</b> inyectado.{' '}
                              {playbookInfo[d.id]?.tasksCreated} tareas tácticas creadas.
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
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Zap className="h-4 w-4 text-brand-blue" /> Revenue Velocity Unit
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-yellow" /> Commercial Integrity
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Database className="h-4 w-4 text-brand-blue" /> Pipeline Core v5.2
        </div>
      </footer>
    </div>
  );
}
