'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Filter, Users, Database, Play, Trash2, Plus, 
  RefreshCw, Tag, Terminal, Fingerprint, 
  Layers, Search, ShieldCheck, ArrowUpRight,
  ChevronRight, AlertCircle, FileJson,
  Clock // ✅ Agrega esta línea aquí
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
    setLoading(true); setErr(null);
    try {
      const resp = await adminFetch('/api/admin/segments', { cache: 'no-store' });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Err_Segments_Node');
      setItems(Array.isArray(json?.items) ? json.items : []);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    const n = name.trim();
    if (!n) return setErr('Name_Required');
    const parsed = safeJsonParse(filterJson);
    if (!parsed.ok) return setErr(parsed.error);

    setLoading(true); setErr(null);
    try {
      const resp = await adminFetch('/api/admin/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n, entity_type: entityType, description: description.trim() || undefined, filter: parsed.value }),
      });
      if (!resp.ok) throw new Error('Segment_Creation_Denied');
      setName(''); setDescription(''); setFilterJson('{\n  "stage": "new"\n}');
      await load();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const handleRun = async (id: string) => {
    setLoading(true);
    try {
      const resp = await adminFetch(`/api/admin/segments/${id}/run`, { method: 'POST' });
      if (!resp.ok) throw new Error('Query_Execution_Fail');
      await load();
    } catch (e: any) { setErr(e.message); setLoading(false); }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('¿Eliminar permanentemente este nodo de segmento?')) return;
    setLoading(true);
    try {
      const resp = await adminFetch(`/api/admin/segments/${id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Deletion_Denied');
      await load();
    } catch (e: any) { setErr(e.message); setLoading(false); }
  };

  const signals = [
    { label: 'Matriz Activa', value: String(items.length), note: 'Segmentos en DB.' },
    { label: 'Targeting Leads', value: String(items.filter(i => i.entity_type === 'leads').length), note: 'Filtros de prospección.' },
    { label: 'Targeting Clients', value: String(items.filter(i => i.entity_type === 'customers').length), note: 'Filtros de retención.' },
  ];

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER DE INTELIGENCIA DE AUDIENCIA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Fingerprint className="h-3.5 w-3.5" /> Audience Lane: /segments-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Matriz de <span className="text-brand-yellow italic font-light">Segmentos</span>
          </h1>
          <p className="mt-4 text-base text-[color:var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
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
          { href: '/admin/customers', label: 'Ver Clientes' }
        ]}
        signals={signals}
      />

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        
        {/* COLUMNA 1: CONSTRUCTOR DE NODOS */}
        <section className="h-max rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-10 shadow-2xl space-y-8 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 opacity-[0.02] group-hover:rotate-12 transition-transform duration-700"><Filter className="h-64 w-64" /></div>
          
          <header className="flex items-center gap-4 border-b border-[color:var(--color-border)] pb-6 relative z-10">
            <div className="h-10 w-10 rounded-2xl bg-brand-blue/5 text-brand-blue flex items-center justify-center">
               <Plus className="h-5 w-5" />
            </div>
            <h2 className="font-heading text-2xl text-brand-blue">Nuevo Nodo</h2>
          </header>

          <div className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 ml-2">Identificador</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: High_Value_EU"
                className="w-full h-12 px-5 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-sm font-bold text-[color:var(--color-text)] outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 ml-2">Entidad Target</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as any)}
                className="w-full h-12 px-5 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-sm font-bold text-brand-blue outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/5 transition-all"
                disabled={loading}
              >
                <option value="leads">LEADS NODE</option>
                <option value="customers">CUSTOMERS NODE</option>
              </select>
            </div>

            <div className="space-y-2">
              <header className="flex items-center justify-between px-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">Predicate_Logic (JSON)</label>
                <FileJson className="h-3.5 w-3.5 text-brand-blue/30" />
              </header>
              <textarea
                value={filterJson}
                onChange={(e) => setFilterJson(e.target.value)}
                rows={8}
                className="w-full p-5 rounded-xl border border-[color:var(--color-border)] bg-brand-dark text-emerald-400 font-mono text-xs leading-relaxed outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all resize-none shadow-inner"
                disabled={loading}
              />
            </div>

            <Button 
              onClick={handleCreate} 
              disabled={loading || !name.trim()} 
              className="w-full h-14 rounded-2xl bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] transition-transform"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} {loading ? 'Sincronizando...' : 'Inyectar en Matriz'}
            </Button>
            
            {err && (
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-700 flex items-center gap-3 animate-in zoom-in-95">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-[10px] font-mono uppercase font-bold truncate">{err}</p>
              </div>
            )}
          </div>
        </section>

        {/* COLUMNA 2: DIRECTORIO DE BÓVEDA */}
        <section className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[color:var(--color-border)] pb-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-brand-blue/5 text-brand-blue flex items-center justify-center shadow-inner">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-2xl text-[color:var(--color-text)]">Directorio de Cohortes</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30">Node Registry Active</p>
              </div>
            </div>
            <Button onClick={load} disabled={loading} variant="outline" className="h-10 px-6 rounded-xl border-brand-blue/10 text-brand-blue text-[9px] font-bold uppercase tracking-widest">
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Nodes
            </Button>
          </header>

          <div className="overflow-x-auto">
            <div className="rounded-[2.5rem] border border-black/[0.03] bg-[color:var(--color-surface)] overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm border-separate border-spacing-0">
                <thead className="bg-[color:var(--color-surface-2)]">
                  <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/40">
                    <th className="px-8 py-6 rounded-tl-[2.5rem]">Segmento & Metadata</th>
                    <th className="px-8 py-6 text-center">Tipo_Target</th>
                    <th className="px-8 py-6 text-center">Población_Actual</th>
                    <th className="px-8 py-6 text-right rounded-tr-[2.5rem]">Acción Táctica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.03]">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-32 text-center">
                        <Users className="mx-auto h-16 w-16 text-brand-blue/5 mb-6" />
                        <p className="font-heading text-xl text-[color:var(--color-text)]/50 uppercase tracking-tighter">Sin Segmentos Registrados</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((s) => (
                      <tr key={s.id} className="group transition-all hover:bg-brand-blue/[0.01]">
                        <td className="px-8 py-6 align-top">
                          <Link href={`/admin/segments/${s.id}`} className="font-heading text-lg text-brand-blue hover:underline block mb-2 tracking-tighter uppercase">{s.name}</Link>
                          {s.description && <p className="text-[11px] text-[color:var(--color-text)]/50 italic line-clamp-1 max-w-[280px]">"{s.description}"</p>}
                          <div className="mt-4 flex items-center gap-2 text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-brand-blue/30">
                            <Clock className="h-2.5 w-2.5" /> Ingesta: {new Date(s.created_at).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="px-8 py-6 align-top text-center">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-widest ${
                            s.entity_type === 'leads' ? 'bg-amber-500/5 border-amber-500/20 text-amber-600' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'
                          }`}>
                            <Tag className="h-3 w-3 opacity-40" /> {s.entity_type}
                          </span>
                        </td>

                        <td className="px-8 py-6 align-top text-center space-y-2">
                          <div className="text-3xl font-heading text-[color:var(--color-text)]">{s.last_run_count ?? '—'}</div>
                          <p className="text-[8px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30">
                            Trace: {s.last_run_at ? new Date(s.last_run_at).toLocaleTimeString() : 'PENDING'}
                          </p>
                        </td>

                        <td className="px-8 py-6 align-top text-right">
                          <div className="flex justify-end gap-3">
                            <Link href={`/admin/segments/${s.id}`} className="h-10 px-5 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] flex items-center justify-center text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)] hover:bg-brand-blue hover:text-white transition-all">Refinar</Link>
                            <Button onClick={() => handleRun(s.id)} disabled={loading} variant="outline" className="h-10 w-10 rounded-xl border-brand-blue/10 text-brand-blue p-0">
                               <Play className="h-4 w-4 fill-brand-blue" />
                            </Button>
                            <Button onClick={() => handleRemove(s.id)} disabled={loading} variant="outline" className="h-10 w-10 rounded-xl border-rose-500/10 text-rose-500 p-0 hover:bg-rose-500 hover:text-white">
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

      <footer className="mt-12 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity">
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