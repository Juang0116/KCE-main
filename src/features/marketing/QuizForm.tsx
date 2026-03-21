'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { CalendarDays, MapPin, Compass, Wallet, Users, Mail, ArrowRight, Sparkles } from 'lucide-react';

import { buildContextHref, type MarketingLocale } from '@/features/marketing/contactContext';

type Rec = { id: string; slug: string; title: string; city?: string | null; url: string };
type CrmSummary = {
  leadReady?: boolean;
  leadId?: string | null;
  dealId?: string | null;
  taskId?: string | null;
  followUpWindowHours?: number | null;
};

type AiItinerary = {
  title: string;
  summary: string;
  days: { day: number; theme: string; morning: string; afternoon: string; evening: string; recommendedTourSlug?: string; }[];
};

type RichBlock = { time: string; title: string; neighborhood?: string; description: string; approx_cost_cop?: number; booking_hint?: string; };
type RichDay = { day: number; date: string; title: string; summary: string; blocks: RichBlock[]; safety: string; tips?: string; };
type RichPlan = {
  city: string; days: number; budgetTier: 'low' | 'mid' | 'high';
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
  } catch { return null; }
}

function nullToUndefined<T>(v: T | null | undefined): T | undefined { return v == null ? undefined : v; }

function detectLocaleFromPath(pathname: string): 'es' | 'en' | 'fr' | 'de' {
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  return /^(es|en|fr|de)$/i.test(seg) ? (seg.toLowerCase() as 'es' | 'en' | 'fr' | 'de') : 'es';
}

const INTERESTS = ['history', 'culture', 'nature', 'coffee', 'food', 'nightlife', 'adventure', 'beach'] as const;
type Budget = 'low' | 'mid' | 'high' | '';
type Pace = 'relaxed' | 'balanced' | 'intense' | '';

const LABELS: Record<(typeof INTERESTS)[number], string> = { history: 'Historia', culture: 'Cultura', nature: 'Naturaleza', coffee: 'Café', food: 'Gastronomía', nightlife: 'Vida nocturna', adventure: 'Aventura', beach: 'Playa' };
const BUDGET_LABELS: Record<Exclude<Budget, ''>, string> = { low: 'Económico', mid: 'Estándar', high: 'Premium' };
const PACE_LABELS: Record<Exclude<Pace, ''>, string> = { relaxed: 'Relajado', balanced: 'Equilibrado', intense: 'Intenso' };

