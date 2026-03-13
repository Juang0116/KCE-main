/* src/app/admin/deals/board/AdminDealsBoardClient.tsx */
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { adminFetch } from '@/lib/adminFetch.client';
import { AdminTourSelector } from '@/components/admin/AdminTourSelector';
import { loadCheckoutPreset, saveCheckoutPreset, ymdPlusDays } from '@/components/admin/checkoutPreset';

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

type CheckoutDraft = {
  slug: string;
  date: string;
  guests: number;
  email: string;
};

type PlaybookInfo = {
  kind: string;
  tasksCreated: number;
  templates?: unknown;
};

const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'checkout', 'won', 'lost'] as const;

function fmtMoney(amountMinor: number | null, currency: string | null) {
  if (amountMinor === null || amountMinor === undefined) return '—';
  const cur = (currency || 'EUR').toUpperCase();
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: cur }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(2)} ${cur}`;
  }
}

function getEmailForDeal(d: Deal) {
  return d.customers?.email || d.leads?.email || '';
}

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

    if (!draft.slug || !draft.date) {
      alert('Completa tour slug y fecha (YYYY-MM-DD).');
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

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || !data?.url) throw new Error(data?.error || 'No se pudo crear checkout');

      const url = String(data.url);

      setCheckoutUrl((s) => ({ ...s, [deal.id]: url }));
      saveCheckoutPreset({ lastSlug: draft.slug, lastDate: draft.date, lastGuests: draft.guests });

      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // ignore
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error creando checkout');
    }
  }

  async function applyPlaybook(dealId: string, kind: 'followup_24h' | 'proposal' | 'checkout_push') {
    try {
      const res = await adminFetch(`/api/admin/deals/${encodeURIComponent(dealId)}/playbook`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind }),
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const data = (await res.json().catch(() => ({} as any))) as any;

      setPlaybookInfo((s) => ({
        ...s,
        [dealId]: { kind, tasksCreated: Number(data?.tasksCreated ?? 0), templates: data?.templates },
      }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error aplicando playbook');
    }
  }

  const load = () => {
    setLoading(true);
    setErr(null);

    const params = new URLSearchParams();
    params.set('limit', '100');
    if (q.trim()) params.set('q', q.trim());

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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byStage = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    for (const s of STAGES) map[s] = [];
    map.other = [];

    for (const d of items) {
      const st = String(d.stage ?? 'other');
      const bucket = map[st];
      if (bucket) bucket.push(d);
      else map.other.push(d);
    }

    // ✅ FIX TS2532: map[k] can be undefined under noUncheckedIndexedAccess
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
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stage }),
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new Error(msg || `HTTP ${res.status}`);
      }
    } catch (e: unknown) {
      setItems(prev);
      setErr(e instanceof Error ? e.message : 'No se pudo mover el deal');
    }
  };

  return (
    <section className="space-y-4">
      {err ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
          {err}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, tour, email..."
            className="w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] p-2 text-sm"
          />
          <button
            onClick={load}
            className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm hover:bg-black/10"
            type="button"
            disabled={loading}
          >
            {loading ? 'Cargando…' : 'Buscar'}
          </button>
        </div>

        <div className="text-sm">
          <Link href="/admin/deals" className="text-brand-blue underline underline-offset-2">
            Vista lista
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {STAGES.map((stage) => (
          <div key={stage} className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)]">
            <div className="flex items-center justify-between border-b border-black/10 bg-black/5 px-4 py-3">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{stage}</div>
              <div className="text-xs text-[color:var(--color-text)]/60">{(byStage[stage] ?? []).length}</div>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-auto p-3">
              {(byStage[stage] ?? []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-black/10 bg-black/5 p-3 text-xs text-[color:var(--color-text)]/60">
                  Vacío
                </div>
              ) : null}

              {(byStage[stage] ?? []).map((d) => {
                const open = checkoutOpen[d.id] ?? false;
                const draft = getDraftForDeal(d);
                const cu = checkoutUrl[d.id];
                const pb = playbookInfo[d.id];

                return (
                  <div key={d.id} className="rounded-2xl border border-black/10 bg-black/5 p-3">
                    <div className="text-sm font-medium text-[color:var(--color-text)]">{d.title || 'Deal'}</div>

                    <div className="mt-1 text-xs text-[color:var(--color-text)]/60">
                      {d.tour_slug ? `tour: ${d.tour_slug}` : 'tour: —'} •{' '}
                      {d.updated_at ? new Date(d.updated_at).toLocaleString() : '—'}
                    </div>

                    <div className="mt-2 text-sm text-[color:var(--color-text)]">{fmtMoney(d.amount_minor, d.currency)}</div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={String(d.stage ?? stage)}
                          onChange={(e) => move(d.id, e.target.value)}
                          className="h-9 rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-2 text-sm"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCheckoutOpen((s) => ({ ...s, [d.id]: !(s[d.id] ?? false) }))}
                            className="h-9 rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-2 text-xs"
                          >
                            Checkout
                          </button>

                          <button
                            type="button"
                            onClick={() => applyPlaybook(d.id, 'followup_24h')}
                            className="h-9 rounded-xl border border-black/10 bg-[color:var(--color-surface)] px-2 text-xs"
                            title="Crea tareas 24h/48h + plantillas"
                          >
                            Playbook
                          </button>

                          <Link
                            href={`/admin/tasks?deal_id=${encodeURIComponent(d.id)}`}
                            className="text-brand-blue underline underline-offset-2 text-sm"
                          >
                            Tareas
                          </Link>
                        </div>
                      </div>

                      {open ? (
                        <div className="grid grid-cols-1 gap-2 rounded-xl border border-black/10 bg-[color:var(--color-surface)] p-2">
                          <AdminTourSelector value={draft.slug} onChange={(slug) => patchDraft(d.id, { slug }, draft)} />

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <div className="sm:col-span-1">
                              <input
                                value={draft.date}
                                onChange={(e) => patchDraft(d.id, { date: e.target.value }, draft)}
                                placeholder="fecha YYYY-MM-DD"
                                className="w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] p-2 text-xs"
                              />
                              <div className="mt-2 flex flex-wrap gap-2">
                                {[0, 7, 14].map((dd) => (
                                  <button
                                    key={dd}
                                    type="button"
                                    onClick={() => patchDraft(d.id, { date: ymdPlusDays(dd) }, draft)}
                                    className="h-8 rounded-xl border border-black/10 bg-black/5 px-3 text-xs hover:bg-black/10"
                                  >
                                    {dd === 0 ? 'Hoy' : `+${dd}d`}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="sm:col-span-1">
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={String(draft.guests)}
                                onChange={(e) => patchDraft(d.id, { guests: Number(e.target.value || 1) }, draft)}
                                placeholder="personas"
                                className="w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] p-2 text-xs"
                              />
                              <div className="mt-2 flex flex-wrap gap-2">
                                {[1, 2, 4, 6].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => patchDraft(d.id, { guests: n }, draft)}
                                    className="h-8 rounded-xl border border-black/10 bg-black/5 px-3 text-xs hover:bg-black/10"
                                  >
                                    {n}p
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="sm:col-span-1 flex items-start">
                              <button
                                type="button"
                                onClick={() => createCheckoutLink(d)}
                                className="h-9 w-full rounded-xl bg-black px-3 text-xs text-white"
                              >
                                Crear checkout (copia)
                              </button>
                            </div>
                          </div>

                          <input
                            value={draft.email}
                            onChange={(e) => patchDraft(d.id, { email: e.target.value }, draft)}
                            placeholder="email (opcional)"
                            className="w-full rounded-xl border border-black/10 bg-[color:var(--color-surface)] p-2 text-xs"
                          />
                        </div>
                      ) : null}

                      {cu ? (
                        <div className="rounded-xl border border-black/10 bg-black/5 p-2 text-xs text-[color:var(--color-text)]/80">
                          Link copiado: <span className="break-all">{cu}</span>
                        </div>
                      ) : null}

                      {pb ? (
                        <div className="rounded-xl border border-black/10 bg-black/5 p-2 text-xs text-[color:var(--color-text)]/80">
                          Playbook <b>{pb.kind}</b> aplicado — tareas: {pb.tasksCreated}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-[color:var(--color-text)]/60">
        Nota: si tu DB tiene un CHECK de stages diferente, ajusta STAGES en este archivo o aplica el patch SQL.
      </div>
    </section>
  );
}
