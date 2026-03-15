import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { AffiliateCreateForm } from '@/features/growth/AffiliateCreateForm';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { Users, Link as LinkIcon, DollarSign, Activity, Percent } from 'lucide-react';

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
  return String(iso).slice(0, 10);
}

function badgeStatus(status: string) {
  const s = (status || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest';
  if (s === 'active') return `${base} border border-emerald-500/20 bg-emerald-500/10 text-emerald-700`;
  if (s === 'paused') return `${base} border border-amber-500/20 bg-amber-500/10 text-amber-700`;
  return `${base} border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]/70`;
}

export default async function AdminAffiliatesPage() {
  const sb = getSupabaseAdmin();

  // NOTE: `affiliates` might not exist in generated `Database` types yet.
  // Cast to `any` to avoid the common "relation never" TypeScript pitfall.
  const { data, error } = await (sb as any)
    .from('affiliates')
    .select('id,code,name,email,status,commission_bps,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const items = (data ?? []) as AffiliateRow[];

  const signals = [
    { label: 'Partners Activos', value: String(items.filter(a => a.status === 'active').length), note: 'Afiliados con códigos operativos.' },
    { label: 'Total Base', value: String(items.length), note: 'Todos los afiliados registrados.' }
  ];

  return (
    <div className="space-y-10 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Red de Afiliados (Partners)</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Gestión de embajadores, creadores de contenido y B2B.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Growth Expansion"
        title="Escala con Terceros"
        description="Crea códigos de descuento únicos (ref=code) para que tus afiliados dirijan tráfico al catálogo. KCE rastreará automáticamente las comisiones generadas desde el checkout."
        actions={[
          { href: '/admin/marketing', label: 'Ver Rendimiento Marketing', tone: 'primary' },
          { href: '/admin/revenue', label: 'Ver Impacto Revenue' }
        ]}
        signals={signals}
      />

      {error && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 shadow-sm">
          <div className="flex items-center gap-3 text-rose-700 mb-2">
            <Activity className="h-5 w-5" />
            <h3 className="font-heading text-xl">Falla de Conexión</h3>
          </div>
          <p className="text-sm font-light text-rose-700/80 mb-4">{error.message}</p>
          <div className="rounded-xl bg-rose-50 p-4 text-[10px] font-mono text-rose-800/60 uppercase tracking-widest border border-rose-200">
            Fix: Verifica que exista la tabla "affiliates" y que el Service Role de Supabase esté bien configurado.
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        
        {/* Formulario de Creación */}
        <div className="h-max rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-border)] pb-6">
            <Users className="h-5 w-5 text-brand-blue" />
            <h2 className="font-heading text-xl text-[var(--color-text)]">Nuevo Afiliado</h2>
          </div>
          <AffiliateCreateForm />
        </div>

        {/* Tabla de Afiliados */}
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-border)] pb-6">
            <LinkIcon className="h-5 w-5 text-brand-blue" />
            <h2 className="font-heading text-xl text-[var(--color-text)]">Directorio de Códigos</h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                  <th className="px-5 py-4">Afiliado</th>
                  <th className="px-5 py-4 text-center">Código (UTM)</th>
                  <th className="px-5 py-4 text-center">Estado</th>
                  <th className="px-5 py-4 text-right">Comisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <Users className="mx-auto h-10 w-10 text-[var(--color-text)]/10 mb-3" />
                      <div className="text-sm font-medium text-[var(--color-text)]/40">El programa de afiliados aún no tiene miembros.</div>
                    </td>
                  </tr>
                ) : (
                  items.map((a) => (
                    <tr key={a.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-brand-blue">{a.name || 'Sin Nombre'}</div>
                        <div className="text-xs text-[var(--color-text)]/50 mb-1">{a.email || '—'}</div>
                        <div className="text-[10px] font-mono text-[var(--color-text)]/30">Alta: {fmtDateISO(a.created_at)}</div>
                      </td>
                      <td className="px-5 py-4 align-top text-center">
                        <span className="font-mono text-sm font-bold text-[var(--color-text)] bg-[var(--color-surface-2)] px-3 py-1 rounded-lg border border-[var(--color-border)]">
                          {a.code}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top text-center">
                        <span className={badgeStatus(a.status || '')}>{a.status || '—'}</span>
                      </td>
                      <td className="px-5 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5 font-bold text-emerald-600">
                          <Percent className="h-3 w-3" /> {a.commission_bps ? (a.commission_bps / 100).toFixed(1) : '0'}%
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-[var(--color-text)]/40 mt-1">{a.commission_bps} bps</div>
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