'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

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
  customers?: {
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    country?: string | null;
  } | null;
};

function money(minor: number | null, currency: string) {
  if (typeof minor !== 'number') return '—';
  const v = minor / 100;
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(v);
  } catch {
    return `${v.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

const STAGES: DealStage[] = ['new', 'qualified', 'proposal', 'checkout', 'won', 'lost'];

export function AdminDealsClient() {
  const [items, setItems] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (stage) params.set('stage', stage);
    if (q.trim()) params.set('q', q.trim());
    const qs = params.toString();
    return `/api/admin/deals/export${qs ? `?${qs}` : ''}`;
  }, [stage, q]);

  const visibleValueMinor = useMemo(
    () => items.reduce((sum, d) => sum + (typeof d.amount_minor === 'number' ? d.amount_minor : 0), 0),
    [items],
  );
  const weightedValueMinor = useMemo(
    () =>
      items.reduce(
        (sum, d) => sum + (typeof d.amount_minor === 'number' ? Math.round((d.amount_minor * d.probability) / 100) : 0),
        0,
      ),
    [items],
  );
  const checkoutCount = useMemo(() => items.filter((d) => d.stage === 'checkout').length, [items]);
  const hotDealCount = useMemo(
    () => items.filter((d) => ['qualified', 'proposal', 'checkout'].includes(d.stage)).length,
    [items],
  );
  const dealSignals = useMemo(
    () => [
      {
        label: 'Visible value',
        value: money(visibleValueMinor, items[0]?.currency || 'eur'),
        note: 'Simple sum of the visible deals inside the current view.',
      },
      {
        label: 'Weighted pipeline',
        value: money(weightedValueMinor, items[0]?.currency || 'eur'),
        note: 'Pipeline value adjusted by probability across the visible deals.',
      },
      {
        label: 'Checkout now',
        value: String(checkoutCount),
        note: 'Deals already in checkout and needing close pressure or confirmation.',
      },
      {
        label: 'Hot lanes',
        value: String(hotDealCount),
        note: 'Qualified, proposal and checkout deals visible in this filtered view.',
      },
    ],
    [checkoutCount, hotDealCount, items, visibleValueMinor, weightedValueMinor],
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (stage) params.set('stage', stage);
      if (q.trim()) params.set('q', q.trim());
      params.set('limit', '50');

      const res = await adminFetch(`/api/admin/deals?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to load deals');
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStage(id: string, nextStage: DealStage) {
    const prev = items;
    setItems((cur) => cur.map((d) => (d.id === id ? { ...d, stage: nextStage } : d)));
    try {
      const res = await adminFetch(`/api/admin/deals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to update deal');
    } catch (e: any) {
      setItems(prev);
      alert(e?.message || 'Error updating deal');
    }
  }

  return (
    <section className="space-y-4">
      <AdminOperatorWorkbench
        eyebrow="deals workbench"
        title="Push the opportunities closest to payment before grooming the rest"
        description="Use this pipeline as a close desk: apply pressure to qualified, proposal and checkout lanes first, rescue only the believable opportunities and keep the next move obvious."
        actions={[
          { href: '/admin/deals/board', label: 'Kanban board', tone: 'primary' },
          { href: '/admin/revenue', label: 'Revenue' },
          { href: '/admin/outbound', label: 'Outbound' },
          { href: '/admin/templates', label: 'Templates' },
        ]}
        signals={dealSignals}
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--color-text)]/70">Stage</span>
            <select
              className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-[color:var(--color-text)]"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            >
              <option value="">All</option>
              {STAGES.map((s) => (
                <option
                  key={s}
                  value={s}
                >
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--color-text)]/70">Search</span>
            <input
              className="placeholder:text-[color:var(--color-text)]/40 h-10 w-full min-w-[240px] rounded-xl border border-white/10 bg-black/20 px-3 text-[color:var(--color-text)]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="title / slug"
            />
          </label>

          <Button
            onClick={load}
            disabled={loading}
            variant="secondary"
          >
            {loading ? 'Loading…' : 'Apply'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <a
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-[color:var(--color-text)] hover:bg-black/30"
            href={exportUrl}
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStage('')}
          className="rounded-full border border-white/10 px-3 py-1 text-xs text-[color:var(--color-text)]/80 hover:bg-black/20"
        >
          Todos
        </button>
        {(['new', 'qualified', 'proposal', 'checkout'] as DealStage[]).map((quick) => (
          <button
            key={quick}
            type="button"
            onClick={() => setStage(quick)}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-[color:var(--color-text)]/80 hover:bg-black/20"
          >
            {quick}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-[color:var(--color-text)]/70 text-left">
              <th className="px-3 py-2">Deal</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Value</th>
              <th className="px-3 py-2">Prob.</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  className="text-[color:var(--color-text)]/60 px-3 py-6"
                  colSpan={7}
                >
                  No deals found.
                </td>
              </tr>
            ) : null}

            {items.map((d) => (
              <tr
                key={d.id}
                className="rounded-2xl bg-black/20"
              >
                <td className="p-3 align-top">
                  <Link href={`/admin/deals/${d.id}`} className="font-medium text-[color:var(--color-text)] underline">
                    {d.title}
                  </Link>
                  <div className="text-[color:var(--color-text)]/60 mt-1">
                    {d.tour_slug ? <span className="font-mono">{d.tour_slug}</span> : '—'}
                  </div>
                  <div className="text-[color:var(--color-text)]/50 mt-1 font-mono">
                    {d.id.slice(0, 8)}
                  </div>
                </td>

                <td className="p-3 align-top">
                  <div className="text-[color:var(--color-text)]">
                    {d.customers?.name || d.customers?.email || d.leads?.email || '—'}
                  </div>
                  <div className="text-[color:var(--color-text)]/60 mt-1">
                    {d.customers?.phone || d.leads?.whatsapp || ''}
                  </div>
                </td>

                <td className="p-3 align-top">
                  <select
                    className="h-9 rounded-xl border border-white/10 bg-black/20 px-2 text-[color:var(--color-text)]"
                    value={d.stage}
                    onChange={(e) => updateStage(d.id, e.target.value as DealStage)}
                  >
                    {STAGES.map((s) => (
                      <option
                        key={s}
                        value={s}
                      >
                        {s}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="p-3 align-top text-[color:var(--color-text)]">
                  {money(d.amount_minor, d.currency)}
                </td>

                <td className="p-3 align-top text-[color:var(--color-text)]">{d.probability}%</td>

                <td className="text-[color:var(--color-text)]/80 p-3 align-top">
                  {new Date(d.updated_at).toLocaleString('es-CO')}
                </td>

                <td className="text-[color:var(--color-text)]/70 p-3 align-top">
                  {d.source || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[color:var(--color-text)]/50 mt-4 text-xs">
        Tip: Para automatizar el flujo, el chatbot crea deals cuando detecta intención real de
        reserva (proposal/checkout).
      </p>
      </div>
    </section>
  );
}
