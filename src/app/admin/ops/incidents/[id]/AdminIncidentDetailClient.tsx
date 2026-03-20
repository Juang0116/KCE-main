'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch.client';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, 
  MapPin, RefreshCw, Save, Activity, Settings, 
  Network, ArrowLeft, XCircle, Terminal, 
  User, Database, Zap, ShieldCheck, Flame
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
  try { return new Date(ts).toLocaleString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }); } 
  catch { return ts; }
}

function badgeSeverity(s: string) {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm';
  if (s === 'critical') return `${base} border-rose-500/40 bg-rose-500/10 text-rose-700 animate-pulse`;
  if (s === 'warn') return `${base} border-amber-500/40 bg-amber-500/10 text-amber-800`;
  return `${base} border-sky-500/30 bg-sky-500/10 text-sky-700`;
}

function badgeStatus(s: string) {
  const base = 'inline-flex items-center rounded-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border';
  if (s === 'open') return `${base} border-rose-500/40 bg-rose-500/5 text-rose-600`;
  if (s === 'acked') return `${base} border-amber-500/40 bg-amber-500/5 text-amber-700`;
  if (s === 'resolved') return `${base} border-emerald-500/40 bg-emerald-500/5 text-emerald-600`;
  return `${base} border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]/50`;
}

