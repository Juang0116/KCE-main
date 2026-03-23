'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch.client';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, 
  MapPin, RefreshCw, Save, Activity, Settings, 
  Network, ArrowLeft, XCircle, Terminal, 
  User, Database, Zap, ShieldCheck, Flame,
  Hash, ChevronRight, Layout, Info, Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE INCIDENCIA ---
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

// --- HELPERS ---
function fmt(ts: string | null | undefined) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }); } 
  catch { return ts; }
}

function badgeSeverity(s: string) {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm';
  if (s === 'critical') return `${base} border-red-500/40 bg-red-500/10 text-red-700 animate-pulse`;
  if (s === 'warn') return `${base} border-amber-500/40 bg-amber-500/10 text-amber-800`;
  return `${base} border-sky-500/30 bg-sky-500/10 text-sky-700`;
}

function badgeStatus(s: string) {
  const base = 'inline-flex items-center rounded-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border';
  if (s === 'open') return `${base} border-red-500/40 bg-red-500/5 text-red-600`;
  if (s === 'acked') return `${base} border-amber-500/40 bg-amber-500/5 text-amber-700`;
  if (s === 'resolved') return `${base} border-green-500/40 bg-green-500/5 text-green-600`;
  return `${base} border-brand-dark/10 bg-surface-2 text-muted`;
}

