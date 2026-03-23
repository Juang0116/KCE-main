import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { AffiliateCreateForm } from '@/features/growth/AffiliateCreateForm';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Users, Link as LinkIcon, DollarSign, Activity, 
  Percent, ShieldCheck, Zap, ExternalLink, Mail 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AffiliateRow = {
  id: string;
  code: string;
  name: string | null;
  email: string | null;
  status: string | null;
  commission_bps: number | null;
  created_at: string | null;
};

function fmtDateISO(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

function badgeStatus(status: string) {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-sm border';
  if (s === 'active') return `${base} bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20`;
  if (s === 'paused') return `${base} bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20`;
  return `${base} bg-surface-2 text-muted border-brand-dark/10 dark:border-white/10`;
}

export default async function AdminAffiliatesPage() {
  const sb = getSupabaseAdmin();

  // Fetch data with any cast to bypass missing types during dev
  const { data, error } = await (sb as any)
    .from('affiliates')
    .select('id,code,name,email,status,commission_bps,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const items = (data ?? []) as AffiliateRow[];

  const signals = [
    { 
      label: 'Partners Activos', 
      value: String(items.filter(a => a.status === 'active').length), 
      note: 'Generando tráfico.'
    },
    { 
      label: 'Comisión Promedio', 
      value: items.length > 0 
        ? `${((items.reduce((acc, curr) => acc + (curr.commission_bps || 0), 0) / items.length) / 100).toFixed(1)}%` 
        : '0%', 
      note: 'Incentivo de red.'
    }
  ];

  return (
    <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 01. HEADER DE SECCIÓN */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Activity className="h-3.5 w-3.5" /> Growth & Partners
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tight">Red de Afiliados</h1>
          <p className="mt-3 text-base text-muted font-light max-w-2xl">
            Control de códigos UTM y comisiones para embajadores de KCE. Rastrear conversiones nunca fue tan elegante.
          </p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-full shadow-sm hover:bg-surface-2 border-brand-dark/10 transition-all text-[10px] font-bold uppercase tracking-widest h-12 px-6">
             Descargar Reporte
           </Button>
        </div>
      </header>

      {/* 02. WORKBENCH (CENTRO DE SEÑALES) */}
      <AdminOperatorWorkbench
        eyebrow="Network Intelligence"
        title="Escala tu canal indirecto"
        description="Cada afiliado recibe un código único. Cuando un viajero reserva usando su enlace, el sistema asigna la comisión automáticamente basada en los puntos básicos (BPS) definidos aquí."
        actions={[
          { href: '/admin/marketing', label: 'Rendimiento UTM', tone: 'primary' },
          { href: '/admin/revenue', label: 'Analítica de Pagos' }
        ]}
        signals={signals}
      />

      {/* 03. MANEJO DE ERRORES VISUAL */}
      {error && (
        <div className="rounded-[var(--radius-2xl)] border border-rose-500/20 bg-rose-500/5 p-8 shadow-sm">
          <div className="flex items-center gap-4 text-rose-700 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-xl">Error de Infraestructura</h3>
              <p className="text-sm opacity-80">{error.message}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/50 dark:bg-black/20 p-4 font-mono text-[11px] text-rose-900/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
            {'>'} Check: ¿Existe la tabla "affiliates"? ¿Service Role activo?
          </div>
        </div>
      )}

      {/* 04. LAYOUT PRINCIPAL: FORM + TABLA */}
      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        
        {/* PANEL DE CREACIÓN (BOVEDA IZQ) */}
        <aside className="space-y-6">
          <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-8 shadow-pop sticky top-8">
            <div className="flex items-center gap-3 mb-8 border-b border-brand-dark/5 dark:border-white/5 pb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl text-main tracking-tight">Alta de Partner</h2>
            </div>
            <AffiliateCreateForm />
          </div>

          <div className="rounded-[var(--radius-3xl)] bg-brand-blue/5 border border-brand-blue/10 p-8 text-center">
             <p className="text-sm font-light text-brand-blue/80 dark:text-brand-blue/60 leading-relaxed italic">
               "Un buen afiliado no solo vende un tour, vende la confianza que KCE representa."
             </p>
          </div>
        </aside>

        {/* DIRECTORIO (BOVEDA DER) */}
        <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden flex flex-col">
          <div className="p-8 pb-6 border-b border-brand-dark/5 dark:border-white/5 bg-surface-2/30">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LinkIcon className="h-5 w-5 text-brand-blue opacity-50" />
                  <h2 className="font-heading text-2xl text-main tracking-tight">Directorio de Códigos</h2>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted bg-surface border border-brand-dark/5 dark:border-white/5 px-3 py-1.5 rounded-full">
                  Total: {items.length} registros
                </div>
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
                <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                  <th className="px-8 py-5">Identidad del Partner</th>
                  <th className="px-8 py-5 text-center">Código de Rastreo</th>
                  <th className="px-8 py-5 text-center">Estado Operativo</th>
                  <th className="px-8 py-5 text-right">Comisión (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-32 text-center bg-surface">
                      <div className="flex flex-col items-center justify-center opacity-40 grayscale">
                        <Users className="h-16 w-16 text-brand-blue mb-6" />
                        <p className="text-xl font-heading text-main tracking-tight">Programa Vacío</p>
                        <p className="text-sm font-light text-muted mt-2">Aún no hay miembros en el programa de afiliados.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((a) => (
                    <tr key={a.id} className="group transition-all hover:bg-surface-2/50 cursor-default">
                      <td className="px-8 py-6 align-middle">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue font-bold text-xs">
                            {a.name?.charAt(0) || <Mail className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-main group-hover:text-brand-blue transition-colors">{a.name || 'Sin nombre asignado'}</div>
                            <div className="text-xs font-light text-muted flex items-center gap-1.5 mt-0.5">
                              <Mail className="h-3 w-3 opacity-50" /> {a.email || 'N/A'}
                            </div>
                            <div className="mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-50">Registrado: {fmtDateISO(a.created_at)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center align-middle">
                        <code className="inline-flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2 font-mono text-sm font-bold text-brand-blue border border-brand-dark/5 dark:border-white/5 shadow-inner group-hover:bg-brand-blue group-hover:text-white transition-all">
                          {a.code}
                        </code>
                      </td>
                      <td className="px-8 py-6 text-center align-middle">
                        <span className={badgeStatus(a.status || '')}>
                          {a.status === 'active' && <Zap className="h-3 w-3 fill-current" />}
                          {a.status || 'inactive'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right align-middle">
                        <div className="inline-flex flex-col items-end">
                          <div className="flex items-center gap-1.5 text-lg font-heading text-green-600 dark:text-green-400">
                            <span className="text-sm font-bold opacity-50">+</span>
                            {a.commission_bps ? (a.commission_bps / 100).toFixed(1) : '0'}
                            <Percent className="h-4 w-4 opacity-50" />
                          </div>
                          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted opacity-50 mt-1">
                            {a.commission_bps} BPS (Base)
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}