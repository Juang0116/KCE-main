'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/Button';
import { buildContextHref, type MarketingLocale } from '@/features/marketing/contactContext';

type Rec = { id: string; slug: string; title: string; city?: string | null; url: string };
type CrmSummary = {
  leadReady?: boolean;
  leadId?: string | null;
  dealId?: string | null;
  taskId?: string | null;
  followUpWindowHours?: number | null;
};

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]!) : null;
}

function readUtm(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem('kce.utm');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function nullToUndefined<T>(v: T | null | undefined): T | undefined {
  return v == null ? undefined : v;
}


function detectLocaleFromPath(pathname: string): 'es' | 'en' | 'fr' | 'de' {
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  return /^(es|en|fr|de)$/i.test(seg) ? (seg.toLowerCase() as 'es' | 'en' | 'fr' | 'de') : 'es';
}

function withLocale(locale: 'es' | 'en' | 'fr' | 'de', href: string) {
  if (!href.startsWith('/')) return href;
  return /^\/(es|en|fr|de)(\/|$)/i.test(href) ? href : href === '/' ? `/${locale}` : `/${locale}${href}`;
}

const INTERESTS = [
  'history',
  'culture',
  'nature',
  'coffee',
  'food',
  'nightlife',
  'adventure',
  'beach',
] as const;

type Budget = 'low' | 'mid' | 'high' | '';
type Pace = 'relaxed' | 'balanced' | 'intense' | '';

const LABELS: Record<(typeof INTERESTS)[number], string> = {
  history: 'Historia',
  culture: 'Cultura',
  nature: 'Naturaleza',
  coffee: 'Café',
  food: 'Gastronomía',
  nightlife: 'Vida nocturna',
  adventure: 'Aventura',
  beach: 'Playa',
};


const BUDGET_LABELS: Record<Exclude<Budget, ''>, string> = {
  low: 'Económico',
  mid: 'Estándar',
  high: 'Premium',
};

const PACE_LABELS: Record<Exclude<Pace, ''>, string> = {
  relaxed: 'Relajado',
  balanced: 'Equilibrado',
  intense: 'Intenso',
};

function pillClass(active: boolean) {
  return active
    ? 'border-brand-yellow bg-brand-yellow text-brand-dark shadow-soft'
    : 'border-[var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-2)]';
}

function sectionClass(span2 = false) {
  return `rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5 ${span2 ? 'md:col-span-2' : ''}`.trim();
}

export default function QuizForm() {
  const pathname = usePathname() || '/plan';
  const locale = detectLocaleFromPath(pathname);
  const [city, setCity] = React.useState('');
  const [budget, setBudget] = React.useState<Budget>('');
  const [pace, setPace] = React.useState<Pace>('');
  const [pax, setPax] = React.useState<number>(2);
  const [interests, setInterests] = React.useState<string[]>(['culture']);
  const [email, setEmail] = React.useState('');
  const [consent, setConsent] = React.useState(true);
  const [travelStart, setTravelStart] = React.useState('');
  const [travelEnd, setTravelEnd] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [recs, setRecs] = React.useState<Rec[]>([]);
  const [crm, setCrm] = React.useState<CrmSummary | null>(null);
  const [msg, setMsg] = React.useState<string>('');

  function toggleInterest(i: string) {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  function buildPlanContactHref(extra: Record<string, string | number | undefined> = {}) {
    return buildContextHref(locale as MarketingLocale, '/contact', {
      source: 'plan-personalizado',
      topic: extra.topic || 'plan',
      city: city || undefined,
      budget: budget || undefined,
      pace: pace || undefined,
      pax,
      interests: interests.join(','),
      start: travelStart || undefined,
      end: travelEnd || undefined,
      ...extra,
    });
  }

  function resetQuiz() {
    setCity('');
    setBudget('');
    setPace('');
    setPax(2);
    setInterests(['culture']);
    setEmail('');
    setConsent(true);
    setTravelStart('');
    setTravelEnd('');
    setMsg('Formulario reiniciado.');
    setRecs([]);
    setCrm(null);
  }

  const travelWindow = [travelStart || null, travelEnd || null].filter(Boolean).join(' → ');
  const travelerSnapshot = [
    city ? ['Ciudad base', city] : null,
    budget ? ['Presupuesto', BUDGET_LABELS[budget]] : null,
    pace ? ['Ritmo', PACE_LABELS[pace]] : null,
    pax ? ['Viajeros', String(pax)] : null,
    interests.length ? ['Intereses', interests.map((value) => LABELS[value as keyof typeof LABELS] || value).join(', ')] : null,
    travelWindow ? ['Fechas', travelWindow] : null,
  ].filter(Boolean) as Array<[string, string]>;

  const primaryNextStep = recs.length <= 1
    ? 'Abre el tour y valida si quieres que KCE te ayude a asegurar la mejor siguiente acción.'
    : 'Compara 2 o 3 opciones, quédate con tu favorita y usa contacto o chat cuando quieras cerrar con apoyo humano.';

  const planContinuityLinks = [
    {
      label: 'Seguir comparando tours',
      href: withLocale(locale, '/tours'),
      copy: 'Vuelve al catálogo para revisar más opciones reales antes de decidir.',
    },
    {
      label: 'Continuar con KCE',
      href: buildPlanContactHref({ topic: 'plan', query: msg || 'Quiero continuar mi plan personalizado con KCE.' }),
      copy: 'Abre contacto con el contexto del plan para no volver a explicar todo desde cero.',
    },
    {
      label: 'Abrir chat KCE',
      href: '#chat',
      copy: 'Usa el concierge si prefieres afinar la ruta por conversación antes de reservar.',
    },
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setRecs([]);
    setCrm(null);

    try {
      const res = await fetch('/api/plan/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          city: city.trim() || undefined,
          budget: budget || undefined,
          pace: pace || undefined,
          pax,
          interests,
          travelDates:
            travelStart || travelEnd
              ? { start: travelStart || undefined, end: travelEnd || undefined }
              : undefined,
          email: email.trim() || undefined,
          consent,
          language: (navigator.language || '').slice(0, 5),
          utm: nullToUndefined(readUtm()),
          visitorId: nullToUndefined(getCookie('kce_vid')),
        }),
      });

      const data = await res.json().catch(() => ({} as { ok?: boolean; detail?: string; requestId?: string; recommendations?: Rec[]; crm?: CrmSummary }));
      if (!res.ok || !data?.ok) {
        const rid = data?.requestId ? ` (Req: ${String(data.requestId)})` : '';
        const detail =
          process.env.NODE_ENV !== 'production' && data?.detail
            ? `\nDetalle: ${String(data.detail)}`
            : '';
        throw new Error(`No pudimos procesar tu plan${rid}.${detail}`);
      }

      setRecs(Array.isArray(data.recommendations) ? data.recommendations : []);
      setCrm(data?.crm && typeof data.crm === 'object' ? data.crm : null);
      setMsg(
        email && consent
          ? 'Te enviamos el resumen por correo si quedó permitido.'
          : 'Aquí tienes tus recomendaciones.',
      );
    } catch (err: unknown) {
      const m = String((err as { message?: string } | null)?.message || '').trim();
      setMsg(m || 'No pudimos procesar tu plan. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {[
          ['01', 'Cuéntanos tu idea de viaje', 'Ciudad, presupuesto, ritmo e intereses para entender mejor lo que buscas.'],
          ['02', 'Recibe opciones reales', 'El resultado sale conectado al catálogo y listo para comparar o reservar.'],
          ['03', 'Si hace falta, te ayudamos', 'Puedes pasar a contacto o WhatsApp sin perder el contexto del caso.'],
          ['04', 'Seguimiento con más contexto', 'Si dejas tu email y consentimiento, KCE puede retomar tu proceso con más claridad.'],
        ].map(([num, title, copy]) => (
          <div
            key={num}
            className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-soft"
          >
            <div className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-text-muted)]">{num}</div>
            <div className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
            <div className="mt-1 text-sm text-[color:var(--color-text)]/70">{copy}</div>
          </div>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="grid gap-4 md:grid-cols-2"
      >
        <div className={sectionClass(true)}>
          <h3 className="font-heading text-lg text-brand-blue">1) Ciudad base</h3>
          <p className="mt-1 text-sm text-[color:var(--color-text)]/70">¿Desde dónde quieres empezar?</p>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Bogotá, Medellín, Cartagena..."
            className="mt-3 w-full bg-[color:var(--color-surface)]"
          />
        </div>

        <div className={sectionClass()}>
          <h3 className="font-heading text-lg text-brand-blue">2) Fechas aproximadas</h3>
          <p className="mt-1 text-sm text-[color:var(--color-text)]/70">Opcional, pero ayuda a que la ruta salga más útil.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="travel-start" className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">Inicio</label>
              <input
                id="travel-start"
                type="date"
                value={travelStart}
                onChange={(e) => setTravelStart(e.target.value)}
                className="mt-2 w-full bg-[color:var(--color-surface)]"
              />
            </div>
            <div>
              <label htmlFor="travel-end" className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">Fin</label>
              <input
                id="travel-end"
                type="date"
                value={travelEnd}
                onChange={(e) => setTravelEnd(e.target.value)}
                className="mt-2 w-full bg-[color:var(--color-surface)]"
              />
            </div>
          </div>
        </div>

        <div className={sectionClass()}>
          <h3 className="font-heading text-lg text-brand-blue">3) Presupuesto</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['low', 'mid', 'high'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setBudget(v)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${pillClass(budget === v)}`}
              >
                {BUDGET_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        <div className={sectionClass()}>
          <h3 className="font-heading text-lg text-brand-blue">4) Ritmo</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['relaxed', 'balanced', 'intense'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setPace(v)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${pillClass(pace === v)}`}
              >
                {PACE_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        <div className={sectionClass(true)}>
          <h3 className="font-heading text-lg text-brand-blue">5) Intereses</h3>
          <p className="mt-1 text-sm text-[color:var(--color-text)]/70">Elige lo que te llama la atención.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleInterest(i)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${pillClass(interests.includes(i))}`}
              >
                {LABELS[i]}
              </button>
            ))}
          </div>
          {interests.length === 0 ? (
            <p className="mt-3 text-xs text-red-600 dark:text-red-200">Selecciona al menos un interés.</p>
          ) : null}
        </div>

        <div className={sectionClass()}>
          <h3 className="font-heading text-lg text-brand-blue">6) Personas</h3>
          <input
            type="number"
            min={1}
            max={20}
            value={pax}
            onChange={(e) => setPax(parseInt(e.target.value || '1', 10))}
            className="mt-3 w-full bg-[color:var(--color-surface)]"
          />
        </div>

        <div className={sectionClass()}>
          <h3 className="font-heading text-lg text-brand-blue">7) Recibir resumen por correo</h3>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Opcional: tu@email.com"
            className="mt-3 w-full bg-[color:var(--color-surface)]"
          />
          <label className="mt-3 flex items-start gap-2 text-sm text-[color:var(--color-text)]/70">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            <span>Acepto que KCE me contacte para continuar esta propuesta, enviarme mi resumen y ayudarme con el siguiente paso.</span>
          </label>
        </div>

        <div className="md:col-span-2 flex flex-col gap-3 rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-[color:var(--color-text)]">Listo para recibir tu ruta inicial</div>
            <div className="mt-1 text-sm text-[color:var(--color-text)]/70">
              Este formulario devuelve tours reales del catálogo y, si quieres, deja tu caso listo para que KCE retome contigo con más contexto y menos fricción.
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || interests.length === 0}
                isLoading={loading}
              >
                Ver recomendaciones
              </Button>
              <Button type="button" variant="outline" onClick={resetQuiz}>
                Reiniciar
              </Button>
            </div>
            {msg ? <p className="text-sm text-[color:var(--color-text)]/80">{msg}</p> : null}
          </div>
        </div>
      </form>

      {crm?.leadReady ? (
        <div className="mt-10 rounded-[calc(var(--radius)+0.25rem)] border border-emerald-500/25 bg-emerald-500/10 p-6 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800/75 dark:text-emerald-100/75">Operación KCE</div>
              <h3 className="mt-2 font-heading text-2xl text-emerald-900 dark:text-emerald-50">Tu plan ya quedó listo para seguimiento</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-900/75 dark:text-emerald-50/75">
                KCE guardó tu contexto y dejó una ruta comercial inicial para continuar contigo con más claridad.
                {typeof crm.followUpWindowHours === 'number' ? ` Seguimiento objetivo: ≤ ${crm.followUpWindowHours} horas.` : ''}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-600/15 bg-white/60 px-4 py-3 text-xs text-emerald-900/80 dark:bg-black/10 dark:text-emerald-50/80">
              <div className="font-semibold">Señales creadas</div>
              <div className="mt-2 space-y-1">
                <div>Lead: {crm.leadId ? 'sí' : 'pendiente'}</div>
                <div>Deal: {crm.dealId ? 'sí' : 'pendiente'}</div>
                <div>Tarea: {crm.taskId ? 'sí' : 'pendiente'}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {recs.length > 0 ? (
        <div className="mt-10 rounded-[calc(var(--radius)+0.25rem)] border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-6 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="font-heading text-2xl text-brand-blue">Tus opciones iniciales</h3>
              <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
                Estas recomendaciones están pensadas para ayudarte a comparar mejor, abrir detalle y decidir si sigues por catálogo, contacto o ayuda humana.
              </p>
            </div>
            <Link
              href={withLocale(locale, '/tours')}
              className="text-sm font-semibold text-brand-blue underline-offset-4 hover:underline"
            >
              Ver todo el catálogo
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4">
              <div className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-text-muted)]">MATCHES</div>
              <div className="mt-2 text-2xl font-heading text-brand-blue">{recs.length}</div>
              <div className="mt-1 text-sm text-[color:var(--color-text)]/70">Opciones reales listas para revisar.</div>
            </div>
            <div className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4">
              <div className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-text-muted)]">SIGUIENTE PASO</div>
              <div className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">Abrir detalle o pedir ayuda</div>
              <div className="mt-1 text-sm text-[color:var(--color-text)]/70">Puedes pasar al tour, hablar con KCE o guardar tu intención sin perder el contexto.</div>
            </div>
            <div className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4">
              <div className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-text-muted)]">SEGUIMIENTO</div>
              <div className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">KCE puede retomar contigo con contexto</div>
              <div className="mt-1 text-sm text-[color:var(--color-text)]/70">Así continuamos tu proceso con más contexto y menos fricción.</div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">Resumen de tu idea</div>
              <div className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">Tu ruta ya tiene forma y continuidad</div>
              <p className="mt-1 text-sm text-[color:var(--color-text)]/70">{primaryNextStep}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {travelerSnapshot.map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/48">{label}</div>
                    <div className="mt-1 text-sm font-semibold text-[color:var(--color-text)]">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-brand-blue/15 bg-brand-blue/5 p-5 shadow-soft">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-blue/75">Continuar desde aquí</div>
              <div className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">Plan, catálogo, chat y contacto ya trabajan como un solo hilo</div>
              <p className="mt-1 text-sm text-[color:var(--color-text)]/72">No necesitas reiniciar la historia. Usa la ruta que más te convenga ahora y KCE conserva mejor el contexto.</p>
              <div className="mt-4 grid gap-3">
                {planContinuityLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="rounded-2xl border border-brand-blue/10 bg-white/80 px-4 py-3 transition hover:bg-white dark:bg-black/10 dark:hover:bg-black/20"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/50">Ruta útil</div>
                    <div className="mt-1 text-sm font-semibold text-[color:var(--color-text)]">{link.label}</div>
                    <div className="mt-1 text-[11px] leading-5 text-[color:var(--color-text)]/70">{link.copy}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {recs.map((r, index) => (
              <div
                key={r.slug}
                className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">Opción #{index + 1}</div>
                    <div className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">{r.title}</div>
                    <div className="mt-1 text-sm text-[color:var(--color-text)]/70">{r.city ?? 'Colombia'}</div>
                  </div>
                  <div className="rounded-full bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-brand-blue">
                    Match
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={r.url}
                    className="inline-flex items-center rounded-full bg-[color:var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white no-underline hover:no-underline"
                  >
                    Abrir detalle →
                  </Link>
                  <Link
                    href={buildPlanContactHref({ topic: 'plan', tour: r.title, slug: r.slug })}
                    className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text)] no-underline hover:no-underline"
                  >
                    Continuar con KCE
                  </Link>
                  <Link
                    href={withLocale(locale, '/wishlist')}
                    className="inline-flex items-center rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text)] no-underline hover:no-underline"
                  >
                    Guardar shortlist
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ['Abrir detalle', 'Compara con calma precio, duración, logística y fit de cada experiencia.'],
              ['Continuar con KCE', 'Pasa a contacto, chat o WhatsApp si quieres validar la mejor ruta con apoyo humano.'],
              ['Retomar con contexto', 'Si dejaste tu correo o tu contacto, KCE puede continuar este caso sin empezar de cero.'],
            ].map(([title, copy]) => (
              <div key={String(title)} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4">
                <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
                <div className="mt-1 text-sm text-[color:var(--color-text)]/70">{copy}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
