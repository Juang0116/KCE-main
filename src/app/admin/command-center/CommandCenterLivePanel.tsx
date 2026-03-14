// src/app/admin/command-center/CommandCenterLivePanel.tsx
// Client component: fetches live ops data and displays upcoming bookings + sequence queue.
'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';

type Booking = { id: string; tour_title: string; customer_name: string; tour_date: string };
type Event = { type: string; source: string; created_at: string };
type Enrollment = { id: string; current_step: number; next_run_at: string };

type Summary = {
  kpis: { todayBookings: number; activeEnrollments: number; staleDeals: number; potentialRevenue: number };
  agents: { ops: { today: number; emails: number }; review: { today: number; emails: number } };
  upcomingBookings: Booking[];
  recentAgentEvents: Event[];
  activeSequences: Enrollment[];
};

function fmt(iso: string) {
  try { return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return iso; }
}

export default function CommandCenterLivePanel() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/api/admin/ops/summary')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setData(d); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)]" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Live KPI strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">Tours hoy</div>
          <div className="mt-1 text-3xl font-bold text-brand-blue">{data.kpis.todayBookings}</div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">Drip activo</div>
          <div className="mt-1 text-3xl font-bold text-emerald-600">{data.kpis.activeEnrollments}</div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">Deals en riesgo</div>
          <div className={`mt-1 text-3xl font-bold ${data.kpis.staleDeals > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {data.kpis.staleDeals}
          </div>
        </div>
      </div>

      {/* Agent activity today */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5">
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
          Agentes hoy
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[color:var(--color-surface-2)] p-3">
            <div className="text-[10px] text-[color:var(--color-text-muted)]">🔔 Ops (pre-tour)</div>
            <div className="mt-1 text-xl font-bold text-brand-blue">{data.agents.ops.emails} emails</div>
            <div className="text-[10px] text-[color:var(--color-text-muted)]">{data.agents.ops.today} runs completados</div>
          </div>
          <div className="rounded-xl bg-[color:var(--color-surface-2)] p-3">
            <div className="text-[10px] text-[color:var(--color-text-muted)]">⭐ Review (post-tour)</div>
            <div className="mt-1 text-xl font-bold text-emerald-600">{data.agents.review.emails} emails</div>
            <div className="text-[10px] text-[color:var(--color-text-muted)]">{data.agents.review.today} runs completados</div>
          </div>
        </div>
      </div>

      {/* Upcoming bookings */}
      {data.upcomingBookings.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
            Próximas experiencias confirmadas
          </div>
          <div className="space-y-2">
            {data.upcomingBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--color-text)]">{b.tour_title}</div>
                  <div className="text-xs text-[color:var(--color-text-muted)]">{b.customer_name}</div>
                </div>
                <div className="text-xs font-semibold text-brand-blue">{b.tour_date}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent agent events */}
      {data.recentAgentEvents.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-muted)]">
            Log de agentes (hoy)
          </div>
          <div className="space-y-1.5">
            {data.recentAgentEvents.slice(0, 8).map((e, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className={`font-medium ${e.source === 'ops_agent' ? 'text-brand-blue' : 'text-emerald-600'}`}>
                  {e.type.split('.').pop()}
                </span>
                <span className="text-[color:var(--color-text-muted)]">{fmt(e.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
