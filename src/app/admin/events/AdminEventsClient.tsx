'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Activity, Search, RefreshCw, AlertCircle, 
  Database, Eye, Fingerprint, ShieldCheck, 
  Sparkles, Terminal, Code, Hash, Clock,
  Cpu, Zap, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TIPADO DEL NODO DE EVENTOS ---
type EventItem = {
  id: string;
  type: string;
  source: string | null;
  entity_id: string | null;
  dedupe_key: string | null;
  created_at: string | null;
  payload: Record<string, unknown> | null;
};

type TimelineApiResponse = {
  items: EventItem[];
  entityIds: string[];
  requestId?: string;
  error?: string;
};

export function AdminEventsClient() {
  const [sessionId, setSessionId] = useState('');
  const [entityIds, setEntityIds] = useState('');
  const [limit, setLimit] = useState(200);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedEntityIds, setUsedEntityIds] = useState<string[]>([]);
  const [items, setItems] = useState<EventItem[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  const canSearch = useMemo(() => sessionId.trim() || entityIds.trim(), [sessionId, entityIds]);

  // Sincronización inicial con URL Query Params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const sid = url.searchParams.get('session_id')?.trim();
    const eid = url.searchParams.get('entity_id')?.trim();
    const lim = url.searchParams.get('limit')?.trim();

    if (sid) setSessionId(sid);
    if (eid) setEntityIds(eid);
    if (lim) {
      const n = Number(lim);
      if (Number.isFinite(n) && n >= 10 && n <= 500) setLimit(n);
    }
  }, []);

  const runInvestigation = useCallback(async () => {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    const myReqId = ++reqIdRef.current;

    try {
      const qs = new URLSearchParams();
      if (sessionId.trim()) qs.set('session_id', sessionId.trim());
      if (entityIds.trim()) qs.set('entity_id', entityIds.trim());
      qs.set('limit', String(limit));

      const res = await adminFetch(`/api/admin/events/timeline?${qs.toString()}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));

      if (myReqId !== reqIdRef.current) return;

      if (!res.ok) {
        setError(data?.error || 'Falla en la recuperación de trazas forenses');
        setRequestId(data?.requestId || null);
        return;
      }

      setUsedEntityIds(Array.isArray(data?.entityIds) ? data.entityIds : []);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setRequestId(data?.requestId || null);
    } catch (e: unknown) {
      if (myReqId !== reqIdRef.current) return;
      setError(e instanceof Error ? e.message : 'Error inesperado en el nodo forense');
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }, [canSearch, sessionId, entityIds, limit]);

  const eventsSignals = useMemo(() => [
    { label: 'Eventos Recuperados', value: String(items.length), note: 'Trazas en este periodo.' },
    { label: 'Nodos Relacionados', value: String(usedEntityIds.length), note: 'IDs vinculados al Kernel.' }
  ], [items.length, usedEntityIds.length]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA INVESTIGATIVA */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Fingerprint className="h-3.5 w-3.5" /> Investigation Lane: /forensics
          </div>
          <h1 className="font-heading text-4xl md:text-6xl text-main tracking-tighter leading-none">
            Visor de <span className="text-brand-yellow italic font-light">Eventos</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2">
            Traza de auditoría profunda para Knowing Cultures S.A.S. Reconstruye la historia exacta de cada interacción técnica, pago y reserva en milisegundos.
          </p>
        </div>
      </header>

      {/* 02. WORKBENCH OPERATIVO */}
      <AdminOperatorWorkbench
        eyebrow="System Forensics"
        title="Diagnóstico de Conversión"
        description="Si un viajero reporta problemas en el checkout, utiliza el Session ID para reconstruir la secuencia lógica interna. El objetivo es identificar fricciones técnicas."
        actions={[
          { href: '/admin/qa', label: 'QA Integridad', tone: 'primary' },
          { href: '/admin/revenue', label: 'Revenue Hub' }
        ]}
        signals={eventsSignals}
      />

      {/* 03. INSTRUMENTACIÓN DE BÚSQUEDA */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden relative flex flex-col">
        
        <div className="p-8 bg-surface-2/30 border-b border-brand-dark/5 dark:border-white/5">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-end justify-between">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 w-full lg:w-4/5">
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Stripe Session ID</label>
                <div className="relative group">
                  <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
                  <input
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    placeholder="cs_test_..."
                    className="w-full h-14 pl-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface font-mono text-sm text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30"
                  />
                </div>
              </div>

              <div className="space-y-3 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Entity IDs (Kernel Reference)</label>
                <div className="relative group">
                  <Database className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
                  <input
                    value={entityIds}
                    onChange={(e) => setEntityIds(e.target.value)}
                    placeholder="booking_id, deal_id, customer_id..."
                    className="w-full h-14 pl-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface font-mono text-sm text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="space-y-3 w-28">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted text-center block opacity-40">Límite</label>
                <input 
                  type="number" 
                  value={limit} 
                  onChange={(e) => setLimit(Number(e.target.value))} 
                  min={10} max={500} 
                  className="w-full h-14 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-center font-bold text-brand-blue outline-none shadow-sm" 
                />
              </div>
              <Button 
                onClick={() => void runInvestigation()} 
                disabled={!canSearch || loading} 
                className="h-14 rounded-2xl px-10 bg-brand-dark text-brand-yellow shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95 disabled:opacity-30"
              >
                {loading ? <RefreshCw className="mr-3 h-5 w-5 animate-spin" /> : <Search className="mr-3 h-5 w-5" />} 
                Investigar
              </Button>
            </div>
          </div>

          {(usedEntityIds.length > 0 || requestId) && (
            <div className="mt-8 flex flex-wrap items-center gap-4 p-5 rounded-2xl bg-brand-blue/5 border border-brand-blue/10 font-mono text-[10px] text-brand-blue animate-in fade-in">
              <Code className="h-4 w-4 opacity-40" />
              {usedEntityIds.length > 0 && <div><span className="font-bold opacity-40 uppercase">Entities Detected:</span> {usedEntityIds.join(' | ')}</div>}
              {requestId && <div className="border-l border-brand-blue/20 pl-4"><span className="font-bold opacity-40 uppercase">Trace_ID:</span> {requestId}</div>}
            </div>
          )}
        </div>

        {error && (
          <div className="mx-8 mt-6 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/10 p-6 flex items-center gap-4 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2">
            <AlertTriangle className="h-6 w-6 shrink-0 opacity-60" />
            <p className="text-sm font-bold">Investigación Interrumpida: <span className="font-light">{error}</span></p>
          </div>
        )}

        {/* 04. TABLA DE TRAZABILIDAD (LA BÓVEDA) */}
        <div className="overflow-x-auto custom-scrollbar px-2 pb-6">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-5">Timestamp (ISO_8601)</th>
                <th className="px-8 py-5">Trigger Operation</th>
                <th className="px-8 py-5 text-center">Node Source</th>
                <th className="px-8 py-5">Entity Mapping</th>
                <th className="px-8 py-5 text-right">Data Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
              {loading && items.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-40 text-center animate-pulse text-[11px] font-bold uppercase tracking-[0.5em] text-muted bg-surface">Accediendo al histórico del Kernel...</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-40 text-center bg-surface">
                    <Activity className="mx-auto h-16 w-16 text-brand-blue opacity-10 mb-6" />
                    <p className="text-xl font-heading text-main tracking-tight opacity-30">Silencio en el Kernel</p>
                    <p className="text-sm font-light text-muted mt-2 italic">No hay trazas registradas para los criterios instrumentados.</p>
                  </td>
                </tr>
              ) : (
                items.map((ev) => (
                  <tr key={ev.id} className="group transition-colors hover:bg-surface-2/50 cursor-default bg-surface">
                    <td className="px-8 py-8 align-top font-mono text-[11px] text-muted opacity-60">
                      <div className="flex items-center gap-2">
                         <Clock className="h-3.5 w-3.5 opacity-40" />
                         {ev.created_at ? new Date(ev.created_at).toISOString().replace('T', ' ').slice(0, 19) : '—'}
                      </div>
                    </td>
                    <td className="px-8 py-8 align-top">
                      <span className="inline-flex items-center rounded-lg border border-brand-blue/20 bg-brand-blue/5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-blue shadow-inner">
                        {ev.type}
                      </span>
                    </td>
                    <td className="px-8 py-8 align-top text-center font-mono text-[10px] text-muted uppercase tracking-widest">
                      {ev.source ?? 'kernel'}
                    </td>
                    <td className="px-8 py-8 align-top">
                       <div className="flex items-center gap-2 font-mono text-xs text-green-600 dark:text-green-400 font-bold tracking-tighter">
                          <Hash className="h-3.5 w-3.5 opacity-30" />
                          {ev.entity_id ?? <span className="opacity-20">—</span>}
                       </div>
                    </td>
                    <td className="px-8 py-8 align-top text-right">
                      {ev.payload && typeof ev.payload === 'object' && Object.keys(ev.payload).length > 0 ? (
                        <details className="group/payload relative inline-block text-left cursor-pointer">
                          <summary className="inline-flex items-center gap-2 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-main hover:bg-brand-blue hover:text-white transition-all list-none shadow-sm active:scale-95">
                            <Eye className="h-4 w-4" /> Inspeccionar Objeto
                          </summary>
                          {/* JSON Code Viewer Window */}
                          <div className="absolute right-0 top-full z-50 mt-4 w-[550px] overflow-hidden rounded-[2.5rem] border border-brand-dark/20 bg-[#0a0a0a] shadow-2xl animate-in zoom-in-95 pointer-events-auto ring-1 ring-white/10">
                            <div className="bg-brand-dark px-8 py-4 border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow flex justify-between items-center">
                               <div className="flex items-center gap-3">
                                  <div className="h-2 w-2 rounded-full bg-red-500/40" />
                                  <div className="h-2 w-2 rounded-full bg-amber-500/40" />
                                  <div className="h-2 w-2 rounded-full bg-green-500/40" />
                                  <span className="ml-2 opacity-60">Payload Structure</span>
                               </div>
                               <span className="font-mono opacity-30">EV_TRACE_{ev.id.slice(0,8)}</span>
                            </div>
                            <pre className="max-h-[400px] overflow-auto p-8 text-[12px] font-mono text-emerald-400/90 leading-relaxed custom-scrollbar text-left selection:bg-brand-blue/30">
                              {JSON.stringify(ev.payload, null, 4)}
                            </pre>
                            <div className="bg-white/5 px-8 py-3 text-[9px] uppercase tracking-[0.5em] text-white/10 italic text-center">
                               Knowing Cultures Forensic Unit · v3.1
                            </div>
                          </div>
                        </details>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-muted opacity-20 italic">Void Block</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* FOOTER DE INTEGRIDAD TÉCNICA */}
      <footer className="pt-16 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Resolution Traceability
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Cpu className="h-4 w-4 opacity-50" /> Forensic unit v3.1
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-blue">
          <Terminal className="h-4 w-4" /> Protocol: P77-Secure
        </div>
      </footer>
    </div>
  );
}