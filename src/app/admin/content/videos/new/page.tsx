'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Save,
  Hash,
  Globe,
  CheckCircle2,
  Youtube,
  Sparkles,
  MonitorPlay,
  Play,
  AlertTriangle,
  Link as LinkIcon,
  Image as ImageIcon,
  Terminal,
  ShieldCheck,
  Zap,
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
    () =>
      tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tags],
  );

  const videoId = useMemo(() => {
    if (!youtubeUrl) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = youtubeUrl.match(regExp);
    return match?.[2]?.length === 11 ? match[2] : null;
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
      if (!res.ok || !json?.ok)
        throw new Error(json?.error?.message || json?.error || 'Falla al registrar el video');

      router.push(`/admin/content/videos/${json.item.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado en el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-7xl px-4 pb-24 duration-700">
      {/* 01. HEADER DE PRODUCCIÓN */}
      <header className="mb-12 flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => router.push('/admin/content/videos')}
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:text-red-600"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />{' '}
            Production Suite / Vlog
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/20">
              <Youtube className="h-6 w-6" />
            </div>
            <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-6xl">
              Nueva <span className="font-light italic text-brand-yellow">Producción</span>
            </h1>
          </div>
          <p className="max-w-xl text-base font-light text-muted">
            Vincula contenido audiovisual al ecosistema de Knowing Cultures S.A.S. La IA procesará
            la señal para alimentar el contexto del viajero.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Button
            onClick={onSubmit}
            disabled={loading || !title.trim() || !youtubeUrl.trim()}
            className="h-14 rounded-full bg-brand-dark px-10 text-xs font-bold uppercase tracking-widest text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Sparkles className="mr-3 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-3 h-4 w-4" />
            )}
            {loading ? 'Inicializando...' : 'Registrar Producción'}
          </Button>
        </div>
      </header>

      {error && (
        <div className="animate-in slide-in-from-top-2 mb-10 flex items-center gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 text-red-700 shadow-sm dark:bg-red-950/20 dark:text-red-400">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <p className="text-sm font-bold">
            Error de Registro: <span className="font-light">{error}</span>
          </p>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="grid items-start gap-10 lg:grid-cols-[1fr_400px]"
      >
        {/* 02. LADO IZQUIERDO: CONTENIDO Y MONITOR */}
        <section className="space-y-8">
          <div className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5 md:p-12">
            <div className="pointer-events-none absolute right-0 top-0 p-10 opacity-[0.01]">
              <MonitorPlay className="h-64 w-64 text-red-600" />
            </div>

            <div className="relative z-10 space-y-10">
              {/* Título Input */}
              <div className="space-y-4">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-50">
                  Título de la Pieza
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Ej: Inmersión Cultural en Palenque..."
                  className="w-full border-none bg-transparent font-heading text-3xl tracking-tighter text-main outline-none placeholder:opacity-10 focus:ring-0 md:text-4xl"
                  disabled={loading}
                />
                <div className="h-px w-full bg-gradient-to-r from-red-600/30 via-red-600/10 to-transparent" />
              </div>

              {/* YouTube Link & Live Preview */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-50">
                    <LinkIcon className="h-4 w-4 text-red-600" /> Fuente de Originación (YouTube)
                  </label>
                  <input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="h-14 w-full rounded-2xl border border-brand-dark/10 bg-surface-2 px-6 font-mono text-sm text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-red-600/5 dark:border-white/10"
                    disabled={loading}
                  />
                </div>

                {/* Monitor de Previsualización (Studio Look) */}
                <div className="space-y-4">
                  <div className="ml-1 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted">
                      <Play className="h-3 w-3 fill-current" /> Monitor de Señal Entrante
                    </span>
                    {videoId && (
                      <span className="animate-pulse rounded border border-green-500/10 bg-green-50 px-2 py-0.5 font-mono text-[9px] text-green-600 dark:bg-green-500/10 dark:text-green-400">
                        Sync Active
                      </span>
                    )}
                  </div>

                  {videoId ? (
                    <div className="animate-in zoom-in-95 aspect-video w-full overflow-hidden rounded-[2.5rem] border-8 border-brand-dark bg-black shadow-2xl duration-500">
                      <iframe
                        title="KCE Inbound Stream Monitor"
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="group flex aspect-video w-full flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-brand-dark/10 bg-surface-2 text-muted transition-all duration-500 hover:border-red-600/30">
                      <MonitorPlay className="mb-6 h-16 w-16 opacity-10 transition-transform group-hover:scale-110" />
                      <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-40">
                        Esperando señal de video...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-4">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-50">
                  Resumen Narrativo
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe brevemente la esencia de este video..."
                  className="min-h-[160px] w-full resize-none rounded-[2rem] border border-brand-dark/10 bg-surface-2 p-8 text-sm font-light leading-relaxed text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/5 dark:border-white/10"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 03. LADO DERECHO: ESTRATEGIA (BÓVEDA) */}
        <aside className="space-y-8">
          <div className="sticky top-8 rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5">
            <header className="mb-8 flex items-center gap-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-2xl tracking-tight text-main">Arquitectura</h2>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted opacity-60">
                  Meta-Data Inicial
                </p>
              </div>
            </header>

            <div className="space-y-6">
              {/* Mercado */}
              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  Mercado Objetivo
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue opacity-40" />
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value as Lang)}
                    className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-brand-dark/10 bg-surface-2 pl-11 pr-4 text-sm font-bold text-main shadow-sm outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
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
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  Estado de Despliegue
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="h-12 w-full cursor-pointer rounded-xl border border-brand-dark/10 bg-surface-2 px-4 text-sm font-bold text-main shadow-sm outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                  disabled={loading}
                >
                  <option value="draft">Borrador (Draft)</option>
                  <option value="published">Publicar Ahora</option>
                </select>
              </div>

              {/* URL */}
              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  Ruta Web (Slug)
                </label>
                <div className="group relative">
                  <Hash className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue opacity-40 transition-opacity group-focus-within:opacity-100" />
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="ej: tour-amazonia-video"
                    className="h-12 w-full rounded-xl border border-brand-dark/10 bg-surface-2 pl-11 font-mono text-xs text-brand-blue shadow-inner outline-none focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  <Sparkles className="h-3.5 w-3.5 text-brand-yellow" /> Etiquetas SEO
                </label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="vlog, bogota, tips..."
                  className="h-12 w-full rounded-xl border border-brand-dark/10 bg-surface-2 px-4 text-xs font-bold text-main shadow-inner outline-none dark:border-white/10"
                  disabled={loading}
                />
              </div>

              {/* Cover */}
              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  Miniatura Custom
                </label>
                <div className="group relative">
                  <ImageIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-blue opacity-40 transition-opacity group-focus-within:opacity-100" />
                  <input
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://cdn.kce.travel/..."
                    className="h-12 w-full rounded-xl border border-brand-dark/10 bg-surface-2 pl-11 text-xs text-main shadow-inner outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-2xl)] border border-red-500/10 bg-red-500/5 p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-red-600">
              <ShieldCheck className="h-4 w-4" /> Editorial Shield
            </div>
            <p className="text-[11px] font-light leading-relaxed text-red-700/70">
              <strong className="font-bold">Knowing Cultures S.A.S.</strong> recomienda vincular
              videos que tengan habilitada la opción de "permitir inserción" en YouTube para evitar
              bloqueos de streaming.
            </p>
          </div>
        </aside>
      </form>

      {/* 04. FOOTER TÉCNICO DE SISTEMA */}
      <footer className="mt-20 flex flex-col items-center justify-between border-t border-brand-dark/10 pt-10 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Terminal className="h-3.5 w-3.5" /> Media Ingestion v2.1
        </div>
        <div className="mt-4 flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-muted sm:mt-0">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500 opacity-50" /> Channel-Auth: Verified
          </span>
          <span className="hidden opacity-30 sm:inline">|</span>
          <span className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-brand-yellow opacity-50" /> RAG-Extraction: Standby
          </span>
        </div>
      </footer>
    </main>
  );
}
