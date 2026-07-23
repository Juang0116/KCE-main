'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  Filter,
  Users,
  Database,
  Play,
  Trash2,
  Plus,
  RefreshCw,
  Tag,
  Terminal,
  Fingerprint,
  Layers,
  Search,
  ShieldCheck,
  ArrowUpRight,
  ChevronRight,
  AlertCircle,
  FileJson,
  Clock, // ✅ Agrega esta línea aquí
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE INTELIGENCIA DE AUDIENCIA ---
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
  } catch (e: any) {
    return { ok: false, error: e.message || 'JSON_Invalid_Payload' };
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

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const resp = await adminFetch('/api/admin/segments', { cache: 'no-store' });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Err_Segments_Node');
      setItems(Array.isArray(json?.items) ? json.items : []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    const n = name.trim();
    if (!n) return setErr('Name_Required');
    const parsed = safeJsonParse(filterJson);
    if (!parsed.ok) return setErr(parsed.error);

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
      if (!resp.ok) throw new Error('Segment_Creation_Denied');
      setName('');
      setDescription('');
      setFilterJson('{\n  "stage": "new"\n}');
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (id: string) => {
    setLoading(true);
    try {
      const resp = await adminFetch(`/api/admin/segments/${id}/run`, { method: 'POST' });
      if (!resp.ok) throw new Error('Query_Execution_Fail');
      await load();
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('¿Eliminar permanentemente este nodo de segmento?')) return;
    setLoading(true);
    try {
      const resp = await adminFetch(`/api/admin/segments/${id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Deletion_Denied');
      await load();
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  };

  const signals = [
    { label: 'Matriz Activa', value: String(items.length), note: 'Segmentos en DB.' },
    {
      label: 'Targeting Leads',
      value: String(items.filter((i) => i.entity_type === 'leads').length),
      note: 'Filtros de prospección.',
    },
    {
      label: 'Targeting Clients',
      value: String(items.filter((i) => i.entity_type === 'customers').length),
      note: 'Filtros de retención.',
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-12 pb-32 duration-700">
      {/* HEADER DE INTELIGENCIA DE AUDIENCIA */}
      <header className="flex flex-col justify-between gap-8 border-b border-[color:var(--color-border)] px-2 pb-10 md:flex-row md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Fingerprint className="h-3.5 w-3.5" /> Audience Lane: /segments-vault
          </div>
          <h1 className="font-heading text-4xl leading-tight text-brand-blue md:text-5xl">
            Matriz de <span className="font-light italic text-brand-yellow">Segmentos</span>
          </h1>
          <p className="text-[color:var(--color-text)]/50 mt-4 max-w-2xl text-base font-light italic leading-relaxed">
            Consola de definición de cohortes. Crea grupos dinámicos basados en lógica predictiva
            para disparar acciones de marketing y ventas con precisión quirúrgica.
          </p>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Targeting Protocol"
        title="Micro-segmentación Forense"
        description="Define reglas inmutables (ej: stage=new, source=quiz). Al ejecutar el nodo, el sistema recalcula la población exacta en tiempo real."
        actions={[
          { href: '/admin/leads', label: 'Ver Leads', tone: 'primary' },
          { href: '/admin/customers', label: 'Ver Clientes' },
        ]}
        signals={signals}
      />

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* COLUMNA 1: CONSTRUCTOR DE NODOS */}
        <section className="group relative h-max space-y-8 overflow-hidden rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-2xl md:p-10">
          <div className="absolute -right-10 -top-10 opacity-[0.02] transition-transform duration-700 group-hover:rotate-12">
            <Filter className="h-64 w-64" />
          </div>

          <header className="relative z-10 flex items-center gap-4 border-b border-[color:var(--color-border)] pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
              <Plus className="h-5 w-5" />
            </div>
            <h2 className="font-heading text-2xl text-brand-blue">Nuevo Nodo</h2>
          </header>

          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <label className="text-[color:var(--color-text)]/30 ml-2 text-[10px] font-bold uppercase tracking-widest">
                Identificador
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: High_Value_EU"
                className="h-12 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 text-sm font-bold text-[color:var(--color-text)] outline-none transition-all focus:ring-4 focus:ring-brand-blue/5"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[color:var(--color-text)]/30 ml-2 text-[10px] font-bold uppercase tracking-widest">
                Entidad Target
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as any)}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 text-sm font-bold text-brand-blue outline-none transition-all focus:ring-4 focus:ring-brand-blue/5"
                disabled={loading}
              >
                <option value="leads">LEADS NODE</option>
                <option value="customers">CUSTOMERS NODE</option>
              </select>
            </div>

            <div className="space-y-2">
              <header className="flex items-center justify-between px-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">
                  Predicate_Logic (JSON)
                </label>
                <FileJson className="h-3.5 w-3.5 text-brand-blue/30" />
              </header>
              <textarea
                value={filterJson}
                onChange={(e) => setFilterJson(e.target.value)}
                rows={8}
                className="w-full resize-none rounded-xl border border-[color:var(--color-border)] bg-brand-dark p-5 font-mono text-xs leading-relaxed text-emerald-400 shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10"
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="h-14 w-full rounded-2xl bg-brand-dark text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-xl transition-transform hover:scale-[1.02]"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}{' '}
              {loading ? 'Sincronizando...' : 'Inyectar en Matriz'}
            </Button>

            {err && (
              <div className="animate-in zoom-in-95 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="truncate font-mono text-[10px] font-bold uppercase">{err}</p>
              </div>
            )}
          </div>
        </section>

        {/* COLUMNA 2: DIRECTORIO DE BÓVEDA */}
        <section className="relative space-y-8 overflow-hidden rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-2xl md:p-10">
          <header className="flex flex-col justify-between gap-6 border-b border-[color:var(--color-border)] pb-8 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue shadow-inner">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-2xl text-[color:var(--color-text)]">
                  Directorio de Cohortes
                </h2>
                <p className="text-[color:var(--color-text)]/30 text-[10px] font-bold uppercase tracking-widest">
                  Node Registry Active
                </p>
              </div>
            </div>
            <Button
              onClick={load}
              disabled={loading}
              variant="outline"
              className="h-10 rounded-xl border-brand-blue/10 px-6 text-[9px] font-bold uppercase tracking-widest text-brand-blue"
            >
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync
              Nodes
            </Button>
          </header>

          <div className="overflow-x-auto">
            <div className="overflow-hidden rounded-[2.5rem] border border-black/[0.03] bg-[color:var(--color-surface)] shadow-sm">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="bg-[color:var(--color-surface-2)]">
                  <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                    <th className="rounded-tl-[2.5rem] px-8 py-6">Segmento & Metadata</th>
                    <th className="px-8 py-6 text-center">Tipo_Target</th>
                    <th className="px-8 py-6 text-center">Población_Actual</th>
                    <th className="rounded-tr-[2.5rem] px-8 py-6 text-right">Acción Táctica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.03]">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-8 py-32 text-center"
                      >
                        <Users className="mx-auto mb-6 h-16 w-16 text-brand-blue/5" />
                        <p className="text-[color:var(--color-text)]/50 font-heading text-xl uppercase tracking-tighter">
                          Sin Segmentos Registrados
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((s) => (
                      <tr
                        key={s.id}
                        className="group transition-all hover:bg-brand-blue/[0.01]"
                      >
                        <td className="px-8 py-6 align-top">
                          <Link
                            href={`/admin/segments/${s.id}`}
                            className="mb-2 block font-heading text-lg uppercase tracking-tighter text-brand-blue hover:underline"
                          >
                            {s.name}
                          </Link>
                          {s.description && (
                            <p className="text-[color:var(--color-text)]/50 line-clamp-1 max-w-[280px] text-[11px] italic">
                              "{s.description}"
                            </p>
                          )}
                          <div className="mt-4 flex items-center gap-2 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-brand-blue/30">
                            <Clock className="h-2.5 w-2.5" /> Ingesta:{' '}
                            {new Date(s.created_at).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="px-8 py-6 text-center align-top">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest ${
                              s.entity_type === 'leads'
                                ? 'border-amber-500/20 bg-amber-500/5 text-amber-600'
                                : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600'
                            }`}
                          >
                            <Tag className="h-3 w-3 opacity-40" /> {s.entity_type}
                          </span>
                        </td>

                        <td className="space-y-2 px-8 py-6 text-center align-top">
                          <div className="font-heading text-3xl text-[color:var(--color-text)]">
                            {s.last_run_count ?? '—'}
                          </div>
                          <p className="text-[color:var(--color-text)]/30 text-[8px] font-bold uppercase tracking-widest">
                            Trace:{' '}
                            {s.last_run_at
                              ? new Date(s.last_run_at).toLocaleTimeString()
                              : 'PENDING'}
                          </p>
                        </td>

                        <td className="px-8 py-6 text-right align-top">
                          <div className="flex justify-end gap-3">
                            <Link
                              href={`/admin/segments/${s.id}`}
                              className="flex h-10 items-center justify-center rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)] transition-all hover:bg-brand-blue hover:text-white"
                            >
                              Refinar
                            </Link>
                            <Button
                              onClick={() => handleRun(s.id)}
                              disabled={loading}
                              variant="outline"
                              className="h-10 w-10 rounded-xl border-brand-blue/10 p-0 text-brand-blue"
                            >
                              <Play className="h-4 w-4 fill-brand-blue" />
                            </Button>
                            <Button
                              onClick={() => handleRemove(s.id)}
                              disabled={loading}
                              variant="outline"
                              className="h-10 w-10 rounded-xl border-rose-500/10 p-0 text-rose-500 hover:bg-rose-500 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-12 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 transition-opacity hover:opacity-50">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Targeting
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> Audience Hub v3.2
        </div>
      </footer>
    </div>
  );
}
