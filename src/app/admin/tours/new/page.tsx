'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminFetch } from '@/lib/adminFetch.client';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Save,
  Compass,
  MapPin,
  DollarSign,
  Clock,
  Image as ImageIcon,
  Tag,
  Globe,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminTourNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [city, setCity] = useState('');
  const [summary, setSummary] = useState('');
  const [bodyMd, setBodyMd] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [lang, setLang] = useState('es');

  function autoSlug(t: string) {
    return t
      .toLowerCase()
      .replace(/[áàä]/g, 'a')
      .replace(/[éèë]/g, 'e')
      .replace(/[íìï]/g, 'i')
      .replace(/[óòö]/g, 'o')
      .replace(/[úùü]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError('El título es obligatorio.');
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || autoSlug(title),
          city: city.trim() || undefined,
          summary: summary.trim() || undefined,
          body_md: bodyMd.trim() || undefined,
          base_price: basePrice ? Math.round(parseFloat(basePrice) * 100) : undefined,
          duration_hours: durationHours ? parseFloat(durationHours) : undefined,
          image: imageUrl.trim() || undefined,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error al crear el tour');
      router.push('/admin/tours');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 px-4 py-2.5 text-sm text-main outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all';
  const labelClass = 'block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5';

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-3xl space-y-8 pb-20 duration-700">
      <header className="flex items-center gap-4 border-b border-brand-dark/5 pb-6 dark:border-white/5">
        <Link href="/admin/tours">
          <Button
            variant="outline"
            className="h-9 rounded-full px-4 text-xs"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Volver
          </Button>
        </Link>
        <div>
          <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
            <Compass className="h-3 w-3" /> Nuevo Tour
          </div>
          <h1 className="font-heading text-2xl text-main">Crear Experiencia</h1>
        </div>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-6"
      >
        <div className="space-y-4 rounded-2xl border border-brand-dark/5 bg-surface p-6 dark:border-white/5">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
            <Globe className="h-3.5 w-3.5" /> Información Principal
          </h2>
          <div>
            <label className={labelClass}>Título *</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug) setSlug(autoSlug(e.target.value));
              }}
              className={inputClass}
              placeholder="Ej: Expedición Caño Cristales Premium"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Slug (URL)</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={inputClass}
                placeholder="expedicion-cano-cristales"
              />
            </div>
            <div>
              <label className={labelClass}>
                <MapPin className="mr-1 inline h-3 w-3" /> Ciudad
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
                placeholder="Bogotá, Medellín..."
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Resumen corto</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Descripción breve para listados y SEO..."
            />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-brand-dark/5 bg-surface p-6 dark:border-white/5">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
            <DollarSign className="h-3.5 w-3.5" /> Precio y Duración
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Precio base (EUR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className={inputClass}
                placeholder="299.00"
              />
            </div>
            <div>
              <label className={labelClass}>
                <Clock className="mr-1 inline h-3 w-3" /> Duración (horas)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className={inputClass}
                placeholder="8"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-brand-dark/5 bg-surface p-6 dark:border-white/5">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
            <ImageIcon className="h-3.5 w-3.5" /> Imagen y Tags
          </h2>
          <div>
            <label className={labelClass}>URL de imagen de portada</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={inputClass}
              placeholder="https://images.unsplash.com/..."
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                className="mt-2 h-24 w-full rounded-xl object-cover"
              />
            )}
          </div>
          <div>
            <label className={labelClass}>
              <Tag className="mr-1 inline h-3 w-3" /> Tags (separados por coma)
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={inputClass}
              placeholder="naturaleza, aventura, colombia"
            />
          </div>
          <div>
            <label className={labelClass}>Idioma</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className={inputClass}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-brand-dark/5 bg-surface p-6 dark:border-white/5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
            Contenido (Markdown)
          </h2>
          <textarea
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            rows={10}
            className={`${inputClass} font-mono text-xs`}
            placeholder="## Descripción completa&#10;&#10;Escribe el contenido del tour en Markdown..."
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/admin/tours">
            <Button
              variant="outline"
              className="rounded-full px-6"
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 rounded-full bg-brand-blue px-8 text-white hover:bg-brand-dark"
          >
            {loading ? (
              'Guardando...'
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Crear Tour
              </>
            )}
          </Button>
        </div>
      </form>
    </main>
  );
}
