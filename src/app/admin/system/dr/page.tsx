import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import AdminDrClient from './AdminDrClient';
import { Activity, Clock, ShieldCheck, History, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

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
  const base = 'inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border';
  if (s === 'completed') return `${base} bg-emerald-500/10 text-emerald-700 border-emerald-500/20`;
  if (s === 'planned' || s === 'in_progress') return `${base} bg-amber-500/10 text-amber-700 border-amber-500/20`;
  if (s === 'failed') return `${base} bg-rose-500/10 text-rose-700 border-rose-500/20`;
  return `${base} bg-[var(--color-surface-2)] text-[var(--color-text)]/70 border-[var(--color-border)]`;
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Historial de Disaster Recovery</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Registro inmutable de simulacros y eventos de recuperación de la plataforma.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {String((error as any)?.message || 'Error cargando ops_dr_drills')}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        
        {/* Tarjeta Último Simulacro */}
        <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Último Simulacro</h2>
          </div>
          
          {last ? (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-1">Fecha de Ejecución</div>
                <div className="font-semibold text-brand-blue text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {new Date(last.performed_at).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-border)] pt-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-1">Tipo de Prueba</div>
                  <div className="font-mono text-xs uppercase text-[var(--color-text)]/80 font-bold">{last.kind}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-1">Estado</div>
                  <div><span className={badgeStatus(last.status)}>{last.status}</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[var(--color-text)]/40 text-sm italic">Sin registros de simulacros todavía.</div>
          )}
        </div>

        {/* Creador de Simulacro (Client Component) */}
        <div className="h-full">
          <AdminDrClient />
        </div>
      </div>

      {/* Historial Completo */}
      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-6 border-b border-[var(--color-border)] pb-6">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Bitácora Histórica</h2>
          </div>
          <span className="rounded-full bg-[var(--color-surface-2)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 border border-[var(--color-border)] shadow-sm">
            Últimos 50
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-5 py-4">Fecha (ISO)</th>
                <th className="px-5 py-4">Tipo de Prueba</th>
                <th className="px-5 py-4 text-center">Estado</th>
                <th className="px-5 py-4">Responsable</th>
                <th className="px-5 py-4 text-right">Notas Postmortem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm font-medium text-[var(--color-text)]/40">La bitácora está vacía.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-5 py-4 align-top text-[10px] font-mono text-[var(--color-text)]/60">
                      {new Date(r.performed_at).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className="font-mono text-xs font-bold text-brand-blue uppercase tracking-widest">{r.kind}</span>
                    </td>
                    <td className="px-5 py-4 align-top text-center">
                      <span className={badgeStatus(r.status)}>{r.status}</span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="text-xs font-medium text-[var(--color-text)]">{r.performed_by || 'Sistema / Anónimo'}</div>
                    </td>
                    <td className="px-5 py-4 align-top text-right">
                      {r.notes ? (
                        <div className="text-xs font-light leading-relaxed text-[var(--color-text)]/70 max-w-[300px] truncate ml-auto" title={r.notes}>
                          {r.notes}
                        </div>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text)]/30">—</span>
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