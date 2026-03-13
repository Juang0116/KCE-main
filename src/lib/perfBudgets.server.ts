// src/lib/perfBudgets.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';

import { getSupabaseAdminAny } from '@/lib/supabaseAdminAny.server';
import { logOpsIncident } from '@/lib/opsIncidents.server';
import { getRequestId } from '@/lib/requestId';

type Metric = 'LCP' | 'INP' | 'CLS';

function num(v: string | undefined, def: number) {
  const n = Number(String(v ?? '').trim());
  return Number.isFinite(n) ? n : def;
}

export type PerfBudgetResult = {
  ok: boolean;
  windowDays: number;
  thresholds: { LCP: number; INP: number; CLS: number };
  p75: Partial<Record<Metric, number>>;
  breaches: Array<{ metric: Metric; p75: number; threshold: number }>;
};

export async function computePerfBudgets(windowDays = 7): Promise<PerfBudgetResult> {
  const thresholds = {
    LCP: num(process.env.PERF_BUDGET_LCP_MS, 2500),
    INP: num(process.env.PERF_BUDGET_INP_MS, 200),
    CLS: num(process.env.PERF_BUDGET_CLS, 0.1),
  };

  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const sb = getSupabaseAdminAny();
  if (!sb) {
    return { ok: false, windowDays, thresholds, p75: {}, breaches: [] };
  }

  // NOTE: usamos adminAny porque Database types no incluyen 'web_vitals' todavía.
  const { data, error } = await (sb as any)
    .from('web_vitals')
    .select('metric,value,created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) {
    // Si falla la query, marcamos ok=false para que el caller pueda levantar incidente si quiere.
    return { ok: false, windowDays, thresholds, p75: {}, breaches: [] };
  }

  const buckets: Record<string, number[]> = {};
  for (const row of (data || []) as any[]) {
    const m = String(row?.metric || '').toUpperCase();
    const v = row?.value;
    if (!m || typeof v !== 'number') continue;
    if (!buckets[m]) buckets[m] = [];
    buckets[m].push(v);
  }

  function p75(values: number[]) {
    if (!values.length) return null;
    const arr = values.slice().sort((a, b) => a - b);
    const idx = Math.floor(0.75 * (arr.length - 1));
    return arr[idx] ?? null;
  }

  const p75s: Partial<Record<Metric, number>> = {};
  (['LCP', 'INP', 'CLS'] as Metric[]).forEach((m) => {
    const v = p75(buckets[m] || []);
    if (typeof v === 'number') p75s[m] = v;
  });

  const breaches: PerfBudgetResult['breaches'] = [];
  (['LCP', 'INP', 'CLS'] as Metric[]).forEach((m) => {
    const v = p75s[m];
    if (typeof v !== 'number') return;
    const th = thresholds[m];
    if (v > th) breaches.push({ metric: m, p75: v, threshold: th });
  });

  return {
    ok: breaches.length === 0,
    windowDays,
    thresholds,
    p75: p75s,
    breaches,
  };
}

export async function checkPerfBudgets(req: NextRequest, windowDays = 7): Promise<PerfBudgetResult> {
  const result = await computePerfBudgets(windowDays);

  const createIncident = (process.env.PERF_BUDGET_CREATE_INCIDENT || '').trim();
  const shouldCreate = createIncident === '1' || (createIncident === '' && process.env.NODE_ENV === 'production');

  // Si falla el cálculo o hay breaches, en prod podemos levantar incidente.
  if (!result.ok && shouldCreate) {
    await logOpsIncident(req, {
      severity: 'warn',
      kind: 'performance_budget_breach',
      message: `Perf budget breach (or query failure) over ${windowDays}d`,
      fingerprint: `perf_budget_${windowDays}d`,
      meta: {
        requestId: getRequestId(req.headers),
        ...result,
      },
    });
  }

  return result;
}
