'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  ArrowLeft, Save, Trash2, Globe, CheckCircle2, 
  Hash, Youtube, Video, Play, Clock, AlertTriangle, 
  Sparkles, ExternalLink, Layout, MonitorPlay,
  ChevronRight
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
  
  // UX Pro / Next.js 15+: Extraemos el ID de forma segura con el hook useParams
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

  // 2. CÁLCULOS SEGUROS (Blindados contra null)
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

  // 4. ESTADOS DE CARGA / ERROR
  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-32 text-center">
        <MonitorPlay className="h-12 w-12 mx-auto text-rose-500/20 mb-6 animate-pulse"/>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-rose-500/40">Cargando material visual...</div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-rose-500 mb-6" />
        <h2 className="font-heading text-2xl text-[color:var(--color-text)] mb-4">{error ?? 'Video extraviado'}</h2>
        <Button variant="outline" onClick={() => router.push('/admin/content/videos')} className="rounded-full">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Vlog
        </Button>
      </main>
    );
  }

  const isPub = item.status === 'published';

  return (
    <main className="max-w-7xl mx-auto px-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER TÁCTICO */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 mb-12">
        <div className="space-y-4">
          <button 
            type="button" 
            onClick={() => router.push('/admin/content/videos')} 
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 hover:text-rose-600 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> Gestión de Vlog
          </button>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            {item.title || <span className="opacity-20 italic">Producción sin título</span>}
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border shadow-sm ${
              isPub ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            }`}>
              <div className={`h-1.5 w-1.5 rounded-full ${isPub ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {item.status}
            </span>
            <div className="h-1 w-1 rounded-full bg-[color:var(--color-border)]" />
            <span className="text-[10px] font-mono text-[color:var(--color-text)]/30 flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Corte Final: {new Date(item.updated_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button 
            onClick={() => void save()} 
            disabled={saving} 
            className="rounded-full bg-brand-dark text-brand-yellow px-8 py-6 shadow-xl hover:scale-105 transition-transform"
          >
            <Save className="mr-2 h-4 w-4" /> {saving ? 'Renderizando...' : 'Guardar Video'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => void save({ status: isPub ? 'draft' : 'published' })} 
            disabled={saving} 
            className={`rounded-full px-6 py-6 border-[color:var(--color-border)] transition-all ${isPub ? 'hover:bg-amber-50 hover:text-amber-700' : 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'}`}
          >
            {isPub ? 'Mover a Draft' : 'Publicar Video'}
          </Button>

          <button 
            onClick={() => void del()} 
            disabled={saving} 
            className="flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-500 transition hover:bg-rose-500 hover:text-white disabled:opacity-20 shadow-sm"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-10 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 animate-in zoom-in-95">
          <AlertTriangle className="h-6 w-6" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        
        {/* LADO IZQUIERDO: ESTUDIO DE VIDEO */}
        <section className="space-y-8">
          <div className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02]">
               <Video className="h-40 w-40 text-rose-600" />
            </div>

            <div className="relative z-10 space-y-10">
              {/* Título */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/40 ml-1">Título del Video</label>
                <input 
                  value={item.title} 
                  onChange={(e) => setField('title', e.target.value)} 
                  placeholder="Explorando el centro histórico..." 
                  className="w-full bg-transparent border-none text-3xl font-heading text-brand-blue outline-none placeholder:opacity-10 focus:ring-0"
                />
                <div className="h-px w-full bg-gradient-to-r from-brand-blue/20 to-transparent" />
              </div>

              {/* YouTube Source & Preview */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/40 ml-1 flex items-center gap-2">
                    <Youtube className="h-3.5 w-3.5 text-rose-600" /> Fuente de YouTube
                  </label>
                  <input 
                    value={item.youtube_url} 
                    onChange={(e) => setField('youtube_url', e.target.value)} 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    className="w-full h-14 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-6 font-mono text-sm text-brand-blue outline-none focus:ring-4 focus:ring-rose-500/5 transition-all"
                  />
                </div>

                {/* Reproductor de Previsualización */}
                {videoId ? (
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30 ml-1 flex items-center gap-1.5">
                      <Play className="h-2.5 w-2.5" /> Monitor de Salida
                    </span>
                    <div className="aspect-video w-full rounded-[2rem] overflow-hidden border border-[color:var(--color-border)] bg-black shadow-2xl">
                      <iframe
                        title="Monitor de salida de YouTube" // ✅ FIX ACCESIBILIDAD
                        src={`https://www.youtube.com/embed/${videoId}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-[2rem] border-2 border-dashed border-[color:var(--color-border)] flex flex-col items-center justify-center text-[color:var(--color-text)]/50">
                     <MonitorPlay className="h-12 w-12 mb-4 opacity-50" />
                     <p className="text-xs font-bold uppercase tracking-widest">Esperando URL válida...</p>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/40 ml-1">Descripción del Contenido</label>
                <textarea 
                  value={item.description ?? ''} 
                  onChange={(e) => setField('description', e.target.value || null)} 
                  placeholder="Describe la experiencia de este video..." 
                  className="min-h-[250px] w-full rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-8 text-sm font-light leading-relaxed text-[color:var(--color-text)]/70 outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* LADO DERECHO: METADATOS Y ESTRATEGIA */}
        <aside className="space-y-8">
          <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-xl sticky top-24">
            <header className="flex items-center gap-3 border-b border-[color:var(--color-border)] pb-6 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/5 text-rose-600">
                <Layout className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl text-brand-blue">Vlog Strategy</h2>
            </header>

            <div className="space-y-6">
              {/* Idioma */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 ml-1">Idioma del Video</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30" />
                  <select 
                    value={item.lang} 
                    onChange={(e) => setField('lang', e.target.value)} 
                    className="w-full pl-11 pr-4 h-12 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-sm font-bold text-brand-blue outline-none appearance-none cursor-pointer"
                  >
                    <option value="es">Español (ES)</option>
                    <option value="en">English (EN)</option>
                    <option value="fr">Français (FR)</option>
                    <option value="de">Deutsch (DE)</option>
                  </select>
                </div>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 ml-1">Slug (Ruta Web)</label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                  <input 
                    value={item.slug} 
                    onChange={(e) => setField('slug', e.target.value)} 
                    className="w-full pl-11 h-12 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-xs font-mono text-brand-blue outline-none" 
                  />
                </div>
              </div>

              {/* Cover URL */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 ml-1">Miniatura (URL Opcional)</label>
                <input 
                  value={item.cover_url ?? ''} 
                  onChange={(e) => setField('cover_url', e.target.value || null)} 
                  placeholder="https://..."
                  className="w-full h-12 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 text-xs outline-none" 
                />
                <p className="text-[9px] text-[color:var(--color-text)]/30 italic">Por defecto usaremos la miniatura de YouTube.</p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 ml-1 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-brand-yellow" /> Etiquetas SEO
                </label>
                <input 
                  value={tagsStr} 
                  onChange={(e) => setField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} 
                  placeholder="vlog, bogota, tips..."
                  className="w-full h-12 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 text-xs font-medium text-brand-blue outline-none" 
                />
              </div>

              <div className="pt-6 border-t border-[color:var(--color-border)]">
                 <Button variant="ghost" size="sm" className="w-full text-brand-blue/60 group">
                    <ExternalLink className="mr-2 h-4 w-4" /> Ver en YouTube <ChevronRight className="ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </Button>
              </div>
            </div>
          </div>

          {/* Tips de Calidad */}
          <div className="rounded-[2.5rem] bg-rose-500/5 border border-rose-500/10 p-8">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rose-600 mb-3">
                <CheckCircle2 className="h-3.5 w-3.5" /> Calidad de Video
             </div>
             <p className="text-[11px] text-rose-700/60 font-light leading-relaxed">
               Asegúrate de que el video sea público o esté oculto (no privado). Los videos privados no se cargarán en el motor de KCE.
             </p>
          </div>
        </aside>

      </div>
    </main>
  );
}