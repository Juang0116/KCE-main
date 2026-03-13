// src/app/admin/system/backups/page.tsx
import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const dynamic = 'force-dynamic';

type BackupLogRow = {
  id: string;
  kind: string;
  provider: string | null;
  location: string | null;
  ok: boolean;
  message: string | null;
  created_at: string;
};

export default async function AdminBackupsPage() {
  const sb = getSupabaseAdmin();

  // NOTE:
  // Si tu Database types no incluye la tabla ops_backups_log, TS infiere `never`.
  // Por eso hacemos cast controlado del query + tipado manual del resultado.
  const { data, error } = await (sb as any)
    .from('ops_backups_log')
    .select('id,kind,provider,location,ok,message,created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  // Si falla, no reventamos el render; mostramos 0 filas.
  const rows: BackupLogRow[] = Array.isArray(data) ? (data as BackupLogRow[]) : [];
  const last = rows[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Backups & DR</h1>
        <p className="text-sm text-muted-foreground">
          Registro de respaldos (DB/Storage/Config). Esto no hace backups por ti: te da un sistema repetible + auditoría.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-200">
          {String((error as any)?.message || 'Error cargando ops_backups_log')}
        </div>
      ) : null}

      <div className="rounded-xl border p-4 text-sm">
        <div className="font-medium">Último backup</div>
        <div className="opacity-80">
          {last ? `${last.kind} — ${last.ok ? 'OK' : 'FAIL'} — ${last.created_at}` : '—'}
        </div>
        <div className="opacity-80">
          Provider: {last?.provider || '—'} | Location: {last?.location || '—'}
        </div>
      </div>

      <div className="rounded-xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3">Fecha</th>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">OK</th>
              <th className="text-left p-3">Provider</th>
              <th className="text-left p-3">Location</th>
              <th className="text-left p-3">Msg</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 whitespace-nowrap">{r.created_at}</td>
                <td className="p-3">{r.kind}</td>
                <td className="p-3">{r.ok ? '✅' : '❌'}</td>
                <td className="p-3">{r.provider || '—'}</td>
                <td className="p-3">{r.location || '—'}</td>
                <td className="p-3 max-w-[420px] truncate" title={r.message || ''}>
                  {r.message || '—'}
                </td>
              </tr>
            ))}

            {rows.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={6}>
                  Sin registros todavía. Usa POST /api/admin/ops/backups/run para registrar uno.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border p-4 text-sm space-y-2">
        <div className="font-medium">Runbook (mínimo)</div>
        <ul className="list-disc pl-5 opacity-80">
          <li>DB: pg_dump diario + retención 14–30 días (en S3/GCS/Backblaze).</li>
          <li>Storage: export mensual + hashes.</li>
          <li>Config: export de env vars (sin secretos en claro) + versiones.</li>
          <li>Prueba restore 1 vez/mes (sandbox) y registra resultado aquí.</li>
        </ul>
      </div>
    </div>
  );
}
