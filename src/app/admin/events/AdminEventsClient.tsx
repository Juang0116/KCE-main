'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Activity, Search, RefreshCw, AlertCircle, 
  Database, Eye, Fingerprint, ShieldCheck, 
  Sparkles, Terminal, Code
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

  // UX Pro: Control de concurrencia para evitar saltos de datos
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
        setError(data?.error || 'Fallo en la recuperación de trazas');
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
    { label: 'Eventos Recuperados', value: String(items.length), note: 'Trazas registradas en el nodo.' },
    { label: 'Nodos Detectados', value: String(usedEntityIds.length), note: 'IDs relacionados en el Kernel.' }
  ], [items.length, usedEntityIds.length]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA INVESTIGATIVA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Fingerprint className="h-3.5 w-3.5" /> Investigation Lane: /forensics
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue">
            Visor de <span className="text-brand-yellow italic font-light">Eventos</span>
          </h1>
          <p className="mt-4 text-base text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Traza de auditoría profunda. Reconstruye la historia exacta de cada interacción técnica, pago y reserva en milisegundos.
          </p>
        </div>
      </header>

      {/* 02. WORKBENCH OPERATIVO */}
      <AdminOperatorWorkbench
        eyebrow="System Forensics"
        title="Rastrea Fallos de Conversión"
        description="Si un viajero reporta problemas en el checkout, utiliza el Session ID de Stripe para reconstruir la secuencia lógica interna del sistema."
        actions={[
          { href: '/admin/qa', label: 'QA Integridad', tone: 'primary' },
          { href: '/admin/revenue', label: 'Revenue Hub' }
        ]}
        signals={eventsSignals}
      />

      {/* 03. INSTRUMENTACIÓN DE BÚSQUEDA */}
      <section className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl relative overflow-hidden">
        <div className="p-8 pb-10 border-b border-[var(--color-border)] bg-white/50 backdrop-blur-sm rounded-t-[2.5rem]">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-end justify-between">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 w-full lg:w-4/5">
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Stripe Session ID</label>
                <div className="relative group">
                  <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                  <input
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    placeholder="cs_test_..."
                    className="w-full h-14 pl-12 rounded-2xl border border-[var(--color-border)] bg-white font-mono text-sm outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Entity IDs (Separados por coma)</label>
                <div className="relative group">
                  <Database className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                  <input
                    value={entityIds}
                    onChange={(e) => setEntityIds(e.target.value)}
                    placeholder="booking_id, deal_id, customer_id..."
                    className="w-full h-14 pl-12 rounded-2xl border border-[var(--color-border)] bg-white font-mono text-sm outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="space-y-2 w-24">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/30 text-center block">Límite</label>
                <input 
                  type="number" 
                  value={limit} 
                  onChange={(e) => setLimit(Number(e.target.value))} 
                  min={10} max={500} 
                  className="w-full h-14 rounded-2xl border border-[var(--color-border)] bg-white text-center font-bold text-brand-blue outline-none" 
                />
              </div>
              <Button 
                onClick={() => void runInvestigation()} 
                disabled={!canSearch || loading} 
                className="h-14 rounded-2xl px-8 bg-brand-dark text-brand-yellow shadow-xl hover:scale-105 transition-transform disabled:opacity-50"
              >
                <Search className={`mr-2 h-4 w-4 ${loading ? 'animate-pulse' : ''}`} /> Investigar
              </Button>
            </div>
          </div>

          {(usedEntityIds.length > 0 || requestId) && (
            <div className="mt-8 flex flex-wrap items-center gap-4 p-5 rounded-2xl bg-brand-blue/[0.03] border border-brand-blue/10 font-mono text-[10px] text-brand-blue animate-in fade-in">
              <Code className="h-4 w-4 opacity-40" />
              {usedEntityIds.length > 0 && <div><span className="font-bold opacity-40 uppercase">Entities Detected:</span> {usedEntityIds.join(' | ')}</div>}
              {requestId && <div className="border-l border-brand-blue/20 pl-4"><span className="font-bold opacity-40 uppercase">Trace_ID:</span> {requestId}</div>}
            </div>
          )}
        </div>

        {error && (
          <div className="mx-8 mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 animate-in zoom-in-95">
            <AlertCircle className="h-6 w-6 opacity-40" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* 04. TABLA DE TRAZABILIDAD */}
        <div className="overflow-x-auto px-6 py-8">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-white overflow-hidden shadow-sm">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40">
                  <th className="px-8 py-6">Timestamp (ISO)</th>
                  <th className="px-8 py-6">Tipo / Operación</th>
                  <th className="px-8 py-6 text-center">Nodo Origen</th>
                  <th className="px-8 py-6">ID Entidad</th>
                  <th className="px-8 py-6 text-right">Payload inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {loading && items.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-24 text-center animate-pulse text-xs font-bold uppercase tracking-widest text-brand-blue/20">Accediendo al histórico del Kernel...</td></tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center text-[var(--color-text)]/20 italic">
                      <Activity className="mx-auto h-12 w-12 opacity-10 mb-4" />
                      No hay trazas registradas para los criterios de esta consulta.
                    </td>
                  </tr>
                ) : (
                  items.map((ev) => (
                    <tr key={ev.id} className="group transition-all hover:bg-brand-blue/[0.01]">
                      <td className="px-8 py-6 align-top font-mono text-[10px] text-[var(--color-text)]/60">
                        {ev.created_at ? new Date(ev.created_at).toISOString().replace('T', ' ').slice(0, 19) : '—'}
                      </td>
                      <td className="px-8 py-6 align-top">
                        <span className="inline-flex items-center rounded-lg border border-brand-blue/20 bg-brand-blue/5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-blue shadow-inner">
                          {ev.type}
                        </span>
                      </td>
                      <td className="px-8 py-6 align-top text-center font-mono text-[10px] text-[var(--color-text)]/60 uppercase">
                        {ev.source ?? 'kernel'}
                      </td>
                      <td className="px-8 py-6 align-top font-mono text-xs text-emerald-600 font-bold tracking-tighter">
                        {ev.entity_id ?? '—'}
                      </td>
                      <td className="px-8 py-6 align-top text-right">
                        {ev.payload && typeof ev.payload === 'object' && Object.keys(ev.payload).length > 0 ? (
                          <details className="group/payload relative inline-block text-left cursor-pointer">
                            <summary className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/70 hover:bg-brand-blue hover:text-white transition-all list-none">
                              <Eye className="h-3.5 w-3.5" /> Ver Objeto
                            </summary>
                            <div className="absolute right-0 top-full z-50 mt-2 w-[450px] overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-white shadow-2xl animate-in zoom-in-95 pointer-events-auto">
                              <div className="bg-brand-dark px-6 py-3 border-b border-white/5 text-[9px] font-bold uppercase tracking-widest text-brand-yellow/60 flex justify-between">
                                 <span>Data Payload Structure</span>
                                 <span className="font-mono opacity-50">#ID_{ev.id.slice(0,8)}</span>
                              </div>
                              <pre className="max-h-[350px] overflow-auto p-6 text-[10px] font-mono text-emerald-400 leading-relaxed custom-scrollbar text-left bg-[#0F172A]">
                                {JSON.stringify(ev.payload, null, 2)}
                              </pre>
                            </div>
                          </details>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-[var(--color-text)]/20 italic">Void</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FOOTER DE INTEGRIDAD TÉCNICA */}
      <footer className="pt-10 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Resolution Traceability
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Forensic unit v3.1
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Terminal className="h-3.5 w-3.5" /> Audit Protocol: P77
        </div>
      </footer>
    </div>
  );
}