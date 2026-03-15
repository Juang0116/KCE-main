'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch.client';
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, MapPin, RefreshCw, Save, Activity, Settings, Network, ArrowLeft, XCircle } from 'lucide-react';

type Incident = {
  id: string;
  request_id: string | null;
  severity: 'info' | 'warn' | 'critical';
  kind: string;
  status: string;
  message: string;
  actor: string | null;
  path: string | null;
  method: string | null;
  ip: string | null;
  user_agent: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  count: number | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  meta: any;
};

type Update = {
  id: string;
  incident_id: string;
  kind: 'note' | 'action' | 'status';
  actor: string | null;
  message: string;
  meta: any;
  created_at: string;
};

type Postmortem = {
  incident_id: string;
  owner: string | null;
  summary: string | null;
  customer_impact: string | null;
  root_cause: string | null;
  timeline: string | null;
  what_went_well: string | null;
  what_went_wrong: string | null;
  action_items: any[];
  updated_at?: string | null;
};

type DetailResp = {
  ok: boolean;
  requestId: string;
  incident: Incident;
  updates: Update[];
  postmortem: Postmortem | null;
  error?: string;
};

function fmt(ts: string | null | undefined) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }); } 
  catch { return ts; }
}

function badgeSeverity(s: string) {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border shadow-sm';
  if (s === 'critical') return `${base} border-rose-500/40 bg-rose-500/10 text-rose-700`;
  if (s === 'warn') return `${base} border-amber-500/40 bg-amber-500/10 text-amber-800`;
  return `${base} border-sky-500/30 bg-sky-500/10 text-sky-700`;
}

