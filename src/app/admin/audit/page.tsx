// src/app/admin/audit/page.tsx
import 'server-only';

import Link from 'next/link';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

type SearchParams = Record<string, string | string[] | undefined>;

function norm(q: string | string[] | undefined) {
  if (!q) return '';
  return Array.isArray(q) ? (q[0] || '') : q;
}

export default async function AdminAuditPage({ searchParams }: { searchParams?: SearchParams | Promise<SearchParams> }) {
  const sp = (await searchParams) ?? {};
  const tab = (norm(sp.tab) || 'admin').toLowerCase();
  const kind = norm(sp.kind).trim();
  const actor = norm(sp.actor).trim();
  const createdFrom = norm(sp.from || sp.created_from).trim();
  const createdTo = norm(sp.to || sp.created_to).trim();
  const limitRaw = norm(sp.limit).trim();
  const limit = Math.min(Math.max(parseInt(limitRaw || '200', 10) || 200, 1), 2000);

  const sb = getSupabaseAdmin();
  if (!sb) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Auditoría</h1>
        <p className="mt-2 text-sm text-neutral-600">Supabase Admin no está configurado.</p>
      </div>
    );
  }

  // NOTE: these tables may not exist in the generated Supabase types yet.
  // Avoid blocking builds by using an `any` escape hatch until types are aligned.
  const adminAny = sb as any;

  const isSecurity = tab === 'security';

  let q = (isSecurity
    ? adminAny.from('security_events')
    : adminAny.from('admin_audit_events')
  )
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (isSecurity) {
    if (kind) q = q.eq('kind', kind);
    if (actor) q = q.eq('actor', actor);
  } else {
    if (kind) q = q.eq('action', kind);
    if (actor) q = q.eq('actor', actor);
  }
  if (createdFrom) q = q.gte('created_at', `${createdFrom}T00:00:00.000Z`);
  if (createdTo) q = q.lt('created_at', `${createdTo}T23:59:59.999Z`);

  const { data, error } = await q;

  const qp = new URLSearchParams();
  qp.set('tab', isSecurity ? 'security' : 'admin');
  if (kind) qp.set('kind', kind);
  if (actor) qp.set('actor', actor);
  if (createdFrom) qp.set('from', createdFrom);
  if (createdTo) qp.set('to', createdTo);
  qp.set('limit', String(Math.min(limit * 5, 5000)));

  const exportHref = `/api/admin/audit/export?${qp.toString()}`;

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Auditoría</h1>
          <p className="mt-1 text-sm text-neutral-600">Últimos {limit} eventos. Filtra por acción/kind, actor y rango de fechas.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/audit?tab=admin"
            className={`rounded-md border px-3 py-2 text-sm ${!isSecurity ? 'bg-neutral-900 text-white' : 'bg-white'}`}
          >
            Admin
          </Link>
          <Link
            href="/admin/audit?tab=security"
            className={`rounded-md border px-3 py-2 text-sm ${isSecurity ? 'bg-neutral-900 text-white' : 'bg-white'}`}
          >
            Seguridad
          </Link>
        </div>
      </div>

      <form className="mt-6 grid gap-3 sm:grid-cols-6" action="/admin/audit" method="get">
        <input type="hidden" name="tab" value={isSecurity ? 'security' : 'admin'} />
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="text-neutral-600">{isSecurity ? 'kind' : 'action'}</span>
          <input
            name="kind"
            defaultValue={kind}
            className="rounded-md border px-3 py-2"
            placeholder={isSecurity ? 'rate_limit' : 'admin.mutation'}
          />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-1">
          <span className="text-neutral-600">actor</span>
          <input name="actor" defaultValue={actor} className="rounded-md border px-3 py-2" placeholder="admin" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-neutral-600">desde</span>
          <input type="date" name="from" defaultValue={createdFrom} className="rounded-md border px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-neutral-600">hasta</span>
          <input type="date" name="to" defaultValue={createdTo} className="rounded-md border px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-neutral-600">límite</span>
          <input name="limit" defaultValue={String(limit)} className="rounded-md border px-3 py-2" />
        </label>

        <div className="flex items-end gap-2 sm:col-span-6">
          <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">
            Filtrar
          </button>
          <Link href={`/admin/audit?tab=${isSecurity ? 'security' : 'admin'}`} className="rounded-md border px-4 py-2 text-sm">
            Limpiar
          </Link>
          <a href={exportHref} className="rounded-md border px-4 py-2 text-sm">
            Exportar CSV
          </a>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border">
        {error ? (
          <div className="p-4 text-sm text-red-600">Error: {error.message}</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2">fecha</th>
                <th className="px-3 py-2">actor</th>
                <th className="px-3 py-2">{isSecurity ? 'kind' : 'action'}</th>
                <th className="px-3 py-2">ruta</th>
                <th className="px-3 py-2">detalle</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((row: any) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">{String(row.created_at || '')}</td>
                  <td className="px-3 py-2">{String(row.actor || '')}</td>
                  <td className="px-3 py-2">{String(isSecurity ? row.kind : row.action)}</td>
                  <td className="px-3 py-2">{String(row.path || '')}</td>
                  <td className="px-3 py-2">
                    <pre className="max-w-4xl overflow-x-auto whitespace-pre-wrap text-xs text-neutral-700">
                      {JSON.stringify(row.meta || {}, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
              {(!data || data.length === 0) && (
                <tr>
                  <td className="px-3 py-6 text-sm text-neutral-600" colSpan={5}>
                    No hay eventos para esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
