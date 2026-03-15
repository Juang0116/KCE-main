'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Key, Users, Copy, Lock, RefreshCw, Plus, Trash2, Download } from 'lucide-react';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';

type Role = { role_key: string; name: string; permissions: string[] };
type Binding = { actor: string; role_key: string; created_at?: string };
type TemplateInfo = { key: string; name: string; description: string; rolesCount: number };
type ApiList<T> = { ok: boolean; items: T[] };
type ApiItem<T> = { ok: boolean; item: T };

async function adminJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await adminFetch(path, init);
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(String(json?.error || json?.message || `Request failed (${res.status})`));
  }
  return json as T;
}

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

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await adminJson<ApiList<Role>>('/api/admin/rbac/roles');
      const b = await adminJson<ApiList<Binding>>('/api/admin/rbac/bindings');
      const t = await adminJson<ApiList<TemplateInfo>>('/api/admin/rbac/templates');
      setRoles(r.items || []);
      setBindings(b.items || []);
      setTemplates(t.items || []);
      setShowBootstrap(false);
    } catch (e: any) {
      const msg = String(e?.message || 'Error');
      setErr(msg);
      if (msg.includes('RBAC_REQUIRED') || msg.toLowerCase().includes('rbac')) {
        setShowBootstrap(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleKeys = useMemo(() => roles.map((r) => r.role_key), [roles]);

  const bootstrapOwner = async () => {
    setErr(null);
    if (!bootstrapSecret.trim()) {
      setErr('RBAC_BOOTSTRAP_SECRET requerido para bootstrapping.');
      return;
    }
    setLoading(true);
    try {
      await adminJson<ApiItem<any>>('/api/admin/rbac/bootstrap', {
        method: 'POST',
        headers: { 'x-rbac-bootstrap-secret': bootstrapSecret.trim() },
      });
      setBootstrapSecret('');
      await refresh();
    } catch(e: any) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  const createRole = async () => {
    setErr(null);
    const role_key = newRoleKey.trim();
    if (!role_key) return setErr('role_key requerido');
    const permissions = newRolePerms.split(',').map((s) => s.trim()).filter(Boolean);
    
    setLoading(true);
    try {
      await adminJson<ApiItem<Role>>('/api/admin/rbac/roles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role_key, name: role_key, permissions }),
      });
      setNewRoleKey('');
      await refresh();
    } catch(e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const addBinding = async () => {
    setErr(null);
    setLoading(true);
    try {
      await adminJson<ApiItem<Binding>>('/api/admin/rbac/bindings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ actor: bindActor.trim(), role_key: bindRole.trim() }),
      });
      await refresh();
    } catch(e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const delBinding = async (actor: string, role_key: string) => {
    setErr(null);
    setLoading(true);
    try {
      await adminJson<ApiItem<any>>(`/api/admin/rbac/bindings?actor=${encodeURIComponent(actor)}&role_key=${encodeURIComponent(role_key)}`, { method: 'DELETE' });
      await refresh();
    } catch(e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const requestBreakglass = async () => {
    setErr(null);
    setLoading(true);
    try {
      const payload = { actor: bindActor.trim(), reason: 'Ops emergency', ttlMinutes: 30 };
      const r = await adminJson<any>('/api/admin/rbac/breakglass/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      alert(r?.token?.token ? `Breakglass token: ${r.token.token}` : 'Breakglass request created (approval pending).');
      await refresh();
    } catch(e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const applyTemplate = async (templateKey: string, bindRoleKey = 'owner') => {
    setErr(null);
    setLoading(true);
    try {
      await adminJson<any>('/api/admin/rbac/templates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ template: templateKey, bindRole: bindRoleKey, bindActor: bindActor.trim() || undefined }),
      });
      await refresh();
    } catch(e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  const rbacSignals = [
    { label: 'Roles Activos', value: String(roles.length), note: 'Configuraciones de permisos en base de datos.' },
    { label: 'Bindings', value: String(bindings.length), note: 'Actores asignados a roles específicos.' },
    { label: 'Estado', value: showBootstrap ? 'Desactivado' : 'Protegido', note: 'Estado actual del middleware RBAC.' },
  ];

  return (
    <div className="space-y-10 pb-20">
      
      {/* Cabecera Ejecutiva */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-brand-blue">Security & RBAC</h1>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Control de accesos basados en roles, bindings y permisos de sistema.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refresh} disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 disabled:opacity-50 shadow-md">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Sincronizando...' : 'Sync'}
          </button>
        </div>
      </div>

      <AdminOperatorWorkbench
        eyebrow="identity access management"
        title="Protege la Frontera del Panel"
        description="Asegúrate de que cada operador o Agente IA tenga estrictamente los permisos necesarios. Instala los templates por defecto si es un ambiente nuevo."
        actions={[
          { href: '/admin/ops', label: 'Centro de Operaciones', tone: 'primary' },
          { href: '/admin/audit', label: 'Ver Logs de Auditoría' }
        ]}
        signals={rbacSignals}
      />

      {err && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-700">{err}</div>}

      {/* BOOTSTRAP UI (Si el sistema está bloqueado) */}
      {showBootstrap && (
        <div className="rounded-3xl border-2 border-rose-500/30 bg-rose-500/10 p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10"><ShieldCheck className="h-32 w-32 text-rose-600" /></div>
          <div className="relative z-10">
            <h2 className="font-heading text-2xl text-rose-800">Inicialización Requerida</h2>
            <p className="mt-2 text-sm text-rose-700/80 font-light max-w-2xl">
              El sistema ha detectado <code>RBAC_REQUIRED=1</code> pero no tienes roles asignados. Para evitar quedarte bloqueado, inyecta la clave secreta de bootstrap para crearte un rol de <strong>owner</strong> temporalmente.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 max-w-xl">
              <input
                className="flex-1 rounded-xl border border-rose-500/30 bg-white/50 px-4 py-3 text-sm outline-none focus:border-rose-500 font-mono placeholder:font-sans"
                placeholder="RBAC_BOOTSTRAP_SECRET (Ver env.local)"
                value={bootstrapSecret}
                onChange={(e) => setBootstrapSecret(e.target.value)}
              />
              <button disabled={loading} onClick={bootstrapOwner} className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-rose-700 shadow-md disabled:opacity-50">
                <Key className="h-4 w-4"/> Inyectar Owner
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* 1. TEMPLATES Y ROLES */}
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Download className="h-6 w-6 text-brand-blue" />
              <h2 className="font-heading text-2xl text-[var(--color-text)]">Templates</h2>
            </div>
            <p className="text-sm text-[var(--color-text)]/60 font-light mb-6">Instala las configuraciones recomendadas para Operadores, Ventas, Soporte y Owners (P3).</p>
            <div className="space-y-3">
              {templates.length === 0 ? <div className="text-sm text-[var(--color-text)]/40 italic">No hay templates disponibles.</div> : null}
              {templates.map((t) => (
                <div key={t.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 transition-colors hover:border-brand-blue/30">
                  <div>
                    <div className="font-semibold text-brand-blue">{t.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-[var(--color-text)]/50 mt-1">{t.rolesCount} roles incluidos</div>
                  </div>
                  <button disabled={loading} onClick={() => applyTemplate(t.key, 'owner')} className="shrink-0 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)] transition hover:bg-brand-blue/5 hover:text-brand-blue disabled:opacity-50">
                    Instalar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-brand-blue" />
                <h2 className="font-heading text-2xl text-[var(--color-text)]">Roles</h2>
              </div>
              <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-[10px] font-bold text-brand-blue">{roles.length} Activos</span>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto mb-6 pr-2">
              {roles.length === 0 ? <div className="text-sm text-[var(--color-text)]/40 italic">Aún no hay roles.</div> : null}
              {roles.map((r) => (
                <div key={r.role_key} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
                  <div className="font-semibold text-[var(--color-text)] mb-2">{r.role_key}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(r.permissions || []).map(p => (
                      <span key={p} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[9px] font-mono uppercase text-[var(--color-text)]/70">{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--color-border)] pt-6 mt-6">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-4">Crear / Actualizar Rol</div>
              <div className="space-y-3">
                <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-sm outline-none focus:border-brand-blue" placeholder="Role Key (ej: sales_agent)" value={newRoleKey} onChange={(e) => setNewRoleKey(e.target.value)} />
                <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-sm outline-none focus:border-brand-blue" placeholder="Permisos separados por coma" value={newRolePerms} onChange={(e) => setNewRolePerms(e.target.value)} />
                <button disabled={loading} onClick={createRole} className="w-full rounded-xl bg-brand-dark px-4 py-3 text-xs font-bold uppercase tracking-widest text-brand-yellow transition hover:scale-105 shadow-sm disabled:opacity-50">
                  Guardar Rol
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. BINDINGS Y BREAKGLASS */}
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-brand-blue" />
                <h2 className="font-heading text-2xl text-[var(--color-text)]">Bindings</h2>
              </div>
              <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-[10px] font-bold text-brand-blue">{bindings.length} Asignados</span>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto mb-6 pr-2">
              {bindings.length === 0 ? <div className="text-sm text-[var(--color-text)]/40 italic">Aún no hay bindings.</div> : null}
              {bindings.map((b, idx) => (
                <div key={`${b.actor}-${b.role_key}-${idx}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 transition hover:border-rose-500/30">
                  <div>
                    <div className="font-semibold text-brand-blue">{b.actor}</div>
                    <div className="text-xs text-[var(--color-text)]/60 font-mono mt-1">{b.role_key}</div>
                  </div>
                  <button disabled={loading} onClick={() => delBinding(b.actor, b.role_key)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--color-border)] pt-6 mt-6">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 mb-4">Añadir Binding</div>
              <div className="space-y-3">
                <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-sm outline-none focus:border-brand-blue" placeholder="Actor (User Email o ID)" value={bindActor} onChange={(e) => setBindActor(e.target.value)} />
                <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 text-sm outline-none focus:border-brand-blue appearance-none cursor-pointer" value={bindRole} onChange={(e) => setBindRole(e.target.value)}>
                  {roleKeys.length > 0 ? roleKeys.map(k => <option key={k} value={k}>{k}</option>) : <option value="ops">ops</option>}
                </select>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button disabled={loading} onClick={addBinding} className="flex-1 rounded-xl bg-brand-blue px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shadow-sm disabled:opacity-50">
                    <Plus className="h-4 w-4 inline mr-1"/> Añadir Binding
                  </button>
                  <button disabled={loading} onClick={requestBreakglass} className="flex-1 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 text-center">
                    <Lock className="h-4 w-4 inline mr-1"/> Break-Glass
                  </button>
                </div>
                <p className="text-[10px] text-[var(--color-text)]/50 mt-2 text-center">
                  *Break-glass requiere aprobación Two-Man en la bandeja de Ops.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}