'use client';

import * as React from 'react';

import { Button } from '@/components/ui/Button';
import { adminFetch } from '@/lib/adminFetch.client';

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
      setMsg('Simulacro registrado. Recarga la página para ver el historial.');
      setNotes('');
    } catch (e: any) {
      setMsg(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-6 shadow-sm dark:bg-[#0b1220]">
      <div className="text-sm font-semibold">Registrar simulacro</div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          <div className="mb-1 text-[color:var(--color-text)]/70">Tipo</div>
          <select
            className="w-full rounded-xl border border-[color:var(--color-border)] bg-transparent px-3 py-2"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="tabletop">tabletop</option>
            <option value="restore_test">restore_test</option>
            <option value="webhook_replay">webhook_replay</option>
            <option value="db_backup_restore">db_backup_restore</option>
            <option value="runbook_review">runbook_review</option>
          </select>
        </label>

        <label className="text-sm">
          <div className="mb-1 text-[color:var(--color-text)]/70">Estado</div>
          <select
            className="w-full rounded-xl border border-[color:var(--color-border)] bg-transparent px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="planned">planned</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
          </select>
        </label>

        <div className="flex items-end">
          <Button onClick={submit} disabled={busy}>
            Guardar
          </Button>
        </div>
      </div>

      <label className="mt-4 block text-sm">
        <div className="mb-1 text-[color:var(--color-text)]/70">Notas (opcional)</div>
        <textarea
          className="w-full rounded-xl border border-[color:var(--color-border)] bg-transparent px-3 py-2"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Qué se probó, qué falló, qué se mejora..."
        />
      </label>

      {msg ? <div className="mt-3 text-sm text-[color:var(--color-text)]/80">{msg}</div> : null}
    </div>
  );
}
