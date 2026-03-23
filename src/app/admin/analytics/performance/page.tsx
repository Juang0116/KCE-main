import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { computePerfBudgets } from '@/lib/perfBudgets.server';
import { 
  Zap, Activity, Gauge, Clock, 
  BarChart3, ShieldCheck, AlertCircle, 
  ArrowUpRight, Monitor, Layout 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Telemetría de Red | KCE Ops',
  description: 'Monitoreo de Core Web Vitals y presupuestos de rendimiento para la plataforma KCE.'
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400 border border-green-500/20 shadow-sm">
        <ShieldCheck className="h-3.5 w-3.5" /> Optimizado
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-700 dark:text-red-400 border border-red-500/20 shadow-sm">
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
    CLS: 'Estabilidad visual de los elementos (Cumulative Layout Shift).'
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 01. HEADER TÁCTICO */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Zap className="h-3.5 w-3.5 fill-current" /> Core Web Vitals Analytics
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tight">Salud del <span className="text-brand-yellow italic font-light">Ecosistema</span></h1>
          <p className="mt-3 text-base text-muted font-light max-w-2xl leading-relaxed">
            Monitoreo en tiempo real de la experiencia del viajero. Estos datos se capturan directamente desde los navegadores de nuestros clientes.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-full shadow-sm hover:bg-surface-2 border-brand-dark/10 h-12 px-8 text-[10px] font-bold uppercase tracking-widest transition-all">
            <Activity className="h-4 w-4 mr-2" /> Refrescar Datos
          </Button>
        </div>
      </header>

      {/* 02. PANEL DE CONTROL DE BUDGETS (BOVEDA CENTRAL) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 md:p-12 shadow-pop relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
          <Gauge className="h-64 w-64 text-brand-blue" />
        </div>

        <header className="relative z-10 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-brand-dark/5 dark:border-white/5 pb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-2xl text-main tracking-tight">Performance Budgets</h2>
              <p className="text-[10px] text-muted mt-1 uppercase tracking-[0.2em] font-bold">Percentil p75 · Ventana de 7 días</p>
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
              <article key={m} className={`group rounded-[var(--radius-2xl)] border p-8 transition-all hover:shadow-soft duration-300 ${ok ? 'bg-surface border-brand-dark/5 dark:border-white/5' : 'bg-red-50/50 dark:bg-red-950/20 border-red-500/20'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xs ${ok ? 'bg-brand-blue/10 text-brand-blue' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                    {m}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Activity className={`h-4 w-4 ${ok ? 'text-green-500' : 'text-red-500'} animate-pulse`} />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className={`text-4xl font-heading tracking-tight ${ok ? 'text-main' : 'text-red-600 dark:text-red-400'}`}>
                    {val == null ? '—' : String(val)}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60 mt-2 block">
                    Threshold: {thresholdsObj[m]}
                  </div>
                </div>

                <p className="mt-6 text-xs font-light leading-relaxed text-muted border-t border-brand-dark/5 dark:border-white/5 pt-4">
                  {metricDescriptions[m]}
                </p>
              </article>
            );
          })}
        </div>

        {!budget.ok && (
          <div className="relative z-10 mt-10 rounded-[var(--radius-2xl)] bg-red-50 dark:bg-red-500/10 border border-red-500/20 p-6 flex items-start gap-4 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-200 leading-relaxed font-light">
              <strong className="font-bold block mb-1">Alerta de Optimización</strong>
              Se han detectado brechas en: <span className="font-mono text-xs font-bold bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md mx-1">{budget.breaches.map((b: any) => `${b.metric} (${b.p75})`).join(', ')}</span>. Es necesario revisar la hidratación del cliente y el tamaño de los assets de Media.
            </div>
          </div>
        )}
      </section>

      {/* 03. REGISTRO DE EVENTOS (TABLA DE TELEMETRÍA) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden flex flex-col">
        <div className="p-8 pb-6 flex items-center justify-between border-b border-brand-dark/5 dark:border-white/5 bg-surface-2/30">
           <div className="flex items-center gap-3">
             <BarChart3 className="h-5 w-5 text-brand-blue opacity-50" />
             <h2 className="font-heading text-2xl text-main tracking-tight">Logs de Navegador (RUM)</h2>
           </div>
           <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted bg-surface px-3 py-1.5 rounded-full border border-brand-dark/5 dark:border-white/5">
             Últimos {rows.length} eventos
           </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar max-h-[500px]">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5 sticky top-0 backdrop-blur-md z-10">
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
                  <td colSpan={4} className="px-8 py-20 text-center bg-surface">
                     <Monitor className="mx-auto h-12 w-12 text-brand-blue opacity-20 mb-4" />
                     <p className="text-sm text-muted font-light">Esperando los primeros reportes de telemetría de los clientes...</p>
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={idx} className="group transition-colors hover:bg-surface-2/50 cursor-default">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3 text-muted group-hover:text-main transition-colors text-xs font-mono">
                        <Clock className="h-3.5 w-3.5 opacity-40" />
                        {new Date(r.created_at).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' })}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3 font-medium text-brand-blue group-hover:text-brand-yellow transition-colors">
                        <Layout className="h-3.5 w-3.5 opacity-50" />
                        {r.page || '/'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center justify-center rounded-lg bg-brand-blue/5 border border-brand-blue/10 px-3 py-1 font-mono text-[10px] font-bold text-brand-blue">
                        {r.metric}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="font-mono text-base font-bold text-main">
                        {r.value}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 04. FOOTER DE ESTÁNDARES */}
      <footer className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 border-t border-brand-dark/10 dark:border-white/10 pt-8 opacity-40 transition-opacity hover:opacity-100 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
          <Monitor className="h-3 w-3" /> Real User Monitoring (RUM)
        </div>
        <div className="hidden sm:block h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
          <ArrowUpRight className="h-3 w-3" /> Vercel Deployment Standards
        </div>
      </footer>

    </div>
  );
}