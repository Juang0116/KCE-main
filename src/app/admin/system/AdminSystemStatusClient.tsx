'use client';

import * as React from 'react';

import { Button } from '@/components/ui/Button';
import { adminFetch } from '@/lib/adminFetch.client';

type Check = { ok: boolean; detail?: string; meta?: Record<string, any> };

type StatusPayload = {
  ok: boolean;
  deep: boolean;
  actor: string;
  ms: number;
  env: any;
  checks: Record<string, Check>;
};

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={[
        'inline-block h-2.5 w-2.5 rounded-full',
        ok ? 'bg-emerald-500' : 'bg-red-500',
      ].join(' ')}
      aria-label={ok ? 'OK' : 'FAIL'}
      title={ok ? 'OK' : 'FAIL'}
    />
  );
}

function pretty(v: any) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export default function AdminSystemStatusClient() {
  const [loading, setLoading] = React.useState(false);
  const [deep, setDeep] = React.useState(false);
  const [data, setData] = React.useState<StatusPayload | null>(null);
  const [err, setErr] = React.useState<string>('');

  async function load(nextDeep: boolean) {
    setErr('');
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/system/status?deep=${nextDeep ? '1' : '0'}`, {
        method: 'GET',
        cache: 'no-store',
        headers: { accept: 'application/json' },
      });
      const json = (await res.json().catch(() => null)) as StatusPayload | null;
      if (!res.ok || !json) throw new Error((json as any)?.error || `HTTP ${res.status}`);
      setDeep(nextDeep);
      setData(json);
    } catch (e: any) {
      setErr(String(e?.message || 'No se pudo cargar status.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" isLoading={loading} onClick={() => void load(false)}>
          Revisar (shallow)
        </Button>
        <Button variant="secondary" isLoading={loading} onClick={() => void load(true)}>
          Revisar (deep)
        </Button>
        {data ? (
          <div className="text-xs text-[color:var(--color-text)]/70">
            Actor: <span className="font-mono">{data.actor}</span> ·
            {' '}Tiempo: <span className="font-mono">{data.ms}ms</span> ·
            {' '}Modo: <span className="font-mono">{deep ? 'deep' : 'shallow'}</span>
          </div>
        ) : null}
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200">
          {err}
        </div>
      ) : null}

      {data ? (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Dot ok={data.ok} />
              <div className="font-semibold">Resultado global</div>
              <div className="text-sm text-[color:var(--color-text)]/70">
                {data.ok ? 'OK' : 'Revisa fallos abajo'}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <div className="font-semibold">Checks</div>
            <div className="mt-3 grid gap-2">
              {Object.entries(data.checks || {}).map(([k, c]) => (
                <div key={k} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-black/10 p-3 text-sm dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Dot ok={Boolean(c.ok)} />
                    <div className="font-mono text-xs">{k}</div>
                  </div>
                  <div className="flex-1 text-[color:var(--color-text)]/80">{c.detail || (c.ok ? 'OK' : 'FAIL')}</div>
                  {c.meta ? (
                    <details className="w-full">
                      <summary className="cursor-pointer text-xs text-[color:var(--color-text)]/60">ver meta</summary>
                      <pre className="mt-2 overflow-auto rounded-xl bg-black/5 p-3 text-[11px] leading-snug dark:bg-white/5">{pretty(c.meta)}</pre>
                    </details>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <details className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <summary className="cursor-pointer font-semibold">Env snapshot</summary>
            <pre className="mt-3 overflow-auto rounded-xl bg-black/5 p-3 text-[11px] leading-snug dark:bg-white/5">{pretty(data.env)}</pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}
