'use client';

import * as React from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { ShieldAlert, Activity, Save, Database, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminDrClient() {
  const [kind, setKind] = React.useState('tabletop');
  const [status, setStatus] = React.useState('completed');
  const [notes, setNotes] = React.useState('');
  const [msg, setMsg] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await adminFetch('/api/admin/system/drills/record', {
        method: 'POST',
        body: JSON.stringify({ kind, status, notes: notes.trim() || undefined }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'No se pudo registrar el simulacro.');
      setMsg('Simulacro guardado correctamente en la bitácora E2E ✅');
      setNotes('');
    } catch (e: any) {
      setMsg(String(e?.message || e));
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 5000);
    }
  }

  const drSignals = [
    { label: 'Estado', value: 'OK', note: 'Módulo de simulacros activo.' },
    { label: 'Política', value: 'Tier 1', note: 'Registro inmutable de DR.' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-heading text-3xl text-brand-blue md:text-4xl">
            Disaster Recovery (DR)
          </h1>
          <p className="text-[color:var(--color-text)]/60 mt-2 text-sm font-light">
            Bitácora de simulacros de recuperación y auditoría de resiliencia del sistema.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Business Continuity"
        title="Protocolos de Supervivencia"
        description="Documenta las pruebas de estrés, recuperación de backups y repetición de webhooks para garantizar que KCE puede sobrevivir a caídas de terceros (Stripe/Supabase)."
        actions={[
          { href: '/admin/system', label: 'Monitor de Sistema', tone: 'primary' },
          { href: '/admin/audit', label: 'Auditoría Global' },
        ]}
        signals={drSignals}
      />

      <section className="mx-auto max-w-4xl rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-sm md:p-10">
        <div className="mb-8 flex items-center gap-3 border-b border-[color:var(--color-border)] pb-6">
          <ShieldAlert className="h-6 w-6 text-brand-blue" />
          <h2 className="font-heading text-2xl text-[color:var(--color-text)]">
            Registrar Simulacro
          </h2>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              {/* CORRECCIÓN: Se eliminó el 'block' para evitar el conflicto con 'flex' */}
              <span className="text-[color:var(--color-text)]/50 mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                <Database className="h-3 w-3" /> Vector de Falla (Tipo)
              </span>
              <select
                className="w-full cursor-pointer appearance-none rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm font-semibold outline-none transition-colors focus:border-brand-blue"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="tabletop">Teórico (Tabletop)</option>
                <option value="restore_test">Restauración de Sistema (Restore Test)</option>
                <option value="webhook_replay">Fallo de API (Webhook Replay)</option>
                <option value="db_backup_restore">Recuperación de Datos (DB Backup)</option>
                <option value="runbook_review">Sanidad de Ops (Runbook Review)</option>
              </select>
            </label>

            <label className="block">
              {/* CORRECCIÓN: Se eliminó el 'block' para evitar el conflicto con 'flex' */}
              <span className="text-[color:var(--color-text)]/50 mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                <Activity className="h-3 w-3" /> Resultado / Estado
              </span>
              <select
                className="w-full cursor-pointer appearance-none rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm font-semibold outline-none transition-colors focus:border-brand-blue"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="planned">Planeado (Planned)</option>
                <option value="in_progress">En Curso (In Progress)</option>
                <option value="completed">Exitoso (Completed)</option>
                <option value="failed">Fallo Crítico (Failed)</option>
              </select>
            </label>
          </div>

          <label className="block">
            {/* CORRECCIÓN: Se eliminó el 'block' para evitar el conflicto con 'flex' */}
            <span className="text-[color:var(--color-text)]/50 mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
              <AlertTriangle className="h-3 w-3" /> Autopsia / Notas Postmortem
            </span>
            <textarea
              className="min-h-[160px] w-full resize-y rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm font-light leading-relaxed outline-none transition-colors focus:border-brand-blue"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Se simuló la caída de Supabase. El webhook de Stripe se encoló y se recuperó al restaurar la red. Latencia: 4ms..."
            />
          </label>

          <div className="flex flex-col items-center gap-4 border-t border-[color:var(--color-border)] pt-4 sm:flex-row">
            <button
              onClick={submit}
              disabled={busy || !notes.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-dark px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-brand-yellow shadow-md transition hover:scale-105 disabled:opacity-50 sm:w-auto"
            >
              <Save className={`h-4 w-4 ${busy ? 'animate-bounce' : ''}`} />
              {busy ? 'Sellando...' : 'Sellar Registro Forense'}
            </button>
            {msg && (
              <div className="animate-fade-in text-xs font-bold uppercase tracking-widest text-emerald-600">
                {msg}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
