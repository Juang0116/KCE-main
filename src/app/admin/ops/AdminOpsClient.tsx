'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  ShieldCheck, Activity, Clock, Lock, 
  AlertCircle, Zap, RefreshCw, Settings, 
  CheckCircle2, XCircle, Terminal, Radio,
  ShieldAlert, Fingerprint, Layers, Key,
  Hash, Cpu, ChevronRight, Database,
  ArrowRight, Smartphone, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// --- TYPES DE OPERACIONES ---
type OpsResp = {
  actor?: string;
  access?: { mode: string; actor: string; roles: string[]; permissions: string[]; hasAll: boolean; breakglassActive?: boolean; };
  requestId: string;
  range: { tz: string; from: string; to: string };
  tickets: { open: number; pending: number; in_progress: number; urgent: number; };
  tasks: { open: number; overdue: number; due_today: number; urgent: number; };
  deals: Record<string, number>;
  controls?: {
    auto_promote?: { enabled: boolean; override?: 'runtime' | 'env'; updated_at?: string | null };
    channel_pauses?: { email?: { channel: string; paused_until: string; reason?: string | null } | null };
  };
  lists: {
    urgent_tickets: Array<{ id: string; subject: string | null; updated_at: string | null; priority: string | null }>;
    overdue_tasks: Array<{ id: string; title: string; due_at: string | null; priority: string | null; ticket_id: string | null; deal_id: string | null; }>;
  };
};

type Approval = {
  id: string;
  action: string;
  payload: unknown;
  status: 'pending' | 'approved' | 'executed' | 'rejected' | 'expired' | string;
  created_at: string;
  expires_at: string;
};

