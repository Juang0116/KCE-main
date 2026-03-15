'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { Filter, Users, Database, Play, Trash2, Plus, RefreshCw, Tag } from 'lucide-react';

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
  const [filterJson, setFilterJson] = useState('{\n  "stage": "new"\n}');

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
    if (!parsed.ok) { setErr(parsed.error); return; }
    if (typeof parsed.value !== 'object' || !parsed.value) { setErr('El filtro debe ser un objeto JSON'); return; }

    setLoading(true); setErr(null);
    try {
      const resp = await adminFetch('/api/admin/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n, entity_type: entityType, description: description.trim() || undefined, filter: parsed.value }),
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error creando segmento');
      setName(''); setDescription(''); setFilterJson('{}');
      await load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error'); } finally { setLoading(false); }
  }

  async function run(id: string) {
    setLoading(true); setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/segments/${encodeURIComponent(id)}/run`, { method: 'POST' });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error ejecutando segmento');
      await load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error'); } finally { setLoading(false); }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar permanentemente este segmento?')) return;
    setLoading(true); setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/segments/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(json?.error || 'Error eliminando segmento');
      await load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error'); } finally { setLoading(false); }
  }

  const segmentSignals = [
    { label: 'Segmentos Activos', value: String(items.length), note: 'Filtros dinámicos en la base de datos.' },
    { label: 'Población Leads', value: String(items.filter(i => i.entity_type === 'leads').length), note: 'Segmentos de la tabla leads.' },
    { label: 'Población Customers', value: String(items.filter(i => i.entity_type === 'customers').length), note: 'Segmentos de la tabla customers.' },
  ];

  return (
    <div className="space-y-10 pb-20">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Segmentos Avanzados</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Crea grupos dinámicos de leads o clientes basados en filtros JSON para campañas masivas.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Audience Targeting"
        title="Micro-segmentación de Audiencias"
        description="Define reglas de negocio (ej. stage=new, source=quiz) para agrupar contactos. Los segmentos se actualizan en tiempo real al ejecutarlos."
        actions={[
          { href: '/admin/leads', label: 'Bandeja de Leads', tone: 'primary' },
          { href: '/admin/customers', label: 'Directorio Clientes' }
        ]}
        signals={segmentSignals}
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        
        {/* Creador de Segmentos */}
        <section className="h-max rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-border)] pb-6">
            <Filter className="h-5 w-5 text-brand-blue" />
            <h2 className="font-heading text-xl text-[var(--color-text)]">Crear Segmento</h2>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Nombre</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Leads ES (new)"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold outline-none focus:border-brand-blue transition-colors"
                disabled={loading}
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Entidad Objetivo</span>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as any)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold outline-none focus:border-brand-blue transition-colors appearance-none cursor-pointer"
                disabled={loading}
              >
                <option value="leads">Leads (Prospectos)</option>
                <option value="customers">Customers (Clientes)</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Descripción (Opcional)</span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Para qué se usa..."
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none focus:border-brand-blue transition-colors"
                disabled={loading}
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Reglas (JSON Filter)</span>
              <textarea
                value={filterJson}
                onChange={(e) => setFilterJson(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-[var(--color-border)] bg-gray-900 text-emerald-400 px-4 py-3 text-xs font-mono leading-relaxed outline-none focus:border-brand-blue transition-colors resize-y shadow-inner"
                disabled={loading}
              />
              <p className="text-[9px] uppercase font-bold tracking-widest text-[var(--color-text)]/40 mt-2 leading-relaxed">
                Leads: stage, source, tags (array), q. <br />
                Customers: country, language, q.
              </p>
            </label>

            <div className="pt-2 border-t border-[var(--color-border)]">
              <button
                onClick={create}
                disabled={loading || !name.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-md disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Guardar Segmento
              </button>
            </div>
            
            {err && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-700">{err}</div>}
          </div>
        </section>

        {/* Directorio de Segmentos */}
        <section className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[var(--color-border)] pb-6">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-brand-blue" />
              <h2 className="font-heading text-xl text-[var(--color-text)]">Base de Segmentos</h2>
            </div>
            <button onClick={load} disabled={loading} className="flex h-9 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] disabled:opacity-50">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refrescar
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                  <th className="px-5 py-4">Segmento</th>
                  <th className="px-5 py-4 text-center">Tipo / Target</th>
                  <th className="px-5 py-4 text-center">Población (Count)</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <Users className="mx-auto h-10 w-10 text-[var(--color-text)]/10 mb-3" />
                      <div className="text-sm font-medium text-[var(--color-text)]/40">Aún no hay segmentos creados.</div>
                    </td>
                  </tr>
                ) : (
                  items.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-brand-blue">{s.name}</div>
                        {s.description && <div className="text-xs text-[var(--color-text)]/60 mt-1 line-clamp-1 max-w-[200px]" title={s.description}>{s.description}</div>}
                        <div className="text-[9px] font-mono text-[var(--color-text)]/30 mt-2 uppercase tracking-widest">Creado: {new Date(s.created_at).toLocaleDateString('es-ES')}</div>
                      </td>
                      <td className="px-5 py-4 align-top text-center">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${s.entity_type === 'leads' ? 'border-amber-500/20 bg-amber-500/10 text-amber-700' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'}`}>
                          <Tag className="h-3 w-3 opacity-50"/> {s.entity_type}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top text-center">
                        <div className="font-heading text-xl text-[var(--color-text)]">{s.last_run_count ?? '—'}</div>
                        <div className="text-[9px] font-mono text-[var(--color-text)]/40 uppercase tracking-widest mt-1">
                          Actualizado: {s.last_run_at ? new Date(s.last_run_at).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'Nunca'}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link href={`/admin/segments/${encodeURIComponent(s.id)}`} className="flex h-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)]">
                            Abrir
                          </Link>
                          <button onClick={() => void run(s.id)} disabled={loading} className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-brand-blue/10 px-3 text-[10px] font-bold uppercase tracking-widest text-brand-blue transition hover:bg-brand-blue/20 disabled:opacity-50">
                            <Play className="h-3 w-3 fill-brand-blue"/> Ejecutar
                          </button>
                          <button onClick={() => void remove(s.id)} disabled={loading} className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50" title="Eliminar">
                            <Trash2 className="h-4 w-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}