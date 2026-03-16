'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, Save, FileText, Hash, Globe, Image as ImageIcon, CheckCircle2, Youtube } from 'lucide-react';

type Lang = 'es' | 'en' | 'fr' | 'de';
type Status = 'draft' | 'published';

export default function AdminVideoNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [tags, setTags] = useState('');
  const [lang, setLang] = useState<Lang>('es');
  const [status, setStatus] = useState<Status>('draft');

  const tagsArray = useMemo(
    () => tags.split(',').map((t) => t.trim()).filter(Boolean),
    [tags],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/content/videos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title, slug: slug || undefined, description: description || null,
          youtube_url: youtubeUrl, cover_url: coverUrl || null, tags: tagsArray,
          lang, status,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error?.message || json?.error || 'No se pudo crear el video');

      router.push(`/admin/content/videos/${json.item.id}`);
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
        <button type="button" onClick={() => router.push('/admin/content/videos')} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-rose-600 transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" /> Volver al Vlog
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Nuevo Video</h1>
            <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
              Registra un link de YouTube en KCE y publícalo cuando esté listo.
            </p>
          </div>
          
          <button type="button" onClick={onSubmit} disabled={loading || !title.trim() || !youtubeUrl.trim()} className="flex items-center justify-center gap-2 rounded-xl bg-brand-dark px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-md disabled:opacity-50">
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
        
        {/* Editor Principal (Columna Izquierda) */}
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2 border-b border-[var(--color-border)] pb-4">
              <Youtube className="h-5 w-5 text-rose-600" />
              <h2 className="font-heading text-xl text-[var(--color-text)]">Detalles del Video</h2>
            </div>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Título del Video</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ej: 10 Cosas que hacer en Bogotá" className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-4 text-lg font-heading outline-none focus:border-rose-500 transition-colors disabled:opacity-50" disabled={loading} />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">YouTube URL</span>
              <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} required placeholder="https://www.youtube.com/watch?v=..." className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-3 text-sm font-mono text-brand-blue outline-none focus:border-rose-500 transition-colors disabled:opacity-50" disabled={loading} />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Descripción Corta</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Escribe un pequeño resumen del video..." className="min-h-[200px] w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-4 font-light text-sm leading-relaxed outline-none focus:border-rose-500 transition-colors resize-y disabled:opacity-50" disabled={loading} />
            </label>
          </div>
        </div>

        {/* Metadatos (Columna Derecha) */}
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm space-y-5 sticky top-6">
            <div className="flex items-center gap-3 mb-2 border-b border-[var(--color-border)] pb-4">
              <FileText className="h-5 w-5 text-rose-600" />
              <h2 className="font-heading text-xl text-[var(--color-text)]">Metadatos & SEO</h2>
            </div>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-1.5"><Globe className="h-3 w-3"/> Idioma</span>
              <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 transition-colors appearance-none cursor-pointer" disabled={loading}>
                <option value="es">Español (ES)</option>
                <option value="en">English (EN)</option>
                <option value="fr">Français (FR)</option>
                <option value="de">Deutsch (DE)</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3"/> Estado</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 transition-colors appearance-none cursor-pointer" disabled={loading}>
                <option value="draft">Borrador (Draft)</option>
                <option value="published">Publicado (Published)</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 block mb-2">Slug (URL)</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="se-genera-automatico" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-mono outline-none focus:border-rose-500 transition-colors" disabled={loading} />
              <p className="mt-1.5 text-[9px] uppercase tracking-widest text-[var(--color-text)]/40">Déjalo en blanco para auto-generar.</p>
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-1.5"><ImageIcon className="h-3 w-3"/> Imagen de Portada (Opcional)</span>
              <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none focus:border-rose-500 transition-colors" disabled={loading} />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-2 flex items-center gap-1.5"><Hash className="h-3 w-3"/> Etiquetas (SEO)</span>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="colombia, travel, vlog..." className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none focus:border-rose-500 transition-colors" disabled={loading} />
              <p className="mt-1.5 text-[9px] uppercase tracking-widest text-[var(--color-text)]/40">Separa con comas.</p>
            </label>
          </div>
        </div>

      </form>
    </main>
  );
}