export function AdminOpsClient() {
  const [data, setData] = useState<OpsResp | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [approverToken, setApproverToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [approvalsErr, setApprovalsErr] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r = await adminFetch('/api/admin/ops', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || `Node Fail: ${r.status}`);
      setData(j as OpsResp);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadApprovals = useCallback(async () => {
    setApprovalsLoading(true); setApprovalsErr('');
    try {
      const res = await adminFetch('/api/admin/ops/approvals?status=pending', { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Auth node unreachable');
      setApprovals(j?.approvals || []);
    } catch (e: any) {
      setApprovalsErr(e.message);
    } finally {
      setApprovalsLoading(false);
    }
  }, []);

  const executeApproval = async (id: string) => {
    setApprovalsErr('');
    try {
      const res = await adminFetch(`/api/admin/ops/approvals/${encodeURIComponent(id)}/execute`, { 
        method: 'POST', 
        headers: { 'x-ops-approver-token': approverToken || '' }
      });
      if (!res.ok) throw new Error('Authorization denied');
      setApproverToken('');
      await Promise.all([loadApprovals(), load()]);
    } catch (e: any) {
      setApprovalsErr(e.message);
    }
  };

  const callControl = async (payload: unknown) => {
    try {
      const r = await adminFetch('/api/admin/ops/control', { 
        method: 'POST', headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (!r.ok) throw new Error('Control rejected');
      await load();
    } catch (e: any) { setErr(e.message); }
  };

  useEffect(() => { void load(); void loadApprovals(); }, [load, loadApprovals]);

  const signals = useMemo(() => [
    { label: 'Urgencia CRM', value: String(data?.tickets?.urgent ?? 0), note: 'Tickets bajo alerta roja.' },
    { label: 'Deuda Operativa', value: String(data?.tasks?.overdue ?? 0), note: 'Tareas vencidas hoy.' },
    { label: 'Pending Auth', value: String(approvals.length), note: 'Two-Man Rule activa.' }
  ], [data, approvals]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA DE MANDO CENTRAL */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Terminal className="h-3.5 w-3.5" /> Command Lane: /ops-center-node
          </div>
          <h1 className="font-heading text-4xl md:text-6xl text-main tracking-tighter leading-none">
            Operations <span className="text-brand-yellow italic font-light">Center</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2">
            Nodo de soberanía administrativa para Knowing Cultures S.A.S. Supervisa el estado de integridad global, audita la deuda operativa y gestiona protocolos de seguridad.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/ops/notifications" className="h-12 px-6 rounded-full border border-brand-dark/10 bg-surface text-[10px] font-bold uppercase tracking-widest text-muted hover:bg-surface-2 hover:text-main transition-all shadow-sm flex items-center gap-2">
             <Bell className="h-3.5 w-3.5" /> Alertas
          </Link>
          <Link href="/admin/ops/runbooks" className="h-12 px-6 rounded-full border border-brand-dark/10 bg-surface text-[10px] font-bold uppercase tracking-widest text-muted hover:bg-surface-2 hover:text-main transition-all shadow-sm flex items-center gap-2">
             <Database className="h-3.5 w-3.5" /> Protocolos
          </Link>
          <Button onClick={() => void load()} disabled={loading} className="h-12 px-8 rounded-full bg-brand-dark text-brand-yellow shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
          </Button>
        </div>
      </header>

      {/* 02. WORKBENCH DE GOBERNANZA */}
      <AdminOperatorWorkbench
        eyebrow="Stability & Governance"
        title="Sanidad Operativa del Núcleo"
        description="Gestiona la sanidad estructural del sistema. El retraso en tareas críticas o tickets urgentes degrada la promesa de servicio premium de la marca."
        actions={[
          { href: '/admin/ops/incidents', label: 'Analizar Fallas', tone: 'primary' },
          { href: '/admin/events', label: 'Visor Forense' }
        ]}
        signals={signals}
      />

      {err && (
        <div className="mx-2 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/10 p-6 flex items-center gap-4 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 shadow-sm font-bold">
          <ShieldAlert className="h-6 w-6 opacity-60" /> Protocolo de Error: <span className="font-light">{err}</span>
        </div>
      )}

      {/* 03. GRID DE CONTROLES Y SEGURIDAD */}
      <div className="grid gap-10 lg:grid-cols-2">
        
        {/* PANEL DE CONTROL DINÁMICO (OVERRIDE) */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-12 shadow-pop space-y-12 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-[0.02] pointer-events-none"><Settings className="h-64 w-64" /></div>
          <header className="flex items-center gap-4 border-b border-brand-dark/5 dark:border-white/5 pb-8 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner">
               <Radio className="h-6 w-6" />
            </div>
            <div>
               <h2 className="font-heading text-3xl text-main tracking-tight uppercase">Override del Sistema</h2>
               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">Manual Control Protocol</p>
            </div>
          </header>

          <div className="space-y-8 relative z-10">
            {/* Control Auto-Promote */}
            <div className="rounded-[2.2rem] border border-brand-dark/5 bg-surface-2/30 p-8 shadow-inner group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="space-y-1">
                  <p className="font-bold text-main text-base uppercase tracking-tight">Auto-Promote Engine</p>
                  <p className="text-sm font-light text-muted italic">Avanza deals según pesos algorítmicos automáticos.</p>
                </div>
                <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${data?.controls?.auto_promote?.enabled ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-700 border-red-500/20 animate-pulse'}`}>
                  {data?.controls?.auto_promote?.enabled ? 'Nominal_Active' : 'Override_Active'}
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => void callControl({ action: 'set_flag', key: 'crm_auto_promote_weights', value: data?.controls?.auto_promote?.enabled ? 'false' : 'true' })} 
                  className={`flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-soft active:scale-95 ${data?.controls?.auto_promote?.enabled ? 'bg-brand-dark text-brand-yellow hover:bg-red-600 hover:text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  {data?.controls?.auto_promote?.enabled ? 'Pausar Nodo' : 'Activar Nodo'}
                </button>
                <button onClick={() => void callControl({ action: 'clear_flag', key: 'crm_auto_promote_weights' })} className="h-12 px-6 rounded-xl border border-brand-dark/10 bg-surface text-muted hover:text-brand-blue hover:border-brand-blue/30 transition-all shadow-sm">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Control Email */}
            <div className="rounded-[2.2rem] border border-brand-dark/5 bg-surface-2/30 p-8 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="space-y-1">
                  <p className="font-bold text-main text-base uppercase tracking-tight">Comunicaciones Globales</p>
                  <p className="text-sm font-light text-muted italic flex items-center gap-2">
                     <Smartphone className="h-3.5 w-3.5 opacity-40" />
                     {data?.controls?.channel_pauses?.email?.reason || 'Protocolo de salida activo.'}
                  </p>
                </div>
                <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${data?.controls?.channel_pauses?.email ? 'bg-red-500/10 text-red-700 border-red-500/20' : 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'}`}>
                  {data?.controls?.channel_pauses?.email ? 'Channel_Locked' : 'Transmitting'}
                </div>
              </div>
              <Button 
                onClick={() => void callControl({ action: data?.controls?.channel_pauses?.email ? 'resume_channel' : 'pause_channel', channel: 'email', minutes: 60, reason: 'Manual Ops Pause' })} 
                className={`w-full h-14 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-pop transition-all active:scale-95 ${data?.controls?.channel_pauses?.email ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-brand-dark text-brand-yellow hover:bg-red-600 hover:text-white'}`}
              >
                {data?.controls?.channel_pauses?.email ? 'Reanudar Transmisión' : 'Lock Email Channel (1h)'}
              </Button>
            </div>
          </div>
        </section>

        {/* GOBERNANZA RBAC (EL BÚNKER OSCURO) */}
        <section className="rounded-[var(--radius-3xl)] border border-brand-dark/20 bg-brand-dark p-10 md:p-12 shadow-2xl text-white space-y-10 relative overflow-hidden group">
          <div className="absolute -right-20 -bottom-20 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 pointer-events-none"><Lock className="h-[30rem] w-[30rem]" /></div>
          
          <header className="flex items-center justify-between border-b border-white/5 pb-8 relative z-10">
            <div className="flex items-center gap-5">
              <div className="h-12 w-12 rounded-2xl bg-brand-yellow/10 flex items-center justify-center text-brand-yellow shadow-inner ring-1 ring-brand-yellow/20">
                 <Key className="h-6 w-6" />
              </div>
              <div>
                 <h2 className="font-heading text-3xl tracking-tight">Gobernanza RBAC</h2>
                 <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">Auth Session Integrity</p>
              </div>
            </div>
            {data?.access?.breakglassActive && (
               <div className="px-5 py-2 rounded-full bg-red-600 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                  Emergency Breakglass Active
               </div>
            )}
          </header>

          <div className="space-y-8 relative z-10">
            <div className="p-6 rounded-[1.8rem] bg-white/5 border border-white/10 shadow-inner group/sig">
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mb-3">Active Node Signature</p>
              <div className="font-mono text-base text-brand-yellow flex items-center gap-3 group-hover/sig:translate-x-1 transition-transform">
                 <Fingerprint className="h-5 w-5 opacity-50" /> 
                 <span className="tracking-tight">{data?.access?.actor || 'ROOT_SESSION_STABLE'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-[1.8rem] bg-white/5 border border-white/10 shadow-inner">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mb-4 flex items-center gap-2">
                   <ShieldCheck className="h-3 w-3" /> Active Roles
                </p>
                <div className="flex flex-wrap gap-2">
                   {data?.access?.roles.map(r => (
                      <span key={r} className="px-3 py-1 rounded-md bg-brand-blue/20 text-[10px] font-mono font-bold text-brand-blue uppercase tracking-tighter border border-brand-blue/20">
                         {r}
                      </span>
                   ))}
                </div>
              </div>
              <div className="p-6 rounded-[1.8rem] bg-white/5 border border-white/10 shadow-inner flex flex-col justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mb-4">Auth Mode</p>
                <div className="text-sm font-mono text-green-400 font-bold uppercase tracking-widest flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                   {data?.access?.mode || 'READ_WRITE_SECURE'}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 relative z-10 flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.5em] text-white/10 italic">
             <Terminal className="h-3 w-3" /> Knowing Cultures Security MMXXVI
          </div>
        </section>
      </div>

      {/* 04. TWO-MAN RULE (LA BÓVEDA DE AUTORIZACIÓN) */}
      <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-pop overflow-hidden relative">
        <header className="p-10 md:p-12 border-b border-brand-dark/5 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-10 bg-surface-2/30">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-[2rem] bg-green-500/10 text-green-600 flex items-center justify-center shadow-inner ring-1 ring-green-500/20">
               <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-4xl text-main tracking-tight leading-none">Two-Man Rule <span className="text-brand-blue italic font-light">Vault</span></h2>
              <p className="text-base text-muted font-light italic">Protocolo de autorización obligatoria para maniobras críticas de alto nivel.</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
             <label className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-60 ml-1">Master Approver Token</label>
             <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue opacity-30 group-focus-within:opacity-100 transition-opacity" />
                <input 
                  type="password"
                  className="h-14 w-full lg:w-96 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface text-sm font-mono text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30" 
                  placeholder="Insert Key Token..." 
                  value={approverToken} 
                  onChange={(e) => setApproverToken(e.target.value)} 
                />
             </div>
          </div>
        </header>

        <div className="p-8 md:p-10">
           <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left text-sm border-separate border-spacing-y-3">
               <thead>
                 <tr className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted opacity-50">
                   <th className="px-8 py-4">Misión & Expiración</th>
                   <th className="px-8 py-4">Protocolo de Acción</th>
                   <th className="px-8 py-4 text-center">Status</th>
                   <th className="px-8 py-4 text-right">Mando</th>
                 </tr>
               </thead>
               <tbody>
                 {approvals.length === 0 ? (
                   <tr>
                     <td colSpan={4} className="px-8 py-32 text-center bg-surface-2/20 rounded-[2rem] border border-dashed border-brand-dark/10">
                        <ShieldAlert className="h-16 w-16 mx-auto mb-6 text-brand-blue opacity-10" />
                        <p className="text-xl font-heading text-main tracking-tight opacity-30">Vigilancia Total</p>
                        <p className="text-sm font-light text-muted mt-2 italic">No se han detectado protocolos de autorización pendientes.</p>
                     </td>
                   </tr>
                 ) : (
                   approvals.map((a) => (
                     <tr key={a.id} className="group">
                       <td className="px-8 py-8 bg-surface border-y border-l border-brand-dark/5 dark:border-white/5 rounded-l-[2rem] shadow-sm">
                         <div className="flex items-center gap-3 font-bold text-main text-base">
                            <Clock className="h-4 w-4 text-brand-blue opacity-40" />
                            {new Date(a.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                         </div>
                         <div className="mt-2 flex items-center gap-2 text-[10px] text-red-600 font-bold uppercase tracking-tighter bg-red-500/5 px-2 py-0.5 rounded-md w-fit">
                            <Zap className="h-3 w-3" /> Exp: {new Date(a.expires_at).toLocaleTimeString()}
                         </div>
                       </td>
                       <td className="px-8 py-8 bg-surface border-y border-brand-dark/5 dark:border-white/5">
                         <div className="font-heading text-2xl text-brand-blue tracking-tight group-hover:translate-x-1 transition-transform">{a.action.toUpperCase()}</div>
                         <div className="mt-2 text-[9px] font-mono text-muted opacity-40">OBJECT_ID: {a.id.slice(0,16)}</div>
                       </td>
                       <td className="px-8 py-8 bg-surface border-y border-brand-dark/5 dark:border-white/5 text-center">
                         <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-amber-500/10 text-amber-700 border-amber-500/20 shadow-inner ring-4 ring-amber-500/5">
                            {a.status}
                         </span>
                       </td>
                       <td className="px-8 py-8 bg-surface border-y border-r border-brand-dark/5 dark:border-white/5 rounded-r-[2rem] text-right shadow-sm">
                         <Button 
                           onClick={() => void executeApproval(a.id)} 
                           disabled={!approverToken} 
                           className="h-12 px-8 rounded-xl bg-green-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-pop hover:bg-green-700 active:scale-95 disabled:opacity-20 transition-all"
                         >
                            Ejecutar Autorización
                         </Button>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
           
           {approvalsErr && (
              <div className="mt-8 p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-700 text-xs font-bold flex items-center gap-3 animate-in slide-in-from-bottom-2">
                 <AlertCircle className="h-4 w-4" /> Error de Autorización: {approvalsErr}
              </div>
           )}
        </div>
      </section>

      {/* 05. FOOTER DE SOBERANÍA TÉCNICA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Operations Active
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Layers className="h-4 w-4 opacity-50" /> Command Center v4.8
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Zap className="h-4 w-4 animate-pulse" /> Core Signal Monitoring
        </div>
      </footer>

    </div>
  );
}