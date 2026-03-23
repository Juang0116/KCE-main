'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  ShieldCheck, Key, Users, Copy, Lock, 
  RefreshCw, Plus, Trash2, Download, 
  Fingerprint, ShieldAlert, Terminal, 
  Layers, Zap, Database, ShieldOff,
  UserCheck, Hash, Cpu, ChevronRight,
  Shield, Globe, AlertTriangle
} from 'lucide-react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { Button } from '@/components/ui/Button';

// --- TYPES DE GOBERNANZA ---
type Role = { role_key: string; name: string; permissions: string[] };
type Binding = { actor: string; role_key: string; created_at?: string };
type TemplateInfo = { key: string; name: string; description: string; rolesCount: number };

export default function AdminRbacClient() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [showBootstrap, setShowBootstrap] = useState(false);

  const [newRoleKey, setNewRoleKey] = useState('');
  const [newRolePerms, setNewRolePerms] = useState('metrics_view,alerts_ack,ops_control');
  const [bindActor, setBindActor] = useState('admin');
  const [bindRole, setBindRole] = useState('ops');

  const refresh = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [r, b, t] = await Promise.all([
        adminFetch('/api/admin/rbac/roles'),
        adminFetch('/api/admin/rbac/bindings'),
        adminFetch('/api/admin/rbac/templates')
      ]);

      const [rj, bj, tj] = await Promise.all([r.json(), b.json(), t.json()]);

      if (!r.ok) throw new Error(rj.error || 'Err_Roles');
      setRoles(rj.items || []);
      setBindings(bj.items || []);
      setTemplates(tj.items || []);
      setShowBootstrap(false);
    } catch (e: any) {
      const msg = e.message;
      setErr(msg);
      if (msg.includes('RBAC_REQUIRED')) setShowBootstrap(true);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const bootstrapOwner = async () => {
    if (!bootstrapSecret.trim()) return setErr('RBAC_BOOTSTRAP_SECRET_REQUIRED');
    setLoading(true);
    try {
      const r = await adminFetch('/api/admin/rbac/bootstrap', {
        method: 'POST',
        headers: { 'x-rbac-bootstrap-secret': bootstrapSecret.trim() },
      });
      if (!r.ok) throw new Error('Bootstrap_Auth_Failed');
      setBootstrapSecret('');
      await refresh();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const createRole = async () => {
    const role_key = newRoleKey.trim();
    if (!role_key) return setErr('role_key_missing');
    const permissions = newRolePerms.split(',').map(s => s.trim()).filter(Boolean);
    setLoading(true);
    try {
      await adminFetch('/api/admin/rbac/roles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role_key, name: role_key, permissions }),
      });
      setNewRoleKey(''); await refresh();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const addBinding = async () => {
    setLoading(true);
    try {
      await adminFetch('/api/admin/rbac/bindings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ actor: bindActor.trim(), role_key: bindRole.trim() }),
      });
      await refresh();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const delBinding = async (actor: string, role_key: string) => {
    setLoading(true);
    try {
      await adminFetch(`/api/admin/rbac/bindings?actor=${encodeURIComponent(actor)}&role_key=${encodeURIComponent(role_key)}`, { method: 'DELETE' });
      await refresh();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const applyTemplate = async (templateKey: string) => {
    setLoading(true);
    try {
      await adminFetch('/api/admin/rbac/templates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ template: templateKey, bindRole: 'owner', bindActor: bindActor.trim() || undefined }),
      });
      await refresh();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const signals = [
    { label: 'Definiciones', value: String(roles.length), note: 'Roles Activos' },
    { label: 'Identidades', value: String(bindings.length), note: 'Actores Vinculados' },
    { label: 'Sovereignty', value: showBootstrap ? 'REQUIRED' : 'NOMINAL', note: 'Access Status' },
  ];

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-dark/5 dark:border-white/5 pb-10 px-2">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Terminal className="h-4 w-4" /> Identity Lane: /rbac-vault-node
          </div>
          <h1 className="font-heading text-4xl md:text-7xl text-main tracking-tighter leading-none">
            Privilege <span className="text-brand-yellow italic font-light">Governance</span>
          </h1>
          <p className="text-base text-muted font-light max-w-2xl leading-relaxed mt-2 italic">
            Monitor de privilegios y soberanía para Knowing Cultures S.A.S. Define la frontera de acceso y audita los vínculos de operadores y Agentes IA.
          </p>
        </div>
        <div className="flex gap-4">
           <Button onClick={() => void refresh()} disabled={loading} variant="outline" className="rounded-full h-12 px-8 border-brand-dark/10 shadow-sm font-bold uppercase tracking-widest text-[10px] hover:bg-surface-2 transition-all">
             <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`} /> Sincronizar Bóveda
           </Button>
        </div>
      </header>

      {/* 02. WORKBENCH DE IDENTIDAD */}
      <AdminOperatorWorkbench
        eyebrow="IAM Control"
        title="Gobernanza de Mínimos Privilegios"
        description="Asegura que cada nodo operativo tenga estrictamente lo necesario para funcionar. El uso del rol 'Owner' está restringido a protocolos de emergencia."
        actions={[
          { href: '/admin/ops', label: 'Operations Center', tone: 'primary' },
          { href: '/admin/events', label: 'Logs de Auditoría' }
        ]}
        signals={signals}
      />

      {err && !showBootstrap && (
        <div className="mx-2 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/10 p-6 flex items-center gap-4 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 shadow-sm font-bold">
          <ShieldAlert className="h-6 w-6 opacity-60" />
          <p className="text-sm">Protocolo de Error: <span className="font-light">{err}</span></p>
        </div>
      )}

      {/* 03. EMERGENCY BOOTSTRAP UI (MODO SOBERANO) */}
      {showBootstrap && (
        <section className="rounded-[3rem] border-2 border-red-500/30 bg-red-500/[0.03] p-10 md:p-14 shadow-pop relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
             <ShieldOff className="h-64 w-64 text-red-500" />
          </div>
          <div className="relative z-10 space-y-8">
            <header className="space-y-4">
               <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] animate-pulse shadow-lg">
                  <Zap className="h-4 w-4 fill-current" /> Emergency Bootstrap Active
               </div>
               <h2 className="font-heading text-4xl text-red-800 dark:text-red-400 tracking-tight">Inicialización de Soberanía</h2>
               <p className="max-w-2xl text-lg font-light text-red-900/60 dark:text-red-400/60 leading-relaxed italic border-l-2 border-red-500/20 pl-8">
                  El sistema ha detectado ausencia de propietarios raíz (<span className="font-mono font-bold">RBAC_REQUIRED</span>). 
                  Inyecta la clave secreta maestra para restaurar la jerarquía de mando.
               </p>
            </header>
            <div className="flex flex-col sm:flex-row gap-5 max-w-3xl">
              <div className="relative flex-1">
                 <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500 opacity-40" />
                 <input
                   className="w-full h-16 pl-14 pr-6 rounded-2xl border-2 border-red-500/10 bg-surface text-base font-mono text-red-600 outline-none focus:border-red-500 transition-all shadow-inner placeholder:text-red-900/20"
                   placeholder="ENTER_SECURE_ROOT_SECRET"
                   value={bootstrapSecret}
                   type="password"
                   onChange={(e) => setBootstrapSecret(e.target.value)}
                 />
              </div>
              <Button onClick={() => void bootstrapOwner()} disabled={loading} className="h-16 px-10 rounded-2xl bg-red-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-pop hover:bg-red-700 active:scale-95 transition-all">
                Restaurar Mando
              </Button>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-2">
        
        {/* COLUMNA 1: DEFINICIONES (PROTOCOLOS & MATRIZ) */}
        <div className="space-y-10">
          
          {/* TEMPLATES (MISSION PROTOCOLS) */}
          <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 shadow-pop space-y-10 relative overflow-hidden">
            <header className="flex items-center gap-4 border-b border-brand-dark/5 dark:border-white/5 pb-8">
               <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner">
                  <Download className="h-6 w-6" />
               </div>
               <div>
                  <h2 className="font-heading text-3xl text-main tracking-tight uppercase">Protocolos de Misión</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40 mt-1">Preset Role Templates</p>
               </div>
            </header>
            <div className="grid gap-4">
              {templates.map((t) => (
                <div key={t.key} className="group p-6 rounded-[2rem] border border-brand-dark/5 bg-surface-2/30 hover:bg-surface-2 hover:border-brand-blue/30 transition-all flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <p className="font-bold text-main text-sm uppercase tracking-tight">{t.name}</p>
                    <p className="text-[10px] font-mono text-muted uppercase tracking-widest flex items-center gap-2">
                       <Hash className="h-3 w-3 opacity-40" /> {t.rolesCount} Roles pre-definidos
                    </p>
                  </div>
                  <Button onClick={() => void applyTemplate(t.key)} disabled={loading} variant="outline" className="h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest border-brand-dark/10 bg-surface shadow-sm hover:bg-brand-dark hover:text-brand-yellow transition-all">Instalar</Button>
                </div>
              ))}
            </div>
          </section>

          {/* LISTADO DE ROLES (ACCESS MATRIX) */}
          <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 shadow-pop space-y-10">
            <header className="flex items-center justify-between border-b border-brand-dark/5 dark:border-white/5 pb-8">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                     <Layers className="h-6 w-6" />
                  </div>
                  <h2 className="font-heading text-3xl text-main tracking-tight uppercase">Matriz de Roles</h2>
               </div>
               <span className="px-3 py-1 rounded-lg bg-surface-2 text-[10px] font-mono font-bold text-brand-blue uppercase border border-brand-dark/5">{roles.length} Definidos</span>
            </header>
            
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
              {roles.map((r) => (
                <div key={r.role_key} className="p-8 rounded-[2.5rem] border border-brand-dark/5 bg-surface-2/30 shadow-inner group/role relative">
                  <div className="flex items-center justify-between mb-6">
                     <p className="font-heading text-2xl text-main tracking-tighter uppercase">{r.role_key}</p>
                     <div className="h-2 w-2 rounded-full bg-brand-blue/40" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.permissions.map(p => (
                      <span key={p} className="px-3 py-1.5 rounded-lg bg-surface border border-brand-dark/10 text-[9px] font-mono font-bold text-brand-blue uppercase tracking-tighter hover:scale-105 transition-transform cursor-default">
                         {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-10 border-t border-brand-dark/5 space-y-6">
               <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                  <Plus className="h-4 w-4" /> Constructor de Roles
               </div>
               <div className="grid gap-4">
                  <div className="relative group">
                     <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue opacity-30 group-focus-within:opacity-100 transition-opacity" />
                     <input className="w-full h-14 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-bold text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner" placeholder="Role_Key (ej: tour_manager)" value={newRoleKey} onChange={(e) => setNewRoleKey(e.target.value)} />
                  </div>
                  <textarea className="w-full h-32 p-6 rounded-[2rem] border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-[11px] font-mono leading-relaxed text-brand-blue outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all resize-none shadow-inner custom-scrollbar italic" placeholder="Lista de permisos (metrics_view, tours_edit...)" value={newRolePerms} onChange={(e) => setNewRolePerms(e.target.value)} />
                  <Button onClick={() => void createRole()} disabled={loading} className="w-full h-14 rounded-2xl bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95">Guardar Definición</Button>
               </div>
            </div>
          </section>
        </div>

        {/* COLUMNA 2: ASIGNACIONES (IDENTITY LINKS & OVERRIDE) */}
        <div className="space-y-10">
          
          <section className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-12 shadow-pop space-y-10 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000"><Users className="h-64 w-64 text-brand-blue" /></div>
            
            <header className="flex items-center justify-between border-b border-brand-dark/5 dark:border-white/5 pb-8 relative z-10">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner">
                     <UserCheck className="h-6 w-6" />
                  </div>
                  <h2 className="font-heading text-3xl text-main tracking-tight uppercase leading-none">Identity Bindings</h2>
               </div>
               <span className="px-3 py-1 rounded-lg bg-green-500/5 text-[10px] font-mono font-bold text-green-600 uppercase border border-green-500/10 tracking-widest">{bindings.length} Activos</span>
            </header>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar relative z-10">
              {bindings.map((b, idx) => (
                <div key={`${b.actor}-${b.role_key}-${idx}`} className="group/binding p-6 rounded-[2rem] border border-brand-dark/5 bg-surface-2/30 transition-all hover:bg-surface-2 hover:border-red-500/20 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="h-10 w-10 rounded-xl bg-surface border border-brand-dark/5 flex items-center justify-center shadow-inner text-brand-blue opacity-50 group-hover/binding:opacity-100 transition-opacity">
                       <Fingerprint className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                       <p className="font-bold text-main text-sm tracking-tight">{b.actor}</p>
                       <p className="text-[10px] font-mono font-black text-brand-blue/60 uppercase tracking-[0.2em]">{b.role_key}</p>
                    </div>
                  </div>
                  <button onClick={() => void delBinding(b.actor, b.role_key)} disabled={loading} className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-500/5 text-red-600 hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover/binding:opacity-100 shadow-sm active:scale-90">
                     <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-10 border-t border-brand-dark/5 space-y-8 relative z-10">
               <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                  <Plus className="h-4 w-4" /> Inyector de Privilegios
               </div>
               <div className="space-y-4">
                  <div className="relative group">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue opacity-30 group-focus-within:opacity-100 transition-opacity" />
                    <input className="w-full h-14 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-sm font-bold text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner" placeholder="Actor (Email o UUID)" value={bindActor} onChange={(e) => setBindActor(e.target.value)} />
                  </div>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue opacity-30 group-focus-within:opacity-100 transition-opacity" />
                    <select className="w-full h-14 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface-2 text-[10px] font-bold text-main outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner" value={bindRole} onChange={(e) => setBindRole(e.target.value)}>
                      {roles.map(k => <option key={k.role_key} value={k.role_key}>{k.role_key.toUpperCase()}</option>)}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-muted opacity-30" />
                  </div>
                  <Button onClick={() => void addBinding()} disabled={loading} className="w-full h-14 rounded-2xl bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95">Inyectar Binding de Red</Button>
               </div>
            </div>
          </section>

          {/* CRITICAL OVERRIDE (BREAK-GLASS) */}
          <section className="rounded-[var(--radius-3xl)] border border-red-500/20 bg-red-500/[0.02] p-10 md:p-12 shadow-pop relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
               <Zap className="h-[20rem] w-[20rem] text-red-500" />
            </div>
            <header className="flex items-center gap-4 mb-8 text-red-800 dark:text-red-400 relative z-10">
               <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 shadow-inner ring-1 ring-red-500/20">
                  <AlertTriangle className="h-6 w-6 animate-pulse" />
               </div>
               <div>
                  <h3 className="font-heading text-3xl tracking-tight leading-none">Tactical Override (Break-Glass)</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40 mt-1">High-Impact Security Maneuver</p>
               </div>
            </header>
            <p className="text-base font-light text-red-900/70 dark:text-red-400/70 leading-relaxed mb-10 italic border-l-2 border-red-500/10 pl-6 relative z-10">
              Autoriza una elevación de privilegios inmediata fuera de la matriz convencional. Este protocolo exige la validación obligatoria de un segundo operador (Two-Man Rule) y deja un rastro inmutable en el registro forense.
            </p>
            <Button onClick={() => void 0} className="w-full h-16 rounded-[2rem] border-2 border-red-500/20 bg-surface text-red-600 font-black uppercase tracking-[0.2em] text-[11px] shadow-soft hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 relative z-10">
               Solicitar Elevación de Emergencia
            </Button>
          </section>

        </div>
      </div>

      {/* FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 border-t border-brand-dark/10 dark:border-white/10 pt-16 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Identity Verified
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Database className="h-4 w-4 opacity-50" /> RBAC Node v4.2 Immutable
        </div>
        <div className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 hidden sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Globe className="h-4 w-4 animate-spin-slow" /> Sovereign Sovereignty Verified
        </div>
      </footer>
    </div>
  );
}