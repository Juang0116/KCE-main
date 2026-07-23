'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useState, useCallback } from 'react';
import {
  Save,
  Play,
  RefreshCw,
  Terminal as TerminalIcon,
  Database,
  Users,
  FileJson,
  AlertCircle,
  Clock,
  Fingerprint,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE AUDIENCIA ---
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

export function AdminSegmentDetailClient({ id }: { id: string }) {
  const [seg, setSeg] = useState<Segment | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filterJson, setFilterJson] = useState('{}');

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/segments/${id}`, { cache: 'no-store' });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Node_Fetch_Failure');
      const item = json?.item as Segment;
      setSeg(item);
      setName(item.name || '');
      setDescription(item.description || '');
      setFilterJson(JSON.stringify(item.filter ?? {}, null, 2));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    const n = name.trim();
    if (!n) return setErr('Name_Required');
    const parsed = safeJsonParse(filterJson);
    if (!parsed.ok) return setErr(parsed.error);

    setLoading(true);
    setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/segments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: n,
          description: description.trim() || null,
          filter: parsed.value,
        }),
      });
      if (!resp.ok) throw new Error('Save_Operation_Denied');
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setLoading(true);
    setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/segments/${id}/run`, { method: 'POST' });
      if (!resp.ok) throw new Error('Query_Execution_Failed');
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!seg) {
    return (
      <div className="animate-pulse py-20 text-center">
        <RefreshCw className="mx-auto mb-4 h-10 w-10 animate-spin text-brand-blue/20" />
        <p className="text-sm font-light italic text-[color:var(--color-text-muted)]">
          Localizando nodo de segmento...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
      {/* 01. MATRIZ DE IDENTIDAD DEL SEGMENTO */}
      <section className="relative space-y-10 overflow-hidden rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-2xl md:p-10">
        <div className="absolute -right-10 -top-10 rotate-12 opacity-[0.02]">
          <Users className="h-64 w-64" />
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-[color:var(--color-text)]/30 ml-2 text-[10px] font-bold uppercase tracking-[0.2em]">
              Identificador Comercial
            </label>
            <div className="group relative">
              <Fingerprint className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue/30 transition-colors group-focus-within:text-brand-blue" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] pl-12 pr-4 text-sm font-bold text-[color:var(--color-text)] outline-none transition-all focus:ring-4 focus:ring-brand-blue/5"
                placeholder="Ej: High Value Travelers"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[color:var(--color-text)]/30 ml-2 text-[10px] font-bold uppercase tracking-[0.2em]">
              Entidad de Origen
            </label>
            <div className="flex h-12 items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-5 shadow-inner">
              <Database className="h-4 w-4 text-brand-blue/40" />
              <span className="font-mono text-xs font-bold uppercase tracking-tighter text-brand-blue">
                {seg.entity_type}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[color:var(--color-text)]/30 ml-2 text-[10px] font-bold uppercase tracking-[0.2em]">
              Nota Operativa
            </label>
            <div className="group relative">
              <Layers className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue/30 transition-colors group-focus-within:text-brand-blue" />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-[color:var(--color-text)]/60 h-12 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] pl-12 pr-4 text-sm font-light italic outline-none transition-all focus:ring-4 focus:ring-brand-blue/5"
                placeholder="Propósito del segmento..."
              />
            </div>
          </div>
        </div>

        {/* 02. EDITOR DE LÓGICA (CONSOLE) */}
        <div className="relative z-10 space-y-3">
          <header className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              <TerminalIcon className="h-3.5 w-3.5" /> Predicate_Logic_Console
            </div>
            <div className="text-[color:var(--color-text)]/30 flex items-center gap-2 font-mono text-[9px]">
              <FileJson className="h-3 w-3" /> JSON_Strict_Mode
            </div>
          </header>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-brand-blue/5 opacity-0 transition-opacity group-focus-within:opacity-100" />
            <textarea
              value={filterJson}
              onChange={(e) => setFilterJson(e.target.value)}
              rows={12}
              className="custom-scrollbar w-full resize-none rounded-2xl border border-[color:var(--color-border)] bg-brand-dark p-6 font-mono text-xs leading-relaxed text-emerald-400 shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10"
            />
          </div>
        </div>

        {/* 03. BARRA DE COMANDO Y TELEMETRÍA */}
        <footer className="relative z-10 flex flex-col items-center justify-between gap-8 border-t border-[color:var(--color-border)] pt-8 lg:flex-row">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={handleSave}
              disabled={loading}
              variant="primary"
              className="h-12 rounded-xl bg-brand-dark px-8 text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-xl transition-transform hover:scale-105"
            >
              <Save className="mr-2 h-4 w-4" /> Persistir Cambios
            </Button>

            <Button
              onClick={handleRun}
              disabled={loading}
              variant="outline"
              className="h-12 rounded-xl border-brand-blue/20 px-8 text-[10px] font-bold uppercase tracking-widest text-brand-blue transition-all hover:bg-brand-blue/5"
            >
              <Play className="mr-2 h-4 w-4" /> Ejecutar Query
            </Button>

            <Button
              onClick={load}
              disabled={loading}
              variant="ghost"
              className="h-12 rounded-xl px-6 text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] transition-colors hover:text-brand-blue"
            >
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />{' '}
              Sincronizar Nodo
            </Button>
          </div>

          <div className="flex items-center gap-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-6 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-brand-blue opacity-30" />
              <div className="space-y-0.5">
                <p className="text-[color:var(--color-text)]/30 text-[8px] font-bold uppercase tracking-widest">
                  Last Transmission
                </p>
                <p className="font-mono text-[10px] font-bold text-[color:var(--color-text)]">
                  {seg.last_run_at ? new Date(seg.last_run_at).toLocaleString() : 'NEVER_EXECUTED'}
                </p>
              </div>
            </div>
            <div className="h-8 w-px bg-[color:var(--color-border)]" />
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-brand-blue opacity-30" />
              <div className="space-y-0.5">
                <p className="text-[color:var(--color-text)]/30 text-[8px] font-bold uppercase tracking-widest">
                  Node Count
                </p>
                <p className="font-heading text-xl leading-none text-brand-blue">
                  {seg.last_run_count ?? '0'}
                </p>
              </div>
            </div>
          </div>
        </footer>

        {err && (
          <div className="animate-in zoom-in-95 mt-8 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 text-rose-700">
            <AlertCircle className="h-5 w-5 opacity-40" />
            <p className="font-mono text-xs font-bold uppercase">Error_Log: {err}</p>
          </div>
        )}
      </section>
    </div>
  );
}
