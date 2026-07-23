import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import AdminDrClient from './AdminDrClient';
import {
  Activity,
  Clock,
  ShieldCheck,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type DrDrillRow = {
  id: string;
  kind: string;
  status: string;
  notes: string | null;
  performed_by: string | null;
  performed_at: string;
};

function badgeStatus(status: string) {
  const s = (status || '').toLowerCase();
  const base =
    'inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border';
  if (s === 'completed') return `${base} bg-emerald-500/10 text-emerald-700 border-emerald-500/20`;
  if (s === 'planned' || s === 'in_progress')
    return `${base} bg-amber-500/10 text-amber-700 border-amber-500/20`;
  if (s === 'failed') return `${base} bg-rose-500/10 text-rose-700 border-rose-500/20`;
  return `${base} bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]/70 border-[color:var(--color-border)]`;
}

export default async function AdminDrPage() {
  const sb = getSupabaseAdmin();

  const { data, error } = await (sb as any)
    .from('ops_dr_drills')
    .select('id,kind,status,notes,performed_by,performed_at')
    .order('performed_at', { ascending: false })
    .limit(50);

  const rows: DrDrillRow[] = Array.isArray(data) ? (data as DrDrillRow[]) : [];
  const last = rows[0] ?? null;

  return (
    <div className="space-y-10 pb-20">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-heading text-3xl text-brand-blue md:text-4xl">
            Historial de Disaster Recovery
          </h1>
          <p className="text-[color:var(--color-text)]/60 mt-2 text-sm font-light">
            Registro inmutable de simulacros y eventos de recuperación de la plataforma.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-700">
          <AlertTriangle className="h-4 w-4" />{' '}
          {String((error as any)?.message || 'Error cargando ops_dr_drills')}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Tarjeta Último Simulacro */}
        <div className="flex flex-col justify-center rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Activity className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-[color:var(--color-text)]">
              Último Simulacro
            </h2>
          </div>

          {last ? (
            <div className="space-y-4">
              <div>
                <div className="text-[color:var(--color-text)]/50 mb-1 text-[10px] font-bold uppercase tracking-widest">
                  Fecha de Ejecución
                </div>
                <div className="flex items-center gap-2 text-lg font-semibold text-brand-blue">
                  <Clock className="h-4 w-4" />{' '}
                  {new Date(last.performed_at).toLocaleString('es-ES', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-[color:var(--color-border)] pt-4">
                <div>
                  <div className="text-[color:var(--color-text)]/50 mb-1 text-[10px] font-bold uppercase tracking-widest">
                    Tipo de Prueba
                  </div>
                  <div className="text-[color:var(--color-text)]/80 font-mono text-xs font-bold uppercase">
                    {last.kind}
                  </div>
                </div>
                <div>
                  <div className="text-[color:var(--color-text)]/50 mb-1 text-[10px] font-bold uppercase tracking-widest">
                    Estado
                  </div>
                  <div>
                    <span className={badgeStatus(last.status)}>{last.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm italic text-[color:var(--color-text-muted)]">
              Sin registros de simulacros todavía.
            </div>
          )}
        </div>

        {/* Creador de Simulacro (Client Component) */}
        <div className="h-full">
          <AdminDrClient />
        </div>
      </div>

      {/* Historial Completo */}
      <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-[color:var(--color-border)] pb-6">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-[color:var(--color-text)]">
              Bitácora Histórica
            </h2>
          </div>
          <span className="text-[color:var(--color-text)]/50 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm">
            Últimos 50
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]">
              <tr className="text-[color:var(--color-text)]/50 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-5 py-4">Fecha (ISO)</th>
                <th className="px-5 py-4">Tipo de Prueba</th>
                <th className="px-5 py-4 text-center">Estado</th>
                <th className="px-5 py-4">Responsable</th>
                <th className="px-5 py-4 text-right">Notas Postmortem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[color:var(--color-surface)]">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm font-medium text-[color:var(--color-text-muted)]"
                  >
                    La bitácora está vacía.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-[color:var(--color-surface-2)]/50 transition-colors"
                  >
                    <td className="text-[color:var(--color-text)]/60 px-5 py-4 align-top font-mono text-[10px]">
                      {new Date(r.performed_at).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest text-brand-blue">
                        {r.kind}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center align-top">
                      <span className={badgeStatus(r.status)}>{r.status}</span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="text-xs font-medium text-[color:var(--color-text)]">
                        {r.performed_by || 'Sistema / Anónimo'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right align-top">
                      {r.notes ? (
                        <div
                          className="text-[color:var(--color-text)]/70 ml-auto max-w-[300px] truncate text-xs font-light leading-relaxed"
                          title={r.notes}
                        >
                          {r.notes}
                        </div>
                      ) : (
                        <span className="text-[color:var(--color-text)]/30 text-[10px] font-bold uppercase">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
