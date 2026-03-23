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
  Mail, Phone, Terminal, Hash, Layout,
  User, ShieldCheck // <--- Los dos fugitivos añadidos aquí
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

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) try { setSaved(JSON.parse(raw)); } catch {}
    
    adminFetch('/api/admin/segments?entity_type=customers')
      .then(r => r.json())
      .then(j => setSegments(j.items || []))
      .catch(() => null);
  }, []);

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
    { label: 'Identidades', value: total != null ? String(total) : '0', note: 'Viajeros únicos.' },
    { label: 'Alcance', value: String(new Set(items.map(i => i.country).filter(Boolean)).size), note: 'Países activos.' },
    { label: 'Idiomas', value: String(new Set(items.map(i => i.language).filter(Boolean)).size), note: 'Voces detectadas.' },
    { label: 'Segmentos', value: String(segments.length), note: 'Agrupaciones en DB.' }
  ];

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <UserCheck className="h-3.5 w-3.5" /> Customer Intelligence Lane
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tighter">
            Directorio de <span className="text-brand-yellow italic font-light">Clientes</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed">
            Visualización 360 del rastro del viajero. Filtra identidades por demografía, guarda vistas operativas o crea segmentos para campañas de Knowing Cultures.
          </p>
        </div>
        <div className="flex gap-4">
          <Button onClick={exportCsv} disabled={loading || !items.length} variant="outline" className="h-12 rounded-full border-brand-dark/10 shadow-sm font-bold uppercase tracking-widest text-[10px] px-8 hover:bg-surface-2 transition-all">
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </header>

      {/* 02. ESTRATEGIA OPERATIVA */}
      <AdminOperatorWorkbench
        eyebrow="Relational Strategy"
        title="Auditoría de Audiencias"
        description="Identifica patrones de comportamiento por origen o idioma. Usa los segmentos guardados para alimentar flujos de outbound y optimizar el LTV de cada viajero."
        actions={[
          { href: '/admin/deals', label: 'Sales Pipeline', tone: 'primary' },
          { href: '/admin/bookings', label: 'Ver Reservas' },
        ]}
        signals={signals}
      />

      {/* 03. LA BÓVEDA DE DATOS */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden relative flex flex-col">
        
        {/* Instrumentación de Búsqueda */}
        <div className="p-8 pb-10 bg-surface-2/30 border-b border-brand-dark/5 dark:border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <Filter className="h-6 w-6 text-brand-blue opacity-50" />
            <h2 className="font-heading text-2xl text-main tracking-tight uppercase">Filtros de Inteligencia</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-end">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Identidad / Nodo</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
                <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Email, nombre o ID..." className="w-full h-14 pl-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm font-light text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Ubicación (ISO)</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40" />
                <input value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }} placeholder="US, CO, ES..." className="w-full h-14 pl-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm font-bold text-main uppercase outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner" maxLength={2} />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 opacity-60">Idioma</label>
              <div className="relative">
                <Languages className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40" />
                <input value={language} onChange={(e) => { setLanguage(e.target.value); setPage(1); }} placeholder="es, en, fr..." className="w-full h-14 pl-12 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm font-bold text-brand-blue lowercase outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner" maxLength={2} />
              </div>
            </div>
          </div>
        </div>

        {/* Consola de Segmentos Premium */}
        <div className="bg-brand-blue/[0.02] border-b border-brand-dark/5 dark:border-white/5 p-8">
           <div className="flex flex-col xl:flex-row items-center gap-10">
             {/* Vistas Locales */}
             <div className="flex items-center gap-4 w-full xl:w-auto">
               <div className="flex items-center gap-3 text-muted shrink-0">
                  <Layout className="h-4 w-4 opacity-40" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Vistas Locales</span>
               </div>
               <select value={selectedSaved} onChange={(e) => { setSelectedSaved(e.target.value); if(e.target.value) applySaved(e.target.value); }} className="h-12 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface px-5 text-xs font-bold text-brand-blue outline-none min-w-[180px] shadow-sm appearance-none cursor-pointer hover:bg-surface-2 transition-colors">
                 <option value="">Cargar Historial...</option>
                 {saved.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
               </select>
               <div className="flex items-center bg-surface border border-brand-dark/10 dark:border-white/10 rounded-xl overflow-hidden h-12 shadow-sm">
                  <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Nombrar vista..." className="bg-transparent px-5 text-xs outline-none w-36 font-light text-main" />
                  <button onClick={saveCurrent} disabled={!saveName.trim()} className="px-5 text-brand-blue hover:bg-brand-blue hover:text-white transition-all h-full border-l border-brand-dark/10 active:bg-brand-blue/90"><Save className="h-4 w-4" /></button>
               </div>
               <button onClick={() => selectedSaved && deleteSaved(selectedSaved)} disabled={!selectedSaved} className="h-12 w-12 flex items-center justify-center rounded-xl border border-red-500/10 bg-red-50 dark:bg-red-500/5 text-red-600 disabled:opacity-20 hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 className="h-4 w-4"/></button>
             </div>

             <div className="hidden xl:block h-10 w-px bg-brand-dark/5 dark:bg-white/5" />

             {/* Segmentos DB */}
             <div className="flex items-center gap-4 w-full xl:w-auto">
               <div className="flex items-center gap-3 text-muted shrink-0">
                  <Database className="h-4 w-4 opacity-40" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Global Segments</span>
               </div>
               <select value={selectedSegment} onChange={(e) => { setSelectedSegment(e.target.value); if(e.target.value) applySegment(e.target.value); }} className="h-12 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface px-5 text-xs font-bold text-brand-blue outline-none min-w-[180px] shadow-sm appearance-none cursor-pointer hover:bg-surface-2 transition-colors">
                 <option value="">Sincronizar DB...</option>
                 {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
               <div className="flex items-center bg-surface border border-brand-dark/10 dark:border-white/10 rounded-xl overflow-hidden h-12 shadow-sm">
                  <input value={segmentName} onChange={(e) => setSegmentName(e.target.value)} placeholder="Crear global..." className="bg-transparent px-5 text-xs outline-none w-36 font-light text-main" />
                  <button onClick={() => void saveAsSegment()} disabled={!segmentName.trim() || loading} className="px-5 text-[10px] font-bold uppercase tracking-widest text-brand-blue hover:bg-brand-blue hover:text-white transition-all h-full border-l border-brand-dark/10 active:bg-brand-blue/90">Deploy</button>
               </div>
             </div>
           </div>
        </div>

        {/* Listado de Identidades */}
        <div className="overflow-x-auto custom-scrollbar px-2 pb-6">
          <table className="w-full text-left text-sm min-w-[1100px]">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-5">Entidad Viajera</th>
                <th className="px-8 py-5">Canales de Contacto</th>
                <th className="px-8 py-5 text-center">Perfil Demográfico</th>
                <th className="px-8 py-5">Fecha Alta</th>
                <th className="px-8 py-5 text-right">Mando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-40 text-center animate-pulse text-[11px] font-bold uppercase tracking-[0.5em] text-muted bg-surface">Interrogando al núcleo de identidad...</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-40 text-center bg-surface">
                    <Users className="mx-auto h-16 w-16 text-brand-blue opacity-10 mb-6" />
                    <p className="text-xl font-heading text-main tracking-tight opacity-30">Cero Resultados</p>
                    <p className="text-sm font-light text-muted mt-2 italic">No hay identidades que coincidan con los filtros instrumentados.</p>
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id} className="group transition-colors hover:bg-surface-2/50 cursor-default bg-surface">
                    <td className="px-8 py-8 align-top">
                      <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 border border-brand-blue/5 flex items-center justify-center text-brand-blue font-bold text-sm shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                          {c.name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-heading text-xl text-main group-hover:text-brand-blue transition-colors leading-none tracking-tight">
                            {c.name || <span className="opacity-20 italic">Identidad pendiente</span>}
                          </div>
                          <div className="mt-2 font-mono text-[9px] text-muted uppercase tracking-widest opacity-50 flex items-center gap-2">
                             <Hash className="h-3 w-3" /> {c.id.slice(0,16)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8 align-top">
                      <div className="space-y-2">
                        <div className="font-medium text-main flex items-center gap-3">
                           <Mail className="h-4 w-4 text-brand-blue opacity-30" /> {c.email || <span className="opacity-20">—</span>}
                        </div>
                        <div className="text-[11px] font-mono text-muted flex items-center gap-3">
                           <Phone className="h-4 w-4 text-brand-blue opacity-20" /> {c.phone || <span className="opacity-20 italic font-sans">Sin registro</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8 align-top text-center">
                      <div className="flex justify-center gap-3">
                        <span className="inline-flex items-center gap-2 rounded-xl bg-surface-2 border border-brand-dark/10 dark:border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-main shadow-inner">
                          <Globe className="h-3.5 w-3.5 text-brand-blue opacity-40" /> {c.country || '??'}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-xl bg-surface-2 border border-brand-dark/10 dark:border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-main shadow-inner">
                          <Languages className="h-3.5 w-3.5 text-brand-blue opacity-40" /> {c.language?.toUpperCase() || '??'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-8 align-top">
                       <div className="text-[11px] font-bold text-main">{new Date(c.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                       <div className="text-[9px] font-bold uppercase tracking-widest text-muted opacity-40 mt-1.5 flex items-center gap-1.5">
                         <ShieldCheck className="h-3 w-3 text-green-500" /> Sincronizado
                       </div>
                    </td>
                    <td className="px-8 py-8 align-top text-right">
                      <Button asChild className="rounded-xl bg-brand-dark text-brand-yellow hover:bg-brand-blue hover:text-white shadow-pop transition-all group/btn h-11 px-6 text-[10px] font-bold uppercase tracking-widest">
                        <Link href={`/admin/customers/${encodeURIComponent(c.id)}`}>
                          Perfil 360 <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Estratégica */}
        {pages > 1 && (
          <footer className="p-8 flex items-center justify-between border-t border-brand-dark/5 dark:border-white/5 bg-surface-2/30 gap-6">
            <Button variant="outline" disabled={page <= 1 || loading} onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-full h-12 px-10 border-brand-dark/10 text-[10px] font-bold uppercase tracking-widest hover:bg-surface transition-all">
              <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
            
            <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-60">
              Nodo de Datos <span className="text-main font-bold">{page}</span> de {pages}
            </div>

            <Button variant="outline" disabled={page >= pages || loading} onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-full h-12 px-10 border-brand-dark/10 text-[10px] font-bold uppercase tracking-widest hover:bg-surface transition-all">
              Siguiente <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </footer>
        )}
      </section>

      {/* FOOTER DE INTEGRIDAD */}
      <footer className="pt-16 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Terminal className="h-4 w-4" /> Segmentation Unit v2.4
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-blue">
          <Sparkles className="h-4 w-4" /> Intelligent Audience Sync Active
        </div>
      </footer>

    </div>
  );
}