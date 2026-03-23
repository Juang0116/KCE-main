'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { 
  ArrowLeft, Save, Hash, 
  Globe, CheckCircle2, Youtube, Sparkles, 
  MonitorPlay, Play, AlertTriangle, 
  Link as LinkIcon,
  Image as ImageIcon,
  Terminal, ShieldCheck, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Lang = 'es' | 'en' | 'fr' | 'de';
type Status = 'draft' | 'published';

export default function AdminVideoNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [tags, setTags] = useState('');
  const [lang, setLang] = useState<Lang>('es');
  const [status, setStatus] = useState<Status>('draft');

  // CÁLCULOS DINÁMICOS
  const tagsArray = useMemo(
    () => tags.split(',').map((t) => t.trim()).filter(Boolean),
    [tags],
  );

  const videoId = useMemo(() => {
    if (!youtubeUrl) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = youtubeUrl.match(regExp);
    return (match?.[2]?.length === 11) ? match[2] : null;
  }, [youtubeUrl]);

  async function onSubmit(e?: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    if (!title.trim() || !youtubeUrl.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/content/videos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title, 
          slug: slug || undefined, 
          description: description || null,
          youtube_url: youtubeUrl, 
          cover_url: coverUrl || null, 
          tags: tagsArray,
          lang, 
          status,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error?.message || json?.error || 'Falla al registrar el video');

      router.push(`/admin/content/videos/${json.item.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado en el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 01. HEADER DE PRODUCCIÓN */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 mb-12">
        <div className="space-y-4">
          <button 
            type="button" 
            onClick={() => router.push('/admin/content/videos')} 
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-red-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" /> Production Suite / Vlog
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/20">
              <Youtube className="h-6 w-6" />
            </div>
            <h1 className="font-heading text-4xl md:text-6xl text-main tracking-tighter leading-none">
              Nueva <span className="text-brand-yellow italic font-light">Producción</span>
            </h1>
          </div>
          <p className="text-base text-muted font-light max-w-xl">
            Vincula contenido audiovisual al ecosistema de Knowing Cultures S.A.S. La IA procesará la señal para alimentar el contexto del viajero.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Button 
            onClick={onSubmit} 
            disabled={loading || !title.trim() || !youtubeUrl.trim()} 
            className="rounded-full bg-brand-dark text-brand-yellow px-10 h-14 text-xs font-bold uppercase tracking-widest shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Sparkles className="mr-3 h-4 w-4 animate-spin" /> : <Save className="mr-3 h-4 w-4" />}
            {loading ? 'Inicializando...' : 'Registrar Producción'}
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-10 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/20 p-6 flex items-center gap-4 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 shadow-sm">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <p className="text-sm font-bold">Error de Registro: <span className="font-light">{error}</span></p>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1fr_400px] items-start">
        
        {/* 02. LADO IZQUIERDO: CONTENIDO Y MONITOR */}
        <section className="space-y-8">
          <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 md:p-12 shadow-pop relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.01] pointer-events-none">
               <MonitorPlay className="h-64 w-64 text-red-600" />
            </div>

            <div className="relative z-10 space-y-10">
              {/* Título Input */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted ml-1 opacity-50">Título de la Pieza</label>
                <input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  placeholder="Ej: Inmersión Cultural en Palenque..." 
                  className="w-full bg-transparent border-none text-3xl md:text-4xl font-heading text-main outline-none placeholder:opacity-10 focus:ring-0 tracking-tighter"
                  disabled={loading}
                />
                <div className="h-px w-full bg-gradient-to-r from-red-600/30 via-red-600/10 to-transparent" />
              </div>

              {/* YouTube Link & Live Preview */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted ml-1 flex items-center gap-2 opacity-50">
                    <LinkIcon className="h-4 w-4 text-red-600" /> Fuente de Originación (YouTube)
                  </label>
                  <input 
                    value={youtubeUrl} 
                    onChange={(e) => setYoutubeUrl(e.target.value)} 
                    required 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    className="w-full h-14 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 px-6 font-mono text-sm text-main outline-none focus:ring-4 focus:ring-red-600/5 transition-all shadow-inner"
                    disabled={loading}
                  />
                </div>

                {/* Monitor de Previsualización (Studio Look) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                       <Play className="h-3 w-3 fill-current" /> Monitor de Señal Entrante
                    </span>
                    {videoId && (
                      <span className="text-[9px] font-mono text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded border border-green-500/10 animate-pulse">Sync Active</span>
                    )}
                  </div>

                  {videoId ? (
                    <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden border-8 border-brand-dark shadow-2xl bg-black animate-in zoom-in-95 duration-500">
                      <iframe
                        title="KCE Inbound Stream Monitor"
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-[2.5rem] border-2 border-dashed border-brand-dark/10 bg-surface-2 flex flex-col items-center justify-center text-muted group hover:border-red-600/30 transition-all duration-500">
                       <MonitorPlay className="h-16 w-16 mb-6 opacity-10 group-hover:scale-110 transition-transform" />
                       <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-40">Esperando señal de video...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted ml-1 opacity-50">Resumen Narrativo</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Describe brevemente la esencia de este video..." 
                  className="min-h-[160px] w-full rounded-[2rem] border border-brand-dark/10 dark:border-white/10 bg-surface-2 p-8 text-sm font-light leading-relaxed text-main outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all resize-none shadow-inner"
                  disabled={loading}
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
                <h2 className="font-heading text-2xl text-main tracking-tight">Arquitectura</h2>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">Meta-Data Inicial</p>
              </div>
            </header>

            <div className="space-y-6">
              {/* Mercado */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1">Mercado Objetivo</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40" />
                  <select 
                    value={lang} 
                    onChange={(e) => setLang(e.target.value as Lang)} 
                    className="w-full pl-11 pr-4 h-12 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-bold text-main outline-none appearance-none cursor-pointer shadow-sm focus:ring-2 focus:ring-brand-blue/20 transition-all"
                    disabled={loading}
                  >
                    <option value="es">Español (ES)</option>
                    <option value="en">English (EN)</option>
                    <option value="fr">Français (FR)</option>
                    <option value="de">Deutsch (DE)</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1">Estado de Despliegue</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as Status)} 
                  className="w-full h-12 px-4 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-bold text-main outline-none cursor-pointer shadow-sm focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  disabled={loading}
                >
                  <option value="draft">Borrador (Draft)</option>
                  <option value="published">Publicar Ahora</option>
                </select>
              </div>

              {/* URL */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1">Ruta Web (Slug)</label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
                  <input 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)} 
                    placeholder="ej: tour-amazonia-video"
                    className="w-full pl-11 h-12 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-xs font-mono text-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none shadow-inner"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-brand-yellow" /> Etiquetas SEO
                </label>
                <input 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)} 
                  placeholder="vlog, bogota, tips..."
                  className="w-full h-12 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 px-4 text-xs font-bold text-main outline-none shadow-inner"
                  disabled={loading}
                />
              </div>

              {/* Cover */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1">Miniatura Custom</label>
                <div className="relative group">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue opacity-40 group-focus-within:opacity-100 transition-opacity" />
                  <input 
                    value={coverUrl} 
                    onChange={(e) => setCoverUrl(e.target.value)} 
                    placeholder="https://cdn.kce.travel/..."
                    className="w-full pl-11 h-12 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-xs text-main outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all shadow-inner"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-2xl)] bg-red-500/5 border border-red-500/10 p-8 shadow-sm">
             <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-red-600 mb-4">
                <ShieldCheck className="h-4 w-4" /> Editorial Shield
             </div>
             <p className="text-[11px] text-red-700/70 font-light leading-relaxed">
                <strong className="font-bold">Knowing Cultures S.A.S.</strong> recomienda vincular videos que tengan habilitada la opción de "permitir inserción" en YouTube para evitar bloqueos de streaming.
             </p>
          </div>
        </aside>

      </form>

      {/* 04. FOOTER TÉCNICO DE SISTEMA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-10 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3.5 w-3.5" /> Media Ingestion v2.1
        </div>
        <div className="flex items-center gap-6 text-[10px] font-mono tracking-widest uppercase text-muted mt-4 sm:mt-0">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 opacity-50 text-green-500" /> Channel-Auth: Verified
          </span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 opacity-50 text-brand-yellow" /> RAG-Extraction: Standby
          </span>
        </div>
      </footer>

    </main>
  );
}