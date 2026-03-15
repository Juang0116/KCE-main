'use client';

import * as React from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { Activity, Server, RefreshCw, CheckCircle2, XCircle, Clock, Database, Globe } from 'lucide-react';

type Check = { ok: boolean; detail?: string; meta?: Record<string, any> };

type StatusPayload = {
  ok: boolean;
  deep: boolean;
  actor: string;
  ms: number;
  env: any;
  checks: Record<string, Check>;
};

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

  const totalChecks = data ? Object.keys(data.checks).length : 0;
  const passedChecks = data ? Object.values(data.checks).filter(c => c.ok).length : 0;
  const healthScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  const systemSignals = React.useMemo(() => [
    { label: 'System Health', value: data ? `${healthScore}%` : '—', note: 'Porcentaje de servicios operacionales.' },
    { label: 'Latencia (ms)', value: data ? `${data.ms}ms` : '—', note: 'Tiempo de respuesta del chequeo.' },
    { label: 'Nivel', value: deep ? 'Deep' : 'Shallow', note: 'Profundidad de la verificación.' },
  ], [data, healthScore, deep]);

  return (
    <div className="space-y-10 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">System Monitor</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Verificación de salud en tiempo real de BBDD, APIs de terceros y variables de entorno.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Infrastructure Health"
        title="Sanidad de Servidores"
        description="El chequeo Shallow (rápido) evalúa base de datos y entorno. El chequeo Deep (profundo) hace peticiones de red reales a Stripe, Resend y otros proveedores para asegurar operatividad absoluta."
        actions={[
          { href: '/admin/ops', label: 'Ver Operaciones', tone: 'primary' },
          { href: '/admin/audit', label: 'Logs de Auditoría' }
        ]}
        signals={systemSignals}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[var(--color-border)] pb-6">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Ejecutar Diagnóstico</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => void load(false)} disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-6 text-xs font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading && !deep ? 'animate-spin' : ''}`} /> Rápido (Shallow)
            </button>
            <button onClick={() => void load(true)} disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-md">
              <Globe className={`h-4 w-4 ${loading && deep ? 'animate-spin' : ''}`} /> Red (Deep)
            </button>
          </div>
        </div>

        {err && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}

        {data ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
            {/* Lista de Checks */}
            <div className="space-y-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2">Servicios Analizados</div>
              {Object.entries(data.checks).map(([key, check]) => (
                <div key={key} className={`rounded-2xl border p-5 transition-colors ${check.ok ? 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-brand-blue/30' : 'border-rose-500/30 bg-rose-50'}`}>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      {check.ok ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-rose-500" />}
                      <span className={`font-semibold ${check.ok ? 'text-[var(--color-text)]' : 'text-rose-700'}`}>{key}</span>
                    </div>
                    {check.detail && <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--color-text)]/40 bg-[var(--color-surface)] px-3 py-1 rounded-lg border border-[var(--color-border)]">{check.detail}</span>}
                  </div>
                  {check.meta && Object.keys(check.meta).length > 0 && (
                    <div className="mt-3 rounded-xl bg-[var(--color-surface)] p-3 text-[11px] font-mono text-[var(--color-text)]/60 border border-[var(--color-border)] overflow-x-auto">
                      <pre>{pretty(check.meta)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Metadatos Globales */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-4">
                  <Database className="h-4 w-4" /> Contexto de Ejecución
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-1">Actor (Token)</div>
                    <div className="font-mono text-brand-blue truncate" title={data.actor}>{data.actor}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-1">Status Base</div>
                    <div className={`font-bold uppercase tracking-widest text-xs ${data.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{data.ok ? '✅ All Clear' : '❌ Failing'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 mb-1">Tiempo de Respuesta</div>
                    <div className="font-mono">{data.ms}ms</div>
                  </div>
                </div>
              </div>

              {data.env && Object.keys(data.env).length > 0 && (
                <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-4">
                    <Server className="h-4 w-4" /> Environment Flags
                  </div>
                  <div className="rounded-xl bg-[var(--color-surface)] p-4 text-[10px] font-mono text-[var(--color-text)]/70 border border-[var(--color-border)] overflow-x-auto max-h-[400px] overflow-y-auto">
                    <pre>{pretty(data.env)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          !loading && <div className="py-16 text-center text-sm font-medium text-[var(--color-text)]/40">Ejecuta un diagnóstico para ver el estado del sistema.</div>
        )}
      </div>
    </div>
  );
}