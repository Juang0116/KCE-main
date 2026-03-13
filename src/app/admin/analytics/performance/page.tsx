import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { computePerfBudgets } from '@/lib/perfBudgets.server';

export const dynamic = 'force-dynamic';

export default async function AdminPerformancePage() {
  const sb = getSupabaseAdmin();
  // NOTE: si el tipo Database (src/types/supabase.ts) aún no incluye la tabla `web_vitals`,
  // el client tipado infiere `never` y rompe el build. En admin usamos service-role,
  // así que este cast es seguro mientras regeneras/alineas tipos.
  const sbAny = sb as any;
  const budget = await computePerfBudgets(7);

  const { data: rows } = await sbAny
    .from('web_vitals')
    .select('metric,value,page,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const badge = (ok: boolean) =>
    ok ? (
      <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-600">OK</span>
    ) : (
      <span className="rounded-full bg-rose-500/15 px-2 py-1 text-xs text-rose-600">Breach</span>
    );

  const val = (m: 'LCP' | 'INP' | 'CLS') => {
    const v = (budget.p75 as any)[m];
    return typeof v === 'number' ? v : null;
  };

  const isOk = (m: 'LCP' | 'INP' | 'CLS') => {
    const v = val(m);
    if (v == null) return true;
    return v <= (budget.thresholds as any)[m];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Performance</h1>
        <p className="text-sm text-muted-foreground">Web Vitals capturados desde /api/track/perf</p>
      </div>

      <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-6 shadow-sm dark:bg-[#0b1220]">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Budgets (p75 últimos {budget.windowDays} días)</div>
          {badge(budget.ok)}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
          {(['LCP', 'INP', 'CLS'] as const).map((m) => (
            <div key={m} className="rounded-xl border border-[color:var(--color-border)] p-3">
              <div className="flex items-center justify-between">
                <div className="text-[color:var(--color-text)]/70">{m}</div>
                {badge(isOk(m))}
              </div>
              <div className="mt-2 font-mono">
                p75={val(m) == null ? '—' : String(val(m))} / th={(budget.thresholds as any)[m]}
              </div>
            </div>
          ))}
        </div>

        {!budget.ok ? (
          <div className="mt-4 text-sm text-[color:var(--color-text)]/80">
            Breaches: {budget.breaches.map((b) => `${b.metric}(${b.p75} > ${b.threshold})`).join(', ')}
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5">
            <tr className="text-left text-[color:var(--color-text)]/70">
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Página</th>
              <th className="px-4 py-2">Métrica</th>
              <th className="px-4 py-2">Valor</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((r: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-4 py-2">{r.page || '-'}</td>
                <td className="px-4 py-2">{r.metric}</td>
                <td className="px-4 py-2 font-mono">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
