'use client';

import { useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';

type Item = {
  id: string;
  kind: 'export' | 'delete';
  email: string;
  name: string | null;
  message: string | null;
  locale: string | null;
  status: string;
  created_at: string;
};

export function PrivacyRequestsTable({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [msg, setMsg] = useState<string | null>(null);

  async function update(id: string, status: string) {
    setMsg(null);
    const res = await adminFetch(`/api/admin/privacy/requests/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(json?.error || 'No se pudo actualizar');
      return;
    }
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    setMsg('Actualizado');
  }

  return (
    <div className="space-y-3">
      {msg ? <div className="text-sm opacity-80">{msg}</div> : null}
      <div className="rounded-xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Mensaje</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.kind}</td>
                <td className="p-3">{r.email}</td>
                <td className="p-3">{r.name || '—'}</td>
                <td className="p-3 max-w-[420px] truncate" title={r.message || ''}>
                  {r.message || '—'}
                </td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="rounded border px-2 py-1" onClick={() => update(r.id, 'in_progress')}>
                      In progress
                    </button>
                    <button className="rounded border px-2 py-1" onClick={() => update(r.id, 'done')}>
                      Done
                    </button>
                    <button className="rounded border px-2 py-1" onClick={() => update(r.id, 'rejected')}>
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td className="p-3" colSpan={6}>
                  Sin solicitudes.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
