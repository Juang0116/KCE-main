'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Sparkles, CalendarDays, MapPin, Compass } from 'lucide-react';

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

// ─── Tipos de plan IA ───────────────────────────────────────
type AiItinerary = {
  title: string;
  summary: string;
  days: {
    day: number;
    theme: string;
    morning: string;
    afternoon: string;
    evening: string;
    recommendedTourSlug?: string;
  }[];
};

// Esquema rico del itinerary-builder (Gemini)
type RichBlock = {
  time: string;
  title: string;
  neighborhood?: string;
  description: string;
  approx_cost_cop?: number;
  booking_hint?: string;
};
type RichDay = {
  day: number;
  date: string;
  title: string;
  summary: string;
  blocks: RichBlock[];
  safety: string;
  tips?: string;
};
type RichPlan = {
  city: string;
  days: number;
  budgetTier: 'low' | 'mid' | 'high';
  budgetCOPPerPersonPerDay: { min: number; max: number };
  itinerary: RichDay[];
  totals: { approx_total_cop_per_person: number };
  cta?: { message: string; tours?: { title: string; url: string }[] };
};
type RichMarketing = {
  audience: { persona: string; tone?: string };
  copy: { headline: string; subhead: string; whatsapp: string };
  upsells?: { title: string; url: string }[];
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

const INTERESTS = ['history', 'culture', 'nature', 'coffee', 'food', 'nightlife', 'adventure', 'beach'] as const;

type Budget = 'low' | 'mid' | 'high' | '';
type Pace = 'relaxed' | 'balanced' | 'intense' | '';

const LABELS: Record<(typeof INTERESTS)[number], string> = {
  history: 'Historia', culture: 'Cultura', nature: 'Naturaleza', coffee: 'Café',
  food: 'Gastronomía', nightlife: 'Vida nocturna', adventure: 'Aventura', beach: 'Playa',
};

const BUDGET_LABELS: Record<Exclude<Budget, ''>, string> = { low: 'Económico', mid: 'Estándar', high: 'Premium' };
const PACE_LABELS: Record<Exclude<Pace, ''>, string> = { relaxed: 'Relajado', balanced: 'Equilibrado', intense: 'Intenso' };

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
  const [aiPlan, setAiPlan] = React.useState<AiItinerary | null>(null);
  const [richPlan, setRichPlan] = React.useState<RichPlan | null>(null);
  const [richMarketing, setRichMarketing] = React.useState<RichMarketing | null>(null);
  const [msg, setMsg] = React.useState<string>('');

  function toggleInterest(i: string) {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  function buildPlanContactHref(extra: Record<string, string | number | undefined> = {}) {
    return buildContextHref(locale as MarketingLocale, '/contact', {
      source: 'plan-personalizado', topic: extra.topic || 'plan', city: city || undefined, budget: budget || undefined,
      pace: pace || undefined, pax, interests: interests.join(','), start: travelStart || undefined, end: travelEnd || undefined, ...extra,
    });
  }

  function resetQuiz() {
    setCity(''); setBudget(''); setPace(''); setPax(2); setInterests(['culture']); setEmail(''); setConsent(true);
    setTravelStart(''); setTravelEnd(''); setMsg('Formulario reiniciado.'); setRecs([]); setCrm(null); setAiPlan(null); setRichPlan(null); setRichMarketing(null);
  }

  const travelWindow = [travelStart || null, travelEnd || null].filter(Boolean).join(' → ');
  const travelerSnapshot = [
    city ? ['Ciudad base', city] : null, budget ? ['Presupuesto', BUDGET_LABELS[budget]] : null,
    pace ? ['Ritmo', PACE_LABELS[pace]] : null, pax ? ['Viajeros', String(pax)] : null,
    interests.length ? ['Intereses', interests.map((value) => LABELS[value as keyof typeof LABELS] || value).join(', ')] : null,
    travelWindow ? ['Fechas', travelWindow] : null,
  ].filter(Boolean) as Array<[string, string]>;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(''); setRecs([]); setCrm(null); setAiPlan(null); setRichPlan(null); setRichMarketing(null);

    try {
      const quizBody = {
        city: city.trim() || undefined, budget: budget || undefined, pace: pace || undefined, pax, interests,
        travelDates: travelStart || travelEnd ? { start: travelStart || undefined, end: travelEnd || undefined } : undefined,
        email: email.trim() || undefined, consent, language: (navigator.language || '').slice(0, 5),
        utm: nullToUndefined(readUtm()), visitorId: nullToUndefined(getCookie('kce_vid')),
      };

      // Run quiz/submit (CRM + leads) and itinerary-builder (rich AI plan) in parallel
      const startDate = travelStart || new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
      const itineraryBody = {
        city: city.trim() || 'Bogotá',
        days: 3,
        date: startDate,
        interests,
        budget: (budget || 'mid') as 'low' | 'mid' | 'high',
        pax,
        pace: (pace || 'balanced') as 'relax' | 'balanced' | 'intense',
        language: (navigator.language || 'es').slice(0, 5),
      };

      const [quizRes, richRes] = await Promise.allSettled([
        fetch('/api/plan/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(quizBody),
        }),
        fetch('/api/itinerary-builder', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(itineraryBody),
        }),
      ]);

      // Handle quiz/submit result (CRM is mandatory)
      const res = quizRes.status === 'fulfilled' ? quizRes.value : null;
      if (!res || !res.ok) throw new Error('No pudimos procesar tu plan.');
      const data = await res.json().catch(() => ({} as { ok?: boolean; recommendations?: Rec[]; crm?: CrmSummary; itinerary?: AiItinerary }));
      if (!data?.ok) throw new Error('No pudimos procesar tu plan.');

      setRecs(Array.isArray(data.recommendations) ? data.recommendations : []);
      setCrm(data?.crm && typeof data.crm === 'object' ? data.crm : null);

      // Handle itinerary-builder result (rich plan — best effort)
      if (richRes.status === 'fulfilled' && richRes.value.ok) {
        const richData = await richRes.value.json().catch(() => null);
        if (richData?.ok && richData.plan) {
          setRichPlan(richData.plan as RichPlan);
          if (richData.marketing) setRichMarketing(richData.marketing as RichMarketing);
          // Send rich itinerary email (best-effort, fire & forget)
          if (email && consent) {
            void fetch('/api/plan/email', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                to: email,
                richPlan: richData.plan,
                marketingCopy: richData.marketing?.copy
                  ? { headline: richData.marketing.copy.headline, subhead: richData.marketing.copy.subhead }
                  : null,
                recommendations: Array.isArray(data.recommendations)
                  ? data.recommendations.map((r: Rec) => ({ title: r.title, url: r.url, city: r.city ?? null }))
                  : [],
              }),
            }).catch(() => null);
          }
        }
      } else if (data?.itinerary && typeof data.itinerary === 'object') {
        // Fallback to simple itinerary from quiz/submit
        setAiPlan(data.itinerary as AiItinerary);
      }

      setMsg(email && consent ? 'Te enviamos el resumen por correo.' : 'Aquí tienes tus recomendaciones.');
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
          <div key={num} className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-soft">
            <div className="text-xs font-semibold tracking-[0.18em] text-[color:var(--color-text-muted)]">{num}</div>
            <div className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
            <div className="mt-1 text-sm text-[color:var(--color-text)]/70">{copy}</div>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <div className={sectionClass(true)}>
          <h3 className="font-heading text-lg text-brand-blue">1) Ciudad base</h3>
          <p className="mt-1 text-sm text-[color:var(--color-text)]/70">¿Desde dónde quieres empezar?</p>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bogotá, Medellín, Cartagena..." className="mt-3 w-full bg-[color:var(--color-surface)] rounded-xl border border-[var(--color-border)] px-4 py-3" />
        </div>

        <div className={sectionClass()}>
          <h3 className="font-heading text-lg text-brand-blue">2) Fechas aproximadas</h3>
          <p className="mt-1 text-sm text-[color:var(--color-text)]/70">Opcional, pero ayuda a que la ruta salga más útil.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="travel-start" className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">Inicio</label>
              <input id="travel-start" type="date" value={travelStart} onChange={(e) => setTravelStart(e.target.value)} className="mt-2 w-full bg-[color:var(--color-surface)] rounded-xl border border-[var(--color-border)] px-4 py-3" />
            </div>
            <div>
              <label htmlFor="travel-end" className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">Fin</label>
              <input id="travel-end" type="date" value={travelEnd} onChange={(e) => setTravelEnd(e.target.value)} className="mt-2 w-full bg-[color:var(--color-surface)] rounded-xl border border-[var(--color-border)] px-4 py-3" />
            </div>
          </div>
        </div>

        <div className={sectionClass()}>
          <h3 className="font-heading text-lg text-brand-blue">3) Presupuesto</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['low', 'mid', 'high'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setBudget(v)} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${pillClass(budget === v)}`}>
                {BUDGET_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        <div className={sectionClass()}>
          <h3 className="font-heading text-lg text-brand-blue">4) Ritmo</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['relaxed', 'balanced', 'intense'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setPace(v)} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${pillClass(pace === v)}`}>
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
              <button key={i} type="button" onClick={() => toggleInterest(i)} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${pillClass(interests.includes(i))}`}>
                {LABELS[i]}
              </button>
            ))}
          </div>
          {interests.length === 0 ? <p className="mt-3 text-xs text-red-600 dark:text-red-200">Selecciona al menos un interés.</p> : null}
        </div>

        <div className={sectionClass()}>
          <h3 className="font-heading text-lg text-brand-blue">6) Personas</h3>
          <input type="number" min={1} max={20} value={pax} onChange={(e) => setPax(parseInt(e.target.value || '1', 10))} className="mt-3 w-full bg-[color:var(--color-surface)] rounded-xl border border-[var(--color-border)] px-4 py-3" />
        </div>

        <div className={sectionClass()}>
          <h3 className="font-heading text-lg text-brand-blue">7) Recibir resumen</h3>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Opcional: tu@email.com" className="mt-3 w-full bg-[color:var(--color-surface)] rounded-xl border border-[var(--color-border)] px-4 py-3" />
          <label className="mt-3 flex items-start gap-2 text-sm text-[color:var(--color-text)]/70">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            <span>Acepto que KCE me contacte para continuar esta propuesta.</span>
          </label>
        </div>

        <div className="md:col-span-2 flex flex-col gap-3 rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-[color:var(--color-text)]">Generar Plan Inteligente</div>
            <div className="mt-1 text-sm text-[color:var(--color-text)]/70">
              Nuestra IA cruzará tus gustos con el catálogo de KCE para diseñar una ruta única.
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={loading || interests.length === 0} isLoading={loading}>
                <Sparkles className="w-4 h-4 mr-2" />
                {loading ? 'Diseñando...' : 'Diseñar mi Viaje'}
              </Button>
              <Button type="button" variant="outline" onClick={resetQuiz}>Reiniciar</Button>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-xs text-[color:var(--color-text-muted)] animate-pulse">
                <Sparkles className="h-3 w-3 text-brand-blue" />
                Gemini está diseñando tu plan personalizado...
              </div>
            )}
            {msg && !loading ? <p className="text-sm text-[color:var(--color-text)]/80">{msg}</p> : null}
          </div>
        </div>
      </form>

      {/* ─── Rich Plan (itinerary-builder / Gemini) ─── */}
      {richPlan ? (
        <div className="mt-12 overflow-hidden rounded-[calc(var(--radius)+0.5rem)] border-2 border-brand-blue/20 bg-[color:var(--color-surface)] shadow-pop">
          {/* Header */}
          <div className="relative overflow-hidden bg-brand-blue p-6 text-white md:p-8">
            <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10">
              <Compass className="h-64 w-64" />
            </div>
            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-yellow backdrop-blur-sm">
                <Sparkles className="h-3 w-3" /> Plan exclusivo KCE · Gemini AI
              </div>
              {richMarketing?.copy?.headline && (
                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-yellow/80">
                  {richMarketing.copy.headline}
                </p>
              )}
              <h2 className="font-heading text-3xl leading-tight md:text-4xl">
                {richPlan.city} · {richPlan.days} días
              </h2>
              {richMarketing?.copy?.subhead && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
                  {richMarketing.copy.subhead}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/70">
                <span className="rounded-full bg-white/10 px-3 py-1">
                  💰 COP {richPlan.budgetCOPPerPersonPerDay.min.toLocaleString()} – {richPlan.budgetCOPPerPersonPerDay.max.toLocaleString()} / día / persona
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1">
                  💰 Total ~COP {richPlan.totals.approx_total_cop_per_person.toLocaleString()} / persona
                </span>
              </div>
            </div>
          </div>

          {/* Days */}
          <div className="p-6 md:p-8">
            <div className="space-y-8">
              {richPlan.itinerary.map((day) => (
                <div key={day.day} className="relative border-l-2 border-brand-blue/15 pb-6 pl-8 last:border-l-0 last:pb-0 md:pl-12">
                  <div className="absolute left-[-1.1rem] top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-blue bg-white text-sm font-bold text-brand-blue shadow-sm md:left-[-1.3rem] md:h-10 md:w-10 md:text-base">
                    {day.day}
                  </div>
                  <div className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5 shadow-soft md:p-6">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
                      {day.date}
                    </div>
                    <h3 className="font-heading text-xl text-[color:var(--color-text)]">{day.title}</h3>
                    <p className="mt-1 text-sm text-[color:var(--color-text)]/70">{day.summary}</p>

                    {/* Blocks */}
                    <div className="mt-4 space-y-3">
                      {day.blocks.map((block, bi) => (
                        <div key={bi} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
                                {block.time}
                              </span>
                              {block.neighborhood && (
                                <span className="flex items-center gap-1 text-[10px] text-[color:var(--color-text-muted)]">
                                  <MapPin className="h-2.5 w-2.5" /> {block.neighborhood}
                                </span>
                              )}
                            </div>
                            {block.approx_cost_cop !== undefined && (
                              <span className="text-[10px] font-semibold text-[color:var(--color-text-muted)]">
                                ~COP {block.approx_cost_cop.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">{block.title}</div>
                          <div className="mt-1 text-sm leading-relaxed text-[color:var(--color-text)]/75">{block.description}</div>
                          {block.booking_hint && (
                            <div className="mt-2 text-xs italic text-brand-blue/80">💡 {block.booking_hint}</div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Safety + Tips */}
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
                        🛡️ <strong>Seguridad:</strong> {day.safety}
                      </div>
                      {day.tips && (
                        <div className="rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-800">
                          ✅ <strong>Consejo:</strong> {day.tips}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* KCE Tours upsell */}
            {(richMarketing?.upsells?.length || richPlan.cta?.tours?.length) ? (
              <div className="mt-8 rounded-3xl border border-brand-blue/15 bg-brand-blue/5 p-5 md:p-6">
                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-blue">
                  Tours KCE recomendados para este plan
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(richMarketing?.upsells || richPlan.cta?.tours || []).slice(0, 3).map((t, i) => (
                    <Link
                      key={i}
                      href={t.url}
                      className="flex items-center justify-between rounded-2xl border border-brand-blue/20 bg-white px-4 py-3 text-sm font-medium text-brand-blue transition hover:bg-brand-blue hover:text-white"
                    >
                      {t.title} <span>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {/* CTA */}
            <div className="mt-10 rounded-3xl border border-brand-yellow/30 bg-brand-yellow/10 p-6 text-center">
              <h4 className="font-heading text-lg text-[color:var(--color-text)]">
                {richPlan.cta?.message || '¿Te gusta este borrador? Hablemos para hacerlo realidad.'}
              </h4>
              <p className="mx-auto mt-2 mb-4 max-w-lg text-sm text-[color:var(--color-text)]/70">
                Nuestros asesores expertos en Colombia pueden afinar cada detalle y gestionar las reservas.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href={buildPlanContactHref({ topic: 'plan', query: `Quiero agendar un plan de ${richPlan.days} días en ${richPlan.city}` })}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-6 py-3 font-semibold text-brand-yellow transition hover:scale-105"
                >
                  <CalendarDays className="h-4 w-4" /> Hablar con un Asesor
                </Link>
                {richMarketing?.copy?.whatsapp && (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(richMarketing.copy.whatsapp)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const text = [
                      `✈️ Mi plan de ${richPlan.days} días en ${richPlan.city} — KCE`,
                      '',
                      ...richPlan.itinerary.map((d) =>
                        `Día ${d.day}: ${d.title}\n${d.blocks.slice(0, 2).map((b) => `  ${b.time} ${b.title}`).join('\n')}`
                      ),
                      '',
                      `Diseñado con KCE → ${window.location.origin}/plan`,
                    ].join('\n');
                    navigator.clipboard?.writeText(text).then(() => {
                      alert('Plan copiado al portapapeles ✅');
                    }).catch(() => null);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-2)]"
                >
                  📋 Copiar plan
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : aiPlan ? (
        <div className="mt-12 overflow-hidden rounded-[calc(var(--radius)+0.5rem)] border-2 border-brand-yellow/30 bg-[color:var(--color-surface)] shadow-pop">
          <div className="relative overflow-hidden bg-brand-blue p-6 text-white md:p-8">
            <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10">
              <Compass className="h-64 w-64" />
            </div>
            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-yellow backdrop-blur-sm">
                <Sparkles className="h-3 w-3" /> Plan exclusivo KCE
              </div>
              <h2 className="font-heading text-3xl leading-tight md:text-4xl">{aiPlan.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">{aiPlan.summary}</p>
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className="space-y-6">
              {aiPlan.days.map((day) => (
                <div key={day.day} className="relative border-l-2 border-brand-blue/10 pb-6 pl-8 last:border-l-0 last:pb-0 md:pl-12">
                  <div className="absolute left-[-1.1rem] top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-blue bg-white text-sm font-bold text-brand-blue shadow-sm">
                    {day.day}
                  </div>
                  <div className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5 md:p-6">
                    <h3 className="mb-4 font-heading text-xl text-[color:var(--color-text)]">{day.theme}</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      {[['🌅 Mañana', day.morning], ['☀️ Tarde', day.afternoon], ['🌙 Noche', day.evening]].map(([label, text]) => (
                        <div key={label} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">{label}</div>
                          <p className="text-sm leading-relaxed text-[color:var(--color-text)]/80">{text}</p>
                        </div>
                      ))}
                    </div>
                    {day.recommendedTourSlug && recs.find((r) => r.slug === day.recommendedTourSlug) && (
                      <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-4 sm:flex-row">
                        <div>
                          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-blue">
                            <MapPin className="h-3 w-3" /> Tour KCE Recomendado
                          </div>
                          <div className="text-sm font-medium">{recs.find((r) => r.slug === day.recommendedTourSlug)?.title}</div>
                        </div>
                        <Link href={recs.find((r) => r.slug === day.recommendedTourSlug)?.url || '#'}
                          className="shrink-0 rounded-full bg-brand-blue px-5 py-2 text-xs font-semibold text-white transition hover:bg-brand-blue/90">
                          Ver Tour →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-3xl border border-brand-yellow/30 bg-brand-yellow/10 p-6 text-center">
              <h4 className="font-heading text-lg text-[color:var(--color-text)]">¿Te gusta este borrador?</h4>
              <p className="mx-auto mt-2 mb-4 max-w-lg text-sm text-[color:var(--color-text)]/70">
                Este es solo un punto de partida. Nuestros asesores están listos para afinarlo y hacerlo realidad.
              </p>
              <Link href={buildPlanContactHref({ topic: 'plan', query: `Quiero agendar el plan: ${aiPlan.title}` })}
                className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-6 py-3 font-semibold text-brand-yellow transition hover:scale-105">
                <CalendarDays className="h-4 w-4" /> Hablar con un Asesor para Reservar
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* ─── Tour fallback (sin plan AI) ─── */}
      {!richPlan && !aiPlan && recs.length > 0 ? (
        <div className="mt-10 rounded-[calc(var(--radius)+0.25rem)] border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-6 shadow-soft">
           <h3 className="font-heading text-2xl text-brand-blue mb-4">Opciones de Catálogo</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {recs.map((r, index) => (
              <div key={r.slug} className="rounded-3xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">Opción #{index + 1}</div>
                    <div className="mt-2 text-lg font-semibold text-[color:var(--color-text)]">{r.title}</div>
                    <div className="mt-1 text-sm text-[color:var(--color-text)]/70">{r.city ?? 'Colombia'}</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={r.url} className="inline-flex items-center rounded-full bg-[color:var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white no-underline hover:no-underline">
                    Abrir detalle →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

    </div>
  );
}