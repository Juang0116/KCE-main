import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { PrivacyRequestsTable } from '@/features/privacy/PrivacyRequestsTable';

export const dynamic = 'force-dynamic';

// ⚠️ Importante:
// En algunos snapshots de KCE-main, la tabla `privacy_requests` aún no existe
// en `src/types/supabase.ts` (Database types). Cuando eso pasa, `sb.from('privacy_requests')`
// rompe el build con un error de overload.
//
// Para mantener el build verde (y permitir que el feature conviva mientras se
// alinea el schema/tipos), hacemos el query con un cast controlado.

type Row = {
  id: string;
  kind: string | null;
  email: string | null;
  name: string | null;
  message: string | null;
  locale: string | null;
  status: string | null;
  created_at: string | null;
};

type Item = {
  id: string;
  kind: 'export' | 'delete';
  email: string;
  name: string | null;
  message: string | null;
  locale: string | null;
  status: string;
  created_at: string;
};

function normalizeKind(kind: string | null | undefined): 'export' | 'delete' {
  return kind === 'delete' ? 'delete' : 'export';
}

function normalizeStatus(status: string | null | undefined): 'new' | 'processing' | 'done' | 'rejected' {
  const s = (status || '').toLowerCase();
  if (s === 'processing' || s === 'done' || s === 'rejected') return s;
  return 'new';
}

export default async function AdminPrivacyPage() {
  const sb = getSupabaseAdmin();

  const { data, error } = await (sb as any)
    .from('privacy_requests')
    .select('id,kind,email,name,message,locale,status,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Row[];
  const items: Item[] = rows.map((r) => ({
    id: String(r.id),
    kind: normalizeKind(r.kind),
    email: String(r.email || ''),
    name: r.name ?? null,
    message: r.message ?? null,
    locale: r.locale ?? null,
    status: normalizeStatus(r.status),
    created_at: String(r.created_at || new Date().toISOString()),
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Privacidad &amp; solicitudes</h1>
        <p className="text-sm text-muted-foreground">
          Exportación / borrado de datos. Esta vista está pensada para ser compatible mientras se
          alinean schema + tipos.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <div className="font-semibold">No se pudieron cargar las solicitudes</div>
          <div className="mt-1 opacity-80">{error.message}</div>
          <div className="mt-2 opacity-80">
            Verifica que exista la tabla <span className="font-mono">privacy_requests</span> y que
            el service-role esté configurado en el servidor.
          </div>
        </div>
      ) : null}

      <PrivacyRequestsTable initialItems={items} />
    </div>
  );
}
