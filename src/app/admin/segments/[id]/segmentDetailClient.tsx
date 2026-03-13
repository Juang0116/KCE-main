'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useState } from 'react';

type Segment = {
  id: string;
  name: string;
  entity_type: 'leads' | 'customers';
  description: string | null;
  filter: Record<string, unknown>;
  last_run_at: string | null;
  last_run_count: number | null;
  created_at: string;
};

function safeJsonParse(raw: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'JSON inválido' };
  }
}

export function AdminSegmentDetailClient({ id }: { id: string }) {
  const [seg, setSeg] = useState<Segment | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filterJson, setFilterJson] = useState('{}');

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/segments/${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error cargando segmento');
      const item = json?.item as Segment;
      setSeg(item);
      setName(item.name || '');
      setDescription(item.description || '');
      setFilterJson(JSON.stringify(item.filter ?? {}, null, 2));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function save() {
    const n = name.trim();
    if (!n) {
      setErr('El nombre es requerido');
      return;
    }
    const parsed = safeJsonParse(filterJson);
    if (!parsed.ok) {
      setErr(parsed.error);
      return;
    }
    if (typeof parsed.value !== 'object' || !parsed.value) {
      setErr('El filtro debe ser un objeto JSON');
      return;
    }

    setLoading(true);
    setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/segments/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: n,
          description: description.trim() || null,
          filter: parsed.value,
        }),
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error guardando');
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/segments/${encodeURIComponent(id)}/run`, {
        method: 'POST',
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error ejecutando');
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  if (!seg) {
    return (
      <div className="text-[color:var(--color-text)]/70 text-sm">
        {loading ? 'Cargando…' : 'No encontrado.'}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="text-[color:var(--color-text)]/60 block text-xs">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-[color:var(--color-text)]/60 block text-xs">Tipo</label>
          <div className="mt-2 text-sm text-[color:var(--color-text)]">{seg.entity_type}</div>
        </div>
        <div>
          <label className="text-[color:var(--color-text)]/60 block text-xs">Descripción</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="text-[color:var(--color-text)]/60 block text-xs">Filtro (JSON)</label>
        <textarea
          value={filterJson}
          onChange={(e) => setFilterJson(e.target.value)}
          rows={10}
          className="mt-1 w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 font-mono text-xs"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={() => void save()}
          disabled={loading}
          className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Guardar
        </button>
        <button
          onClick={() => void run()}
          disabled={loading}
          className="rounded-xl border border-black/20 bg-transparent px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          Ejecutar
        </button>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="rounded-xl border border-black/20 bg-transparent px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          Recargar
        </button>
        <div className="text-[color:var(--color-text)]/60 text-xs">
          Última ejecución: {seg.last_run_at || '—'} | Conteo: {seg.last_run_count ?? '—'}
        </div>
      </div>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
    </div>
  );
}