function badgeStatus(s: string) {
  const base = 'inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border';
  if (s === 'open') return `${base} border-rose-500/40 bg-rose-500/10 text-rose-700`;
  if (s === 'acked') return `${base} border-amber-500/40 bg-amber-500/10 text-amber-800`;
  if (s === 'resolved') return `${base} border-emerald-500/40 bg-emerald-500/10 text-emerald-700`;
  return `${base} border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
}

export function AdminIncidentDetailClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [detail, setDetail] = useState<DetailResp | null>(null);

  const [note, setNote] = useState('');
  const [noteKind, setNoteKind] = useState<'note' | 'action' | 'status'>('note');

  const [pm, setPm] = useState<Postmortem>({
    incident_id: id, owner: '', summary: '', customer_impact: '', root_cause: '', timeline: '', what_went_well: '', what_went_wrong: '', action_items: [],
  });

  const [syncing, setSyncing] = useState(false);
  const [_syncInfo, setSyncInfo] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const j = (await r.json().catch(() => null)) as DetailResp | any;
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setDetail(j);
      if (j.postmortem) setPm({ ...pm, ...j.postmortem });
    } catch (e: any) { setErr(e?.message || 'Error'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const canAck = useMemo(() => { const st = detail?.incident?.status || ''; return st === 'open'; }, [detail?.incident?.status]);
  const canResolve = useMemo(() => { const st = detail?.incident?.status || ''; return st === 'open' || st === 'acked'; }, [detail?.incident?.status]);

  const mutateAction = async (endpoint: string) => {
    setLoading(true); setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/${endpoint}`, { method: 'POST' });
      const j = (await r.json().catch(() => null)) as any;
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      await load();
    } catch (e: any) { setErr(e?.message || 'Error'); } finally { setLoading(false); }
  }

  const addUpdate = async () => {
    const msg = note.trim(); if (!msg) return;
    setLoading(true); setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/updates`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: noteKind, message: msg }), });
      const j = (await r.json().catch(() => null)) as any;
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setNote(''); await load();
    } catch (e: any) { setErr(e?.message || 'Error'); } finally { setLoading(false); }
  };

  const savePostmortem = async () => {
    setLoading(true); setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/postmortem`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(pm), });
      const j = (await r.json().catch(() => null)) as any;
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      await load();
    } catch (e: any) { setErr(e?.message || 'Error'); } finally { setLoading(false); }
  };

  const syncActionItemsToTasks = async () => {
    setSyncing(true); setSyncInfo(''); setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/postmortem/action-items/sync`, { method: 'POST' });
      const j = (await r.json().catch(() => null)) as any;
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setSyncInfo(`Tareas creadas: ${j.created || 0}`);
      if (Array.isArray(j.action_items)) setPm((prev) => ({ ...prev, action_items: j.action_items }));
    } catch (e: any) { setErr(e?.message || 'Error'); } finally { setSyncing(false); }
  };

  const inc = detail?.incident;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-20">
      
      {/* CABECERA Y BREADCRUMB */}
      <div>
        <Link href="/admin/ops/incidents" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-brand-blue transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" /> Volver al Centro de Incidentes
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="h-6 w-6 text-brand-blue" />
              <h1 className="font-heading text-3xl md:text-4xl text-[var(--color-text)] leading-tight">
                Detalle Forense (Incidente)
              </h1>
            </div>
            <div className="text-xs text-[var(--color-text)]/50 font-mono mt-2">
              Incidente ID: {id}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 shrink-0">
            <button onClick={load} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] disabled:opacity-50">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refrescar
            </button>
            {canAck && (
              <button onClick={() => void mutateAction('ack')} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 transition hover:bg-amber-500/20 disabled:opacity-50 shadow-sm">
                Asumir (ACK)
              </button>
            )}
            {canResolve && (
              <button onClick={() => void mutateAction('resolve')} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-emerald-600 disabled:opacity-50 shadow-md">
                <CheckCircle2 className="h-3 w-3"/> Resolver Falla
              </button>
            )}
          </div>
        </div>
      </div>

      {err && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}

      {/* TARJETAS DE CONTEXTO */}
      {inc && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col justify-between">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-3">Clasificación</div>
            <div className="space-y-3">
              <div><span className={badgeSeverity(inc.severity)}>{inc.severity}</span></div>
              <div><span className={badgeStatus(inc.status)}>{inc.status}</span></div>
              <div className="text-[10px] font-mono text-brand-blue font-bold uppercase tracking-widest pt-2 border-t border-[var(--color-border)]">{inc.kind}</div>
            </div>
          </div>
          
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col justify-between">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-3 flex items-center gap-1.5"><Clock className="h-3 w-3"/> Tiempos</div>
            <div className="space-y-2 text-xs font-medium text-[var(--color-text)]/80">
              <div className="flex justify-between border-b border-[var(--color-border)] pb-1"><span className="opacity-50 font-light">First Seen:</span> <span>{fmt(inc.first_seen_at)}</span></div>
              <div className="flex justify-between border-b border-[var(--color-border)] pb-1"><span className="opacity-50 font-light">Last Seen:</span> <span>{fmt(inc.last_seen_at)}</span></div>
              <div className="flex justify-between pt-1"><span className="opacity-50 font-light">Ocurrencias:</span> <span className="font-bold text-rose-600">{inc.count} hits</span></div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-3 flex items-center gap-1.5"><Network className="h-3 w-3"/> Red y Contexto</div>
            <div className="grid sm:grid-cols-2 gap-4 text-xs font-medium text-[var(--color-text)]/80">
              <div>
                <div className="opacity-50 font-light mb-1">Ruta del Error (Path)</div>
                <div className="font-mono bg-[var(--color-surface-2)] p-2 rounded-lg border border-[var(--color-border)] truncate" title={`${inc.method} ${inc.path}`}>{inc.method || 'GET'} {inc.path || '—'}</div>
              </div>
              <div>
                <div className="opacity-50 font-light mb-1">Origen (Actor / IP)</div>
                <div className="font-mono bg-[var(--color-surface-2)] p-2 rounded-lg border border-[var(--color-border)] truncate" title={`${inc.actor} / ${inc.ip}`}>{inc.actor || 'Anónimo'} · {inc.ip || 'Local'}</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">Resolución:</span>
              <div className="text-xs font-mono">ACK: {fmt(inc.acknowledged_at)} <span className="mx-2 opacity-30">|</span> FIN: {fmt(inc.resolved_at)}</div>
            </div>
          </div>
        </div>
      )}

      {inc && (
        <div className="rounded-3xl border-2 border-rose-500/20 bg-rose-500/5 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-3 text-rose-700">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-heading text-xl">Mensaje del Sistema</h3>
          </div>
          <div className="font-mono text-sm leading-relaxed text-rose-900/80 bg-white/50 p-4 rounded-xl border border-rose-500/10 whitespace-pre-wrap shadow-inner">
            {inc.message}
          </div>
          <div className="mt-4 flex justify-between items-center text-xs">
            <Link className="font-bold uppercase tracking-widest text-brand-blue hover:underline flex items-center gap-1" href={`/admin/ops/runbooks#${encodeURIComponent(inc.kind || '')}`}>
              <Activity className="h-3 w-3"/> Abrir Runbook Oficial para este error
            </Link>
          </div>
        </div>
      )}

      {/* MITAD INFERIOR: TIMELINE Y POSTMORTEM */}
      <div className="grid gap-6 lg:grid-cols-[1fr_450px] items-start">
        
        {/* POSTMORTEM (Columna Principal) */}
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 border-b border-[var(--color-border)] pb-6">
            <div>
              <h2 className="font-heading text-2xl text-[var(--color-text)]">Análisis Postmortem</h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                Documentación requerida para incidentes de impacto crítico.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={syncActionItemsToTasks} disabled={loading || syncing} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-[var(--color-surface)] disabled:opacity-50" title="Convertir action items en tareas operativas">
                {syncing ? 'Sincronizando...' : 'Crear Tareas (Sinc)'}
              </button>
              <button onClick={savePostmortem} disabled={loading} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-[10px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-md">
                <Save className="h-3 w-3"/> Guardar Doc
              </button>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Owner (Responsable)</span>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold outline-none focus:border-brand-blue transition-colors" value={pm.owner || ''} onChange={(e) => setPm({ ...pm, owner: e.target.value })} placeholder="Ej: John Doe" disabled={loading} />
            </label>
            <label className="sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Resumen (Executive Summary)</span>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none focus:border-brand-blue transition-colors" value={pm.summary || ''} onChange={(e) => setPm({ ...pm, summary: e.target.value })} placeholder="Resumen corto del incidente..." disabled={loading} />
            </label>

            <label className="sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Impacto al Cliente</span>
              <textarea className="h-24 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-light leading-relaxed outline-none focus:border-brand-blue transition-colors resize-y" value={pm.customer_impact || ''} onChange={(e) => setPm({ ...pm, customer_impact: e.target.value })} placeholder="¿Cuántos afectados? ¿Pérdida de ventas?" disabled={loading} />
            </label>
            <label className="sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Causa Raíz (Root Cause)</span>
              <textarea className="h-24 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-light leading-relaxed outline-none focus:border-brand-blue transition-colors resize-y" value={pm.root_cause || ''} onChange={(e) => setPm({ ...pm, root_cause: e.target.value })} placeholder="Análisis técnico de por qué ocurrió..." disabled={loading} />
            </label>
            <label className="sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Línea de Tiempo (Timeline)</span>
              <textarea className="h-28 w-full rounded-xl border border-[var(--color-border)] bg-gray-900 text-emerald-400 font-mono px-4 py-3 text-xs leading-relaxed outline-none focus:border-brand-blue transition-colors resize-y shadow-inner" value={pm.timeline || ''} onChange={(e) => setPm({ ...pm, timeline: e.target.value })} placeholder="10:00 - Falla detectada&#10;10:05 - ACK&#10;10:30 - Fix en PR..." disabled={loading} />
            </label>

            <label>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1 mb-2"><CheckCircle2 className="h-3 w-3"/> What went well</span>
              <textarea className="h-24 w-full rounded-xl border border-emerald-500/30 bg-emerald-50/50 px-4 py-3 text-sm font-light outline-none focus:border-emerald-500 transition-colors resize-y" value={pm.what_went_well || ''} onChange={(e) => setPm({ ...pm, what_went_well: e.target.value })} disabled={loading} />
            </label>
            <label>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 flex items-center gap-1 mb-2"><XCircle className="h-3 w-3"/> What went wrong</span>
              <textarea className="h-24 w-full rounded-xl border border-rose-500/30 bg-rose-50/50 px-4 py-3 text-sm font-light outline-none focus:border-rose-500 transition-colors resize-y" value={pm.what_went_wrong || ''} onChange={(e) => setPm({ ...pm, what_went_wrong: e.target.value })} disabled={loading} />
            </label>
          </div>

          {detail?.postmortem?.updated_at && (
             <div className="mt-6 text-right text-[10px] uppercase font-bold tracking-widest text-[var(--color-text)]/30 border-t border-[var(--color-border)] pt-4">
               Último autoguardado: {fmt(detail.postmortem.updated_at)}
             </div>
          )}
        </div>

        {/* TIMELINE DE ACTUALIZACIONES (Columna Lateral) */}
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm sticky top-6">
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-border)] pb-4">
            <Activity className="h-5 w-5 text-brand-blue" />
            <h2 className="font-heading text-lg text-[var(--color-text)]">Activity Log</h2>
          </div>

          <div className="space-y-3 mb-6">
            <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-blue transition-colors appearance-none cursor-pointer" value={noteKind} onChange={(e) => setNoteKind(e.target.value as any)}>
              <option value="note">Nota Informativa</option>
              <option value="action">Acción Tomada</option>
              <option value="status">Cambio de Estado</option>
            </select>
            <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-light leading-relaxed outline-none focus:border-brand-blue transition-colors resize-none h-24 placeholder:text-[var(--color-text)]/40" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Agrega un comentario a la investigación..." />
            <button onClick={addUpdate} disabled={loading || !note.trim()} className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 disabled:opacity-50 shadow-sm">
              Agregar al Log
            </button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {(detail?.updates || []).length === 0 ? (
              <div className="text-center text-xs text-[var(--color-text)]/40 italic py-6 border border-dashed border-[var(--color-border)] rounded-xl">Sin actualizaciones operativas.</div>
            ) : (
              (detail?.updates || []).map((u) => {
                const isNote = u.kind === 'note';
                const isAction = u.kind === 'action';
                return (
                  <div key={u.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border ${isNote ? 'bg-sky-500/10 text-sky-700 border-sky-500/20' : isAction ? 'bg-brand-yellow/20 text-brand-dark border-brand-yellow/40' : 'bg-[var(--color-text)]/10 text-[var(--color-text)]/60 border-[var(--color-border)]'}`}>
                        {u.kind}
                      </span>
                      <span className="text-[9px] font-mono text-[var(--color-text)]/40">{fmt(u.created_at)}</span>
                    </div>
                    <div className="text-sm font-light text-[var(--color-text)]/80 leading-relaxed">{u.message}</div>
                    <div className="mt-2 text-[9px] uppercase font-bold text-brand-blue text-right">Por: {u.actor || 'Sistema'}</div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}