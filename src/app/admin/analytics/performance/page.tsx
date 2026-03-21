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
  title: 'Rendimiento de Red | Admin KCE',
  description: 'Telemetría de Core Web Vitals y presupuestos de rendimiento para la plataforma KCE.'
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 border border-emerald-500/20 shadow-sm">
        <ShieldCheck className="h-3 w-3" /> Optimizado
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-600 border border-rose-500/20 shadow-sm">
        <AlertCircle className="h-3 w-3" /> Breach
      </span>
    );

  const getMetricValue = (m: MetricType) => {
    // Validamos de forma segura el objeto devuelto por computePerfBudgets
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
    <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER TÁCTICO */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[color:var(--color-border)] pb-10">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Zap className="h-3.5 w-3.5 fill-current" /> Core Web Vitals Analytics
          </div>
          <h1 className="font-heading text-4xl text-brand-blue">Salud del <span className="text-brand-yellow italic font-light">Ecosistema</span></h1>
          <p className="mt-2 text-base text-[color:var(--color-text)]/50 font-light max-w-2xl leading-relaxed">
            Monitoreo en tiempo real de la experiencia del viajero. Estos datos se capturan directamente desde los navegadores de nuestros clientes.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-full">Refrescar Datos</Button>
        </div>
      </header>

      {/* PANEL DE CONTROL DE BUDGETS (BOVEDA CENTRAL) */}
      <section className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
          <Gauge className="h-64 w-64 text-brand-blue" />
        </div>

        <header className="relative z-10 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[color:var(--color-border)] pb-8">
          <div>
            <h2 className="font-heading text-2xl text-brand-blue">Performance Budgets</h2>
            <p className="text-xs text-[color:var(--color-text-muted)] mt-1 uppercase tracking-widest font-bold">Percentil p75 · Ventana de 7 días</p>
          </div>
          {badge(budget.ok)}
        </header>

        <div className="relative z-10 grid gap-6 sm:grid-cols-3">
          {(['LCP', 'INP', 'CLS'] as MetricType[]).map((m) => {
            const ok = checkStatus(m);
            const val = getMetricValue(m);
            const thresholdsObj = budget.thresholds as Record<MetricType, number>;
            
            return (
              <article key={m} className={`group rounded-[2.5rem] border p-8 transition-all hover:shadow-xl ${ok ? 'bg-[color:var(--color-surface)] border-[color:var(--color-border)]' : 'bg-rose-500/[0.02] border-rose-500/20'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xs ${ok ? 'bg-brand-blue/5 text-brand-blue' : 'bg-rose-500/10 text-rose-600'}`}>
                    {m}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Activity className={`h-4 w-4 ${ok ? 'text-emerald-500' : 'text-rose-500'} animate-pulse`} />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className={`text-4xl font-heading ${ok ? 'text-[color:var(--color-text)]' : 'text-rose-700'}`}>
                    {val == null ? '—' : String(val)}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30">
                    Threshold: {thresholdsObj[m]}
                  </div>
                </div>

                <p className="mt-6 text-xs font-light leading-relaxed text-[color:var(--color-text)]/50 border-t border-[color:var(--color-border)] pt-4">
                  {metricDescriptions[m]}
                </p>
              </article>
            );
          })}
        </div>

        {!budget.ok && (
          <div className="relative z-10 mt-10 rounded-2xl bg-rose-500/5 border border-rose-500/10 p-5 flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm text-rose-800/80 leading-relaxed font-light">
              <strong className="font-bold">Alerta de Optimización:</strong> Se han detectado brechas en: {budget.breaches.map((b: any) => `${b.metric} (${b.p75})`).join(', ')}. Es necesario revisar la hidratación del cliente y el tamaño de los assets.
            </div>
          </div>
        )}
      </section>

      {/* REGISTRO DE EVENTOS (TABLA DE TELEMETRÍA) */}
      <section className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-sm overflow-hidden">
        <div className="p-8 pb-4 flex items-center justify-between border-b border-[color:var(--color-border)] mb-4">
           <div className="flex items-center gap-3">
             <BarChart3 className="h-5 w-5 text-brand-blue/40" />
             <h2 className="font-heading text-2xl text-brand-blue">Logs de Navegador</h2>
           </div>
           <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/30">Últimos 200 eventos</span>
        </div>

        <div className="overflow-x-auto px-4 pb-4">
          <div className="rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden shadow-inner">
            <table className="min-w-full text-sm">
              <thead className="bg-[color:var(--color-surface-2)] border-b border-[color:var(--color-border)]">
                <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]">
                  <th className="px-6 py-5">Timestamp</th>
                  <th className="px-6 py-5">Endpoint / Página</th>
                  <th className="px-6 py-5">Métrica</th>
                  <th className="px-6 py-5 text-right">Valor Capturado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((r, idx) => (
                  <tr key={idx} className="group transition-colors hover:bg-brand-blue/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[color:var(--color-text)]/60">
                        <Clock className="h-3.5 w-3.5 opacity-30" />
                        {new Date(r.created_at).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-brand-blue">
                        <Layout className="h-3.5 w-3.5 opacity-30" />
                        {r.page || '/'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-md bg-brand-dark/5 px-2 py-0.5 font-mono text-[10px] font-bold text-[color:var(--color-text)] opacity-60">
                        {r.metric}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono text-base font-bold text-brand-blue">
                        {r.value}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FOOTER DE ESTÁNDARES */}
      <footer className="mt-12 flex items-center justify-center gap-8 border-t border-[color:var(--color-border)] pt-12 opacity-20 transition-opacity hover:opacity-50">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
          <Monitor className="h-3 w-3" /> Real User Monitoring (RUM)
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
          <ArrowUpRight className="h-3 w-3" /> Vercel Deployment Standards
        </div>
      </footer>

    </div>
  );
}