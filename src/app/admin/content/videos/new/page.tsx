'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { 
  ArrowLeft, Save, Hash, 
  Globe, CheckCircle2, Youtube, Sparkles, 
  MonitorPlay, Play, AlertTriangle, 
  Link as LinkIcon,
  Image as ImageIcon
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
    
    // Validación segura del ID de 11 caracteres de YouTube
    return (match?.[2]?.length === 11) ? match[2] : null;
  }, [youtubeUrl]);

  // UX Pro: Soporta envío desde el botón del header o tecla Enter en el formulario
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

      // Redirigir al editor del video recién creado
      router.push(`/admin/content/videos/${json.item.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado en el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER DE PRODUCCIÓN */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 mb-12">
        <div className="space-y-4">
          <button 
            type="button" 
            onClick={() => router.push('/admin/content/videos')} 
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] hover:text-rose-600 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> Volver al Vlog
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/20">
              <Youtube className="h-5 w-5" />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
              Nueva <span className="text-brand-yellow italic font-light">Producción</span>
            </h1>
          </div>
          <p className="text-sm text-[color:var(--color-text)]/50 font-light max-w-xl italic">
            Vincula contenido de YouTube al ecosistema de KCE. La IA procesará el contexto para recomendaciones inteligentes.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Button 
            onClick={onSubmit} 
            disabled={loading || !title.trim() || !youtubeUrl.trim()} 
            className="rounded-full bg-brand-dark text-brand-yellow px-10 py-7 text-sm shadow-2xl hover:scale-105 transition-transform"
          >
            {loading ? <Sparkles className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {loading ? 'Procesando...' : 'Registrar Video'}
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-10 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 animate-in zoom-in-95">
          <AlertTriangle className="h-6 w-6" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1fr_380px] items-start">
        
        {/* LADO IZQUIERDO: CONTENIDO Y MONITOR */}
        <section className="space-y-8">
          <div className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02]">
               <MonitorPlay className="h-40 w-40 text-rose-600" />
            </div>

            <div className="relative z-10 space-y-10">
              {/* Título */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] ml-1">Título del Video</label>
                <input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  placeholder="Ej: Caminata por el Amazonas..." 
                  className="w-full bg-transparent border-none text-3xl font-heading text-brand-blue outline-none placeholder:opacity-20 focus:ring-0"
                  disabled={loading}
                />
                <div className="h-px w-full bg-gradient-to-r from-brand-blue/20 to-transparent" />
              </div>

              {/* YouTube Link & Live Preview */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] ml-1 flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5 text-rose-600/50" /> Fuente Original (YouTube)
                  </label>
                  <input 
                    value={youtubeUrl} 
                    onChange={(e) => setYoutubeUrl(e.target.value)} 
                    required 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    className="w-full h-14 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-6 font-mono text-sm text-brand-blue outline-none focus:ring-4 focus:ring-rose-500/5 transition-all"
                    disabled={loading}
                  />
                </div>

                {/* Monitor de Previsualización en Tiempo Real */}
                {videoId ? (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-rose-600/60 ml-1 flex items-center gap-1.5">
                      <Play className="h-2.5 w-2.5 fill-current" /> Monitor de Señal Activo
                    </span>
                    <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden border border-[color:var(--color-border)] bg-black shadow-2xl">
                      <iframe
                        title="Monitor de previsualización de YouTube" // ✅ FIX ACCESIBILIDAD
                        src={`https://www.youtube.com/embed/${videoId}`}
                        className="w-full h-full border-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-[2.5rem] border-2 border-dashed border-[color:var(--color-border)] flex flex-col items-center justify-center text-[color:var(--color-text)]/50 bg-[color:var(--color-surface-2)]/50">
                     <MonitorPlay className="h-12 w-12 mb-4 opacity-50" />
                     <p className="text-xs font-bold uppercase tracking-widest">Esperando URL de YouTube...</p>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] ml-1">Descripción Breve</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Resume la esencia de este material visual..." 
                  className="min-h-[200px] w-full rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-8 text-sm font-light leading-relaxed text-[color:var(--color-text)]/70 outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all resize-none"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </section>

        {/* LADO DERECHO: ESTRATEGIA SEO */}
        <aside className="space-y-8">
          <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-xl sticky top-24">
            <header className="flex items-center gap-3 border-b border-[color:var(--color-border)] pb-6 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/5 text-rose-600">
                <Globe className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl text-brand-blue">Vlog Core</h2>
            </header>

            <div className="space-y-6">
              {/* Idioma */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">Idioma del Audio</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30" />
                  <select 
                    value={lang} 
                    onChange={(e) => setLang(e.target.value as Lang)} 
                    className="w-full h-12 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-10 text-sm font-bold text-brand-blue outline-none cursor-pointer appearance-none"
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
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">Estado Inicial</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as Status)} 
                  className="w-full h-12 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 text-sm font-bold text-brand-blue outline-none cursor-pointer appearance-none"
                  disabled={loading}
                >
                  <option value="draft">Borrador (Draft)</option>
                  <option value="published">Publicar Inmediato</option>
                </select>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">URL (Slug)</label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                  <input 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)} 
                    placeholder="ej: experiencia-cafe-quindio"
                    className="w-full pl-11 h-12 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 text-xs font-mono text-brand-blue outline-none focus:ring-2 focus:ring-rose-500/5"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1 flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-brand-yellow" /> Etiquetas SEO
                </label>
                <input 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)} 
                  placeholder="vlog, tips, bogota..."
                  className="w-full h-12 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 text-xs outline-none"
                  disabled={loading}
                />
              </div>

              {/* Cover URL */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">Portada Custom</label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30" />
                  <input 
                    value={coverUrl} 
                    onChange={(e) => setCoverUrl(e.target.value)} 
                    placeholder="https://images.kce.travel/..."
                    className="w-full pl-11 h-12 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 text-xs outline-none"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-rose-600/5 border border-rose-600/10 p-8">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rose-600 mb-3">
                <CheckCircle2 className="h-3.5 w-3.5" /> Estándar Multimedia
             </div>
             <p className="text-[11px] text-rose-900/60 font-light leading-relaxed">
               Asegúrate de que el video sea público. Una vez registrado, la IA de KCE podrá extraer fragmentos de contexto para alimentar el chatbot.
             </p>
          </div>
        </aside>

      </form>
    </main>
  );
}