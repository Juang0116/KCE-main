'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { 
  ArrowLeft, Save, FileText, Type, Hash, 
  Globe, CheckCircle2, Sparkles, PenTool, 
  Layout, AlertTriangle, CloudUpload, Terminal,
  ShieldCheck, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Lang = 'es' | 'en' | 'fr' | 'de';
type Status = 'draft' | 'published';

export default function AdminPostNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [tags, setTags] = useState('');
  const [lang, setLang] = useState<Lang>('es');
  const [status, setStatus] = useState<Status>('draft');
  const [contentMd, setContentMd] = useState('');

  const tagsArray = useMemo(
    () => tags.split(',').map((t) => t.trim()).filter(Boolean),
    [tags],
  );

  async function onSubmit(e?: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/content/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title, 
          slug: slug || undefined, 
          excerpt: excerpt || null, 
          cover_url: coverUrl || null, 
          tags: tagsArray, 
          lang, 
          status, 
          content_md: contentMd ?? '',
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error?.message || json?.error || 'Falla al crear el registro');

      router.push(`/admin/content/posts/${json.item.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado en la base de datos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 01. HEADER DE CREACIÓN */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 mb-12">
        <div className="space-y-4">
          <button 
            type="button" 
            onClick={() => router.push('/admin/content/posts')} 
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-brand-blue transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" /> Authority Engine / Blog
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner border border-brand-blue/5">
              <PenTool className="h-6 w-6" />
            </div>
            <h1 className="font-heading text-4xl md:text-6xl text-main tracking-tighter leading-none">
              Inicia una <span className="text-brand-yellow italic font-light">Historia</span>
            </h1>
          </div>
          <p className="text-base text-muted font-light max-w-xl">
            Define la arquitectura inicial del artículo. Podrás pulir la narrativa y los metadatos SEO en el editor avanzado una vez creado el nodo.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Button 
            onClick={onSubmit} 
            disabled={loading || !title.trim()} 
            className="rounded-full bg-brand-dark text-brand-yellow px-10 h-14 text-xs font-bold uppercase tracking-widest shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95"
          >
            {loading ? <Sparkles className="mr-3 h-4 w-4 animate-spin" /> : <Save className="mr-3 h-4 w-4" />}
            {loading ? 'Inicializando...' : 'Crear y Continuar'}
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-10 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/20 p-6 flex items-center gap-4 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 shadow-sm">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <p className="text-sm font-bold">Error de Inicialización: <span className="font-light">{error}</span></p>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1fr_400px] items-start">
        
        {/* 02. LADO IZQUIERDO: EL MANUSCRITO */}
        <section className="space-y-8">
          <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 md:p-12 shadow-pop relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.01] pointer-events-none">
               <FileText className="h-64 w-64 text-brand-blue" />
            </div>

            <div className="relative z-10 space-y-10">
              {/* Título Input */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted ml-1 opacity-50">Título Maestro (H1)</label>
                <input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  placeholder="La esencia de Colombia..." 
                  className="w-full bg-transparent border-none text-3xl md:text-5xl font-heading text-main outline-none placeholder:opacity-10 focus:ring-0 tracking-tighter"
                  disabled={loading}
                />
                <div className="h-px w-full bg-gradient-to-r from-brand-blue/30 via-brand-blue/10 to-transparent" />
              </div>

              {/* Markdown Editor */}
              <div className="space-y-5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted flex items-center gap-2 opacity-50">
                    <Type className="h-3.5 w-3.5 text-brand-blue/40" /> Primer Borrador (Markdown)
                  </label>
                  <span className="text-[9px] font-mono text-muted opacity-40 uppercase tracking-widest">Protocolo: MD-UTF8</span>
                </div>
                <div className="rounded-[2.5rem] overflow-hidden border border-brand-dark/10 dark:border-white/5 shadow-2xl">
                  <textarea 
                    value={contentMd} 
                    onChange={(e) => setContentMd(e.target.value)} 
                    placeholder="# Empieza con un encabezado impactante..." 
                    className="min-h-[650px] w-full bg-[#0F172A] p-10 md:p-16 font-mono text-sm leading-relaxed text-emerald-400/70 outline-none resize-none selection:bg-emerald-500/30 custom-scrollbar scroll-smooth placeholder:text-emerald-900/50"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 03. LADO DERECHO: METADATOS TÁCTICOS (BÓVEDA) */}
        <aside className="space-y-8">
          <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-pop sticky top-8">
            <header className="flex items-center gap-4 border-b border-brand-dark/5 dark:border-white/5 pb-8 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner">
                <Layout className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-2xl text-main tracking-tight">Arquitectura</h2>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">Configuración Inicial</p>
              </div>
            </header>

            <div className="space-y-6">
              {/* Mercado */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <Globe className="h-3 w-3" /> Mercado Objetivo
                </label>
                <select 
                  value={lang} 
                  onChange={(e) => setLang(e.target.value as Lang)} 
                  className="w-full h-12 px-4 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-bold text-main outline-none cursor-pointer appearance-none shadow-sm focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  disabled={loading}
                >
                  <option value="es">Español (ES)</option>
                  <option value="en">English (EN)</option>
                  <option value="fr">Français (FR)</option>
                  <option value="de">Deutsch (DE)</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" /> Estado de Despliegue
                </label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as Status)} 
                  className="w-full h-12 px-4 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-bold text-main outline-none cursor-pointer appearance-none shadow-sm focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  disabled={loading}
                >
                  <option value="draft">Borrador (Seguro)</option>
                  <option value="published">Publicar Inmediato</option>
                </select>
              </div>

              {/* URL */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <Hash className="h-3 w-3" /> URL Permanente (Slug)
                </label>
                <input 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)} 
                  placeholder="mejores-cafes-bogota"
                  className="w-full h-12 px-4 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-xs font-mono text-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none shadow-inner"
                  disabled={loading}
                />
              </div>

              {/* Cover */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <CloudUpload className="h-3 w-3" /> Portada (CDN URL)
                </label>
                <input 
                  value={coverUrl} 
                  onChange={(e) => setCoverUrl(e.target.value)} 
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-12 px-4 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-xs text-main outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all shadow-inner"
                  disabled={loading}
                />
                {coverUrl && (
                  <div className="mt-4 rounded-2xl overflow-hidden border-2 border-brand-dark/5 shadow-soft aspect-video opacity-60">
                    <img src={coverUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-brand-yellow" /> Etiquetas SEO
                </label>
                <input 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)} 
                  placeholder="cultura, bogota, tips..."
                  className="w-full h-12 px-4 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-xs font-bold text-main outline-none shadow-inner"
                  disabled={loading}
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1">Meta-Descripción</label>
                <textarea 
                  value={excerpt} 
                  onChange={(e) => setExcerpt(e.target.value)} 
                  placeholder="Breve resumen para Google..."
                  className="min-h-[120px] w-full rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 p-4 text-xs font-light leading-relaxed text-main outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all resize-none shadow-inner"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Consejo Editorial */}
          <div className="rounded-[var(--radius-2xl)] bg-brand-yellow/5 border border-brand-yellow/20 p-8 shadow-sm">
             <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-main opacity-70 mb-4">
                <CheckCircle2 className="h-4 w-4" /> Editorial Shield
             </div>
             <p className="text-[11px] text-main/80 font-light leading-relaxed">
                <strong className="font-bold">Knowing Cultures S.A.S.</strong> prioriza el contenido de valor. Asegúrate de que tu historia responda a una intención de búsqueda clara del viajero moderno.
             </p>
          </div>
        </aside>

      </form>

      {/* 04. FOOTER TÉCNICO DE SISTEMA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-between border-t border-brand-dark/10 dark:border-white/10 pt-10 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3.5 w-3.5" /> Content Factory v3.2
        </div>
        <div className="flex items-center gap-6 text-[10px] font-mono tracking-widest uppercase text-muted mt-4 sm:mt-0">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 opacity-50 text-green-500" /> Integrity-Lane: Secured
          </span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 opacity-50 text-brand-yellow" /> SEO-Engine: Standby
          </span>
        </div>
      </footer>

    </main>
  );
}