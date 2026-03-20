'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  ShieldCheck, Key, Users, Copy, Lock, 
  RefreshCw, Plus, Trash2, Download, 
  Fingerprint, ShieldAlert, Terminal, 
  Layers, Zap, Database, ShieldOff,
  UserCheck
} from 'lucide-react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';
import { Button } from '@/components/ui/Button';

// --- TYPES DE GOBERNANZA ---
type Role = { role_key: string; name: string; permissions: string[] };
type Binding = { actor: string; role_key: string; created_at?: string };
type TemplateInfo = { key: string; name: string; description: string; rolesCount: number };
type ApiList<T> = { ok: boolean; items: T[] };

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

  useEffect(() => { refresh(); }, [refresh]);

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
    { label: 'Definiciones', value: String(roles.length), note: 'Roles activos en DB.' },
    { label: 'Asignaciones', value: String(bindings.length), note: 'Actores con privilegios.' },
    { label: 'Frontera', value: showBootstrap ? 'BLOQUEADA' : 'NOMINAL', note: 'Estado de soberanía.' },
  ];

  return (
    <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* HEADER DE GOBERNANZA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[color:var(--color-border)] pb-10 px-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue/50">
            <Terminal className="h-3.5 w-3.5" /> Identity Lane: /rbac-vault
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-brand-blue leading-tight">
            Security & <span className="text-brand-yellow italic font-light">RBAC</span>
          </h1>
          <p className="mt-4 text-base text-[color:var(--color-text)]/50 font-light max-w-2xl italic">
            Monitor de privilegios y soberanía. Gestiona la frontera de acceso, define roles 
            y audita los bindings de operadores humanos y Agentes IA.
          </p>
        </div>
        <Button onClick={refresh} disabled={loading} variant="primary" className="h-12 px-8 rounded-2xl bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-transform">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar Nodo
        </Button>
      </header>

      <AdminOperatorWorkbench
        eyebrow="Identity Access Management"
        title="Gobernanza de Mínimos Privilegios"
        description="Asegura que cada nodo operativo tenga estrictamente lo necesario para funcionar. Evita el uso de 'Owner' para tareas de rutina."
        actions={[
          { href: '/admin/ops', label: 'Operations HQ', tone: 'primary' },
          { href: '/admin/audit', label: 'Logs de Auditoría' }
        ]}
        signals={signals}
      />

      {err && (
        <div className="mx-2 rounded-[2rem] border border-rose-500/20 bg-rose-500/5 p-6 flex items-center gap-4 text-rose-700 animate-in zoom-in-95">
          <ShieldAlert className="h-6 w-6 opacity-40" />
          <p className="text-sm font-medium">{err}</p>
        </div>
      )}

      {/* EMERGENCY BOOTSTRAP UI */}
      {showBootstrap && (
        <section className="rounded-[3.5rem] border-2 border-rose-500/20 bg-rose-500/[0.02] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 opacity-[0.03] group-hover:scale-110 transition-transform"><ShieldOff className="h-64 w-64 text-rose-500" /></div>
          <div className="relative z-10 space-y-6">
            <header className="space-y-2">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500 text-white text-[9px] font-bold uppercase tracking-widest animate-pulse">
                  Emergency Protocol Active
               </div>
               <h2 className="font-heading text-3xl text-rose-800">Inicialización de Soberanía</h2>
               <p className="max-w-2xl text-sm font-light text-rose-900/60 leading-relaxed italic">
                 El sistema está en modo <span className="font-mono font-bold">RBAC_REQUIRED</span> sin propietarios definidos. 
                 Inyecta la clave secreta de bootstrap para restaurar el acceso raíz.
               </p>
            </header>
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
              <input
                className="flex-1 h-14 px-6 rounded-2xl border-2 border-rose-500/10 bg-[color:var(--color-surface)] text-sm font-mono text-rose-600 outline-none focus:border-rose-500 transition-all shadow-inner"
                placeholder="SECURE_BOOTSTRAP_SECRET"
                value={bootstrapSecret}
                type="password"
                onChange={(e) => setBootstrapSecret(e.target.value)}
              />
              <Button onClick={bootstrapOwner} disabled={loading} className="h-14 px-8 rounded-2xl bg-rose-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg hover:bg-rose-700">
                <Key className="mr-2 h-4 w-4" /> Inyectar Owner
              </Button>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* COLUMNA 1: DEFINICIONES (ROLES & TEMPLATES) */}
        <div className="space-y-8">
          
          {/* TEMPLATES */}
          <section className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-10 shadow-2xl space-y-8">
            <header className="flex items-center gap-4 border-b border-[color:var(--color-border)] pb-6">
               <Download className="h-6 w-6 text-brand-blue" />
               <h2 className="font-heading text-2xl text-[color:var(--color-text)]">Templates de Misión</h2>
            </header>
            <div className="grid gap-4">
              {templates.map((t) => (
                <div key={t.key} className="group p-6 rounded-[2rem] border border-black/[0.03] bg-[color:var(--color-surface)] hover:border-brand-blue/20 transition-all flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-bold text-brand-blue text-sm uppercase tracking-tight">{t.name}</p>
                    <p className="text-[10px] font-mono text-[color:var(--color-text)]/40 uppercase tracking-widest">{t.rolesCount} Roles pre-definidos</p>
                  </div>
                  <Button onClick={() => applyTemplate(t.key)} disabled={loading} variant="outline" className="h-9 px-6 rounded-xl text-[9px] font-bold uppercase tracking-widest border-[color:var(--color-border)]">Instalar</Button>
                </div>
              ))}
            </div>
          </section>

          {/* LISTADO DE ROLES */}
          <section className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-10 shadow-2xl space-y-10">
            <header className="flex items-center justify-between border-b border-[color:var(--color-border)] pb-6">
               <div className="flex items-center gap-4">
                  <Layers className="h-6 w-6 text-brand-blue" />
                  <h2 className="font-heading text-2xl text-[color:var(--color-text)]">Matriz de Roles</h2>
               </div>
               <span className="text-[10px] font-mono font-bold text-brand-blue/40 uppercase">{roles.length} Definidos</span>
            </header>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {roles.map((r) => (
                <div key={r.role_key} className="p-6 rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm">
                  <p className="font-heading text-lg text-[color:var(--color-text)] mb-4 uppercase tracking-tighter">{r.role_key}</p>
                  <div className="flex flex-wrap gap-2">
                    {r.permissions.map(p => (
                      <span key={p} className="px-3 py-1 rounded-lg bg-[color:var(--color-surface-2)] border border-[color:var(--color-border)] text-[9px] font-mono font-bold text-brand-blue uppercase">{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-[color:var(--color-border)] space-y-4">
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/30 ml-2">Constructor de Roles</p>
               <div className="grid gap-3">
                  <input className="h-12 px-5 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-sm font-bold text-brand-blue outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all" placeholder="Role_Key (ej: tour_manager)" value={newRoleKey} onChange={(e) => setNewRoleKey(e.target.value)} />
                  <textarea className="p-5 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-xs font-mono outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all resize-none italic" placeholder="Permisos (separados por coma)..." value={newRolePerms} onChange={(e) => setNewRolePerms(e.target.value)} />
                  <Button onClick={createRole} disabled={loading} className="h-12 rounded-xl bg-brand-blue text-white font-bold uppercase tracking-widest text-[10px] shadow-lg">Guardar Definición</Button>
               </div>
            </div>
          </section>
        </div>

        {/* COLUMNA 2: ASIGNACIONES (BINDINGS & AUDIT) */}
        <div className="space-y-8">
          
          <section className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-10 shadow-2xl space-y-10 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 opacity-[0.02] rotate-12"><Users className="h-64 w-64" /></div>
            <header className="flex items-center justify-between border-b border-[color:var(--color-border)] pb-6 relative z-10">
               <div className="flex items-center gap-4">
                  <UserCheck className="h-6 w-6 text-brand-blue" />
                  <h2 className="font-heading text-2xl text-[color:var(--color-text)]">Control de Bindings</h2>
               </div>
               <span className="text-[10px] font-mono font-bold text-emerald-600/40 uppercase">{bindings.length} Enlaces</span>
            </header>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
              {bindings.map((b, idx) => (
                <div key={`${b.actor}-${b.role_key}-${idx}`} className="group p-5 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] transition-all hover:border-rose-500/20 flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <Fingerprint className="h-3 w-3 text-brand-blue opacity-30" />
                       <p className="font-bold text-[color:var(--color-text)] text-sm">{b.actor}</p>
                    </div>
                    <p className="text-[10px] font-mono font-bold text-brand-blue/60 uppercase tracking-widest">{b.role_key}</p>
                  </div>
                  <button onClick={() => delBinding(b.actor, b.role_key)} disabled={loading} className="h-9 w-9 rounded-xl flex items-center justify-center bg-rose-500/5 text-rose-600 hover:bg-rose-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-[color:var(--color-border)] space-y-6 relative z-10">
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text)]/30 ml-2">Nuevo Enlace de Privilegios</p>
               <div className="space-y-3">
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30" />
                    <input className="w-full h-12 pl-12 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-sm font-bold text-brand-blue outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all" placeholder="Actor (Email o ID)" value={bindActor} onChange={(e) => setBindActor(e.target.value)} />
                  </div>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                    <select className="w-full h-12 pl-12 pr-6 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[10px] font-bold text-brand-blue outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-brand-blue/5 transition-all" value={bindRole} onChange={(e) => setBindRole(e.target.value)}>
                      {roles.map(k => <option key={k.role_key} value={k.role_key}>{k.role_key.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <Button onClick={addBinding} disabled={loading} variant="primary" className="w-full h-12 rounded-xl text-white font-bold uppercase tracking-widest text-[10px] shadow-lg">Inyectar Binding</Button>
               </div>
            </div>
          </section>

          {/* BREAK-GLASS PROTOCOL */}
          <section className="rounded-[3rem] border border-amber-500/20 bg-amber-500/[0.03] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:scale-110 transition-transform"><Zap className="h-40 w-40 text-amber-500" /></div>
            <header className="flex items-center gap-3 mb-6 text-amber-800">
               <ShieldAlert className="h-6 w-6" />
               <h3 className="font-heading text-2xl tracking-tighter">Emergency Break-Glass</h3>
            </header>
            <p className="text-xs font-light text-amber-900/70 leading-relaxed mb-8 italic">
              Autoriza una elevación de privilegios inmediata fuera de la matriz RBAC. 
              Este protocolo requiere aprobación obligatoria de un segundo operador (Two-Man Rule).
            </p>
            <Button onClick={() => void 0} variant="outline" className="w-full h-12 rounded-xl border-amber-500/30 text-amber-700 font-bold uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-white transition-all">Solicitar Elevación</Button>
          </section>

        </div>
      </div>

      <footer className="mt-12 flex items-center justify-center gap-12 border-t border-[color:var(--color-border)] pt-12 opacity-20 hover:opacity-50 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" /> High-Confidence Identity
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
          <Database className="h-3.5 w-3.5" /> RBAC Node v4.2
        </div>
      </footer>
    </div>
  );
}