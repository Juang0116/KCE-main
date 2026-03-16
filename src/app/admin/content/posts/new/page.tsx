'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, Save, FileText, Type, Hash, Globe, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

type Lang = 'es' | 'en' | 'fr' | 'de';
type Status = 'draft' | 'published';

export default function AdminPostNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/content/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title, slug: slug || undefined, excerpt: excerpt || null, cover_url: coverUrl || null, tags: tagsArray, lang, status, content_md: contentMd ?? '',
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error?.message || json?.error || 'No se pudo crear el post');

      router.push(`/admin/content/posts/${json.item.id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-10 pb-20 max-w-6xl mx-auto">
      
      {/* Cabecera */}
      <div>
        <button type="button" onClick={() => router.push('/admin/content/posts')} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-brand-blue transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" /> Volver al Blog
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Nuevo Post</h1>
            <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
              Redacta un artículo en Markdown. Inicia como borrador y publícalo cuando esté listo.
            </p>
          </div>
          
          <button type="button" onClick={onSubmit} disabled={loading || !title.trim()} className="flex items-center justify-center gap-2 rounded-xl bg-brand-dark px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-md disabled:opacity-50">
            <Save className="h-4 w-4" /> {loading ? 'Creando...' : 'Guardar y Continuar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_350px] items-start">
        
        {/* Editor Principal */}
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2 border-b border-[var(--color-border)] pb-4">
              <Type className="h-5 w-5 text-brand-blue" />
              <h2 className="font-heading text-xl text-[var(--color-text)]">Contenido Principal</h2>
            </div>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Título del Artículo (H1)</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ej: Las 5 mejores playas de Santa Marta..." className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-4 text-lg font-heading outline-none focus:border-brand-blue transition-colors placeholder:font-sans placeholder:text-base" disabled={loading} />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Cuerpo del Post (Soporta Markdown)</span>
              <textarea value={contentMd} onChange={(e) => setContentMd(e.target.value)} placeholder="# Título Secundario&#10;&#10;Escribe tu historia aquí..." className="min-h-[500px] w-full rounded-2xl border border-[var(--color-border)] bg-gray-900 px-5 py-4 font-mono text-sm leading-relaxed text-emerald-400 outline-none focus:border-brand-blue transition-colors resize-y shadow-inner placeholder:text-[var(--color-text)]/30" disabled={loading} />
            </label>
          </div>
        </div>

        {/* Metadatos */}
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm space-y-5 sticky top-6">
            <div className="flex items-center gap-3 mb-2 border-b border-[var(--color-border)] pb-4">
              <FileText className="h-5 w-5 text-brand-blue" />
              <h2 className="font-heading text-xl text-[var(--color-text)]">Metadatos & SEO</h2>
            </div>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-1.5"><Globe className="h-3 w-3"/> Idioma</span>
              <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold outline-none focus:border-brand-blue transition-colors appearance-none cursor-pointer" disabled={loading}>
                <option value="es">Español (ES)</option>
                <option value="en">English (EN)</option>
                <option value="fr">Français (FR)</option>
                <option value="de">Deutsch (DE)</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3"/> Estado</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold outline-none focus:border-brand-blue transition-colors appearance-none cursor-pointer" disabled={loading}>
                <option value="draft">Borrador (Draft)</option>
                <option value="published">Publicado (Published)</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Slug (URL)</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="se-genera-automatico" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-mono outline-none focus:border-brand-blue transition-colors" disabled={loading} />
              <p className="mt-1.5 text-[9px] uppercase tracking-widest text-[var(--color-text)]/40">Déjalo en blanco para auto-generar.</p>
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-1.5"><ImageIcon className="h-3 w-3"/> Imagen de Portada (URL)</span>
              <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none focus:border-brand-blue transition-colors" disabled={loading} />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-1.5"><Hash className="h-3 w-3"/> Etiquetas (SEO)</span>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="playa, cultura, tips..." className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none focus:border-brand-blue transition-colors" disabled={loading} />
              <p className="mt-1.5 text-[9px] uppercase tracking-widest text-[var(--color-text)]/40">Separa con comas.</p>
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Resumen (Excerpt)</span>
              <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Un breve gancho para atraer la atención..." className="min-h-[100px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-light outline-none focus:border-brand-blue transition-colors resize-y" disabled={loading} />
            </label>
          </div>
        </div>

      </form>
    </main>
  );
}