function pillClass(active: boolean) {
  return active
    ? 'border-brand-blue bg-brand-blue text-white shadow-md scale-105'
    : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] hover:border-brand-blue/40 hover:bg-[color:var(--color-surface-2)]';
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
  // Usamos _crm para indicarle a ESLint que sabemos que no se usa en la UI por ahora
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_crm, _setCrm] = React.useState<CrmSummary | null>(null);
  const [aiPlan, setAiPlan] = React.useState<AiItinerary | null>(null);
  const [richPlan, setRichPlan] = React.useState<RichPlan | null>(null);
  const [richMarketing, setRichMarketing] = React.useState<RichMarketing | null>(null);
  const [msg, setMsg] = React.useState<string>('');

  function toggleInterest(i: string) { setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])); }

  function buildPlanContactHref(extra: Record<string, string | number | undefined> = {}) {
    return buildContextHref(locale as MarketingLocale, '/contact', {
      source: 'plan-personalizado', topic: extra.topic || 'plan', city: city || undefined, budget: budget || undefined,
      pace: pace || undefined, pax, interests: interests.join(','), start: travelStart || undefined, end: travelEnd || undefined, ...extra,
    });
  }

  function resetQuiz() {
    setCity(''); setBudget(''); setPace(''); setPax(2); setInterests(['culture']); setEmail(''); setConsent(true);
    setTravelStart(''); setTravelEnd(''); setMsg('Formulario reiniciado.'); setRecs([]); _setCrm(null); setAiPlan(null); setRichPlan(null); setRichMarketing(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(''); setRecs([]); _setCrm(null); setAiPlan(null); setRichPlan(null); setRichMarketing(null);

    try {
      const quizBody = {
        city: city.trim() || undefined, budget: budget || undefined, pace: pace || undefined, pax, interests,
        travelDates: travelStart || travelEnd ? { start: travelStart || undefined, end: travelEnd || undefined } : undefined,
        email: email.trim() || undefined, consent, language: (navigator.language || '').slice(0, 5),
        utm: nullToUndefined(readUtm()), visitorId: nullToUndefined(getCookie('kce_vid')),
      };

      const startDate = travelStart || new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
      const itineraryBody = {
        city: city.trim() || 'Bogotá', days: 3, date: startDate, interests,
        budget: (budget || 'mid') as 'low' | 'mid' | 'high', pax,
        pace: (pace || 'balanced') as 'relax' | 'balanced' | 'intense',
        language: (navigator.language || 'es').slice(0, 5),
      };

      const [quizRes, richRes] = await Promise.allSettled([
        fetch('/api/plan/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(quizBody) }),
        fetch('/api/itinerary-builder', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(itineraryBody) }),
      ]);

      const res = quizRes.status === 'fulfilled' ? quizRes.value : null;
      if (!res || !res.ok) throw new Error('No pudimos procesar tu plan.');
      const data = await res.json().catch(() => ({} as any));
      if (!data?.ok) throw new Error('No pudimos procesar tu plan.');

      setRecs(Array.isArray(data.recommendations) ? data.recommendations : []);
      _setCrm(data?.crm || null);

      if (richRes.status === 'fulfilled' && richRes.value.ok) {
        const richData = await richRes.value.json().catch(() => null);
        if (richData?.ok && richData.plan) {
          setRichPlan(richData.plan);
          if (richData.marketing) setRichMarketing(richData.marketing);
          if (email && consent) {
            void fetch('/api/plan/email', {
              method: 'POST', headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                to: email, richPlan: richData.plan,
                marketingCopy: richData.marketing?.copy ? { headline: richData.marketing.copy.headline, subhead: richData.marketing.copy.subhead } : null,
                recommendations: Array.isArray(data.recommendations) ? data.recommendations.map((r: Rec) => ({ title: r.title, url: r.url, city: r.city ?? null })) : [],
              }),
            }).catch(() => null);
          }
        }
      } else if (data?.itinerary) {
        setAiPlan(data.itinerary);
      }
      setMsg(email && consent ? 'Te enviamos el resumen por correo.' : 'Aquí tienes tus recomendaciones.');
    } catch (err: unknown) {
      setMsg('No pudimos procesar tu plan. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      
      {/* 1. ENCABEZADO EDITORIAL DEL CONCIERGE */}
      <div className="mb-16 text-center max-w-2xl mx-auto">
        <h2 className="font-heading text-4xl md:text-5xl text-brand-blue">Diseña tu ruta perfecta</h2>
        <p className="mt-4 text-lg text-[color:var(--color-text)]/60 font-light leading-relaxed">
          Evita horas de investigación. Cuéntanos qué tipo de viajero eres y nuestra IA cruzará tus preferencias con nuestro catálogo curado para darte un plan en segundos.
        </p>
      </div>

      {/* 2. FORMULARIO FLUIDO */}
      <form onSubmit={onSubmit} className="max-w-3xl mx-auto space-y-12">
        
        {/* Ciudad */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-12 items-start border-b border-[color:var(--color-border)] pb-10">
          <div className="md:w-1/3 shrink-0">
            <div className="flex items-center gap-2 text-brand-blue font-bold tracking-widest uppercase text-[10px] mb-2"><MapPin className="w-3 h-3"/> 01. Destino</div>
            <h3 className="font-heading text-2xl text-[color:var(--color-text)]">Ciudad Base</h3>
          </div>
          <div className="md:w-2/3 w-full">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej: Bogotá, Medellín, Cartagena..." required className="w-full text-xl bg-transparent border-b-2 border-black/10 dark:border-white/10 pb-2 focus:border-brand-blue outline-none transition-colors placeholder:text-black/20 dark:placeholder:text-white/20" />
          </div>
        </div>

        {/* Fechas */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-12 items-start border-b border-[color:var(--color-border)] pb-10">
          <div className="md:w-1/3 shrink-0">
            <div className="flex items-center gap-2 text-brand-blue font-bold tracking-widest uppercase text-[10px] mb-2"><CalendarDays className="w-3 h-3"/> 02. Tiempo</div>
            <h3 className="font-heading text-2xl text-[color:var(--color-text)]">Tus Fechas</h3>
          </div>
          <div className="md:w-2/3 w-full grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--color-text-muted)] block mb-2">Llegada</div>
              <input type="date" value={travelStart} onChange={(e) => setTravelStart(e.target.value)} className="w-full bg-transparent border-b-2 border-black/10 dark:border-white/10 pb-2 focus:border-brand-blue outline-none transition-colors text-lg" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--color-text-muted)] block mb-2">Salida</div>
              <input type="date" value={travelEnd} onChange={(e) => setTravelEnd(e.target.value)} className="w-full bg-transparent border-b-2 border-black/10 dark:border-white/10 pb-2 focus:border-brand-blue outline-none transition-colors text-lg" />
            </div>
          </div>
        </div>

        {/* Estilo (Presupuesto y Ritmo) */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-12 items-start border-b border-[color:var(--color-border)] pb-10">
          <div className="md:w-1/3 shrink-0">
            <div className="flex items-center gap-2 text-brand-blue font-bold tracking-widest uppercase text-[10px] mb-2"><Wallet className="w-3 h-3"/> 03. Estilo</div>
            <h3 className="font-heading text-2xl text-[color:var(--color-text)]">Tu Viaje</h3>
          </div>
          <div className="md:w-2/3 w-full space-y-8">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--color-text-muted)] block mb-3">Presupuesto</div>
              <div className="flex flex-wrap gap-3">
                {(['low', 'mid', 'high'] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setBudget(v)} className={`rounded-full border px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${pillClass(budget === v)}`}>
                    {BUDGET_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--color-text-muted)] block mb-3">Ritmo Deseado</div>
              <div className="flex flex-wrap gap-3">
                {(['relaxed', 'balanced', 'intense'] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setPace(v)} className={`rounded-full border px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${pillClass(pace === v)}`}>
                    {PACE_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Intereses y Pasajeros */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-12 items-start border-b border-[color:var(--color-border)] pb-10">
          <div className="md:w-1/3 shrink-0">
            <div className="flex items-center gap-2 text-brand-blue font-bold tracking-widest uppercase text-[10px] mb-2"><Compass className="w-3 h-3"/> 04. Detalles</div>
            <h3 className="font-heading text-2xl text-[color:var(--color-text)]">Intereses</h3>
          </div>
          <div className="md:w-2/3 w-full">
            <div className="flex flex-wrap gap-3">
              {INTERESTS.map((i) => (
                <button key={i} type="button" onClick={() => toggleInterest(i)} className={`rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-300 ${pillClass(interests.includes(i))}`}>
                  {LABELS[i]}
                </button>
              ))}
            </div>
            
            <div className="mt-8 flex items-center gap-6">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--color-text-muted)] block"><Users className="w-4 h-4 inline mr-2"/> Viajeros:</div>
              <input type="number" min={1} max={20} value={pax} onChange={(e) => setPax(parseInt(e.target.value || '1', 10))} className="w-20 bg-transparent border-b-2 border-black/10 dark:border-white/10 pb-1 text-center text-xl outline-none focus:border-brand-blue transition-colors" />
            </div>
          </div>
        </div>

        {/* Entrega */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-12 items-start pt-6">
          <div className="md:w-1/3 shrink-0">
            <div className="flex items-center gap-2 text-brand-blue font-bold tracking-widest uppercase text-[10px] mb-2"><Mail className="w-3 h-3"/> 05. Entrega</div>
            <h3 className="font-heading text-2xl text-[color:var(--color-text)]">Tu Correo</h3>
          </div>
          <div className="md:w-2/3 w-full">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com (Opcional pero recomendado)" className="w-full text-lg bg-transparent border-b-2 border-black/10 dark:border-white/10 pb-2 focus:border-brand-blue outline-none transition-colors placeholder:text-black/20 dark:placeholder:text-white/20" />
            
            <label htmlFor="consent" className="mt-4 flex items-start gap-3 text-sm text-[color:var(--color-text)]/60 cursor-pointer">
              <input id="consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 w-4 h-4 accent-brand-blue" />
              <span>Acepto recibir este itinerario y que KCE me contacte para hacerlo realidad.</span>
            </label>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <button type="submit" disabled={loading || !city} className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-full bg-brand-blue px-10 py-4 text-white font-bold tracking-wide transition-all hover:bg-brand-blue/90 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-brand-blue/20">
                {loading ? 'Generando plan...' : 'Revelar mi Plan'} <ArrowRight className="w-5 h-5"/>
              </button>
              <button type="button" onClick={resetQuiz} className="text-sm font-semibold text-[color:var(--color-text)]/50 hover:text-brand-blue transition-colors px-4 py-2">
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* 3. ESTADO Y RESULTADOS */}
      {msg && (
        <div className="mt-12 text-center text-sm font-semibold text-brand-blue bg-brand-blue/5 py-3 rounded-full max-w-md mx-auto border border-brand-blue/10">
          {msg}
        </div>
      )}

      {/* PLAN GENERADO (IA) */}
      {(richPlan || aiPlan) && (
        <div className="mt-16 overflow-hidden rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-2xl">
          <div className="relative bg-brand-dark p-10 md:p-16 text-white overflow-hidden text-center md:text-left">
            <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md">
                <Sparkles className="h-3 w-3" /> Itinerario Generado
              </div>
              <h3 className="mt-6 font-heading text-4xl md:text-5xl leading-tight text-white drop-shadow-lg">
                {richMarketing?.copy.headline || richPlan?.city || aiPlan?.title}
              </h3>
              {richMarketing?.copy.subhead && (
                <p className="mt-4 max-w-2xl text-lg font-light leading-relaxed text-white/80 md:mx-0 mx-auto">
                  {richMarketing.copy.subhead}
                </p>
              )}
            </div>
          </div>

          <div className="p-8 md:p-16">
            {richPlan ? (
              <div className="space-y-12">
                {richPlan.itinerary.map((day) => (
                  <div key={day.day} className="relative border-l border-[color:var(--color-border)] pb-8 pl-8 md:pl-12 last:pb-0">
                    <div className="absolute -left-5 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue text-white font-bold shadow-md">
                      {day.day}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] mb-1">{day.date}</div>
                      <h4 className="font-heading text-2xl text-brand-blue">{day.title}</h4>
                      <p className="mt-2 text-[color:var(--color-text)]/70 font-light">{day.summary}</p>
                      
                      <div className="mt-6 space-y-4">
                        {day.blocks.map((block, bi) => (
                          <div key={bi} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5 transition-colors hover:border-brand-blue/30">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                              <div className="font-semibold text-[color:var(--color-text)]">{block.title}</div>
                              <div className="text-xs font-mono text-[color:var(--color-text)]/50 bg-[color:var(--color-surface)] px-2 py-1 rounded-md">{block.time}</div>
                            </div>
                            <p className="text-sm text-[color:var(--color-text)]/70 font-light">{block.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : aiPlan ? (
              <div className="space-y-12">
                <p className="text-[color:var(--color-text)]/70 text-lg mb-8">{aiPlan.summary}</p>
                {aiPlan.days.map((d) => (
                  <div key={d.day} className="relative border-l border-[color:var(--color-border)] pb-8 pl-8 md:pl-12 last:pb-0">
                    <div className="absolute -left-5 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue text-white font-bold shadow-md">
                      {d.day}
                    </div>
                    <h4 className="font-heading text-2xl text-brand-blue">{d.theme}</h4>
                    <div className="mt-6 space-y-4">
                      <div className="rounded-2xl bg-[color:var(--color-surface-2)] p-5 text-sm"><strong className="text-brand-blue">Mañana:</strong> <span className="font-light">{d.morning}</span></div>
                      <div className="rounded-2xl bg-[color:var(--color-surface-2)] p-5 text-sm"><strong className="text-brand-blue">Tarde:</strong> <span className="font-light">{d.afternoon}</span></div>
                      <div className="rounded-2xl bg-[color:var(--color-surface-2)] p-5 text-sm"><strong className="text-brand-blue">Noche:</strong> <span className="font-light">{d.evening}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-16 pt-10 border-t border-[color:var(--color-border)] text-center">
              <h4 className="font-heading text-2xl text-[color:var(--color-text)] mb-6">¿Hacemos realidad este viaje?</h4>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href={buildPlanContactHref({ topic: 'plan', query: `Quiero agendar este plan` })} className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-blue px-8 py-4 font-bold text-white transition hover:scale-105 shadow-xl shadow-brand-blue/20">
                  <CalendarDays className="w-5 h-5"/> Hablar con un Experto
                </Link>
                {richMarketing?.copy?.whatsapp && (
                  <a href={`https://wa.me/?text=${encodeURIComponent(richMarketing.copy.whatsapp)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-emerald-500 bg-emerald-50 px-8 py-4 font-bold text-emerald-700 transition hover:bg-emerald-100">
                    Preguntar por WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FALLBACK: OPCIONES DE CATÁLOGO (Si falla la IA o el backend es simple) */}
      {!richPlan && !aiPlan && recs.length > 0 && (
        <div className="mt-16 overflow-hidden rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-2xl p-8 md:p-16">
          <h3 className="font-heading text-3xl text-brand-blue mb-6">Opciones del Catálogo KCE</h3>
          <p className="text-[color:var(--color-text)]/70 mb-8">Basado en tus intereses, estas experiencias podrían encantarte:</p>
          <div className="grid gap-6 md:grid-cols-2">
            {recs.map((r, i) => (
              <div key={r.slug} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-6 transition-colors hover:border-brand-blue/30">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] mb-2">Recomendación {i + 1}</div>
                <h4 className="font-heading text-xl text-[color:var(--color-text)] mb-2">{r.title}</h4>
                <div className="text-sm text-[color:var(--color-text)]/70 mb-4">{r.city || 'Colombia'}</div>
                <Link href={r.url} className="inline-block text-sm font-bold text-brand-blue hover:text-brand-blue/80">Ver detalle →</Link>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}