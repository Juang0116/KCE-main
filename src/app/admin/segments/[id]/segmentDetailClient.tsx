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
  Layers
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
    setLoading(true); setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/segments/${id}`, { cache: 'no-store' });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Node_Fetch_Failure');
      const item = json?.item as Segment;
      setSeg(item);
      setName(item.name || '');
      setDescription(item.description || '');
      setFilterJson(JSON.stringify(item.filter ?? {}, null, 2));
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    const n = name.trim();
    if (!n) return setErr('Name_Required');
    const parsed = safeJsonParse(filterJson);
    if (!parsed.ok) return setErr(parsed.error);
    
    setLoading(true); setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/segments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n, description: description.trim() || null, filter: parsed.value }),
      });
      if (!resp.ok) throw new Error('Save_Operation_Denied');
      await load();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const handleRun = async () => {
    setLoading(true); setErr(null);
    try {
      const resp = await adminFetch(`/api/admin/segments/${id}/run`, { method: 'POST' });
      if (!resp.ok) throw new Error('Query_Execution_Failed');
      await load();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  if (!seg) {
    return (
      <div className="py-20 text-center animate-pulse">
        <RefreshCw className="h-10 w-10 text-brand-blue/20 mx-auto animate-spin mb-4" />
        <p className="text-sm font-light text-[var(--color-text)]/40 italic">Localizando nodo de segmento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 01. MATRIZ DE IDENTIDAD DEL SEGMENTO */}
      <section className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-10 shadow-2xl space-y-10 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-[0.02] rotate-12"><Users className="h-64 w-64" /></div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/30 ml-2">Identificador Comercial</label>
            <div className="relative group">
               <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
               <input
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 className="w-full h-12 pl-12 pr-4 rounded-xl border border-[var(--color-border)] bg-white text-sm font-bold text-brand-dark outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all"
                 placeholder="Ej: High Value Travelers"
               />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/30 ml-2">Entidad de Origen</label>
            <div className="h-12 px-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center gap-3 shadow-inner">
               <Database className="h-4 w-4 text-brand-blue/40" />
               <span className="text-xs font-mono font-bold text-brand-blue uppercase tracking-tighter">{seg.entity_type}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/30 ml-2">Nota Operativa</label>
            <div className="relative group">
               <Layers className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
               <input
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 className="w-full h-12 pl-12 pr-4 rounded-xl border border-[var(--color-border)] bg-white text-sm font-light text-[var(--color-text)]/60 outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all italic"
                 placeholder="Propósito del segmento..."
               />
            </div>
          </div>
        </div>

        {/* 02. EDITOR DE LÓGICA (CONSOLE) */}
        <div className="space-y-3 relative z-10">
          <header className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
               <TerminalIcon className="h-3.5 w-3.5" /> Predicate_Logic_Console
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-[var(--color-text)]/30">
               <FileJson className="h-3 w-3" /> JSON_Strict_Mode
            </div>
          </header>
          <div className="relative group">
            <div className="absolute inset-0 bg-brand-blue/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            <textarea
              value={filterJson}
              onChange={(e) => setFilterJson(e.target.value)}
              rows={12}
              className="w-full p-6 rounded-2xl border border-[var(--color-border)] bg-brand-dark text-emerald-400 font-mono text-xs leading-relaxed outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all resize-none shadow-inner custom-scrollbar"
            />
          </div>
        </div>

        {/* 03. BARRA DE COMANDO Y TELEMETRÍA */}
        <footer className="pt-8 border-t border-[var(--color-border)] flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex flex-wrap items-center gap-4">
            <Button 
              onClick={handleSave} 
              disabled={loading} 
              variant="primary"
              className="h-12 px-8 rounded-xl bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-transform"
            >
              <Save className="mr-2 h-4 w-4" /> Persistir Cambios
            </Button>
            
            <Button 
              onClick={handleRun} 
              disabled={loading} 
              variant="outline"
              className="h-12 px-8 rounded-xl border-brand-blue/20 text-brand-blue font-bold uppercase tracking-widest text-[10px] hover:bg-brand-blue/5 transition-all"
            >
              <Play className="mr-2 h-4 w-4" /> Ejecutar Query
            </Button>

            <Button 
              onClick={load} 
              disabled={loading} 
              variant="ghost"
              className="h-12 px-6 rounded-xl text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-brand-blue transition-colors"
            >
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Sincronizar Nodo
            </Button>
          </div>

          <div className="flex items-center gap-6 bg-white border border-[var(--color-border)] px-6 py-3 rounded-2xl shadow-sm">
             <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-brand-blue opacity-30" />
                <div className="space-y-0.5">
                   <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">Last Transmission</p>
                   <p className="text-[10px] font-mono font-bold text-brand-dark">{seg.last_run_at ? new Date(seg.last_run_at).toLocaleString() : 'NEVER_EXECUTED'}</p>
                </div>
             </div>
             <div className="w-px h-8 bg-[var(--color-border)]" />
             <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-brand-blue opacity-30" />
                <div className="space-y-0.5">
                   <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-text)]/30">Node Count</p>
                   <p className="text-xl font-heading text-brand-blue leading-none">{seg.last_run_count ?? '0'}</p>
                </div>
             </div>
          </div>
        </footer>

        {err && (
          <div className="mt-8 p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-700 flex items-center gap-3 animate-in zoom-in-95">
             <AlertCircle className="h-5 w-5 opacity-40" />
             <p className="text-xs font-mono font-bold uppercase">Error_Log: {err}</p>
          </div>
        )}
      </section>
    </div>
  );
}