'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { 
  ShieldCheck, Activity, Clock, Lock, 
  AlertCircle, Zap, RefreshCw, Settings, 
  CheckCircle2, XCircle, Terminal, Radio,
  ShieldAlert, Fingerprint, Layers, Key
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

  useEffect(() => { load(); loadApprovals(); }, [load, loadApprovals]);

  const signals = useMemo(() => [
    { label: 'Urgencia CRM', value: String(data?.tickets?.urgent ?? 0), note: 'Tickets bajo alerta roja.' },
    { label: 'Deuda Operativa', value: String(data?.tasks?.overdue ?? 0), note: 'Tareas vencidas hoy.' },
    { label: 'Pending Auth', value: String(approvals.length), note: 'Two-Man Rule activa.' }
  ], [data, approvals]);

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER DE MANDO CENTRAL */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Command Lane: /ops-center
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Operations <span className="text-brand-yellow italic font-light">Center</span>
          </h1>
          <p className="mt-4 text-base text-[color:var(--color-text)]/50 font-light max-w-2xl italic">
            Nodo de soberanía administrativa. Supervisa el estado de integridad y gestiona accesos de seguridad.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/ops/notifications" className="h-12 px-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[10px] font-bold uppercase tracking-widest text-brand-blue flex items-center hover:bg-brand-blue hover:text-white transition-all shadow-sm">Alertas</Link>
          <Link href="/admin/ops/runbooks" className="h-12 px-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[10px] font-bold uppercase tracking-widest text-brand-blue flex items-center hover:bg-brand-blue hover:text-white transition-all shadow-sm">Protocolos</Link>
          <Button onClick={load} disabled={loading} variant="primary" className="h-12 px-6 rounded-2xl shadow-lg hover:scale-105 transition-transform">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
          </Button>
        </div>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Stability & Governance"
        title="Sanidad Operativa del Núcleo"
        description="Gestiona la sanidad del sistema aquí. El retraso en tareas críticas afecta directamente la experiencia premium."
        actions={[
          { href: '/admin/ops/incidents', label: 'Analizar Fallas', tone: 'primary' },
          { href: '/admin/system', label: 'Infra Status' }
        ]}
        signals={signals}
      />

      {err && (
        <div className="mx-2 rounded-[2rem] border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 animate-in zoom-in-95">
          <ShieldAlert className="h-6 w-6 opacity-40" />
          <p className="text-sm font-medium">{err}</p>
        </div>
      )}

      {/* GRID DE CONTROLES Y SEGURIDAD */}
      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* PANEL DE CONTROL DINÁMICO */}
        <section className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-10 shadow-2xl space-y-10 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-[0.03] rotate-12"><Settings className="h-64 w-64" /></div>
          <header className="flex items-center gap-4 border-b border-[color:var(--color-border)] pb-6 relative z-10">
            <Radio className="h-6 w-6 text-brand-blue" />
            <h2 className="font-heading text-2xl text-brand-blue">Override del Sistema</h2>
          </header>

          <div className="space-y-6 relative z-10">
            {/* Control Auto-Promote */}
            <div className="rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-sm group">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <p className="font-bold text-[color:var(--color-text)] text-sm uppercase tracking-tight">Auto-Promote Engine</p>
                  <p className="text-xs font-light text-[color:var(--color-text-muted)] italic">Avanza deals según pesos algorítmicos.</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border ${data?.controls?.auto_promote?.enabled ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 border-rose-500/20 animate-pulse'}`}>
                  {data?.controls?.auto_promote?.enabled ? 'Nominal' : 'Override Active'}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => void callControl({ action: 'set_flag', key: 'crm_auto_promote_weights', value: data?.controls?.auto_promote?.enabled ? 'false' : 'true' })} className="flex-1 h-10 rounded-xl bg-brand-blue text-white text-[10px] font-bold uppercase tracking-widest hover:bg-brand-blue/90 transition-colors">
                  {data?.controls?.auto_promote?.enabled ? 'Pausar Nodo' : 'Activar Nodo'}
                </button>
                <button onClick={() => void callControl({ action: 'clear_flag', key: 'crm_auto_promote_weights' })} className="h-10 px-4 rounded-xl border border-[color:var(--color-border)] text-[color:var(--color-text)]/30 hover:text-brand-blue transition-colors">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Control Email */}
            <div className="rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <p className="font-bold text-[color:var(--color-text)] text-sm uppercase tracking-tight">Comunicaciones Globales</p>
                  <p className="text-xs font-light text-[color:var(--color-text-muted)] italic truncate max-w-[200px]">{data?.controls?.channel_pauses?.email?.reason || 'Protocolo de salida activo.'}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border ${data?.controls?.channel_pauses?.email ? 'bg-rose-500/10 text-rose-700 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'}`}>
                  {data?.controls?.channel_pauses?.email ? 'Channel Locked' : 'Transmitting'}
                </div>
              </div>
              {/* ✅ CORREGIDO: variant "primary" en lugar de "default" */}
              <Button 
                onClick={() => void callControl({ action: data?.controls?.channel_pauses?.email ? 'resume_channel' : 'pause_channel', channel: 'email', minutes: 60, reason: 'Manual Ops Pause' })} 
                variant={data?.controls?.channel_pauses?.email ? 'primary' : 'outline'} 
                className={`w-full h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest ${data?.controls?.channel_pauses?.email ? 'bg-emerald-600 text-white border-none' : 'border-rose-500/20 text-rose-600 hover:bg-rose-500/5'}`}
              >
                {data?.controls?.channel_pauses?.email ? 'Reanudar Transmisión' : 'Lock Email Channel (1h)'}
              </Button>
            </div>
          </div>
        </section>

        {/* GOBERNANZA RBAC */}
        <section className="rounded-[3rem] border border-[color:var(--color-border)] bg-brand-dark p-8 md:p-10 shadow-2xl text-white space-y-8 relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 opacity-5 group-hover:scale-110 transition-transform"><Lock className="h-80 w-80" /></div>
          <header className="flex items-center justify-between border-b border-white/10 pb-6 relative z-10">
            <div className="flex items-center gap-4">
              <Key className="h-6 w-6 text-brand-yellow" />
              <h2 className="font-heading text-2xl">Gobernanza RBAC</h2>
            </div>
            {data?.access?.breakglassActive && <div className="px-3 py-1 rounded-full bg-rose-600 text-[9px] font-bold uppercase tracking-[0.2em] animate-pulse">Emergency Breakglass</div>}
          </header>

          <div className="space-y-6 relative z-10">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 mb-2">Auth Signature</p>
              <div className="font-mono text-sm text-brand-yellow flex items-center gap-2"><Fingerprint className="h-4 w-4" /> {data?.access?.actor || 'ROOT_SESSION'}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 mb-2">Active Roles</p>
                <div className="flex flex-wrap gap-2">
                   {data?.access?.roles.map(r => <span key={r} className="text-[10px] font-mono font-bold text-brand-blue uppercase">{r}</span>)}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 mb-2">Session Mode</p>
                <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest">{data?.access?.mode || 'READ_WRITE'}</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* TWO-MAN RULE */}
      <section className="rounded-[3.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-2xl overflow-hidden relative">
        <header className="p-8 md:p-10 border-b border-[color:var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner">
               <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-heading text-3xl text-brand-blue">Two-Man Rule Vault</h2>
              <p className="text-xs font-light text-[color:var(--color-text-muted)] italic">Autorización obligatoria para acciones críticas.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative group">
               <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30" />
               <input className="h-12 w-full md:w-80 pl-12 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-sm font-mono outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all" placeholder="Approver Token" value={approverToken} onChange={(e) => setApproverToken(e.target.value)} />
             </div>
          </div>
        </header>

        <div className="p-8">
           <div className="overflow-x-auto rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
             <table className="w-full text-left text-sm">
               <thead className="bg-[color:var(--color-surface-2)]">
                 <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                   <th className="px-8 py-6">Misión / Expiración</th>
                   <th className="px-8 py-6">Protocolo</th>
                   <th className="px-8 py-6 text-center">Status</th>
                   <th className="px-8 py-6 text-right">Acción</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-black/[0.03]">
                 {approvals.length === 0 ? (
                   <tr><td colSpan={4} className="px-8 py-20 text-center text-xs italic opacity-30">Vigilance Hub: No pending protocols.</td></tr>
                 ) : (
                   approvals.map((a) => (
                     <tr key={a.id} className="hover:bg-brand-blue/[0.01]">
                       <td className="px-8 py-6">
                         <div className="font-bold text-[color:var(--color-text)]">{new Date(a.created_at).toLocaleDateString('es-CO')}</div>
                         <div className="text-[9px] text-rose-600 font-bold uppercase">Exp: {new Date(a.expires_at).toLocaleTimeString()}</div>
                       </td>
                       <td className="px-8 py-6">
                         <div className="font-heading text-lg text-brand-blue">{a.action.toUpperCase()}</div>
                       </td>
                       <td className="px-8 py-6 text-center">
                         <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase border bg-amber-500/10 text-amber-700">{a.status}</span>
                       </td>
                       <td className="px-8 py-6 text-right">
                         <button onClick={() => executeApproval(a.id)} disabled={!approverToken} className="h-10 px-6 rounded-xl bg-emerald-600 text-white text-[10px] font-bold uppercase hover:bg-emerald-700 disabled:opacity-30">Autorizar</button>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </section>

      <footer className="mt-12 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Ops
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Layers className="h-3.5 w-3.5" /> Command Center v4.8
        </div>
      </footer>
    </div>
  );
}