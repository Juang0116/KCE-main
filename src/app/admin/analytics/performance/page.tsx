import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { computePerfBudgets } from '@/lib/perfBudgets.server';
import {
  Zap,
  Activity,
  Gauge,
  Clock,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  Monitor,
  Layout,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Telemetría de Red | KCE Ops',
  description: 'Monitoreo de Core Web Vitals y presupuestos de rendimiento para la plataforma KCE.',
};

// 1. Tipado estricto para las métricas de Google (Core Web Vitals)
type MetricType = 'LCP' | 'INP' | 'CLS';

// 2. Tipado estricto para los registros de la base de datos
type WebVitalsRow = {
  metric: string;
  value: number;
  page: string | null;
  created_at: string;
};

export default async function AdminPerformancePage() {
  const sb = getSupabaseAdmin();

  // Obtenemos los budgets de rendimiento
  const budget = await computePerfBudgets(7);

  // Tipamos la respuesta de Supabase sin usar 'any'
  const { data } = await sb
    .from('web_vitals')
    .select('metric,value,page,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = (data || []) as WebVitalsRow[];

  const badge = (ok: boolean) =>
    ok ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-green-700 shadow-sm dark:text-green-400">
        <ShieldCheck className="h-3.5 w-3.5" /> Optimizado
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-700 shadow-sm dark:text-red-400">
        <AlertCircle className="h-3.5 w-3.5" /> Breach Detectado
      </span>
    );

  const getMetricValue = (m: MetricType) => {
    const p75Obj = budget.p75 as Record<MetricType, number | null>;
    const v = p75Obj[m];
    return typeof v === 'number' ? v : null;
  };

  const checkStatus = (m: MetricType) => {
    const v = getMetricValue(m);
    if (v == null) return true;

    const thresholdsObj = budget.thresholds as Record<MetricType, number>;
    return v <= thresholdsObj[m];
  };

  const metricDescriptions: Record<MetricType, string> = {
    LCP: 'Velocidad de carga visual (Largest Contentful Paint).',
    INP: 'Responsividad a la interacción (Interaction to Next Paint).',
    CLS: 'Estabilidad visual de los elementos (Cumulative Layout Shift).',
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10 pb-24 duration-700">
      {/* 01. HEADER TÁCTICO */}
      <header className="flex flex-col justify-between gap-6 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Zap className="h-3.5 w-3.5 fill-current" /> Core Web Vitals Analytics
          </div>
          <h1 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
            Salud del <span className="font-light italic text-brand-yellow">Ecosistema</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base font-light leading-relaxed text-muted">
            Monitoreo en tiempo real de la experiencia del viajero. Estos datos se capturan
            directamente desde los navegadores de nuestros clientes.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-12 rounded-full border-brand-dark/10 px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-surface-2"
          >
            <Activity className="mr-2 h-4 w-4" /> Refrescar Datos
          </Button>
        </div>
      </header>

      {/* 02. PANEL DE CONTROL DE BUDGETS (BOVEDA CENTRAL) */}
      <section className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-8 shadow-pop dark:border-white/5 md:p-12">
        <div className="pointer-events-none absolute right-0 top-0 p-8 opacity-[0.02]">
          <Gauge className="h-64 w-64 text-brand-blue" />
        </div>

        <header className="relative z-10 mb-10 flex flex-col justify-between gap-6 border-b border-brand-dark/5 pb-8 dark:border-white/5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-2xl tracking-tight text-main">
                Performance Budgets
              </h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                Percentil p75 · Ventana de 7 días
              </p>
            </div>
          </div>
          {badge(budget.ok)}
        </header>

        <div className="relative z-10 grid gap-6 sm:grid-cols-3">
          {(['LCP', 'INP', 'CLS'] as MetricType[]).map((m) => {
            const ok = checkStatus(m);
            const val = getMetricValue(m);
            const thresholdsObj = budget.thresholds as Record<MetricType, number>;

            return (
              <article
                key={m}
                className={`group rounded-[var(--radius-2xl)] border p-8 transition-all duration-300 hover:shadow-soft ${ok ? 'border-brand-dark/5 bg-surface dark:border-white/5' : 'border-red-500/20 bg-red-50/50 dark:bg-red-950/20'}`}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold ${ok ? 'bg-brand-blue/10 text-brand-blue' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}
                  >
                    {m}
                  </div>
                  <div className="opacity-0 transition-opacity group-hover:opacity-100">
                    <Activity
                      className={`h-4 w-4 ${ok ? 'text-green-500' : 'text-red-500'} animate-pulse`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div
                    className={`font-heading text-4xl tracking-tight ${ok ? 'text-main' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {val == null ? '—' : String(val)}
                  </div>
                  <div className="mt-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60">
                    Threshold: {thresholdsObj[m]}
                  </div>
                </div>

                <p className="mt-6 border-t border-brand-dark/5 pt-4 text-xs font-light leading-relaxed text-muted dark:border-white/5">
                  {metricDescriptions[m]}
                </p>
              </article>
            );
          })}
        </div>

        {!budget.ok && (
          <div className="relative z-10 mt-10 flex items-start gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 shadow-sm dark:bg-red-500/10">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="text-sm font-light leading-relaxed text-red-800 dark:text-red-200">
              <strong className="mb-1 block font-bold">Alerta de Optimización</strong>
              Se han detectado brechas en:{' '}
              <span className="mx-1 rounded-md bg-white/50 px-2 py-0.5 font-mono text-xs font-bold dark:bg-black/20">
                {budget.breaches.map((b: any) => `${b.metric} (${b.p75})`).join(', ')}
              </span>
              . Es necesario revisar la hidratación del cliente y el tamaño de los assets de Media.
            </div>
          </div>
        )}
      </section>

      {/* 03. REGISTRO DE EVENTOS (TABLA DE TELEMETRÍA) */}
      <section className="flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
        <div className="bg-surface-2/30 flex items-center justify-between border-b border-brand-dark/5 p-8 pb-6 dark:border-white/5">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-brand-blue opacity-50" />
            <h2 className="font-heading text-2xl tracking-tight text-main">
              Logs de Navegador (RUM)
            </h2>
          </div>
          <span className="rounded-full border border-brand-dark/5 bg-surface px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted dark:border-white/5">
            Últimos {rows.length} eventos
          </span>
        </div>

        <div className="custom-scrollbar max-h-[500px] overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-2/50 sticky top-0 z-10 border-b border-brand-dark/5 backdrop-blur-md dark:border-white/5">
              <tr className="text-left text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5">Endpoint / Página</th>
                <th className="px-8 py-5">Métrica</th>
                <th className="px-8 py-5 text-right">Valor Capturado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="bg-surface px-8 py-20 text-center"
                  >
                    <Monitor className="mx-auto mb-4 h-12 w-12 text-brand-blue opacity-20" />
                    <p className="text-sm font-light text-muted">
                      Esperando los primeros reportes de telemetría de los clientes...
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-surface-2/50 group cursor-default transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3 font-mono text-xs text-muted transition-colors group-hover:text-main">
                        <Clock className="h-3.5 w-3.5 opacity-40" />
                        {new Date(r.created_at).toLocaleString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3 font-medium text-brand-blue transition-colors group-hover:text-brand-yellow">
                        <Layout className="h-3.5 w-3.5 opacity-50" />
                        {r.page || '/'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center justify-center rounded-lg border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 font-mono text-[10px] font-bold text-brand-blue">
                        {r.metric}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="font-mono text-base font-bold text-main">{r.value}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 04. FOOTER DE ESTÁNDARES */}
      <footer className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-brand-dark/10 pt-8 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row sm:gap-8">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
          <Monitor className="h-3 w-3" /> Real User Monitoring (RUM)
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
          <ArrowUpRight className="h-3 w-3" /> Vercel Deployment Standards
        </div>
      </footer>
    </div>
  );
}
