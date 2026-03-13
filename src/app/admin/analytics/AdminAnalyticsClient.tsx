'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import { Button } from '@/components/ui/Button';

type Row = {
  k: string;
  spend_minor: number;
  revenue_minor: number;
  paid: number;
  cac_minor: number | null;
  roas: number | null;
};

type Summary = {
  spend_minor: number;
  revenue_minor: number;
  paid: number;
  roas: number | null;
};

type Payload = {
  rows: Row[];
  summary: Summary | null;
};

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function fmtMinor(n: number) {
  return n.toLocaleString();
}

function fmtNum(n: number | null | undefined) {
  if (n === null || n === undefined) return '-';
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString();
}

function fmtRoas(n: number | null | undefined) {
  if (n === null || n === undefined) return '-';
  if (!Number.isFinite(n)) return '-';
  return n.toFixed(2);
}

function isPayload(x: unknown): x is Payload {
  if (!x || typeof x !== 'object') return false;
  const o = x as { rows?: unknown; summary?: unknown };
  return Array.isArray(o.rows) && ('summary' in o);
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

export function AdminAnalyticsClient() {
  const [days, setDays] = useState<number>(30);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Avoid race conditions (days changes quickly)
  const reqIdRef = useRef(0);

  const daysInputValue = useMemo(() => String(days), [days]);

  async function refresh() {
    setErr(null);
    setLoading(true);

    const myReqId = ++reqIdRef.current;

    try {
      // adminFetch returns Response in this codebase
      const res = await adminFetch(`/api/admin/analytics/executive?days=${days}`);

      if (myReqId !== reqIdRef.current) return;

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const data: unknown = await res.json();

      if (!isPayload(data)) {
        throw new Error('Respuesta inesperada del servidor (payload inválido).');
      }

      setRows(data.rows ?? []);
      setSummary(data.summary ?? null);
    } catch (e: unknown) {
      if (myReqId !== reqIdRef.current) return;
      const msg = e instanceof Error ? e.message : 'Error';
      setErr(msg);
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  return (
    <div className="rounded-2xl border border-black/10 p-3 dark:border-white/10">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={refresh} disabled={loading}>
          {loading ? 'Cargando…' : 'Recargar'}
        </Button>

        <label className="text-sm opacity-80">
          Ventana (días):{' '}
          <input
            type="number"
            min={1}
            max={365}
            className="ml-1 w-24 rounded-lg border border-black/10 bg-transparent px-2 py-1 dark:border-white/10"
            value={daysInputValue}
            onChange={(e) => {
              const n = Number(e.target.value);
              setDays(clampInt(n || 30, 1, 365));
            }}
          />
        </label>

        {err ? <span className="text-sm text-red-600 dark:text-red-400">{err}</span> : null}
      </div>

      {summary ? (
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <div className="rounded-xl border border-black/10 p-2 dark:border-white/10">
            <div className="text-xs opacity-70">Spend</div>
            <div className="font-semibold">{fmtMinor(summary.spend_minor)}</div>
          </div>

          <div className="rounded-xl border border-black/10 p-2 dark:border-white/10">
            <div className="text-xs opacity-70">Revenue</div>
            <div className="font-semibold">{fmtMinor(summary.revenue_minor)}</div>
          </div>

          <div className="rounded-xl border border-black/10 p-2 dark:border-white/10">
            <div className="text-xs opacity-70">Paid</div>
            <div className="font-semibold">{fmtNum(summary.paid)}</div>
          </div>

          <div className="rounded-xl border border-black/10 p-2 dark:border-white/10">
            <div className="text-xs opacity-70">ROAS</div>
            <div className="font-semibold">{fmtRoas(summary.roas)}</div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs opacity-70">
            <tr>
              <th className="py-2 text-left">Canal</th>
              <th className="py-2 text-left">Spend</th>
              <th className="py-2 text-left">Revenue</th>
              <th className="py-2 text-left">Paid</th>
              <th className="py-2 text-left">CAC</th>
              <th className="py-2 text-left">ROAS</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.k} className="border-t border-black/10 dark:border-white/10">
                <td className="py-2">{r.k}</td>
                <td className="py-2">{fmtMinor(r.spend_minor)}</td>
                <td className="py-2">{fmtMinor(r.revenue_minor)}</td>
                <td className="py-2">{fmtNum(r.paid)}</td>
                <td className="py-2">{r.cac_minor === null ? '-' : fmtMinor(r.cac_minor)}</td>
                <td className="py-2">{fmtRoas(r.roas)}</td>
              </tr>
            ))}

            {rows.length === 0 ? (
              <tr>
                <td className="py-3 opacity-70" colSpan={6}>
                  {loading
                    ? 'Cargando datos…'
                    : 'Sin data. Carga spend y asegúrate que entren eventos checkout.paid.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs opacity-70">
        Nota: para multi-moneda, usa FX daily (P78) y normaliza spend/revenue en la misma moneda.
      </div>
    </div>
  );
}
