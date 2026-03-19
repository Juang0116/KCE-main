'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { 
  ArrowLeft, Save, FileText, Type, Hash, 
  Globe, CheckCircle2, Sparkles, PenTool, 
  Layout, AlertTriangle, CloudUpload
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

  // UX Pro: Soporta tanto el submit del form (Enter) como el click del botón exterior
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

      // Redirigir directamente al editor del nuevo post
      router.push(`/admin/content/posts/${json.item.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado en la base de datos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER DE CREACIÓN */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10 mb-12">
        <div className="space-y-4">
          <button 
            type="button" 
            onClick={() => router.push('/admin/content/posts')} 
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-brand-blue transition-colors"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> Volver al Directorio
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-lg">
              <PenTool className="h-5 w-5" />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
              Inicia una <span className="text-brand-yellow italic font-light">Historia</span>
            </h1>
          </div>
          <p className="text-sm text-[var(--color-text)]/50 font-light max-w-xl italic">
            Define la arquitectura del artículo. Podrás seguir editando los detalles una vez creado el registro.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Button 
            onClick={onSubmit} 
            disabled={loading || !title.trim()} 
            className="rounded-full bg-brand-dark text-brand-yellow px-10 py-7 text-sm shadow-2xl hover:scale-105 transition-transform"
          >
            {loading ? <Sparkles className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {loading ? 'Inicializando...' : 'Crear y Continuar'}
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
        
        {/* LADO IZQUIERDO: EL MANUSCRITO */}
        <section className="space-y-8">
          <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02]">
               <FileText className="h-40 w-40 text-brand-blue" />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40 ml-1">Título Inicial del Post</label>
                <input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  placeholder="Ej: Guía Secreta de Guatapé..." 
                  className="w-full bg-transparent border-none text-3xl md:text-4xl font-heading text-brand-blue outline-none placeholder:opacity-20 focus:ring-0"
                  disabled={loading}
                />
                <div className="h-px w-full bg-gradient-to-r from-brand-blue/20 to-transparent" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40 flex items-center gap-2">
                    <Type className="h-3.5 w-3.5 text-brand-blue/40" /> Cuerpo de Texto (Markdown)
                  </label>
                  <span className="text-[9px] font-mono text-[var(--color-text)]/30">Markdown Supported</span>
                </div>
                <div className="rounded-[2.5rem] overflow-hidden border border-brand-dark/10 shadow-inner">
                  <textarea 
                    value={contentMd} 
                    onChange={(e) => setContentMd(e.target.value)} 
                    placeholder="# Empieza con un H1 o un saludo..." 
                    className="min-h-[600px] w-full bg-[var(--brand-dark)] p-10 font-mono text-sm leading-relaxed text-emerald-400/90 outline-none resize-none placeholder:text-emerald-900"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LADO DERECHO: METADATOS TÁCTICOS */}
        <aside className="space-y-8">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xl sticky top-24">
            <header className="flex items-center gap-3 border-b border-[var(--color-border)] pb-6 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
                <Layout className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl text-brand-blue">Estrategia SEO</h2>
            </header>

            <div className="space-y-6">
              {/* Idioma */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1 flex items-center gap-2">
                  <Globe className="h-3 w-3" /> Mercado Objetivo
                </label>
                <select 
                  value={lang} 
                  onChange={(e) => setLang(e.target.value as Lang)} 
                  className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-bold text-brand-blue outline-none cursor-pointer"
                  disabled={loading}
                >
                  <option value="es">Español (ES)</option>
                  <option value="en">English (EN)</option>
                  <option value="fr">Français (FR)</option>
                  <option value="de">Deutsch (DE)</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1 flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" /> Estado Inicial
                </label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as Status)} 
                  className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-sm font-bold text-brand-blue outline-none cursor-pointer"
                  disabled={loading}
                >
                  <option value="draft">Borrador (Draft)</option>
                  <option value="published">Publicar Inmediato</option>
                </select>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1 flex items-center gap-2">
                  <Hash className="h-3 w-3" /> URL (Slug)
                </label>
                <input 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)} 
                  placeholder="ej: mejores-cafes-bogota"
                  className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-xs font-mono text-brand-blue outline-none focus:ring-2 focus:ring-brand-blue/5"
                  disabled={loading}
                />
              </div>

              {/* Cover URL */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1 flex items-center gap-2">
                  <CloudUpload className="h-3 w-3" /> Portada (URL)
                </label>
                <input 
                  value={coverUrl} 
                  onChange={(e) => setCoverUrl(e.target.value)} 
                  placeholder="https://images.unsplash..."
                  className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-xs outline-none"
                  disabled={loading}
                />
                {coverUrl && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm">
                    <img src={coverUrl} alt="Preview" className="w-full h-24 object-cover opacity-60" />
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1 flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-brand-yellow" /> Etiquetas
                </label>
                <input 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)} 
                  placeholder="cultura, tips, bogota..."
                  className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-xs outline-none"
                  disabled={loading}
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1">Resumen Corto</label>
                <textarea 
                  value={excerpt} 
                  onChange={(e) => setExcerpt(e.target.value)} 
                  className="min-h-[100px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-xs font-light leading-relaxed outline-none focus:ring-2 focus:ring-brand-blue/5 resize-none"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-brand-yellow/5 border border-brand-yellow/20 p-8">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-dark opacity-60 mb-3">
                <CheckCircle2 className="h-3.5 w-3.5" /> Consejo Editorial
             </div>
             <p className="text-[11px] text-brand-dark/70 font-light leading-relaxed">
               Un título potente y una imagen de alta calidad son el 80% del éxito. Asegúrate de que el slug sea limpio para favorecer el SEO en buscadores.
             </p>
          </div>
        </aside>

      </form>
    </main>
  );
}