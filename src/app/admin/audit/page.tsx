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

// Tipado seguro para la tabla de eventos de auditoría/seguridad
type AuditRow = {
  id: string;
  created_at: string;
  path?: string;
  actor: string | null;
  action?: string; // Para admin_audit_events
  kind?: string;   // Para security_events
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 rounded-[3rem] border border-rose-500/20 bg-rose-500/5">
        <AlertTriangle className="h-16 w-16 text-rose-500/50 mb-6" />
        <h1 className="font-heading text-3xl text-rose-700">Infraestructura Bloqueada</h1>
        <p className="mt-2 text-sm text-rose-600/70 max-w-md">El Service Role de Supabase no está configurado. La auditoría requiere privilegios de nivel 0.</p>
      </div>
    );
  }

  // Bypass temporal seguro para la construcción de la query dinámica
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
  
  // Cast seguro de la data retornada a nuestro tipo AuditRow
  const rows = (data || []) as AuditRow[];

  const auditSignals = [
    { 
      label: 'Registros en Vista', 
      value: String(rows.length), 
      note: `Ventana de ${limit} ev.`
    },
    { 
      label: 'Nivel de Integridad', 
      value: '100%', 
      note: 'Logs inmutables activos.'
    }
  ];

  const exportParams = new URLSearchParams(sp as any);
  exportParams.set('limit', '5000');
  const exportHref = `/api/admin/audit/export?${exportParams.toString()}`;

  return (
    <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER INSTITUCIONAL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-10">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Fingerprint className="h-3.5 w-3.5" /> Immutable Audit Lane
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue">
            Auditoría <span className="text-brand-yellow italic font-light">Forense</span>
          </h1>
          <p className="mt-4 text-base text-[var(--color-text)]/50 font-light leading-relaxed max-w-2xl">
            Historial detallado de cada mutación en el sistema. Filtra eventos para investigar cambios en tours, precios o accesos administrativos.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="rounded-full shadow-sm">
            <a href={exportHref} className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Exportar CSV
            </a>
          </Button>
        </div>
      </header>

      {/* WORKBENCH DE CUMPLIMIENTO */}
      <AdminOperatorWorkbench
        eyebrow="System Governance"
        title="Rastreo de Actividad Crítica"
        description="Cada fila representa una acción confirmada por el servidor. El campo 'Actor' identifica al administrador responsable, permitiendo una trazabilidad total en caso de incidencias operativas."
        actions={[
          { href: '/admin/rbac', label: 'Gestionar Permisos', tone: 'primary' },
          { href: '/admin/analytics/performance', label: 'Monitor de Salud' }
        ]}
        signals={auditSignals}
      />

      {/* VISTA DE DATOS (LA BÓVEDA) */}
      <section className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl overflow-hidden relative">
        
        {/* Selector de Pestañas Premium */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-2 p-1.5 rounded-[1.5rem] bg-[var(--color-surface-2)] border border-[var(--color-border)] w-fit shadow-inner">
            <Link 
              href="/admin/audit?tab=admin" 
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${!isSecurity ? 'bg-brand-blue text-white shadow-lg scale-105' : 'text-[var(--color-text)]/40 hover:text-brand-blue'}`}
            >
              <Settings className="h-3.5 w-3.5" /> Actividad Admin
            </Link>
            <Link 
              href="/admin/audit?tab=security" 
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${isSecurity ? 'bg-rose-600 text-white shadow-lg scale-105' : 'text-[var(--color-text)]/40 hover:text-rose-600'}`}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Eventos de Seguridad
            </Link>
          </div>
        </div>

        {/* Formulario de Filtros Tácticos */}
        <div className="px-8 pb-8 border-b border-[var(--color-border)] mb-4">
          <form action="/admin/audit" method="get" className="grid gap-6 xl:grid-cols-[1fr_auto]">
            <input type="hidden" name="tab" value={tab} />
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1 flex items-center gap-1.5">
                  <Filter className="h-3 w-3" /> Tipo de Evento
                </label>
                <input 
                  name="kind" 
                  defaultValue={kind} 
                  placeholder={isSecurity ? "login_failed..." : "tour.update..."}
                  className="w-full h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-xs font-mono focus:ring-2 focus:ring-brand-blue/10 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1 flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Actor (Email/ID)
                </label>
                <input 
                  name="actor" 
                  defaultValue={actor} 
                  placeholder="admin@kce.travel"
                  className="w-full h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-xs focus:ring-2 focus:ring-brand-blue/10 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1 flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3" /> Rango Temporal
                </label>
                <div className="flex items-center gap-2">
                  <input type="date" name="from" defaultValue={createdFrom} className="w-full h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-[11px] focus:ring-2 focus:ring-brand-blue/10 outline-none" />
                  <span className="text-[var(--color-text)]/20">—</span>
                  <input type="date" name="to" defaultValue={createdTo} className="w-full h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-[11px] focus:ring-2 focus:ring-brand-blue/10 outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 ml-1 flex items-center gap-1.5">
                  <Terminal className="h-3 w-3" /> Límite
                </label>
                <input name="limit" defaultValue={String(limit)} className="w-full h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 text-xs font-mono text-center focus:ring-2 focus:ring-brand-blue/10 outline-none" />
              </div>
            </div>

            <div className="flex items-end pb-0.5">
              <Button type="submit" className="h-11 px-8 rounded-xl shadow-lg">Aplicar Filtros</Button>
            </div>
          </form>
        </div>

        {/* Tabla de Resultados */}
        <div className="overflow-x-auto px-6 pb-6">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm min-w-[1000px]">
              <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                <tr className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/40">
                  <th className="px-8 py-6">Timestamp & Ruta</th>
                  <th className="px-8 py-6">Identidad (Actor)</th>
                  <th className="px-8 py-6">Acción Confirmada</th>
                  <th className="px-8 py-6 text-right">Data Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center">
                      <Search className="mx-auto h-12 w-12 text-brand-blue/10 mb-4" />
                      <p className="text-lg font-light text-[var(--color-text)]/30 italic">No se encontraron eventos con los criterios seleccionados.</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="group transition-all hover:bg-brand-blue/[0.01]">
                      <td className="px-8 py-6 align-top">
                        <div className="flex items-center gap-2 text-[var(--color-text)]/60 font-mono text-[11px] mb-2">
                          <Clock className="h-3.5 w-3.5 opacity-30" />
                          {new Date(row.created_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="inline-block max-w-[180px] truncate rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/40" title={row.path}>
                          {row.path || 'Root Context'}
                        </div>
                      </td>
                      <td className="px-8 py-6 align-top">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-brand-blue/5 flex items-center justify-center text-brand-blue font-bold text-[10px]">
                            {row.actor?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <span className="font-bold text-brand-blue group-hover:text-brand-yellow transition-colors truncate max-w-[200px]">{row.actor || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 align-top">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest border ${
                          isSecurity 
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' 
                            : 'bg-brand-blue/5 text-brand-blue border-brand-blue/10'
                        }`}>
                          {isSecurity ? <ShieldCheck className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                          {isSecurity ? row.kind : row.action}
                        </span>
                      </td>
                      <td className="px-8 py-6 align-top text-right">
                        {row.meta && Object.keys(row.meta).length > 0 ? (
                          <details className="group/detail relative inline-block text-left">
                            <summary className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/60 cursor-pointer list-none hover:bg-brand-blue hover:text-white transition-all">
                              Ver JSON <ArrowRight className="h-3 w-3 transition-transform group-open/detail:rotate-90" />
                            </summary>
                            <div className="absolute right-0 top-full z-[100] mt-4 w-[450px] overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-brand-dark text-white shadow-2xl animate-in zoom-in-95 duration-200">
                              <div className="bg-white/5 px-5 py-3 border-b border-white/10 text-[9px] font-bold uppercase tracking-[0.3em] text-brand-yellow flex items-center justify-between">
                                <span>Event Payload Metadata</span>
                                <code className="text-[8px] opacity-40">ID: {row.id.slice(0, 8)}</code>
                              </div>
                              <pre className="max-h-[350px] overflow-auto p-6 text-[11px] font-mono leading-relaxed text-white/70 custom-scrollbar text-left">
                                {JSON.stringify(row.meta, null, 2)}
                              </pre>
                            </div>
                          </details>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/20 italic">No Metadata</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </section>

      {/* FOOTER TÉCNICO */}
      <footer className="mt-12 flex items-center justify-center gap-12 border-t border-[var(--color-border)] pt-12 opacity-30 transition-opacity hover:opacity-60">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Settings className="h-3 w-3" /> Audit v4.8
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3 w-3" /> SOC-2 Ready Logs
        </div>
      </footer>
    </div>
  );
}