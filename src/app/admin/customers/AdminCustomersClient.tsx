'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  Search, Globe, Languages, Users, Save, 
  Download, Trash2, FolderGit2, ChevronLeft, 
  ChevronRight, ArrowUpRight, Activity, 
  Filter, Database, Sparkles, UserCheck,
  Mail, Phone 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TIPADO DEL NÚCLEO DE IDENTIDAD ---
type Customer = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  country: string | null;
  language: string | null;
  created_at: string;
};

type CustomerFilter = {
  q?: string;
  country?: string;
  language?: string;
};

type Segment = {
  id: string;
  name: string;
  entity_type: 'leads' | 'customers';
  filter: CustomerFilter;
  description: string | null;
  last_run_at: string | null;
  last_run_count: number | null;
  created_at: string;
};

type SavedCustomerFilter = CustomerFilter & { name: string };

const LS_KEY = 'kce_admin_customer_filters_v1';

export function AdminCustomersClient() {
  // Filtros de búsqueda
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  // Gestión de Vistas y Segmentos
  const [saved, setSaved] = useState<SavedCustomerFilter[]>([]);
  const [selectedSaved, setSelectedSaved] = useState('');
  const [saveName, setSaveName] = useState('');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState('');
  const [segmentName, setSegmentName] = useState('');

  // Estado de Datos
  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pages = useMemo(() => {
    if (total == null) return 1;
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  // --- CARGA DE DATOS ---
  const load = useCallback(async () => {
    setLoading(true); 
    setErr(null);
    try {
      const qs = new URLSearchParams();
      if (q.trim()) qs.set('q', q.trim());
      if (country.trim()) qs.set('country', country.trim());
      if (language.trim()) qs.set('language', language.trim());
      qs.set('page', String(page)); 
      qs.set('limit', String(limit));

      const resp = await adminFetch(`/api/admin/customers?${qs.toString()}`, { cache: 'no-store' });
      const json = await resp.json().catch(() => ({}));
      
      if (!resp.ok) throw new Error(json?.error || 'Falla en el núcleo de datos');
      
      setItems(json?.items || []); 
      setTotal(json?.total ?? null);
    } catch (e: unknown) { 
      setErr(e instanceof Error ? e.message : 'Error de sincronización'); 
    } finally { 
      setLoading(false); 
    }
  }, [q, country, language, page, limit]);

  useEffect(() => { void load(); }, [load]);

  // Carga inicial de persistencia
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) try { setSaved(JSON.parse(raw)); } catch {}
    
    adminFetch('/api/admin/segments?entity_type=customers')
      .then(r => r.json())
      .then(j => setSegments(j.items || []))
      .catch(() => null);
  }, []);

  // --- ACCIONES DE SEGMENTACIÓN ---
  const saveAsSegment = async () => {
    const name = segmentName.trim(); 
    if (!name) return;
    try {
      const payload = {
        name, 
        entity_type: 'customers',
        filter: { q, country, language },
      };
      const resp = await adminFetch('/api/admin/segments', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (!resp.ok) throw new Error('Error al crear segmento global');
      setSegmentName('');
      
      // Refresco de segmentos de base de datos
      const r = await adminFetch('/api/admin/segments?entity_type=customers');
      const j = await r.json();
      setSegments(j.items || []);
    } catch (e: unknown) { 
      setErr(e instanceof Error ? e.message : 'Error al persistir segmento'); 
    }
  };

  const saveCurrent = () => {
    const name = saveName.trim(); 
    if (!name) return;
    const next: SavedCustomerFilter = { name, q, country, language };
    const updated = [next, ...saved.filter(x => x.name !== name)].slice(0, 25);
    setSaved(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setSaveName('');
    setSelectedSaved(name);
  };

  const applySaved = (name: string) => {
    const f = saved.find(x => x.name === name);
    if (!f) return;
    setQ(f.q || ''); 
    setCountry(f.country || ''); 
    setLanguage(f.language || ''); 
    setPage(1);
  };

  const applySegment = (id: string) => {
    const seg = segments.find(x => x.id === id);
    if (!seg) return;
    const f = seg.filter;
    setQ(f.q || ''); 
    setCountry(f.country || ''); 
    setLanguage(f.language || ''); 
    setPage(1);
  };

  const deleteSaved = (name: string) => {
    const updated = saved.filter((x) => x.name !== name);
    setSaved(updated); 
    if (selectedSaved === name) setSelectedSaved(''); 
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  };

  const exportCsv = () => {
    const qs = new URLSearchParams({ q, country, language });
    window.open(`/api/admin/customers/export?${qs.toString()}`, '_blank');
  };

  const signals = [
    { label: 'Entidades en Radar', value: total != null ? String(total) : '—', note: 'Viajeros identificados.' },
    { label: 'Cobertura Global', value: String(new Set(items.map(i => i.country).filter(Boolean)).size), note: 'Países representados hoy.' },
    { label: 'Voz del Cliente', value: String(new Set(items.map(i => i.language).filter(Boolean)).size), note: 'Idiomas detectados.' },
    { label: 'Clusters Activos', value: String(segments.length), note: 'Segmentos en base de datos.' }
  ];

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 01. CABECERA INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <UserCheck className="h-3.5 w-3.5" /> Customer Intelligence Lane
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue">
            Directorio de <span className="text-brand-yellow italic font-light">Clientes</span>
          </h1>
          <p className="mt-4 text-base text-[var(--color-text)]/50 font-light max-w-2xl italic leading-relaxed">
            Visualización 360 del rastro del viajero. Filtra por demografía, guarda vistas locales o crea segmentos globales.
          </p>
        </div>
      </header>

      {/* 02. ESTRATEGIA OPERATIVA */}
      <AdminOperatorWorkbench
        eyebrow="Relational Strategy"
        title="Datos que mueven el negocio"
        description="Identifica patrones de compra por país o idioma. Usa los segmentos para alimentar secuencias de email personalizadas mediante el mando de outbound."
        actions={[
          { href: '/admin/deals', label: 'Sales Pipeline', tone: 'primary' },
          { href: '/admin/bookings', label: 'Bookings Log' },
        ]}
        signals={signals}
      />

      {/* 03. LA BÓVEDA DE DATOS */}
      <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl overflow-hidden relative">
        
        {/* Instrumentación de Búsqueda */}
        <div className="p-8 pb-10">
          <div className="flex items-center gap-3 mb-8">
            <Filter className="h-5 w-5 text-brand-blue/40" />
            <h2 className="font-heading text-xl text-brand-blue uppercase tracking-tight">Instrumentación de Búsqueda</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Identidad / Contacto</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Email, nombre o ID..." className="w-full h-14 pl-12 rounded-2xl border border-[var(--color-border)] bg-white text-sm font-light outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">País (ISO)</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30" />
                <input value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }} placeholder="Ej: US, CO, FR" className="w-full h-14 pl-12 rounded-2xl border border-[var(--color-border)] bg-white text-sm font-bold text-brand-blue uppercase outline-none" maxLength={2} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Idioma</label>
              <div className="relative">
                <Languages className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30" />
                <input value={language} onChange={(e) => { setLanguage(e.target.value); setPage(1); }} placeholder="Ej: es, en" className="w-full h-14 pl-12 rounded-2xl border border-[var(--color-border)] bg-white text-sm font-bold text-brand-blue lowercase outline-none" maxLength={2} />
              </div>
            </div>
            <Button onClick={exportCsv} disabled={loading || !items.length} variant="outline" className="h-14 rounded-2xl border-[var(--color-border)] bg-white shadow-sm font-bold uppercase tracking-widest text-[10px]">
              <Download className="mr-2 h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        </div>

        {/* Consola de Segmentos Premium */}
        <div className="bg-brand-blue/[0.03] border-y border-[var(--color-border)] p-8">
           <div className="flex flex-col xl:flex-row items-center gap-8">
             <div className="flex items-center gap-4 w-full xl:w-auto">
               <div className="flex items-center gap-2 text-brand-blue/40 shrink-0">
                  <Activity className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Vistas Locales</span>
               </div>
               <select value={selectedSaved} onChange={(e) => { setSelectedSaved(e.target.value); if(e.target.value) applySaved(e.target.value); }} className="h-11 rounded-xl border border-brand-blue/10 bg-white px-4 text-xs font-bold text-brand-blue outline-none min-w-[160px] shadow-sm appearance-none cursor-pointer">
                 <option value="">Cargar Local...</option>
                 {saved.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
               </select>
               <div className="flex items-center bg-white border border-brand-blue/10 rounded-xl overflow-hidden h-11 shadow-sm">
                  <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Guardar vista..." className="bg-transparent px-4 text-xs outline-none w-32 font-light" />
                  <button onClick={saveCurrent} disabled={!saveName.trim()} className="px-4 text-brand-blue hover:bg-brand-blue hover:text-white transition-all h-full border-l border-brand-blue/10"><Save className="h-4 w-4" /></button>
               </div>
               <button onClick={() => selectedSaved && deleteSaved(selectedSaved)} disabled={!selectedSaved} className="h-11 w-11 flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-50 text-rose-600 disabled:opacity-30 hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="h-4 w-4"/></button>
             </div>

             <div className="hidden xl:block h-8 w-px bg-brand-blue/10" />

             <div className="flex items-center gap-4 w-full xl:w-auto">
               <div className="flex items-center gap-2 text-brand-blue/40 shrink-0">
                  <Database className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">DB Segments</span>
               </div>
               <select value={selectedSegment} onChange={(e) => { setSelectedSegment(e.target.value); if(e.target.value) applySegment(e.target.value); }} className="h-11 rounded-xl border border-brand-blue/10 bg-white px-4 text-xs font-bold text-brand-blue outline-none min-w-[160px] shadow-sm appearance-none cursor-pointer">
                 <option value="">Base de Datos...</option>
                 {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
               <div className="flex items-center bg-white border border-brand-blue/10 rounded-xl overflow-hidden h-11 shadow-sm">
                  <input value={segmentName} onChange={(e) => setSegmentName(e.target.value)} placeholder="Crear global..." className="bg-transparent px-4 text-xs outline-none w-32 font-light" />
                  <button onClick={() => void saveAsSegment()} disabled={!segmentName.trim() || loading} className="px-4 text-[10px] font-bold uppercase tracking-widest text-brand-blue hover:bg-brand-blue hover:text-white transition-all h-full border-l border-brand-blue/10">Crear</button>
               </div>
             </div>
           </div>
        </div>

        {/* Listado de Identidades */}
        <div className="overflow-x-auto px-6 py-6">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm min-w-[1100px]">
              <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40">
                  <th className="px-8 py-6">Entidad Viajera</th>
                  <th className="px-8 py-6">Canales de Contacto</th>
                  <th className="px-8 py-6 text-center">Demografía Técnica</th>
                  <th className="px-8 py-6">Fecha Alta</th>
                  <th className="px-8 py-6 text-right">Mando</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-24 text-center animate-pulse text-xs font-bold uppercase tracking-widest text-brand-blue/20">Interrogando al núcleo de identidad...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-32 text-center"><Users className="mx-auto h-12 w-12 text-brand-blue/10 mb-6" /><p className="text-lg font-light text-[var(--color-text)]/30 italic">No se han encontrado registros.</p></td></tr>
                ) : (
                  items.map((c) => (
                    <tr key={c.id} className="group transition-all hover:bg-brand-blue/[0.01]">
                      <td className="px-8 py-6 align-top">
                        <div className="font-heading text-lg text-brand-blue group-hover:text-brand-yellow transition-colors leading-tight">{c.name || <span className="opacity-20 italic">Identidad pendiente</span>}</div>
                        <div className="mt-1 font-mono text-[9px] text-[var(--color-text)]/20 uppercase tracking-tighter">ID: {c.id.slice(0,16)}...</div>
                      </td>
                      <td className="px-8 py-6 align-top">
                        <div className="font-medium text-brand-dark flex items-center gap-2">
                           <Mail className="h-3.5 w-3.5 text-brand-blue/30" /> {c.email || '—'}
                        </div>
                        <div className="mt-1 text-[10px] font-mono text-[var(--color-text)]/40 flex items-center gap-2">
                           <Phone className="h-3.5 w-3.5 text-brand-blue/20" /> {c.phone || 'Sin registro'}
                        </div>
                      </td>
                      <td className="px-8 py-6 align-top text-center">
                        <div className="flex justify-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-blue/70 shadow-inner">
                            <Globe className="h-3 w-3 opacity-30" /> {c.country || '??'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-blue/70 shadow-inner">
                            <Languages className="h-3 w-3 opacity-30" /> {c.language || '??'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 align-top">
                         <div className="text-[11px] font-bold text-brand-dark/60">{new Date(c.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                         <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/20 mt-1">Sincronizado</div>
                      </td>
                      <td className="px-8 py-6 align-top text-right">
                        <Button asChild size="sm" className="rounded-xl bg-brand-dark text-brand-yellow shadow-lg hover:scale-105 transition-transform group/btn">
                          <Link href={`/admin/customers/${encodeURIComponent(c.id)}`}>
                            Perfil 360 <ArrowUpRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación Estratégica */}
        {pages > 1 && (
          <footer className="p-8 pt-4 flex items-center justify-between border-t border-[var(--color-border)] bg-white/50 backdrop-blur-sm">
            <Button variant="outline" disabled={page <= 1 || loading} onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-full px-8">
              <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text)]/30">Página {page} <span className="opacity-20">/</span> {pages}</div>
            <Button variant="outline" disabled={page >= pages || loading} onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-full px-8">
              Siguiente <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </footer>
        )}
      </section>

      <footer className="pt-10 flex flex-wrap items-center justify-center gap-12 border-t border-[var(--color-border)] opacity-20 hover:opacity-50 transition-opacity duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <FolderGit2 className="h-3.5 w-3.5" /> Segmentation Unit v2.4
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Sparkles className="h-3.5 w-3.5" /> Intelligent Audience Sync
        </div>
      </footer>

    </div>
  );
}