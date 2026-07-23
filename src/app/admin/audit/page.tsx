/* src/app/admin/audit/page.tsx */
import 'server-only';

import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import {
  Activity,
  ShieldCheck,
  Download,
  Search,
  Settings,
  Filter,
  CalendarDays,
  User,
  Fingerprint,
  Database,
  ArrowRight,
  AlertTriangle,
  Clock,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type SearchParams = Record<string, string | string[] | undefined>;

type AuditRow = {
  id: string;
  created_at: string;
  path?: string;
  actor: string | null;
  action?: string;
  kind?: string;
  meta?: Record<string, unknown> | null;
};

function norm(q: string | string[] | undefined) {
  if (!q) return '';
  return Array.isArray(q) ? q[0] || '' : q;
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[var(--radius-3xl)] border border-red-500/20 bg-red-500/5 p-12 text-center shadow-sm">
        <AlertTriangle className="mb-6 h-16 w-16 text-red-500 opacity-40" />
        <h1 className="font-heading text-3xl tracking-tight text-red-700 dark:text-red-400">
          Infraestructura Bloqueada
        </h1>
        <p className="mt-2 max-w-md text-sm font-light text-red-600/70 dark:text-red-400/60">
          El Service Role de Supabase no está configurado. La auditoría requiere privilegios de
          Nivel 0 (Root Access).
        </p>
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

  const { data } = await q;
  const rows = (data || []) as AuditRow[];

  const auditSignals = [
    { label: 'Registros en Vista', value: String(rows.length), note: `Ventana de ${limit} ev.` },
    { label: 'Nivel de Integridad', value: '100%', note: 'Logs inmutables activos.' },
  ];

  const exportParams = new URLSearchParams(sp as any);
  exportParams.set('limit', '5000');
  const exportHref = `/api/admin/audit/export?${exportParams.toString()}`;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10 pb-24 duration-700">
      {/* 01. HEADER INSTITUCIONAL */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Fingerprint className="h-3.5 w-3.5" /> Immutable Audit Lane
          </div>
          <h1 className="font-heading text-4xl tracking-tight text-main md:text-5xl">
            Auditoría <span className="font-light italic text-brand-yellow">Forense</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base font-light leading-relaxed text-muted">
            Historial inmutable de cada mutación en el ecosistema. Rastrea cambios en tours, precios
            o escalamientos de privilegios administrativos.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-full border-brand-dark/10 px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-surface-2"
          >
            <a
              href={exportHref}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Exportar CSV
            </a>
          </Button>
        </div>
      </header>

      {/* 02. WORKBENCH DE CUMPLIMIENTO */}
      <AdminOperatorWorkbench
        eyebrow="System Governance"
        title="Trazabilidad Operativa Total"
        description="Cada entrada representa una acción atómica confirmada por el núcleo. El campo 'Actor' identifica al responsable, garantizando transparencia total en la gestión de Knowing Cultures S.A.S."
        actions={[
          { href: '/admin/rbac', label: 'Gestionar Permisos', tone: 'primary' },
          { href: '/admin/ops', label: 'Estado del Sistema' },
        ]}
        signals={auditSignals}
      />

      {/* 03. VISTA DE DATOS (LA BÓVEDA) */}
      <section className="relative flex flex-col overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface shadow-pop dark:border-white/5">
        {/* Selector de Pestañas Premium */}
        <div className="p-8 pb-4">
          <div className="flex w-fit items-center gap-2 rounded-2xl border border-brand-dark/5 bg-surface-2 p-1.5 shadow-inner dark:border-white/5">
            <Link
              href="/admin/audit?tab=admin"
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${!isSecurity ? 'scale-105 bg-brand-blue text-white shadow-md' : 'text-muted hover:text-brand-blue'}`}
            >
              <Settings className="h-3.5 w-3.5" /> Actividad Admin
            </Link>
            <Link
              href="/admin/audit?tab=security"
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${isSecurity ? 'scale-105 bg-red-600 text-white shadow-md' : 'text-muted hover:text-red-600'}`}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Seguridad (Auth)
            </Link>
          </div>
        </div>

        {/* Formulario de Filtros Tácticos */}
        <div className="mb-4 border-b border-brand-dark/5 px-8 pb-8 dark:border-white/5">
          <form
            action="/admin/audit"
            method="get"
            className="grid gap-6 xl:grid-cols-[1fr_auto]"
          >
            <input
              type="hidden"
              name="tab"
              value={tab}
            />

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-2">
                <label className="ml-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted">
                  <Filter className="h-3 w-3" /> Evento
                </label>
                <input
                  name="kind"
                  defaultValue={kind}
                  placeholder={isSecurity ? 'login_failed...' : 'tour.update...'}
                  className="placeholder:text-muted/30 h-11 w-full rounded-xl border border-brand-dark/10 bg-surface-2 px-4 font-mono text-xs text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                />
              </div>

              <div className="space-y-2">
                <label className="ml-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted">
                  <User className="h-3 w-3" /> Responsable (Actor)
                </label>
                <input
                  name="actor"
                  defaultValue={actor}
                  placeholder="admin@kce.travel"
                  className="placeholder:text-muted/30 h-11 w-full rounded-xl border border-brand-dark/10 bg-surface-2 px-4 text-xs text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                />
              </div>

              <div className="space-y-2">
                <label className="ml-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted">
                  <CalendarDays className="h-3 w-3" /> Ventana Temporal
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    name="from"
                    defaultValue={createdFrom}
                    className="h-11 w-full rounded-xl border border-brand-dark/10 bg-transparent px-3 text-[11px] text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                  />
                  <span className="text-muted opacity-30">—</span>
                  <input
                    type="date"
                    name="to"
                    defaultValue={createdTo}
                    className="h-11 w-full rounded-xl border border-brand-dark/10 bg-transparent px-3 text-[11px] text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted">
                  <Terminal className="h-3 w-3" /> Límite
                </label>
                <input
                  name="limit"
                  defaultValue={String(limit)}
                  className="h-11 w-full rounded-xl border border-brand-dark/10 bg-surface-2 px-4 text-center font-mono text-xs text-main outline-none transition-all focus:ring-2 focus:ring-brand-blue/20 dark:border-white/10"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                className="h-11 rounded-xl bg-brand-dark px-8 text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-lg transition-all hover:bg-brand-blue hover:text-white"
              >
                Aplicar Filtros
              </Button>
            </div>
          </form>
        </div>

        {/* Tabla de Resultados */}
        <div className="custom-scrollbar overflow-x-auto px-2 pb-6">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-surface-2/50 border-b border-brand-dark/5 dark:border-white/5">
              <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
                <th className="px-8 py-5">Timestamp & Contexto</th>
                <th className="px-8 py-5">Identidad (Actor)</th>
                <th className="px-8 py-5">Operación Atómica</th>
                <th className="px-8 py-5 text-right">Metadata (Payload)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-dark/5 dark:divide-white/5">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="bg-surface px-8 py-32 text-center"
                  >
                    <Search className="mx-auto mb-6 h-16 w-16 text-brand-blue opacity-10" />
                    <p className="font-heading text-xl tracking-tight text-main opacity-30">
                      Silencio en el Registro
                    </p>
                    <p className="mt-1 text-sm font-light italic text-muted">
                      No se encontraron eventos con los criterios seleccionados.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-surface-2/50 group cursor-default transition-colors"
                  >
                    <td className="px-8 py-6 align-top">
                      <div className="mb-2 flex items-center gap-3 font-mono text-[11px] text-muted transition-colors group-hover:text-main">
                        <Clock className="h-3.5 w-3.5 opacity-30" />
                        {new Date(row.created_at).toLocaleString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                      <div
                        className="inline-block max-w-[180px] truncate rounded-md border border-brand-dark/5 bg-surface-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-muted opacity-60 dark:border-white/5"
                        title={row.path}
                      >
                        {row.path || 'System Internal'}
                      </div>
                    </td>
                    <td className="px-8 py-6 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-blue/5 bg-brand-blue/10 text-xs font-bold text-brand-blue">
                          {row.actor?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <span className="max-w-[220px] truncate font-bold text-main transition-colors group-hover:text-brand-blue">
                          {row.actor || 'System Engine'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 align-top">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest shadow-sm ${
                          isSecurity
                            ? 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400'
                            : 'border-brand-blue/20 bg-brand-blue/10 text-brand-blue'
                        }`}
                      >
                        {isSecurity ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <Activity className="h-3 w-3" />
                        )}
                        {isSecurity ? row.kind : row.action}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right align-top">
                      {row.meta && Object.keys(row.meta).length > 0 ? (
                        <details className="group/detail relative inline-block text-left outline-none">
                          <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-xl border border-brand-dark/10 bg-surface-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-main shadow-sm transition-all hover:bg-brand-dark hover:text-brand-yellow dark:border-white/10">
                            Explorar JSON{' '}
                            <ArrowRight className="h-3 w-3 transition-transform group-open/detail:rotate-90" />
                          </summary>
                          <div className="animate-in zoom-in-95 slide-in-from-top-4 absolute right-0 top-full z-[100] mt-4 w-[500px] overflow-hidden rounded-[2rem] border border-brand-dark/20 bg-brand-dark text-white shadow-2xl duration-300">
                            <div className="flex items-center justify-between border-b border-white/5 bg-white/10 px-6 py-4 text-[9px] font-bold uppercase tracking-[0.4em] text-brand-yellow">
                              <span className="flex items-center gap-2">
                                <Database className="h-3 w-3" /> Event Payload Data
                              </span>
                              <code className="text-[10px] opacity-40">
                                EVENT_ID: {row.id.split('-')[0]}
                              </code>
                            </div>
                            <pre className="custom-scrollbar max-h-[400px] overflow-auto scroll-smooth p-8 text-left font-mono text-[11px] leading-relaxed text-white/80">
                              {JSON.stringify(row.meta, null, 2)}
                            </pre>
                          </div>
                        </details>
                      ) : (
                        <span className="text-[10px] font-bold uppercase italic tracking-widest text-muted opacity-30">
                          No Payload
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 04. FOOTER TÉCNICO */}
      <footer className="mt-16 flex items-center justify-center gap-12 border-t border-brand-dark/10 pt-12 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          <Settings className="h-3 w-3" /> Audit Lane v4.8
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20" />
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3 w-3" /> Compliance Ready Logs
        </div>
      </footer>
    </div>
  );
}
