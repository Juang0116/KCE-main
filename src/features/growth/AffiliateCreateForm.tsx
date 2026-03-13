'use client';

import { useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';

export function AffiliateCreateForm() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [commissionBps, setCommissionBps] = useState<number>(1000);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await adminFetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code, name, email: email || null, commission_bps: commissionBps }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'No se pudo crear el afiliado');
      setMsg('Afiliado creado. Recarga la página para verlo en la lista.');
      setCode('');
      setName('');
      setEmail('');
      setCommissionBps(1000);
    } catch (err: any) {
      setMsg(String(err?.message || err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border p-4 space-y-3">
      <div className="font-semibold">Nuevo afiliado</div>
      <div className="grid gap-2 md:grid-cols-4">
        <label className="text-sm">
          Código
          <input className="mt-1 w-full rounded border px-3 py-2" value={code} onChange={(e) => setCode(e.target.value)} placeholder="partner01" />
        </label>
        <label className="text-sm md:col-span-2">
          Nombre
          <input className="mt-1 w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Agencia X" />
        </label>
        <label className="text-sm">
          Comisión (bps)
          <input
            type="number"
            className="mt-1 w-full rounded border px-3 py-2"
            value={commissionBps}
            onChange={(e) => setCommissionBps(parseInt(e.target.value || '0', 10))}
            min={0}
            max={5000}
          />
        </label>
      </div>
      <label className="text-sm">
        Email (opcional)
        <input className="mt-1 w-full rounded border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ventas@partner.com" />
      </label>
      <button disabled={busy} className="rounded bg-black px-4 py-2 text-white disabled:opacity-60">
        {busy ? 'Creando…' : 'Crear'}
      </button>
      {msg ? <div className="text-sm opacity-80">{msg}</div> : null}
    </form>
  );
}
