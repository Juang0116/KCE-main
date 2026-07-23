'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Key,
  Users,
  Copy,
  Lock,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Fingerprint,
  ShieldAlert,
  Terminal,
  Layers,
  Zap,
  Database,
  ShieldOff,
  UserCheck,
  Hash,
  Cpu,
  ChevronRight,
  Shield,
  Globe,
  AlertTriangle,
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
    setLoading(true);
    setErr(null);
    try {
      const [r, b, t] = await Promise.all([
        adminFetch('/api/admin/rbac/roles'),
        adminFetch('/api/admin/rbac/bindings'),
        adminFetch('/api/admin/rbac/templates'),
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const createRole = async () => {
    const role_key = newRoleKey.trim();
    if (!role_key) return setErr('role_key_missing');
    const permissions = newRolePerms
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setLoading(true);
    try {
      await adminFetch('/api/admin/rbac/roles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role_key, name: role_key, permissions }),
      });
      setNewRoleKey('');
      await refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
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
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const delBinding = async (actor: string, role_key: string) => {
    setLoading(true);
    try {
      await adminFetch(
        `/api/admin/rbac/bindings?actor=${encodeURIComponent(actor)}&role_key=${encodeURIComponent(role_key)}`,
        { method: 'DELETE' },
      );
      await refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async (templateKey: string) => {
    setLoading(true);
    try {
      await adminFetch('/api/admin/rbac/templates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          template: templateKey,
          bindRole: 'owner',
          bindActor: bindActor.trim() || undefined,
        }),
      });
      await refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const signals = [
    { label: 'Definiciones', value: String(roles.length), note: 'Roles Activos' },
    { label: 'Identidades', value: String(bindings.length), note: 'Actores Vinculados' },
    { label: 'Sovereignty', value: showBootstrap ? 'REQUIRED' : 'NOMINAL', note: 'Access Status' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-32 duration-1000">
      {/* 01. CABECERA TÁCTICA */}
      <header className="flex flex-col justify-between gap-8 border-b border-brand-dark/5 px-2 pb-10 dark:border-white/5 md:flex-row md:items-end">
        <div className="space-y-4">
          <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
            <Terminal className="h-4 w-4" /> Identity Lane: /rbac-vault-node
          </div>
          <h1 className="font-heading text-4xl leading-none tracking-tighter text-main md:text-7xl">
            Privilege <span className="font-light italic text-brand-yellow">Governance</span>
          </h1>
          <p className="mt-2 max-w-2xl text-base font-light italic leading-relaxed text-muted">
            Monitor de privilegios y soberanía para Knowing Cultures S.A.S. Define la frontera de
            acceso y audita los vínculos de operadores y Agentes IA.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => void refresh()}
            disabled={loading}
            variant="outline"
            className="h-12 rounded-full border-brand-dark/10 px-8 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-surface-2"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin text-brand-blue' : ''}`}
            />{' '}
            Sincronizar Bóveda
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
          { href: '/admin/events', label: 'Logs de Auditoría' },
        ]}
        signals={signals}
      />

      {err && !showBootstrap && (
        <div className="animate-in slide-in-from-top-2 mx-2 flex items-center gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-6 font-bold text-red-700 shadow-sm dark:bg-red-950/10 dark:text-red-400">
          <ShieldAlert className="h-6 w-6 opacity-60" />
          <p className="text-sm">
            Protocolo de Error: <span className="font-light">{err}</span>
          </p>
        </div>
      )}

      {/* 03. EMERGENCY BOOTSTRAP UI (MODO SOBERANO) */}
      {showBootstrap && (
        <section className="group relative overflow-hidden rounded-[3rem] border-2 border-red-500/30 bg-red-500/[0.03] p-10 shadow-pop md:p-14">
          <div className="pointer-events-none absolute -right-10 -top-10 opacity-[0.03] transition-transform group-hover:scale-110">
            <ShieldOff className="h-64 w-64 text-red-500" />
          </div>
          <div className="relative z-10 space-y-8">
            <header className="space-y-4">
              <div className="inline-flex animate-pulse items-center gap-3 rounded-full bg-red-600 px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-lg">
                <Zap className="h-4 w-4 fill-current" /> Emergency Bootstrap Active
              </div>
              <h2 className="font-heading text-4xl tracking-tight text-red-800 dark:text-red-400">
                Inicialización de Soberanía
              </h2>
              <p className="max-w-2xl border-l-2 border-red-500/20 pl-8 text-lg font-light italic leading-relaxed text-red-900/60 dark:text-red-400/60">
                El sistema ha detectado ausencia de propietarios raíz (
                <span className="font-mono font-bold">RBAC_REQUIRED</span>). Inyecta la clave
                secreta maestra para restaurar la jerarquía de mando.
              </p>
            </header>
            <div className="flex max-w-3xl flex-col gap-5 sm:flex-row">
              <div className="relative flex-1">
                <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-red-500 opacity-40" />
                <input
                  className="h-16 w-full rounded-2xl border-2 border-red-500/10 bg-surface pl-14 pr-6 font-mono text-base text-red-600 shadow-inner outline-none transition-all placeholder:text-red-900/20 focus:border-red-500"
                  placeholder="ENTER_SECURE_ROOT_SECRET"
                  value={bootstrapSecret}
                  type="password"
                  onChange={(e) => setBootstrapSecret(e.target.value)}
                />
              </div>
              <Button
                onClick={() => void bootstrapOwner()}
                disabled={loading}
                className="h-16 rounded-2xl bg-red-600 px-10 text-xs font-black uppercase tracking-[0.2em] text-white shadow-pop transition-all hover:bg-red-700 active:scale-95"
              >
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
          <section className="relative space-y-10 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5">
            <header className="flex items-center gap-4 border-b border-brand-dark/5 pb-8 dark:border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-3xl uppercase tracking-tight text-main">
                  Protocolos de Misión
                </h2>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40">
                  Preset Role Templates
                </p>
              </div>
            </header>
            <div className="grid gap-4">
              {templates.map((t) => (
                <div
                  key={t.key}
                  className="bg-surface-2/30 group flex items-center justify-between rounded-[2rem] border border-brand-dark/5 p-6 shadow-sm transition-all hover:border-brand-blue/30 hover:bg-surface-2"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold uppercase tracking-tight text-main">{t.name}</p>
                    <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                      <Hash className="h-3 w-3 opacity-40" /> {t.rolesCount} Roles pre-definidos
                    </p>
                  </div>
                  <Button
                    onClick={() => void applyTemplate(t.key)}
                    disabled={loading}
                    variant="outline"
                    className="h-10 rounded-xl border-brand-dark/10 bg-surface px-6 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-brand-dark hover:text-brand-yellow"
                  >
                    Instalar
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* LISTADO DE ROLES (ACCESS MATRIX) */}
          <section className="space-y-10 rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5">
            <header className="flex items-center justify-between border-b border-brand-dark/5 pb-8 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                  <Layers className="h-6 w-6" />
                </div>
                <h2 className="font-heading text-3xl uppercase tracking-tight text-main">
                  Matriz de Roles
                </h2>
              </div>
              <span className="rounded-lg border border-brand-dark/5 bg-surface-2 px-3 py-1 font-mono text-[10px] font-bold uppercase text-brand-blue">
                {roles.length} Definidos
              </span>
            </header>

            <div className="custom-scrollbar max-h-[500px] space-y-6 overflow-y-auto pr-3">
              {roles.map((r) => (
                <div
                  key={r.role_key}
                  className="bg-surface-2/30 group/role relative rounded-[2.5rem] border border-brand-dark/5 p-8 shadow-inner"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <p className="font-heading text-2xl uppercase tracking-tighter text-main">
                      {r.role_key}
                    </p>
                    <div className="h-2 w-2 rounded-full bg-brand-blue/40" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.permissions.map((p) => (
                      <span
                        key={p}
                        className="cursor-default rounded-lg border border-brand-dark/10 bg-surface px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-tighter text-brand-blue transition-transform hover:scale-105"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6 border-t border-brand-dark/5 pt-10">
              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                <Plus className="h-4 w-4" /> Constructor de Roles
              </div>
              <div className="grid gap-4">
                <div className="group relative">
                  <Cpu className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-blue opacity-30 transition-opacity group-focus-within:opacity-100" />
                  <input
                    className="h-14 w-full rounded-2xl border border-brand-dark/10 bg-surface-2 pl-12 pr-6 text-sm font-bold text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                    placeholder="Role_Key (ej: tour_manager)"
                    value={newRoleKey}
                    onChange={(e) => setNewRoleKey(e.target.value)}
                  />
                </div>
                <textarea
                  className="custom-scrollbar h-32 w-full resize-none rounded-[2rem] border border-brand-dark/10 bg-surface-2 p-6 font-mono text-[11px] italic leading-relaxed text-brand-blue shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                  placeholder="Lista de permisos (metrics_view, tours_edit...)"
                  value={newRolePerms}
                  onChange={(e) => setNewRolePerms(e.target.value)}
                />
                <Button
                  onClick={() => void createRole()}
                  disabled={loading}
                  className="h-14 w-full rounded-2xl bg-brand-dark text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95"
                >
                  Guardar Definición
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* COLUMNA 2: ASIGNACIONES (IDENTITY LINKS & OVERRIDE) */}
        <div className="space-y-10">
          <section className="group relative space-y-10 overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5 md:p-12">
            <div className="pointer-events-none absolute -right-10 -top-10 opacity-[0.02] transition-transform duration-1000 group-hover:scale-110">
              <Users className="h-64 w-64 text-brand-blue" />
            </div>

            <header className="relative z-10 flex items-center justify-between border-b border-brand-dark/5 pb-8 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue shadow-inner">
                  <UserCheck className="h-6 w-6" />
                </div>
                <h2 className="font-heading text-3xl uppercase leading-none tracking-tight text-main">
                  Identity Bindings
                </h2>
              </div>
              <span className="rounded-lg border border-green-500/10 bg-green-500/5 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-green-600">
                {bindings.length} Activos
              </span>
            </header>

            <div className="custom-scrollbar relative z-10 max-h-[600px] space-y-4 overflow-y-auto pr-3">
              {bindings.map((b, idx) => (
                <div
                  key={`${b.actor}-${b.role_key}-${idx}`}
                  className="group/binding bg-surface-2/30 flex items-center justify-between rounded-[2rem] border border-brand-dark/5 p-6 shadow-sm transition-all hover:border-red-500/20 hover:bg-surface-2"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-dark/5 bg-surface text-brand-blue opacity-50 shadow-inner transition-opacity group-hover/binding:opacity-100">
                      <Fingerprint className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold tracking-tight text-main">{b.actor}</p>
                      <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/60">
                        {b.role_key}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => void delBinding(b.actor, b.role_key)}
                    disabled={loading}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/5 text-red-600 opacity-0 shadow-sm transition-all hover:bg-red-600 hover:text-white active:scale-90 group-hover/binding:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="relative z-10 space-y-8 border-t border-brand-dark/5 pt-10">
              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-muted opacity-40">
                <Plus className="h-4 w-4" /> Inyector de Privilegios
              </div>
              <div className="space-y-4">
                <div className="group relative">
                  <Users className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-blue opacity-30 transition-opacity group-focus-within:opacity-100" />
                  <input
                    className="h-14 w-full rounded-2xl border border-brand-dark/10 bg-surface-2 pl-12 pr-6 text-sm font-bold text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                    placeholder="Actor (Email o UUID)"
                    value={bindActor}
                    onChange={(e) => setBindActor(e.target.value)}
                  />
                </div>
                <div className="group relative">
                  <ShieldCheck className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-blue opacity-30 transition-opacity group-focus-within:opacity-100" />
                  <select
                    className="h-14 w-full cursor-pointer appearance-none rounded-2xl border border-brand-dark/10 bg-surface-2 pl-12 pr-6 text-[10px] font-bold text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
                    value={bindRole}
                    onChange={(e) => setBindRole(e.target.value)}
                  >
                    {roles.map((k) => (
                      <option
                        key={k.role_key}
                        value={k.role_key}
                      >
                        {k.role_key.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted opacity-30" />
                </div>
                <Button
                  onClick={() => void addBinding()}
                  disabled={loading}
                  className="h-14 w-full rounded-2xl bg-brand-dark text-[10px] font-bold uppercase tracking-widest text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95"
                >
                  Inyectar Binding de Red
                </Button>
              </div>
            </div>
          </section>

          {/* CRITICAL OVERRIDE (BREAK-GLASS) */}
          <section className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-red-500/20 bg-red-500/[0.02] p-10 shadow-pop md:p-12">
            <div className="pointer-events-none absolute -right-8 -top-8 opacity-[0.03] transition-transform group-hover:scale-110">
              <Zap className="h-[20rem] w-[20rem] text-red-500" />
            </div>
            <header className="relative z-10 mb-8 flex items-center gap-4 text-red-800 dark:text-red-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 shadow-inner ring-1 ring-red-500/20">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-heading text-3xl leading-none tracking-tight">
                  Tactical Override (Break-Glass)
                </h3>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
                  High-Impact Security Maneuver
                </p>
              </div>
            </header>
            <p className="relative z-10 mb-10 border-l-2 border-red-500/10 pl-6 text-base font-light italic leading-relaxed text-red-900/70 dark:text-red-400/70">
              Autoriza una elevación de privilegios inmediata fuera de la matriz convencional. Este
              protocolo exige la validación obligatoria de un segundo operador (Two-Man Rule) y deja
              un rastro inmutable en el registro forense.
            </p>
            <Button
              onClick={() => void 0}
              className="relative z-10 h-16 w-full rounded-[2rem] border-2 border-red-500/20 bg-surface text-[11px] font-black uppercase tracking-[0.2em] text-red-600 shadow-soft transition-all hover:border-red-600 hover:bg-red-600 hover:text-white active:scale-95"
            >
              Solicitar Elevación de Emergencia
            </Button>
          </section>
        </div>
      </div>

      {/* FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-12 border-t border-brand-dark/10 pt-16 opacity-40 transition-opacity duration-500 hover:opacity-100 dark:border-white/10 sm:flex-row">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-blue" /> High-Confidence Identity Verified
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-muted">
          <Database className="h-4 w-4 opacity-50" /> RBAC Node v4.2 Immutable
        </div>
        <div className="hidden h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20 sm:block" />
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-yellow">
          <Globe className="animate-spin-slow h-4 w-4" /> Sovereign Sovereignty Verified
        </div>
      </footer>
    </div>
  );
}
