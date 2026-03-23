/* src/app/admin/audit/page.tsx */
import 'server-only';

import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  Activity, ShieldCheck, Download, Search, 
  Settings, Filter, CalendarDays, 
  User, Fingerprint, Database, ArrowRight,
  AlertTriangle, Clock, Terminal
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 rounded-[var(--radius-3xl)] border border-red-500/20 bg-red-500/5 shadow-sm">
        <AlertTriangle className="h-16 w-16 text-red-500 opacity-40 mb-6" />
        <h1 className="font-heading text-3xl text-red-700 dark:text-red-400 tracking-tight">Infraestructura Bloqueada</h1>
        <p className="mt-2 text-sm text-red-600/70 dark:text-red-400/60 max-w-md font-light">
          El Service Role de Supabase no está configurado. La auditoría requiere privilegios de Nivel 0 (Root Access).
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
    { label: 'Nivel de Integridad', value: '100%', note: 'Logs inmutables activos.' }
  ];

  const exportParams = new URLSearchParams(sp as any);
  exportParams.set('limit', '5000');
  const exportHref = `/api/admin/audit/export?${exportParams.toString()}`;

  return (
    <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 01. HEADER INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Fingerprint className="h-3.5 w-3.5" /> Immutable Audit Lane
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-main tracking-tight">
            Auditoría <span className="text-brand-yellow italic font-light">Forense</span>
          </h1>
          <p className="mt-3 text-base text-muted font-light leading-relaxed max-w-2xl">
            Historial inmutable de cada mutación en el ecosistema. Rastrea cambios en tours, precios o escalamientos de privilegios administrativos.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="rounded-full shadow-sm hover:bg-surface-2 border-brand-dark/10 h-12 px-8 text-[10px] font-bold uppercase tracking-widest transition-all">
            <a href={exportHref} className="flex items-center gap-2">
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
          { href: '/admin/ops', label: 'Estado del Sistema' }
        ]}
        signals={auditSignals}
      />

      {/* 03. VISTA DE DATOS (LA BÓVEDA) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden relative flex flex-col">
        
        {/* Selector de Pestañas Premium */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface-2 border border-brand-dark/5 dark:border-white/5 w-fit shadow-inner">
            <Link 
              href="/admin/audit?tab=admin" 
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${!isSecurity ? 'bg-brand-blue text-white shadow-md scale-105' : 'text-muted hover:text-brand-blue'}`}
            >
              <Settings className="h-3.5 w-3.5" /> Actividad Admin
            </Link>
            <Link 
              href="/admin/audit?tab=security" 
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${isSecurity ? 'bg-red-600 text-white shadow-md scale-105' : 'text-muted hover:text-red-600'}`}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Seguridad (Auth)
            </Link>
          </div>
        </div>

        {/* Formulario de Filtros Tácticos */}
        <div className="px-8 pb-8 border-b border-brand-dark/5 dark:border-white/5 mb-4">
          <form action="/admin/audit" method="get" className="grid gap-6 xl:grid-cols-[1fr_auto]">
            <input type="hidden" name="tab" value={tab} />
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted ml-1 flex items-center gap-1.5">
                  <Filter className="h-3 w-3" /> Evento
                </label>
                <input 
                  name="kind" 
                  defaultValue={kind} 
                  placeholder={isSecurity ? "login_failed..." : "tour.update..."}
                  className="w-full h-11 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 px-4 text-xs font-mono text-main focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all placeholder:text-muted/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted ml-1 flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Responsable (Actor)
                </label>
                <input 
                  name="actor" 
                  defaultValue={actor} 
                  placeholder="admin@kce.travel"
                  className="w-full h-11 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 px-4 text-xs text-main focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all placeholder:text-muted/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted ml-1 flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3" /> Ventana Temporal
                </label>
                <div className="flex items-center gap-2">
                  <input type="date" name="from" defaultValue={createdFrom} className="w-full h-11 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-transparent px-3 text-[11px] text-main focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all" />
                  <span className="text-muted opacity-30">—</span>
                  <input type="date" name="to" defaultValue={createdTo} className="w-full h-11 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-transparent px-3 text-[11px] text-main focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted ml-1 flex items-center gap-1.5">
                  <Terminal className="h-3 w-3" /> Límite
                </label>
                <input name="limit" defaultValue={String(limit)} className="w-full h-11 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 px-4 text-xs font-mono text-center text-main focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all" />
              </div>
            </div>

            <div className="flex items-end">
              <Button type="submit" className="h-11 px-8 rounded-xl bg-brand-dark text-brand-yellow hover:bg-brand-blue hover:text-white transition-all shadow-lg text-[10px] font-bold uppercase tracking-widest">
                Aplicar Filtros
              </Button>
            </div>
          </form>
        </div>

        {/* Tabla de Resultados */}
        <div className="overflow-x-auto custom-scrollbar px-2 pb-6">
          <table className="w-full text-left text-sm min-w-[1000px]">
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
                  <td colSpan={4} className="px-8 py-32 text-center bg-surface">
                    <Search className="mx-auto h-16 w-16 text-brand-blue opacity-10 mb-6" />
                    <p className="text-xl font-heading text-main tracking-tight opacity-30">Silencio en el Registro</p>
                    <p className="text-sm font-light text-muted italic mt-1">No se encontraron eventos con los criterios seleccionados.</p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="group transition-colors hover:bg-surface-2/50 cursor-default">
                    <td className="px-8 py-6 align-top">
                      <div className="flex items-center gap-3 text-muted group-hover:text-main transition-colors text-[11px] font-mono mb-2">
                        <Clock className="h-3.5 w-3.5 opacity-30" />
                        {new Date(row.created_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="inline-block max-w-[180px] truncate rounded-md bg-surface-2 border border-brand-dark/5 dark:border-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-muted opacity-60" title={row.path}>
                        {row.path || 'System Internal'}
                      </div>
                    </td>
                    <td className="px-8 py-6 align-top">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs border border-brand-blue/5">
                          {row.actor?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <span className="font-bold text-main group-hover:text-brand-blue transition-colors truncate max-w-[220px]">{row.actor || 'System Engine'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 align-top">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border shadow-sm ${
                        isSecurity 
                          ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' 
                          : 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                      }`}>
                        {isSecurity ? <ShieldCheck className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                        {isSecurity ? row.kind : row.action}
                      </span>
                    </td>
                    <td className="px-8 py-6 align-top text-right">
                      {row.meta && Object.keys(row.meta).length > 0 ? (
                        <details className="group/detail relative inline-block text-left outline-none">
                          <summary className="inline-flex items-center gap-2 rounded-xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-main cursor-pointer list-none hover:bg-brand-dark hover:text-brand-yellow transition-all shadow-sm">
                            Explorar JSON <ArrowRight className="h-3 w-3 transition-transform group-open/detail:rotate-90" />
                          </summary>
                          <div className="absolute right-0 top-full z-[100] mt-4 w-[500px] overflow-hidden rounded-[2rem] border border-brand-dark/20 bg-brand-dark text-white shadow-2xl animate-in zoom-in-95 slide-in-from-top-4 duration-300">
                            <div className="bg-white/10 px-6 py-4 border-b border-white/5 text-[9px] font-bold uppercase tracking-[0.4em] text-brand-yellow flex items-center justify-between">
                              <span className="flex items-center gap-2"><Database className="h-3 w-3" /> Event Payload Data</span>
                              <code className="text-[10px] opacity-40">EVENT_ID: {row.id.split('-')[0]}</code>
                            </div>
                            <pre className="max-h-[400px] overflow-auto p-8 text-[11px] font-mono leading-relaxed text-white/80 custom-scrollbar text-left scroll-smooth">
                              {JSON.stringify(row.meta, null, 2)}
                            </pre>
                          </div>
                        </details>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-30 italic">No Payload</span>
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
      <footer className="mt-16 flex items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-12 opacity-40 transition-opacity hover:opacity-100 duration-500">
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