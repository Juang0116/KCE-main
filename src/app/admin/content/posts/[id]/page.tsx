'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  ArrowLeft, Save, Trash2, Globe, CheckCircle2, 
  Hash, Type, Sparkles, ExternalLink, Clock, 
  AlertTriangle, Eye, CloudUpload, Layout
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Lang = 'es' | 'en' | 'fr' | 'de';
type Status = 'draft' | 'published';

type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string;
  cover_url: string | null;
  tags: string[];
  lang: Lang | string;
  status: Status | string;
  published_at: string | null;
  updated_at: string;
};

export default function AdminPostEditPage() {
  const router = useRouter();
  
  // UX Pro / Next.js 15+: Usar useParams en Client Components es más seguro 
  // que recibir params por props, ya que evita conflictos con Promises.
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<PostRow | null>(null);

  const tagsStr = useMemo(() => (item?.tags ?? []).join(', '), [item?.tags]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); 
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/content/posts/${id}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo cargar el artículo');
      setItem(json.item as PostRow);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error crítico al cargar');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function setField<K extends keyof PostRow>(key: K, value: PostRow[K]) {
    setItem((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function save(patch?: Partial<PostRow>) {
    if (!item || !id) return;
    setSaving(true); 
    setError(null);
    try {
      const body = patch ?? {
        title: item.title, slug: item.slug, excerpt: item.excerpt, cover_url: item.cover_url,
        tags: item.tags, lang: item.lang, status: item.status, content_md: item.content_md,
      };
      const res = await adminFetch(`/api/admin/content/posts/${id}`, { 
        method: 'PATCH', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      const json = await res.json().catch(() => ({}));
      
      if (!res.ok || !json?.ok) throw new Error(json?.error?.message || json?.error || 'Falla al guardar');
      setItem(json.item as PostRow);
    } catch (err: unknown) { 
      setError(err instanceof Error ? err.message : 'Error de red'); 
    } finally { 
      setSaving(false); 
    }
  }

  async function del() {
    if (!id) return;
    if (!confirm('¿Eliminar definitivamente este artículo? Esta acción no se puede deshacer.')) return;
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/content/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar');
      router.push('/admin/content/posts');
    } catch (err: unknown) { 
      setError(err instanceof Error ? err.message : 'Error al eliminar'); 
      setSaving(false); 
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-32 text-center animate-pulse">
        <Layout className="h-12 w-12 mx-auto text-brand-blue/20 mb-6"/>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/40">Sincronizando con la nube...</div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-rose-500 mb-6" />
        <h2 className="font-heading text-2xl text-[color:var(--color-text)] mb-4">{error ?? 'Artículo extraviado'}</h2>
        <Button variant="outline" onClick={() => router.push('/admin/content/posts')} className="rounded-full">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Blog
        </Button>
      </main>
    );
  }

  const isPub = item.status === 'published';

  return (
    <main className="max-w-7xl mx-auto px-6 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER DE LA FACTORÍA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 mb-12">
        <div className="space-y-4">
          <button 
            type="button" 
            onClick={() => router.push('/admin/content/posts')} 
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 hover:text-brand-blue transition-colors"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> Gestión de Contenidos
          </button>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            {item.title || <span className="opacity-20 italic">Sin Título</span>}
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
              <Clock className="h-3 w-3" /> Mod: {new Date(item.updated_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button 
            onClick={() => save()} 
            disabled={saving} 
            className="rounded-full bg-brand-dark text-brand-yellow px-8 py-6 shadow-xl hover:scale-105 transition-transform"
          >
            <Save className="mr-2 h-4 w-4" /> {saving ? 'Cifrando...' : 'Guardar Cambios'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => save({ status: isPub ? 'draft' : 'published' })} 
            disabled={saving} 
            className={`rounded-full px-6 py-6 border-[color:var(--color-border)] transition-all ${isPub ? 'hover:bg-amber-50 hover:text-amber-700' : 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'}`}
          >
            {isPub ? 'Mover a Draft' : 'Publicar Ahora'}
          </Button>

          <button 
            onClick={del} 
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
        
        {/* EDITOR (BÓVEDA DE ESCRITURA) */}
        <section className="space-y-8">
          <div className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02]">
               <Type className="h-40 w-40 text-brand-blue" />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/40 ml-1">Título del Artículo (H1)</label>
                <input 
                  value={item.title} 
                  onChange={(e) => setField('title', e.target.value)} 
                  placeholder="La esencia de Colombia..." 
                  className="w-full bg-transparent border-none text-3xl md:text-4xl font-heading text-brand-blue outline-none placeholder:opacity-10 focus:ring-0"
                />
                <div className="h-px w-full bg-gradient-to-r from-brand-blue/20 to-transparent" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/40 flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-brand-yellow" /> Cuerpo del Artículo (Markdown)
                  </label>
                  <span className="text-[9px] font-mono text-[color:var(--color-text)]/30">Auto-save: Cloud Active</span>
                </div>
                <div className="rounded-[2rem] overflow-hidden border border-brand-dark/10 shadow-inner">
                  <textarea 
                    value={item.content_md} 
                    onChange={(e) => setField('content_md', e.target.value)} 
                    placeholder="Comienza tu historia aquí..." 
                    className="min-h-[700px] w-full bg-[var(--brand-dark)] p-10 font-mono text-sm leading-relaxed text-emerald-400/90 outline-none resize-none selection:bg-emerald-500/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* METADATOS & SEO (BÓVEDA DE CONFIGURACIÓN) */}
        <aside className="space-y-8">
          <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-xl sticky top-24">
            <header className="flex items-center gap-3 border-b border-[color:var(--color-border)] pb-6 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
                <Layout className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl text-brand-blue">SEO Core</h2>
            </header>

            <div className="space-y-6">
              {/* Idioma */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 ml-1">Idioma del Post</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30" />
                  <select 
                    value={item.lang} 
                    onChange={(e) => setField('lang', e.target.value)} 
                    className="w-full pl-11 pr-4 h-12 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-sm font-bold text-brand-blue outline-none cursor-pointer appearance-none"
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
                <label className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 ml-1">URL Permanente (Slug)</label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                  <input 
                    value={item.slug} 
                    onChange={(e) => setField('slug', e.target.value)} 
                    className="w-full pl-11 h-12 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-xs font-mono text-brand-blue focus:ring-2 focus:ring-brand-blue/5 outline-none" 
                  />
                </div>
              </div>

              {/* Cover URL */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 ml-1">Imagen de Portada (CDN)</label>
                <div className="relative">
                  <CloudUpload className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30" />
                  <input 
                    value={item.cover_url ?? ''} 
                    onChange={(e) => setField('cover_url', e.target.value || null)} 
                    placeholder="https://images.kce.travel/..."
                    className="w-full pl-11 h-12 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-xs outline-none" 
                  />
                </div>
                {item.cover_url && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-[color:var(--color-border)] shadow-sm">
                    <img src={item.cover_url} alt="Preview" className="w-full h-32 object-cover" />
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 ml-1 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-brand-yellow" /> Etiquetas SEO
                </label>
                <input 
                  value={tagsStr} 
                  onChange={(e) => setField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} 
                  placeholder="bogota, cultura, lujo..."
                  className="w-full h-12 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 text-xs font-medium text-brand-blue outline-none" 
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/40 ml-1">Resumen (SEO Meta-Desc)</label>
                <textarea 
                  value={item.excerpt ?? ''} 
                  onChange={(e) => setField('excerpt', e.target.value || null)} 
                  className="min-h-[120px] w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4 text-xs font-light leading-relaxed outline-none focus:ring-2 focus:ring-brand-blue/5 transition-all resize-none" 
                />
              </div>

              <div className="pt-6 border-t border-[color:var(--color-border)]">
                 <Button variant="ghost" size="sm" className="w-full text-brand-blue/60 group">
                    <Eye className="mr-2 h-4 w-4" /> Previsualizar en Sitio <ExternalLink className="ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </Button>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-brand-blue/5 border border-brand-blue/10 p-8">
             <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue/40 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Best Practices
             </p>
             <ul className="text-[11px] text-brand-blue/60 space-y-2 font-light leading-relaxed">
               <li>• Usa títulos H2 para secciones principales.</li>
               <li>• Las imágenes deben tener texto Alt en el CDN.</li>
               <li>• El excerpt es lo que Google mostrará en el snippet.</li>
             </ul>
          </div>
        </aside>

      </div>
    </main>
  );
}