export function AdminIncidentDetailClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [detail, setDetail] = useState<DetailResp | null>(null);
  const [note, setNote] = useState('');
  const [noteKind, setNoteKind] = useState<'note' | 'action' | 'status'>('note');

  const [pm, setPm] = useState<Postmortem>({
    incident_id: id, owner: '', summary: '', customer_impact: '', root_cause: '', timeline: '', what_went_well: '', what_went_wrong: '', action_items: [],
  });

  const load = useCallback(async () => {
    setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || `Error nodo: ${r.status}`);
      setDetail(j);
      if (j.postmortem) setPm({ ...pm, ...j.postmortem });
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }, [id, pm]);

  useEffect(() => { load(); }, [id]);

  const mutateAction = async (endpoint: string) => {
    setLoading(true); setErr('');
    try {
      const r = await adminFetch(`/api/admin/ops/incidents/${encodeURIComponent(id)}/${endpoint}`, { method: 'POST' });
      if (!r.ok) throw new Error(`Falla en transición de estado: ${r.status}`);
      await load();
    } catch (e: any) { setErr(e.message); setLoading(false); }
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
    } catch (e: any) { setErr(e.message); setLoading(false); }
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
    } catch (e: any) { setErr(e.message); setLoading(false); }
  };

  if (loading && !detail) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-6 animate-pulse">
        <Activity className="h-16 w-16 text-brand-blue opacity-20" />
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-muted">Retrieving Forensic Data...</p>
      </div>
    );
  }

  const inc = detail?.incident;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. HEADER DE COMANDO */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div className="space-y-4">
          <Link href="/admin/ops/incidents" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue hover:translate-x-[-4px] transition-transform">
            <ArrowLeft className="h-3.5 w-3.5" /> Operations Center: /incidents
          </Link>
          <div className="space-y-2">
            <h1 className="font-heading text-4xl md:text-6xl text-main tracking-tighter leading-none">
              Análisis <span className="text-brand-yellow italic font-light">Forense</span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
               <div className="px-3 py-1 rounded-lg bg-surface-2 border border-brand-dark/5 text-[10px] font-mono text-muted">
                  UUID: {id}
               </div>
               <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-blue/5 border border-brand-blue/10 text-[10px] font-bold text-brand-blue uppercase">
                  <Cpu className="h-3 w-3" /> Kernel Node 01
               </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Button onClick={load} disabled={loading} variant="outline" className="rounded-full px-8 h-14 border-brand-dark/10 bg-surface shadow-sm font-bold uppercase tracking-widest text-[10px] hover:bg-surface-2 transition-all">
            <RefreshCw className={`mr-3 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar Nodo
          </Button>
          {inc?.status === 'open' && (
            <Button onClick={() => mutateAction('ack')} disabled={loading} className="rounded-full px-8 h-14 bg-brand-yellow text-brand-dark font-bold uppercase tracking-widest text-[10px] shadow-pop hover:scale-105 active:scale-95 transition-all">
              <Zap className="mr-3 h-4 w-4 fill-current" /> Asumir Mando (ACK)
            </Button>
          )}
          {(inc?.status === 'open' || inc?.status === 'acked') && (
            <Button onClick={() => mutateAction('resolve')} disabled={loading} className="rounded-full px-10 h-14 bg-green-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-pop hover:bg-green-700 active:scale-95 transition-all">
              <ShieldCheck className="mr-3 h-5 w-5" /> Resolver Incidencia
            </Button>
          )}
        </div>
      </header>

      {err && (
        <div className="rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/10 p-6 flex items-center gap-4 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 shadow-sm font-bold">
          <Flame className="h-6 w-6 opacity-60" />
          <p className="text-sm font-medium">Falla de Red Crítica: <span className="font-light">{err}</span></p>
        </div>
      )}

      {/* 02. MÉTRICAS DE INCIDENCIA (BÓVEDA) */}
      {inc && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[2.2rem] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-40 mb-6">Clasificación Operativa</p>
            <div className="space-y-5">
              <div className="flex items-center justify-between"><span className="text-[10px] opacity-40 uppercase font-bold">Severidad</span> <span className={badgeSeverity(inc.severity)}>{inc.severity}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] opacity-40 uppercase font-bold">Estatus</span> <span className={badgeStatus(inc.status)}>{inc.status}</span></div>
              <div className="pt-5 border-t border-brand-dark/5 dark:border-white/5 text-[10px] font-mono font-bold text-brand-blue uppercase tracking-widest">
                 <Hash className="h-3 w-3 inline mr-1" /> {inc.kind}
              </div>
            </div>
          </div>
          
          <div className="rounded-[2.2rem] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-40 mb-6">Telemetría Temporal</p>
            <div className="space-y-4 font-mono text-[11px] text-main">
              <div className="pb-3 border-b border-brand-dark/5 dark:border-white/5"><span className="block opacity-40 mb-1 uppercase text-[9px] font-bold">Detección inicial</span> {fmt(inc.first_seen_at)}</div>
              <div className="pb-3 border-b border-brand-dark/5 dark:border-white/5"><span className="block opacity-40 mb-1 uppercase text-[9px] font-bold">Último pulso</span> {fmt(inc.last_seen_at)}</div>
              <div className="pt-2 flex items-center justify-between">
                 <span className="opacity-40 uppercase text-[9px] font-bold">Hits Totales</span> 
                 <span className="text-red-600 dark:text-red-400 font-bold bg-red-500/5 px-2 py-0.5 rounded">{inc.count} EVENTOS</span>
              </div>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-soft lg:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-40 mb-6 flex items-center gap-3">
               <Network className="h-4 w-4 text-brand-blue" /> Red & Atribución
            </p>
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Endpoint de Falla</span>
                <div className="font-mono text-[11px] bg-surface-2 p-4 rounded-2xl border border-brand-dark/5 dark:border-white/5 shadow-inner truncate text-brand-blue font-bold">
                   <span className="opacity-40 mr-2">{inc.method || 'ERR'}</span> {inc.path || '/root'}
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Origen Técnico</span>
                <div className="font-mono text-[11px] bg-surface-2 p-4 rounded-2xl border border-brand-dark/5 dark:border-white/5 shadow-inner truncate text-main">
                   <User className="h-3 w-3 inline mr-2 opacity-30" /> {inc.actor || 'SYSTEM'} · {inc.ip || 'INTERNAL_ADDR'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 03. TRAZA DEL ERROR (TERMINAL) */}
      {inc && (
        <section className="rounded-[2.5rem] border border-red-500/20 bg-red-500/[0.02] p-8 md:p-12 shadow-pop relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 opacity-[0.02] group-hover:scale-110 transition-transform pointer-events-none">
             <AlertTriangle className="h-64 w-64 text-red-500" />
          </div>
          <header className="flex items-center gap-4 mb-8 text-red-800 dark:text-red-400">
            <Terminal className="h-6 w-6" />
            <h3 className="font-heading text-3xl tracking-tight">System Error Traceback</h3>
          </header>
          <div className="relative">
             <pre className="font-mono text-sm leading-relaxed text-red-900/80 dark:text-red-400/80 bg-surface border border-red-500/10 p-8 rounded-3xl whitespace-pre-wrap shadow-inner max-h-[400px] overflow-y-auto custom-scrollbar selection:bg-red-500/20">
               {inc.message}
             </pre>
             <div className="absolute top-4 right-4 h-3 w-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          </div>
          <footer className="mt-8">
            <Link className="inline-flex items-center gap-3 rounded-2xl bg-brand-dark text-brand-yellow px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95" href={`/admin/ops/runbooks#${inc.kind}`}>
              <Activity className="h-4 w-4"/> Ejecutar Runbook de Mitigación
            </Link>
          </footer>
        </section>
      )}

      {/* 04. POSTMORTEM & LOG (PROCESO OPERATIVO) */}
      <div className="grid gap-10 lg:grid-cols-[1fr_450px]">
        
        {/* DOCUMENTACIÓN POSTMORTEM (BÓVEDA ESTRATÉGICA) */}
        <section className="rounded-[3rem] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-16 shadow-pop space-y-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
             <Database className="h-48 w-48 text-brand-blue" />
          </div>
          
          <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 relative z-10">
            <div className="space-y-3">
               <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
                  <Layout className="h-4 w-4" /> Root Cause Analysis
               </div>
               <h2 className="font-heading text-4xl text-main tracking-tight">Reporte de Postmortem</h2>
               <p className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-40 italic">Incident Lifecycle Management · mmxxvi</p>
            </div>
            <Button onClick={savePostmortem} disabled={loading} className="rounded-2xl h-14 px-10 bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95 group">
              <Save className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform"/> Consolidar Registro
            </Button>
          </header>

          <div className="grid gap-10 sm:grid-cols-2 relative z-10">
            <div className="space-y-3 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Operador Responsable (Owner)</label>
              <div className="relative group">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue opacity-30 group-focus-within:opacity-100 transition-opacity" />
                 <input className="w-full h-14 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-bold text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner" value={pm.owner || ''} onChange={(e) => setPm({ ...pm, owner: e.target.value })} placeholder="Nombre del Nodo de Comando" />
              </div>
            </div>

            <div className="space-y-3 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Impacto Sistémico al Cliente</label>
              <textarea className="w-full h-32 p-6 rounded-[2rem] border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-light leading-relaxed text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all resize-none italic shadow-inner custom-scrollbar" value={pm.customer_impact || ''} onChange={(e) => setPm({ ...pm, customer_impact: e.target.value })} placeholder="Describe la degradación del servicio percibida por los viajeros..." />
            </div>

            <div className="space-y-3 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Cronología Forense (Timeline)</label>
              <div className="relative">
                 <textarea className="w-full h-48 p-8 rounded-[2.5rem] bg-[#0a0a0a] text-emerald-500 font-mono text-xs leading-relaxed outline-none border border-white/5 transition-all resize-none shadow-2xl custom-scrollbar selection:bg-brand-blue/30" value={pm.timeline || ''} onChange={(e) => setPm({ ...pm, timeline: e.target.value })} placeholder="12:01 - Spike detectado en pasarela Stripe..." />
                 <div className="absolute top-4 left-4 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-green-600 flex items-center gap-2 ml-1"><CheckCircle2 className="h-4 w-4 opacity-50"/> Puntos de Estabilidad</label>
              <textarea className="w-full h-40 p-6 rounded-[2rem] border border-green-500/20 bg-green-500/[0.02] text-sm font-light leading-relaxed text-main outline-none focus:ring-4 focus:ring-green-500/10 transition-all resize-none shadow-inner custom-scrollbar" value={pm.what_went_well || ''} onChange={(e) => setPm({ ...pm, what_went_well: e.target.value })} placeholder="¿Qué procesos funcionaron?" />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-red-600 flex items-center gap-2 ml-1"><XCircle className="h-4 w-4 opacity-50"/> Fricciones (Went Wrong)</label>
              <textarea className="w-full h-40 p-6 rounded-[2rem] border border-red-500/20 bg-red-500/[0.02] text-sm font-light leading-relaxed text-main outline-none focus:ring-4 focus:ring-red-500/10 transition-all resize-none shadow-inner custom-scrollbar" value={pm.what_went_wrong || ''} onChange={(e) => setPm({ ...pm, what_went_wrong: e.target.value })} placeholder="¿Qué bloqueó la respuesta rápida?" />
            </div>
          </div>
        </section>

        {/* LOG DE ACTIVIDAD OPERATIVA (TERMINAL OSCURA) */}
        <aside className="space-y-6 lg:sticky lg:top-8">
          <div className="rounded-[3rem] border border-brand-dark/20 bg-brand-dark p-8 md:p-10 text-white shadow-pop flex flex-col min-h-[850px] relative overflow-hidden group">
            
            <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
               <Activity className="h-48 w-48 text-brand-yellow" />
            </div>

            <header className="flex items-center gap-4 mb-10 border-b border-white/5 pb-8 relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-brand-yellow/10 flex items-center justify-center text-brand-yellow shadow-inner ring-1 ring-brand-yellow/20">
                 <Activity className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                 <h2 className="font-heading text-2xl tracking-tight">Live Activity Log</h2>
                 <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/30">Ops Transmission Protocol</p>
              </div>
            </header>

            {/* Inyector de Comentarios */}
            <div className="space-y-4 mb-12 relative z-10">
              <div className="relative">
                 <select className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow outline-none focus:ring-2 focus:ring-brand-yellow/20 appearance-none cursor-pointer hover:bg-white/10 transition-colors shadow-inner" value={noteKind} onChange={(e) => setNoteKind(e.target.value as any)}>
                   <option value="note">MENSAJE INFORMATIVO</option>
                   <option value="action">MANIOBRA TÉCNICA</option>
                   <option value="status">CAMBIO DE ETAPA</option>
                 </select>
                 <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 rotate-90 opacity-40 pointer-events-none" />
              </div>
              <textarea className="w-full h-32 p-5 rounded-[1.5rem] border border-white/10 bg-white/5 text-sm font-light leading-relaxed text-white/80 outline-none focus:ring-2 focus:ring-brand-yellow/20 resize-none placeholder:text-white/20 shadow-inner custom-scrollbar" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Transmitir actualización al comando central..." />
              <Button onClick={addUpdate} disabled={loading || !note.trim()} className="w-full h-14 rounded-2xl bg-brand-blue text-white font-bold uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-pop">
                Transmitir al Log
              </Button>
            </div>

            {/* Feed de Eventos */}
            <div className="flex-1 space-y-8 overflow-y-auto pr-3 custom-scrollbar relative z-10">
              {(detail?.updates || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 italic text-xs gap-4">
                   <Terminal className="h-8 w-8" />
                   Awaiting operational input...
                </div>
              ) : (
                detail?.updates.map((u) => (
                  <div key={u.id} className="relative pl-8 border-l border-white/10 group/log">
                    <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-brand-yellow shadow-[0_0_8px_rgba(251,191,36,0.5)] group-hover/log:scale-150 transition-transform" />
                    <header className="flex items-center justify-between mb-3">
                       <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 opacity-30" />
                          <span className="text-[9px] font-mono text-white/30">{fmt(u.created_at)}</span>
                       </div>
                       <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-brand-yellow bg-brand-yellow/5 px-2 py-0.5 rounded border border-brand-yellow/10">{u.kind}</span>
                    </header>
                    <p className="text-sm font-light leading-relaxed text-white/70 italic">&quot;{u.message}&quot;</p>
                    <div className="mt-4 flex items-center gap-2 text-[9px] uppercase font-bold text-brand-blue/50 tracking-widest">
                       <User className="h-3 w-3" /> Op: {u.actor || 'Root_Node'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

      </div>

      {/* 05. FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldAlert className="h-4 w-4 text-red-500" /> High-Confidence Incident Analysis
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Database className="h-4 w-4 text-brand-blue" /> Immutable Forensic Node v4.1
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Activity className="h-4 w-4 animate-pulse" /> Live Telemetry Synced
        </div>
      </footer>

    </div>
  );
}