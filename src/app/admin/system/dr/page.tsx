// src/app/admin/system/dr/page.tsx
import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import AdminDrClient from './AdminDrClient';

export const dynamic = 'force-dynamic';

type DrDrillRow = {
  id: string;
  kind: string;
  status: string;
  notes: string | null;
  performed_by: string | null;
  performed_at: string; // timestamptz -> string ISO
};

export default async function AdminDrPage() {
  const sb = getSupabaseAdmin();

  // NOTE: si Database types no trae ops_dr_drills, TS infiere never.
  // Hacemos cast controlado del query y tipamos el resultado.
  const { data, error } = await (sb as any)
    .from('ops_dr_drills')
    .select('id,kind,status,notes,performed_by,performed_at')
    .order('performed_at', { ascending: false })
    .limit(50);

  const rows: DrDrillRow[] = Array.isArray(data) ? (data as DrDrillRow[]) : [];
  const last = rows[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-brand-blue">DR (Disaster Recovery)</h1>
        <p className="mt-2 text-sm text-[color:var(--color-text)]/70">
          Registra simulacros y verifica frescura de backups. Esto alimenta alertas e incidentes.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
          {String((error as any)?.message || 'Error cargando ops_dr_drills')}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-6 shadow-sm dark:bg-[#0b1220]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Último simulacro</div>
            <div className="mt-1 text-sm text-[color:var(--color-text)]/70">
              {last ? (
                <>
                  {new Date(last.performed_at).toLocaleString()} — {last.kind} ({last.status})
                </>
              ) : (
                <>Sin registros todavía</>
              )}
            </div>
          </div>
        </div>
      </div>

      <AdminDrClient />

      <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-6 shadow-sm dark:bg-[#0b1220]">
        <div className="text-sm font-semibold">Historial (50)</div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[color:var(--color-text)]/70">
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Por</th>
                <th className="py-2 pr-4">Notas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[color:var(--color-border)]">
                  <td className="py-2 pr-4">{new Date(r.performed_at).toLocaleString()}</td>
                  <td className="py-2 pr-4">{r.kind}</td>
                  <td className="py-2 pr-4">{r.status}</td>
                  <td className="py-2 pr-4">{r.performed_by || '-'}</td>
                  <td className="py-2 pr-4">{r.notes || '-'}</td>
                </tr>
              ))}

              {rows.length === 0 ? (
                <tr>
                  <td className="py-3 pr-4 text-[color:var(--color-text)]/70" colSpan={5}>
                    Sin registros todavía.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
