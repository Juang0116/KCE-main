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

// 🤖 NUEVO: Tipos para leer el itinerario de la IA
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
  const [aiPlan, setAiPlan] = React.useState<AiItinerary | null>(null); // 🤖 ESTADO NUEVO
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
    setTravelStart(''); setTravelEnd(''); setMsg('Formulario reiniciado.'); setRecs([]); setCrm(null); setAiPlan(null);
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
    setLoading(true); setMsg(''); setRecs([]); setCrm(null); setAiPlan(null);

    try {
      const res = await fetch('/api/plan/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          city: city.trim() || undefined, budget: budget || undefined, pace: pace || undefined, pax, interests,
          travelDates: travelStart || travelEnd ? { start: travelStart || undefined, end: travelEnd || undefined } : undefined,
          email: email.trim() || undefined, consent, language: (navigator.language || '').slice(0, 5),
          utm: nullToUndefined(readUtm()), visitorId: nullToUndefined(getCookie('kce_vid')),
        }),
      });

      const data = await res.json().catch(() => ({} as { ok?: boolean; detail?: string; requestId?: string; recommendations?: Rec[]; crm?: CrmSummary; itinerary?: AiItinerary }));
      if (!res.ok || !data?.ok) {
        throw new Error(`No pudimos procesar tu plan.`);
      }

      setRecs(Array.isArray(data.recommendations) ? data.recommendations : []);
      setCrm(data?.crm && typeof data.crm === 'object' ? data.crm : null);
      
      // 🤖 Guardamos el itinerario que llegó del servidor
      if (data?.itinerary && typeof data.itinerary === 'object') {
        setAiPlan(data.itinerary);
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
                Diseñar mi Viaje
              </Button>
              <Button type="button" variant="outline" onClick={resetQuiz}>Reiniciar</Button>
            </div>
            {msg ? <p className="text-sm text-[color:var(--color-text)]/80">{msg}</p> : null}
          </div>
        </div>
      </form>

      {/* 🤖 NUEVA SECCIÓN: EL ITINERARIO DE LA IA (Se muestra si aiPlan existe) */}
      {aiPlan ? (
        <div className="mt-12 rounded-[calc(var(--radius)+0.5rem)] border-2 border-brand-yellow/30 bg-[color:var(--color-surface)] shadow-pop overflow-hidden">
          {/* Cabecera del Itinerario */}
          <div className="bg-brand-blue p-6 md:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
              <Compass className="w-64 h-64" />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-yellow mb-4">
                <Sparkles className="w-3 h-3" />
                Plan exclusivo KCE
              </div>
              <h2 className="font-heading text-3xl md:text-4xl leading-tight">{aiPlan.title}</h2>
              <p className="mt-3 text-white/80 max-w-2xl text-sm md:text-base leading-relaxed">
                {aiPlan.summary}
              </p>
            </div>
          </div>

          {/* Días del Itinerario */}
          <div className="p-6 md:p-8">
            <div className="space-y-6">
              {aiPlan.days.map((day) => (
                <div key={day.day} className="relative pl-8 md:pl-12 border-l-2 border-brand-blue/10 pb-6 last:pb-0 last:border-l-0">
                  <div className="absolute left-[-1.1rem] md:left-[-1.3rem] top-0 bg-white border-2 border-brand-blue text-brand-blue font-bold rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-sm md:text-base shadow-sm">
                    {day.day}
                  </div>
                  
                  <div className="bg-[color:var(--color-surface-2)] rounded-3xl p-5 md:p-6 border border-[var(--color-border)] shadow-soft">
                    <h3 className="font-heading text-xl text-[color:var(--color-text)] flex items-center gap-2 mb-4">
                      {day.theme}
                    </h3>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="bg-[color:var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)]">
                        <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)] mb-2 flex items-center gap-1">
                          🌅 Mañana
                        </div>
                        <p className="text-sm text-[color:var(--color-text)]/80 leading-relaxed">{day.morning}</p>
                      </div>
                      <div className="bg-[color:var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)]">
                        <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)] mb-2 flex items-center gap-1">
                          ☀️ Tarde
                        </div>
                        <p className="text-sm text-[color:var(--color-text)]/80 leading-relaxed">{day.afternoon}</p>
                      </div>
                      <div className="bg-[color:var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)]">
                        <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)] mb-2 flex items-center gap-1">
                          🌙 Noche
                        </div>
                        <p className="text-sm text-[color:var(--color-text)]/80 leading-relaxed">{day.evening}</p>
                      </div>
                    </div>

                    {day.recommendedTourSlug && recs.find(r => r.slug === day.recommendedTourSlug) && (
                      <div className="mt-4 bg-brand-blue/5 border border-brand-blue/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-brand-blue mb-1 flex items-center gap-2">
                            <MapPin className="w-3 h-3" /> Tour KCE Recomendado
                          </div>
                          <div className="text-sm font-medium text-[color:var(--color-text)]">
                            {recs.find(r => r.slug === day.recommendedTourSlug)?.title}
                          </div>
                        </div>
                        <Link
                          href={recs.find(r => r.slug === day.recommendedTourSlug)?.url || '#'}
                          className="shrink-0 bg-brand-blue text-white px-5 py-2 rounded-full text-xs font-semibold hover:bg-brand-blue/90 transition-colors"
                        >
                          Ver Tour →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Final del Itinerario */}
            <div className="mt-10 bg-brand-yellow/10 border border-brand-yellow/30 rounded-3xl p-6 text-center">
              <h4 className="font-heading text-lg text-[color:var(--color-text)]">¿Te gusta este borrador?</h4>
              <p className="text-sm text-[color:var(--color-text)]/70 mt-2 mb-4 max-w-lg mx-auto">
                Este es solo un punto de partida. Nuestros Asesores Expertos en Colombia están listos para afinar cada detalle, gestionar reservas y hacer esto realidad.
              </p>
              <Link
                href={buildPlanContactHref({ topic: 'plan', query: `Quiero agendar el plan: ${aiPlan.title}` })}
                className="inline-flex items-center gap-2 bg-brand-dark text-brand-yellow px-6 py-3 rounded-full font-semibold transition-transform hover:scale-105"
              >
                <CalendarDays className="w-4 h-4" /> Hablar con un Asesor para Reservar
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* Resto de la interfaz (Tours de Fallback y CRM) se oculta si ya tenemos el plan AI para no saturar, o se muestra si no hay AI */}
      {!aiPlan && recs.length > 0 ? (
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