export function AdminIncidentDetailClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [detail, setDetail] = useState<DetailResp | null>(null);
  const [note, setNote] = useState('');
  const [noteKind, setNoteKind] = useState<'note' | 'action' | 'status'>('note');
  const [syncing, setSyncing] = useState(false);

  const [pm, setPm] = useState<Postmortem>({
    incident_id: id, owner: '', summary: '', customer_impact: '', root_cause: '', timeline: '', what_went_well: '', what_went_wrong: '', action_items: [],
  });

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || `Error nodo: ${r.status}`);
      setDetail(j);
      if (j.postmortem) setPm({ ...pm, ...j.postmortem });
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const mutateAction = async (endpoint: string) => {
    setLoading(true); setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/${endpoint}`, { method: 'POST' });
      if (!r.ok) throw new Error(`Falla en transición de estado: ${r.status}`);
      await load();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const addUpdate = async () => {
    const msg = note.trim(); if (!msg) return;
    setLoading(true); setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/updates`, { 
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify({ kind: noteKind, message: msg }), 
      });
      if (!r.ok) throw new Error('Error al inyectar actualización');
      setNote(''); await load();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const savePostmortem = async () => {
    setLoading(true); setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/postmortem`, { 
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify(pm), 
      });
      if (!r.ok) throw new Error('Fallo al consolidar postmortem');
      await load();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const inc = detail?.incident;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-12 pb-32 animate-in fade-in duration-700">
      
      {/* HEADER DE COMANDO */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[color:var(--color-border)] pb-10">
        <div className="space-y-4">
          <Link href="/admin/ops/incidents" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50 hover:text-brand-blue transition-all">
            <ArrowLeft className="h-3 w-3" /> Operations Center: /incidents
          </Link>
          <div className="space-y-1">
            <h1 className="font-heading text-4xl text-brand-blue leading-tight">
              Análisis <span className="text-brand-yellow italic font-light">Forense</span>
            </h1>
            <p className="text-sm font-mono text-[color:var(--color-text)]/40">UUID: {id}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button onClick={load} disabled={loading} variant="outline" className="rounded-2xl px-6 h-12 border-[color:var(--color-border)] font-bold uppercase tracking-widest text-[10px]">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar Nodo
          </Button>
          {inc?.status === 'open' && (
            <Button onClick={() => mutateAction('ack')} disabled={loading} className="rounded-2xl px-6 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-700 font-bold uppercase tracking-widest text-[10px] hover:bg-amber-500/20">
              <Zap className="mr-2 h-4 w-4" /> Asumir Mando (ACK)
            </Button>
          )}
          {(inc?.status === 'open' || inc?.status === 'acked') && (
            <Button onClick={() => mutateAction('resolve')} disabled={loading} className="rounded-2xl px-8 h-12 bg-emerald-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-xl hover:bg-emerald-700">
              <ShieldCheck className="mr-2 h-4 w-4" /> Resolver Incidencia
            </Button>
          )}
        </div>
      </header>

      {err && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 animate-in zoom-in-95">
          <Flame className="h-6 w-6 opacity-40" />
          <p className="text-sm font-medium">{err}</p>
        </div>
      )}

      {/* MÉTRICAS DE INCIDENCIA */}
      {inc && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 mb-6">Clasificación Operativa</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-[10px] opacity-40 uppercase">Severidad:</span> <span className={badgeSeverity(inc.severity)}>{inc.severity}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] opacity-40 uppercase">Estado:</span> <span className={badgeStatus(inc.status)}>{inc.status}</span></div>
              <div className="pt-4 border-t border-[color:var(--color-border)] text-[10px] font-mono font-bold text-brand-blue uppercase">{inc.kind}</div>
            </div>
          </div>
          
          <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 mb-6">Telemetría de Tiempo</p>
            <div className="space-y-3 font-mono text-[11px] text-[color:var(--color-text)]/70">
              <div className="pb-2 border-b border-black/[0.03]"><span className="block opacity-40 mb-1 uppercase text-[9px]">First Seen:</span> {fmt(inc.first_seen_at)}</div>
              <div className="pb-2 border-b border-black/[0.03]"><span className="block opacity-40 mb-1 uppercase text-[9px]">Last Pulse:</span> {fmt(inc.last_seen_at)}</div>
              <div className="pt-1 flex items-center justify-between"><span className="opacity-40 uppercase text-[9px]">Hits:</span> <span className="text-rose-600 font-bold">{inc.count} Eventos</span></div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-sm lg:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 mb-6 flex items-center gap-2"><Network className="h-3.5 w-3.5" /> Contexto de Red</p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-[9px] font-bold opacity-40 uppercase">Endpoint / Method</span>
                <div className="font-mono text-xs bg-[color:var(--color-surface-2)] p-3 rounded-xl border border-[color:var(--color-border)] shadow-inner truncate text-brand-blue">
                   {inc.method || 'ERR'} {inc.path || '/root'}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-bold opacity-40 uppercase">Origen Forense</span>
                <div className="font-mono text-xs bg-[color:var(--color-surface-2)] p-3 rounded-xl border border-[color:var(--color-border)] shadow-inner truncate">
                   {inc.actor || 'anonymous'} · {inc.ip || '0.0.0.0'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRAZA DEL ERROR */}
      {inc && (
        <section className="rounded-[3rem] border-2 border-rose-500/10 bg-rose-500/[0.02] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:scale-110 transition-transform">
             <AlertTriangle className="h-40 w-40 text-rose-500" />
          </div>
          <header className="flex items-center gap-3 mb-6 text-rose-800">
            <Terminal className="h-6 w-6" />
            <h3 className="font-heading text-2xl">System Error Output</h3>
          </header>
          <pre className="font-mono text-sm leading-relaxed text-rose-900/80 bg-[color:var(--color-surface)] border border-rose-500/10 p-6 rounded-2xl whitespace-pre-wrap shadow-inner max-h-[300px] overflow-y-auto custom-scrollbar">
            {inc.message}
          </pre>
          <footer className="mt-6 flex justify-between items-center">
            <Link className="text-[10px] font-bold uppercase tracking-widest text-brand-blue flex items-center gap-2 bg-[color:var(--color-surface)] px-4 py-2 rounded-full border border-brand-blue/10 shadow-sm hover:bg-brand-blue hover:text-white transition-all" href={`/admin/ops/runbooks#${inc.kind}`}>
              <Activity className="h-3.5 w-3.5"/> Abrir Runbook de Mitigación
            </Link>
          </footer>
        </section>
      )}

      {/* POSTMORTEM & TIMELINE */}
      <div className="grid gap-8 lg:grid-cols-[1fr_450px]">
        
        {/* DOCUMENTACIÓN POSTMORTEM */}
        <section className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-12 shadow-2xl space-y-10">
          <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-[color:var(--color-border)] pb-8">
            <div className="space-y-2">
              <h2 className="font-heading text-3xl text-brand-blue">Análisis de Causa Raíz</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 italic">Incident Postmortem Report · MMXXVI</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={savePostmortem} disabled={loading} className="rounded-2xl h-11 px-8 bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 transition-transform">
                <Save className="mr-2 h-3.5 w-3.5"/> Consolidar Reporte
              </Button>
            </div>
          </header>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-3 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 ml-1">Responsable del Nodo (Owner)</label>
              <div className="relative">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30" />
                 <input className="w-full h-14 pl-12 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-sm font-bold text-brand-blue outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all" value={pm.owner || ''} onChange={(e) => setPm({ ...pm, owner: e.target.value })} placeholder="Nombre del Operador" />
              </div>
            </div>

            <div className="space-y-3 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 ml-1">Impacto Sistémico al Cliente</label>
              <textarea className="w-full h-32 p-5 rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-sm font-light leading-relaxed outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all resize-none italic" value={pm.customer_impact || ''} onChange={(e) => setPm({ ...pm, customer_impact: e.target.value })} placeholder="Describe la degradación del servicio percibida..." />
            </div>

            <div className="space-y-3 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 ml-1">Cronología Forense (Timeline)</label>
              <textarea className="w-full h-40 p-6 rounded-[2rem] border-2 border-black/5 bg-gray-950 text-emerald-500 font-mono text-xs leading-relaxed outline-none focus:border-emerald-500/30 transition-all resize-none shadow-inner custom-scrollbar" value={pm.timeline || ''} onChange={(e) => setPm({ ...pm, timeline: e.target.value })} placeholder="12:01 - Spike detectado en Stripe Webhook..." />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-2 ml-1"><CheckCircle2 className="h-3.5 w-3.5"/> Fortalezas (Went Well)</label>
              <textarea className="w-full h-32 p-5 rounded-[2rem] border border-emerald-500/20 bg-emerald-50/30 text-sm font-light leading-relaxed outline-none focus:border-emerald-500 transition-all resize-none" value={pm.what_went_well || ''} onChange={(e) => setPm({ ...pm, what_went_well: e.target.value })} />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-rose-600 flex items-center gap-2 ml-1"><XCircle className="h-3.5 w-3.5"/> Fallas (Went Wrong)</label>
              <textarea className="w-full h-32 p-5 rounded-[2rem] border border-rose-500/20 bg-rose-50/30 text-sm font-light leading-relaxed outline-none focus:border-rose-500 transition-all resize-none" value={pm.what_went_wrong || ''} onChange={(e) => setPm({ ...pm, what_went_wrong: e.target.value })} />
            </div>
          </div>
        </section>

        {/* LOG DE ACTIVIDAD OPERATIVA */}
        <aside className="space-y-6 sticky top-8">
          <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-brand-dark p-8 text-white shadow-2xl">
            <header className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
              <Activity className="h-5 w-5 text-brand-yellow animate-pulse" />
              <h2 className="font-heading text-xl">Live Activity Log</h2>
            </header>

            <div className="space-y-4 mb-8">
              <select className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-bold uppercase tracking-widest text-white outline-none focus:border-brand-yellow appearance-none cursor-pointer" value={noteKind} onChange={(e) => setNoteKind(e.target.value as any)}>
                <option value="note">Mensaje Informativo</option>
                <option value="action">Maniobra Técnica</option>
                <option value="status">Cambio de Etapa</option>
              </select>
              <textarea className="w-full h-24 p-4 rounded-xl border border-white/10 bg-white/5 text-sm font-light leading-relaxed text-white/80 outline-none focus:border-brand-yellow resize-none placeholder:text-white/20" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Inyectar comentario..." />
              <Button onClick={addUpdate} disabled={loading || !note.trim()} className="w-full h-11 rounded-xl bg-brand-blue text-white font-bold uppercase tracking-widest text-[9px] hover:scale-105 transition-transform shadow-lg">
                Transmitir al Log
              </Button>
            </div>

            <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {(detail?.updates || []).length === 0 ? (
                <div className="text-center py-10 opacity-20 italic text-xs">Sin registros de actividad.</div>
              ) : (
                detail?.updates.map((u) => (
                  <div key={u.id} className="relative pl-6 border-l border-white/10 group">
                    <div className="absolute left-[-5px] top-0 h-2 w-2 rounded-full bg-brand-yellow group-hover:scale-150 transition-transform" />
                    <header className="flex items-center justify-between mb-2">
                       <span className="text-[8px] font-mono opacity-40">{fmt(u.created_at)}</span>
                       <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-brand-yellow">{u.kind}</span>
                    </header>
                    <p className="text-xs font-light leading-relaxed text-white/70">{u.message}</p>
                    <p className="mt-2 text-[8px] uppercase font-bold text-brand-blue/80">Op: {u.actor || 'Root'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

      </div>

      {/* FOOTER DE INTEGRIDAD */}
      <footer className="pt-12 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] opacity-20 hover:opacity-50 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldAlert className="h-3.5 w-3.5" /> High-Confidence Incident Data
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> Immutable Forensic Registry
        </div>
      </footer>
    </div>
  );
}