import 'server-only';

import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { Activity, ShieldCheck, Download, Search, Settings, FileText, Filter, CalendarDays } from 'lucide-react';

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
      <div className="space-y-10 pb-20 p-6 text-center">
        <Activity className="mx-auto h-12 w-12 text-rose-500/50 mb-4" />
        <h1 className="font-heading text-3xl text-[var(--color-text)]">Auditoría Bloqueada</h1>
        <p className="mt-2 text-sm text-[var(--color-text)]/60">Supabase Admin no está configurado correctamente en tus variables de entorno.</p>
      </div>
    );
  }

  const adminAny = sb as any;
  const isSecurity = tab === 'security';

  let q = (isSecurity ? adminAny.from('security_events') : adminAny.from('admin_audit_events'))
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

  const auditSignals = [
    { label: 'Eventos Analizados', value: String(data?.length ?? 0), note: `Límite actual: ${limit} registros.` },
    { label: 'Vista Activa', value: isSecurity ? 'Security Logs' : 'Admin Mutations', note: 'Alterna arriba para ver otros eventos.' }
  ];

  return (
    <div className="space-y-10 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Auditoría Global</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Historial inmutable de accesos, mutaciones y eventos de seguridad.
          </p>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="Compliance & Security"
        title="El Registro Inborrable"
        description="Absolutamente todos los cambios críticos que suceden en KCE quedan registrados aquí por motivos de cumplimiento y auditoría forense. Filtra por Actor para investigar comportamientos anómalos."
        actions={[
          { href: '/admin/rbac', label: 'Ver Roles & Permisos', tone: 'primary' },
          { href: '/admin/events', label: 'Ver Trazas de Usuario' }
        ]}
        signals={auditSignals}
      />

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Selector de Vistas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[var(--color-border)] pb-6">
          <div className="flex gap-2 bg-[var(--color-surface-2)] p-1.5 rounded-full border border-[var(--color-border)]">
            <Link href="/admin/audit?tab=admin" className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${!isSecurity ? 'bg-brand-blue text-white shadow-md scale-105' : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-black/5'}`}>
              <Settings className="h-4 w-4"/> Mutaciones (Admin)
            </Link>
            <Link href="/admin/audit?tab=security" className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${isSecurity ? 'bg-rose-600 text-white shadow-md scale-105' : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-black/5'}`}>
              <ShieldCheck className="h-4 w-4"/> Seguridad (RBAC)
            </Link>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <form className="mb-8" action="/admin/audit" method="get">
          <input type="hidden" name="tab" value={isSecurity ? 'security' : 'admin'} />
          
          <div className="flex flex-col xl:flex-row gap-4 xl:items-end justify-between">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 w-full xl:w-4/5">
              <label className="text-sm md:col-span-2">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 flex items-center gap-1"><Filter className="h-3 w-3"/> {isSecurity ? 'Kind (Evento)' : 'Action (Mutación)'}</div>
                <input name="kind" defaultValue={kind} placeholder={isSecurity ? 'rate_limit, login_failed...' : 'admin.mutation...'} className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 outline-none focus:border-brand-blue transition-colors text-sm font-mono" />
              </label>

              <label className="text-sm">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 flex items-center gap-1"><Search className="h-3 w-3"/> Actor</div>
                <input name="actor" defaultValue={actor} placeholder="Email o ID..." className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 outline-none focus:border-brand-blue transition-colors text-sm" />
              </label>

              <label className="text-sm">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 flex items-center gap-1"><CalendarDays className="h-3 w-3"/> Desde</div>
                <input type="date" name="from" defaultValue={createdFrom} className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-transparent px-4 outline-none focus:border-brand-blue transition-colors text-sm" />
              </label>

              <label className="text-sm">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 flex items-center gap-1"><CalendarDays className="h-3 w-3"/> Hasta</div>
                <input type="date" name="to" defaultValue={createdTo} className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-transparent px-4 outline-none focus:border-brand-blue transition-colors text-sm" />
              </label>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <label className="text-sm w-20">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 text-center">Límite</div>
                <input name="limit" defaultValue={String(limit)} className="w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 outline-none focus:border-brand-blue transition-colors text-sm text-center font-mono" />
              </label>
              <button type="submit" className="h-12 flex items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-[10px] font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-md">
                Aplicar
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/admin/audit?tab=${isSecurity ? 'security' : 'admin'}`} className="rounded-full border border-[var(--color-border)] bg-transparent px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/60 transition hover:bg-[var(--color-surface-2)]">
              Limpiar Filtros
            </Link>
            <a href={exportHref} className="rounded-full border border-[var(--color-border)] bg-transparent px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/60 transition hover:bg-[var(--color-surface-2)] flex items-center gap-1.5">
              <Download className="h-3 w-3"/> Descargar CSV (Max {Math.min(limit * 5, 5000)})
            </a>
          </div>
        </form>

        {error && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">Error en consulta: {error.message}</div>}

        {/* Tabla */}
        <div className="overflow-x-auto rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">
                <th className="px-6 py-5">Fecha y Ruta</th>
                <th className="px-6 py-5">Actor</th>
                <th className="px-6 py-5">Evento ({isSecurity ? 'Kind' : 'Action'})</th>
                <th className="px-6 py-5 text-right">Detalle (Payload)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {(!data || data.length === 0) ? (
                <tr>
                  <td className="px-6 py-16 text-center text-sm font-medium text-[var(--color-text)]/40" colSpan={4}>
                    <FileText className="mx-auto h-12 w-12 text-[var(--color-text)]/10 mb-4" />
                    No hay eventos que coincidan con estos filtros.
                  </td>
                </tr>
              ) : (
                (data ?? []).map((row: any) => (
                  <tr key={row.id} className="transition-colors hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-6 py-5 align-top">
                      <div className="font-mono text-xs text-[var(--color-text)]/70 mb-2">
                        {String(row.created_at || '').replace('T', ' ').slice(0, 19)}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 bg-[var(--color-surface-2)] border border-[var(--color-border)] px-2 py-0.5 rounded-md inline-block max-w-[200px] truncate" title={row.path}>
                        {String(row.path || 'NO PATH')}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="font-semibold text-brand-blue line-clamp-1">{String(row.actor || 'ANON')}</div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${isSecurity ? 'bg-rose-500/10 text-rose-700 border-rose-500/20' : 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'}`}>
                        {String(isSecurity ? row.kind : row.action)}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-top text-right">
                      {row.meta && Object.keys(row.meta).length > 0 ? (
                        <details className="group relative inline-block text-left cursor-pointer">
                          <summary className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/70 hover:bg-[var(--color-border)] transition-colors list-none">
                            <Activity className="h-3 w-3"/> Payload
                          </summary>
                          <div className="absolute right-0 top-full z-50 mt-2 w-[400px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
                            <div className="bg-[var(--color-surface-2)] px-4 py-2 border-b border-[var(--color-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 text-left">Metadatos del Evento</div>
                            <pre className="max-h-[300px] overflow-auto p-4 text-[10px] font-mono text-[var(--color-text)]/80 leading-relaxed whitespace-pre-wrap text-left">
                              {JSON.stringify(row.meta || {}, null, 2)}
                            </pre>
                          </div>
                        </details>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text)]/30">— Empty —</span>
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