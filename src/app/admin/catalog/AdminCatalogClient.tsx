'use client';

import { useEffect, useRef, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import { Button } from '@/components/ui/Button';

type Rule = {
  id: string;
  scope: 'tour' | 'tag' | 'city' | 'global';
  tour_id: string | null;
  tag: string | null;
  city: string | null;
  start_date: string | null;
  end_date: string | null;
  currency: string;
  kind: 'delta' | 'override';
  delta_minor: number;
  override_price_minor: number | null;
  priority: number;
  status: 'active' | 'paused' | 'archived';
};

type Payload = { items: Rule[] };

function isPayload(x: unknown): x is Payload {
  if (!x || typeof x !== 'object') return false;
  const o = x as { items?: unknown };
  return Array.isArray(o.items);
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

function isScope(x: string): x is Rule['scope'] {
  return x === 'global' || x === 'city' || x === 'tag' || x === 'tour';
}

export function AdminCatalogClient() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Avoid double refresh races
  const reqIdRef = useRef(0);

  async function refresh() {
    setErr(null);
    setLoading(true);

    const myReqId = ++reqIdRef.current;

    try {
      const res = await adminFetch('/api/admin/catalog/pricing-rules');

      if (myReqId !== reqIdRef.current) return;

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const data: unknown = await res.json();
      if (!isPayload(data)) throw new Error('Respuesta inesperada del servidor (payload inválido).');

      setRules(data.items ?? []);
    } catch (e: unknown) {
      if (myReqId !== reqIdRef.current) return;
      const msg = e instanceof Error ? e.message : 'Error';
      setErr(msg);
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }

  async function createRule() {
    setErr(null);

    const rawScope = (prompt('scope (global|city|tag|tour)', 'global') || '').trim();
    if (!rawScope) return;
    if (!isScope(rawScope)) {
      setErr('Scope inválido. Usa: global | city | tag | tour');
      return;
    }

    const delta = Number(prompt('delta_minor (ej: 5000 o -5000)', '0') || '0');

    try {
      const res = await adminFetch('/api/admin/catalog/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: rawScope,
          delta_minor: Number.isFinite(delta) ? delta : 0,
          currency: 'EUR',
          kind: 'delta',
          priority: 100,
          status: 'active',
        }),
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new Error(msg || `HTTP ${res.status}`);
      }

      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error';
      setErr(msg);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border border-black/10 p-3 dark:border-white/10">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={refresh} size="sm" disabled={loading}>
          {loading ? 'Cargando…' : 'Recargar'}
        </Button>

        <Button size="sm" variant="secondary" onClick={createRule} disabled={loading}>
          Nueva regla
        </Button>

        {err ? <span className="text-sm text-red-600 dark:text-red-400">{err}</span> : null}
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs opacity-70">
            <tr>
              <th className="py-2 text-left">scope</th>
              <th className="py-2 text-left">target</th>
              <th className="py-2 text-left">kind</th>
              <th className="py-2 text-left">delta</th>
              <th className="py-2 text-left">override</th>
              <th className="py-2 text-left">priority</th>
              <th className="py-2 text-left">status</th>
            </tr>
          </thead>

          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-t border-black/10 dark:border-white/10">
                <td className="py-2">{r.scope}</td>
                <td className="py-2">{r.city || r.tag || r.tour_id || '-'}</td>
                <td className="py-2">{r.kind}</td>
                <td className="py-2">{r.delta_minor}</td>
                <td className="py-2">{r.override_price_minor ?? '-'}</td>
                <td className="py-2">{r.priority}</td>
                <td className="py-2">{r.status}</td>
              </tr>
            ))}

            {rules.length === 0 ? (
              <tr>
                <td className="py-3 opacity-70" colSpan={7}>
                  {loading ? 'Cargando…' : 'No hay reglas (ejecuta el SQL P77).'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs opacity-70">
        Para disponibilidad y colecciones, se habilitan en SQL P77. UI extendida en siguientes P&apos;s.
      </div>
    </div>
  );
}
