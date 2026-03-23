'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  ArrowLeft, Save, Trash2, Globe, CheckCircle2, 
  Hash, Youtube, Video, Play, Clock, AlertTriangle, 
  Sparkles, ExternalLink, Layout, MonitorPlay,
  ChevronRight, Terminal, ShieldCheck, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Lang = 'es' | 'en' | 'fr' | 'de';
type Status = 'draft' | 'published';

type VideoRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  youtube_url: string;
  cover_url: string | null;
  tags: string[];
  lang: Lang | string;
  status: Status | string;
  published_at: string | null;
  updated_at: string;
};

export default function AdminVideoEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<VideoRow | null>(null);

  // 1. CARGA DE DATOS (ESTABLE)
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); 
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/content/videos/${id}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo cargar el video');
      setItem(json.item as VideoRow);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falla técnica al recuperar el video');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // 2. CÁLCULOS SEGUROS
  const tagsStr = useMemo(() => (item?.tags ?? []).join(', '), [item?.tags]);

  const videoId = useMemo(() => {
    if (!item || !item.youtube_url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = item.youtube_url.match(regExp);
    return (match && match[2] && match[2].length === 11) ? match[2] : null;
  }, [item]);

  // 3. ACCIONES DE PERSISTENCIA
  function setField<K extends keyof VideoRow>(key: K, value: VideoRow[K]) {
    setItem((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save(patch?: Partial<VideoRow>) {
    if (!item || !id) return;
    setSaving(true); 
    setError(null);
    try {
      const body = patch ?? {
        title: item.title, slug: item.slug, description: item.description,
        youtube_url: item.youtube_url, cover_url: item.cover_url,
        tags: item.tags, lang: item.lang, status: item.status,
      };
      const res = await adminFetch(`/api/admin/content/videos/${id}`, { 
        method: 'PATCH', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      const json = await res.json().catch(() => ({}));
      
      if (!res.ok || !json?.ok) throw new Error(json?.error?.message || json?.error || 'Error al sincronizar');
      setItem(json.item as VideoRow);
    } catch (err: unknown) { 
      setError(err instanceof Error ? err.message : 'Falla de conexión'); 
    } finally { 
      setSaving(false); 
    }
  }

  async function del() {
    if (!id) return;
    if (!confirm('¿Eliminar definitivamente este video? Esta acción detendrá el streaming en la web.')) return;
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/content/videos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar');
      router.push('/admin/content/videos');
    } catch (err: unknown) { 
      setError(err instanceof Error ? err.message : 'Error al eliminar el video'); 
      setSaving(false); 
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-40 text-center animate-in fade-in duration-1000">
        <div className="relative inline-block mb-8">
           <MonitorPlay className="h-16 w-16 text-red-500 opacity-20 animate-pulse" />
           <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-6 w-6 text-red-500 animate-bounce" />
           </div>
        </div>
        <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-red-500/40">Cargando material visual...</div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <AlertTriangle className="h-16 w-16 mx-auto text-red-500 opacity-40 mb-8" />
        <h2 className="font-heading text-3xl text-main mb-4 tracking-tight">{error ?? 'Video extraviado'}</h2>
        <Button variant="outline" onClick={() => router.push('/admin/content/videos')} className="rounded-full h-12 px-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Vlog
        </Button>
      </main>
    );
  }

  const isPub = item.status === 'published';

  return (
    <main className="max-w-7xl mx-auto px-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 01. HEADER TÁCTICO */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 mb-12">
        <div className="space-y-4">
          <button 
            type="button" 
            onClick={() => router.push('/admin/content/videos')} 
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-red-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" /> Production Suite / Vlog
          </button>
          <h1 className="font-heading text-4xl md:text-6xl text-main tracking-tighter leading-none">
            {item.title || <span className="opacity-10 italic">Borrador sin título</span>}
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border shadow-sm ${
              isPub ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-brand-yellow border-amber-500/20'
            }`}>
              <div className={`h-2 w-2 rounded-full ${isPub ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              {item.status}
            </span>
            <div className="h-1 w-1 rounded-full bg-brand-dark/10 dark:bg-white/10" />
            <span className="text-[10px] font-mono text-muted flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 opacity-40" /> Corte Final: {new Date(item.updated_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button 
            onClick={() => void save()} 
            disabled={saving} 
            className="rounded-full bg-brand-dark text-brand-yellow hover:bg-brand-blue hover:text-white px-10 h-14 shadow-pop transition-all active:scale-95 text-xs font-bold uppercase tracking-widest"
          >
            <Save className="mr-3 h-4 w-4" /> {saving ? 'Sincronizando...' : 'Guardar Video'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => void save({ status: isPub ? 'draft' : 'published' })} 
            disabled={saving} 
            className={`rounded-full px-8 h-14 border-brand-dark/10 transition-all text-xs font-bold uppercase tracking-widest ${isPub ? 'hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-500/10' : 'bg-green-600 text-white border-green-600 hover:bg-green-700'}`}
          >
            {isPub ? 'Mover a Borrador' : 'Publicar Ahora'}
          </Button>

          <button 
            onClick={() => void del()} 
            disabled={saving} 
            className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/10 bg-red-50 dark:bg-red-500/10 text-red-600 transition-all hover:bg-red-600 hover:text-white disabled:opacity-20 shadow-sm"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-10 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/20 p-6 flex items-center gap-4 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 shadow-sm">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <p className="text-sm font-bold">Error de Sincronización: <span className="font-light">{error}</span></p>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        
        {/* 02. LADO IZQUIERDO: ESTUDIO DE VIDEO */}
        <section className="space-y-8">
          <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 md:p-12 shadow-pop relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.01] pointer-events-none">
               <Video className="h-64 w-64 text-red-600" />
            </div>

            <div className="relative z-10 space-y-10">
              {/* Título Input */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted ml-1 opacity-50">Título de la Producción</label>
                <input 
                  value={item.title} 
                  onChange={(e) => setField('title', e.target.value)} 
                  placeholder="Explorando el centro histórico..." 
                  className="w-full bg-transparent border-none text-3xl md:text-4xl font-heading text-main outline-none placeholder:opacity-10 focus:ring-0 tracking-tighter"
                />
                <div className="h-px w-full bg-gradient-to-r from-red-600/30 via-red-600/10 to-transparent" />
              </div>

              {/* YouTube Source & Preview */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted ml-1 flex items-center gap-2 opacity-50">
                    <Youtube className="h-4 w-4 text-red-600" /> Fuente de Originación (YouTube)
                  </label>
                  <input 
                    value={item.youtube_url} 
                    onChange={(e) => setField('youtube_url', e.target.value)} 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    className="w-full h-14 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 px-6 font-mono text-sm text-main outline-none focus:ring-4 focus:ring-red-600/5 transition-all shadow-inner"
                  />
                </div>

                {/* Reproductor de Previsualización (Studio Monitor) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                       <Play className="h-3 w-3 fill-current" /> Monitor de Salida Web
                    </span>
                    <span className="text-[9px] font-mono text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded border border-green-500/10">Active Stream</span>
                  </div>
                  
                  {videoId ? (
                    <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden border-8 border-brand-dark shadow-2xl bg-black relative group">
                      <iframe
                        title="KCE Studio Output Monitor"
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-[2.5rem] border-2 border-dashed border-brand-dark/10 bg-surface-2 flex flex-col items-center justify-center text-muted group hover:border-brand-blue/30 transition-all duration-500">
                       <MonitorPlay className="h-16 w-16 mb-6 opacity-10 group-hover:scale-110 transition-transform" />
                       <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-40">Esperando señal de video...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted ml-1 opacity-50">Descripción de la Experiencia</label>
                <textarea 
                  value={item.description ?? ''} 
                  onChange={(e) => setField('description', e.target.value || null)} 
                  placeholder="Describe la narrativa visual de este contenido..." 
                  className="min-h-[250px] w-full rounded-[2rem] border border-brand-dark/10 dark:border-white/10 bg-surface-2 p-8 text-sm font-light leading-relaxed text-main outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all resize-none shadow-inner"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 03. LADO DERECHO: ESTRATEGIA (BÓVEDA) */}
        <aside className="space-y-8">
          <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-pop sticky top-8">
            <header className="flex items-center gap-4 border-b border-brand-dark/5 dark:border-white/5 pb-8 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-2xl text-main tracking-tight">Vlog SEO</h2>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">Configuración Global</p>
              </div>
            </header>

            <div className="space-y-8">
              {/* Idioma */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1">Idioma del Video</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40" />
                  <select 
                    value={item.lang} 
                    onChange={(e) => setField('lang', e.target.value)} 
                    className="w-full pl-11 pr-4 h-12 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-bold text-main outline-none appearance-none cursor-pointer shadow-sm focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  >
                    <option value="es">Español (ES)</option>
                    <option value="en">English (EN)</option>
                    <option value="fr">Français (FR)</option>
                    <option value="de">Deutsch (DE)</option>
                  </select>
                </div>
              </div>

              {/* Slug */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1">Slug (URI Web)</label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
                  <input 
                    value={item.slug} 
                    onChange={(e) => setField('slug', e.target.value)} 
                    className="w-full pl-11 h-12 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-xs font-mono text-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none shadow-inner" 
                  />
                </div>
              </div>

              {/* Miniatura */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1">Miniatura Custom (CDN)</label>
                <div className="relative group">
                   <Layout className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
                   <input 
                    value={item.cover_url ?? ''} 
                    onChange={(e) => setField('cover_url', e.target.value || null)} 
                    placeholder="https://cdn.kce.travel/..."
                    className="w-full pl-11 h-12 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-xs text-main outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all shadow-inner" 
                  />
                </div>
                <p className="text-[9px] text-muted italic ml-1 opacity-50">Si se deja vacío, usaremos la miniatura nativa de YT.</p>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-brand-yellow" /> Etiquetas Semánticas
                </label>
                <input 
                  value={tagsStr} 
                  onChange={(e) => setField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} 
                  placeholder="vlog, bogota, tips..."
                  className="w-full h-12 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 px-4 text-xs font-bold text-main outline-none shadow-inner" 
                />
              </div>

              <div className="pt-8 border-t border-brand-dark/5 dark:border-white/5">
                 <Button variant="ghost" size="sm" className="w-full text-brand-blue h-12 rounded-xl hover:bg-brand-blue/5 group">
                    <ExternalLink className="mr-3 h-4 w-4" /> Ver en Canal YouTube <ChevronRight className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                 </Button>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-2xl)] bg-red-500/5 border border-red-500/10 p-8 shadow-sm">
             <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-red-600 mb-4">
                <ShieldCheck className="h-4 w-4" /> Quality Control
             </div>
             <p className="text-[11px] text-red-700/70 font-light leading-relaxed">
                <strong className="font-bold">Knowing Cultures S.A.S.</strong> recomienda videos en 4K. Asegúrate de que el video sea público o esté oculto en YT para que la plataforma pueda procesar el stream correctamente.
             </p>
          </div>
        </aside>

      </div>

      {/* 04. FOOTER TÉCNICO DE SISTEMA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-10 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3.5 w-3.5" /> Video Streaming Engine v2.1
        </div>
        <div className="flex items-center gap-8 text-[10px] font-mono tracking-widest uppercase text-muted mt-4 sm:mt-0">
           <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 opacity-50 text-green-500" /> Stream-Integrity: Validated
           </div>
           <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 opacity-50 text-brand-yellow" /> Cloud-Delivery: Active
           </div>
        </div>
      </footer>

    </main>
  );
}