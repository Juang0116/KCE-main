import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { AffiliateCreateForm } from '@/features/growth/AffiliateCreateForm';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Afiliados / Partners</h1>
        <p className="text-sm text-muted-foreground">
          Códigos de referral (ref=...) + conversiones desde checkout/webhook.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <div className="font-semibold">No se pudieron cargar los afiliados</div>
          <div className="mt-1 opacity-80">{error.message}</div>
          <div className="mt-2 opacity-80">
            Verifica que exista la tabla <span className="font-mono">affiliates</span> y que el service role esté bien
            configurado en el servidor.
          </div>
        </div>
      ) : null}

      <AffiliateCreateForm />

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Commission (bps)</th>
              <th className="p-3 text-left">Creado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3 font-mono">{a.code}</td>
                <td className="p-3">{a.name || '—'}</td>
                <td className="p-3">{a.email || '—'}</td>
                <td className="p-3">{a.status || '—'}</td>
                <td className="p-3">{a.commission_bps ?? '—'}</td>
                <td className="p-3">{fmtDateISO(a.created_at)}</td>
              </tr>
            ))}

            {!items.length ? (
              <tr>
                <td className="p-3" colSpan={6}>
                  Sin afiliados todavía.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
