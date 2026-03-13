// src/features/reviews/ReviewForm.tsx
'use client';

import * as React from 'react';

type Props = { tourSlug: string };

type FormState = {
  name: string;
  email: string;
  rating: number;
  title: string;
  body: string;
};

function safeTrim(v: string) {
  return v.trim();
}

export function ReviewForm({ tourSlug }: Props) {
  const [state, setState] = React.useState<FormState>({
    name: '',
    email: '',
    rating: 5,
    title: '',
    body: '',
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [ok, setOk] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function validate(): string | null {
    const name = safeTrim(state.name);
    const email = safeTrim(state.email);
    const title = safeTrim(state.title);
    const body = safeTrim(state.body);

    if (!name) return 'Por favor escribe tu nombre.';
    if (!email || !email.includes('@')) return 'Por favor escribe un email válido.';
    if (state.rating < 1 || state.rating > 5) return 'Selecciona una calificación válida (1 a 5).';
    if (!title) return 'Escribe un título corto.';
    if (!body || body.length < 20) return 'Cuéntanos un poco más (mínimo 20 caracteres).';
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setErr(null);

    const msg = validate();
    if (msg) return setErr(msg);

    try {
      setSubmitting(true);

      const payload = {
        tour_slug: tourSlug,
        customer_name: safeTrim(state.name),
        customer_email: safeTrim(state.email),
        rating: Number(state.rating),
        title: safeTrim(state.title),
        body: safeTrim(state.body),
      };

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'No pudimos enviar tu reseña.');

      setOk('¡Gracias! Tu reseña fue enviada y quedará visible cuando sea aprobada.');
      setState({ name: '', email: '', rating: 5, title: '', body: '' });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error enviando la reseña.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="card p-6"
      id="reviews"
    >
      <h3 className="font-heading text-lg text-brand-blue">Deja tu reseña</h3>
      <p className="text-[color:var(--color-text)]/75 mt-2 text-sm">
        Publicamos reseñas reales. Tu reseña puede tardar un poco porque pasa por moderación.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-5 grid gap-4"
      >
        <fieldset
          disabled={submitting}
          className="grid gap-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-[color:var(--color-text)]">Nombre</span>
              <input
                value={state.name}
                onChange={(e) => set('name', e.target.value)}
                className="focus:brand-focus h-11 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm outline-none"
                placeholder="Tu nombre"
                autoComplete="name"
                maxLength={80}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium text-[color:var(--color-text)]">Email</span>
              <input
                value={state.email}
                onChange={(e) => set('email', e.target.value)}
                className="focus:brand-focus h-11 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm outline-none"
                placeholder="tucorreo@email.com"
                autoComplete="email"
                inputMode="email"
                maxLength={120}
              />
            </label>
          </div>

          <div className="grid gap-1">
            <span className="text-sm font-medium text-[color:var(--color-text)]">Calificación</span>
            <div className="flex flex-wrap gap-2">
              {[5, 4, 3, 2, 1].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('rating', r)}
                  className={[
                    'rounded-full border px-3 py-2 text-sm transition',
                    state.rating === r
                      ? 'border-[color:var(--brand-blue)] bg-[color:var(--brand-blue)] text-white'
                      : 'text-[color:var(--color-text)]/80 border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:bg-black/5',
                  ].join(' ')}
                  aria-pressed={state.rating === r}
                >
                  ⭐ {r}
                </button>
              ))}
            </div>
          </div>

          <label className="grid gap-1">
            <span className="text-sm font-medium text-[color:var(--color-text)]">Título</span>
            <input
              value={state.title}
              onChange={(e) => set('title', e.target.value)}
              className="focus:brand-focus h-11 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm outline-none"
              placeholder="Ej: Excelente experiencia"
              maxLength={80}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium text-[color:var(--color-text)]">Reseña</span>
            <textarea
              value={state.body}
              onChange={(e) => set('body', e.target.value)}
              className="focus:brand-focus min-h-[120px] rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 text-sm outline-none"
              placeholder="Cuéntanos cómo fue tu experiencia..."
              maxLength={1200}
            />
            <span className="text-[color:var(--color-text)]/60 text-xs">
              {state.body.length}/1200
            </span>
          </label>
        </fieldset>

        {err ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
            {err}
          </div>
        ) : null}

        {ok ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">
            {ok}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="brand-btn brand-btn--primary w-full disabled:opacity-60"
        >
          {submitting ? 'Enviando…' : 'Enviar reseña'}
        </button>

        <p className="text-[color:var(--color-text)]/55 text-xs">
          Al enviar aceptas que tu reseña sea moderada antes de publicarse (para evitar spam).
        </p>
      </form>
    </div>
  );
}
