'use client';


import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
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

export function AdminSegmentsClient() {
  const [items, setItems] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState<'leads' | 'customers'>('leads');
  const [description, setDescription] = useState('');
  const [filterJson, setFilterJson] = useState('{\n  \"stage\": \"new\"\n}');

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const resp = await adminFetch('/api/admin/segments', { cache: 'no-store' });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error cargando segmentos');
      setItems(Array.isArray(json?.items) ? (json.items as Segment[]) : []);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    const n = name.trim();
    if (!n) return;
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
      const resp = await adminFetch('/api/admin/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: n,
          entity_type: entityType,
          description: description.trim() || undefined,
          filter: parsed.value,
        }),
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error creando segmento');
      setName('');
      setDescription('');
      setFilterJson('{}');
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function run(id: string) {
    setLoading(true);
    setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/segments/${encodeURIComponent(id)}/run`, {
        method: 'POST',
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error ejecutando segmento');
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este segmento?')) return;
    setLoading(true);
    setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/segments/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error eliminando segmento');
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="rounded-2xl border border-black/10 bg-black/5 p-4">
        <h2 className="text-lg font-semibold text-[color:var(--color-text)]">Crear segmento</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="text-[color:var(--color-text)]/60 block text-xs">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Leads ES (new)"
              className="mt-1 w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[color:var(--color-text)]/60 block text-xs">Tipo</label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
            >
              <option value="leads">leads</option>
              <option value="customers">customers</option>
            </select>
          </div>
          <div>
            <label className="text-[color:var(--color-text)]/60 block text-xs">Descripción</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              className="mt-1 w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="text-[color:var(--color-text)]/60 block text-xs">Filtro (JSON)</label>
          <textarea
            value={filterJson}
            onChange={(e) => setFilterJson(e.target.value)}
            rows={6}
            className="mt-1 w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 font-mono text-xs"
          />
          <p className="text-[color:var(--color-text)]/60 mt-2 text-xs">
            Leads: stage, source, tags (array), q. Customers: country, language, q.
          </p>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => void create()}
            disabled={loading || !name.trim()}
            className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Crear
          </button>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="rounded-xl border border-black/20 bg-transparent px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            Recargar
          </button>
        </div>
      </div>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-[color:var(--color-text)]/60 text-left text-xs uppercase tracking-wide">
              <th className="px-3">Nombre</th>
              <th className="px-3">Tipo</th>
              <th className="px-3">Última ejecución</th>
              <th className="px-3">Conteo</th>
              <th className="px-3">Creado</th>
              <th className="px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr
                key={s.id}
                className="rounded-xl bg-black/5"
              >
                <td className="p-3 align-top">
                  <div className="font-medium text-[color:var(--color-text)]">{s.name}</div>
                  {s.description && (
                    <div className="text-[color:var(--color-text)]/60 mt-1 text-xs">
                      {s.description}
                    </div>
                  )}
                  <div className="text-[color:var(--color-text)]/50 mt-2 text-[10px]">{s.id}</div>
                </td>
                <td className="p-3 align-top">{s.entity_type}</td>
                <td className="text-[color:var(--color-text)]/60 p-3 align-top text-xs">
                  {s.last_run_at || '—'}
                </td>
                <td className="p-3 align-top">{s.last_run_count ?? '—'}</td>
                <td className="text-[color:var(--color-text)]/60 p-3 align-top text-xs">
                  {s.created_at}
                </td>
                <td className="p-3 text-right align-top">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/admin/segments/${encodeURIComponent(s.id)}`}
                      className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm font-medium hover:bg-white"
                    >
                      Ver
                    </Link>
                    <button
                      onClick={() => void run(s.id)}
                      disabled={loading}
                      className="rounded-xl border border-black/20 bg-transparent px-3 py-2 text-sm font-medium disabled:opacity-60"
                    >
                      Ejecutar
                    </button>
                    <button
                      onClick={() => void remove(s.id)}
                      disabled={loading}
                      className="rounded-xl border border-red-500/40 bg-transparent px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-60"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td
                  colSpan={6}
                  className="text-[color:var(--color-text)]/60 px-3 py-6 text-center text-sm"
                >
                  {loading ? 'Cargando…' : 'No hay segmentos aún.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
