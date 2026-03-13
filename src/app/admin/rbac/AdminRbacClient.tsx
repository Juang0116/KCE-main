'use client';

import { adminFetch } from '@/lib/adminFetch.client';
import { useEffect, useMemo, useState } from 'react';

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

  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [showBootstrap, setShowBootstrap] = useState(false);

  const [newRoleKey, setNewRoleKey] = useState('');
  const [newRolePerms, setNewRolePerms] = useState('metrics_view,alerts_ack,ops_control');
  const [bindActor, setBindActor] = useState('admin');
  const [bindRole, setBindRole] = useState('ops');

  const refresh = async () => {
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
      // If RBAC is required (or permissions missing), surface bootstrap UI.
      if (msg.includes('RBAC_REQUIRED') || msg.toLowerCase().includes('rbac')) {
        setShowBootstrap(true);
      }
      throw e;
    }
  };

  useEffect(() => {
    refresh().catch(() => void 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleKeys = useMemo(() => roles.map((r) => r.role_key), [roles]);

  const bootstrapOwner = async () => {
    setErr(null);
    if (!bootstrapSecret.trim()) {
      setErr('RBAC_BOOTSTRAP_SECRET requerido para bootstrapping.');
      return;
    }
    await adminJson<ApiItem<any>>('/api/admin/rbac/bootstrap', {
      method: 'POST',
      headers: { 'x-rbac-bootstrap-secret': bootstrapSecret.trim() },
    });
    setBootstrapSecret('');
    await refresh();
  };

  const createRole = async () => {
    setErr(null);
    const role_key = newRoleKey.trim();
    if (!role_key) return setErr('role_key requerido');
    const permissions = newRolePerms
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await adminJson<ApiItem<Role>>('/api/admin/rbac/roles', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role_key, name: role_key, permissions }),
    });
    setNewRoleKey('');
    await refresh();
  };

  const addBinding = async () => {
    setErr(null);
    await adminJson<ApiItem<Binding>>('/api/admin/rbac/bindings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ actor: bindActor.trim(), role_key: bindRole.trim() }),
    });
    await refresh();
  };

  const delBinding = async (actor: string, role_key: string) => {
    setErr(null);
    await adminJson<ApiItem<any>>(
      '/api/admin/rbac/bindings?actor=' +
        encodeURIComponent(actor) +
        '&role_key=' +
        encodeURIComponent(role_key),
      {
      method: 'DELETE',
      },
    );
    await refresh();
  };

  const requestBreakglass = async () => {
    setErr(null);
    const payload = { actor: bindActor.trim(), reason: 'Ops emergency', ttlMinutes: 30 };
    const r = await adminJson<any>('/api/admin/rbac/breakglass/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    alert(r?.token?.token ? `Breakglass token: ${r.token.token}` : 'Breakglass request created (approval pending).');
    await refresh();
  };



  const applyTemplate = async (templateKey: string, bindRoleKey = 'owner') => {
    setErr(null);
    await adminJson<any>('/api/admin/rbac/templates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ template: templateKey, bindRole: bindRoleKey, bindActor: bindActor.trim() || undefined }),
    });
    await refresh();
  };
  return (
    <div className="space-y-6">
      {err ? <div className="rounded-xl border p-3 text-sm text-red-600">{err}</div> : null}

      {showBootstrap ? (
        <div className="rounded-2xl border p-4 space-y-2">
          <div className="font-semibold">RBAC no inicializado / sin permisos</div>
          <div className="text-sm opacity-80">
            Si activaste <code>RBAC_REQUIRED=1</code> o no tienes roles asignados, primero necesitas bootstrappear un rol owner para tu actor.
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
              placeholder="RBAC_BOOTSTRAP_SECRET"
              value={bootstrapSecret}
              onChange={(e) => setBootstrapSecret(e.target.value)}
            />
            <button className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5" onClick={() => bootstrapOwner().catch((e) => setErr(e.message))}>
              Bootstrap owner
            </button>
          </div>
          <div className="text-xs opacity-70">
            Esto llama <code>/api/admin/rbac/bootstrap</code> y crea el rol <code>owner</code> + binding para tu actor.
          </div>
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-4">
        

        <div className="rounded-2xl border p-4 space-y-3">
          <h2 className="font-semibold">Templates</h2>
          <div className="text-sm opacity-70">Instala un set recomendado de roles/permisos para KCE (P3).</div>
          <div className="space-y-2">
            {templates.length === 0 ? <div className="text-sm opacity-70">No templates.</div> : null}
            {templates.map((t) => (
              <div key={t.key} className="rounded-xl border p-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs opacity-70">{t.description} · {t.rolesCount} roles</div>
                  </div>
                  <button
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5"
                    onClick={() => applyTemplate(t.key, 'owner').catch((e) => setErr(e.message))}
                  >
                    Install
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs opacity-70">
            Tip: deja <span className="font-mono">bindActor</span> como tu usuario admin y así te asigna <span className="font-mono">owner</span> automáticamente.
          </div>
        </div>

<div className="rounded-2xl border p-4 space-y-3">
          <h2 className="font-semibold">Roles</h2>
          <div className="space-y-2 text-sm">
            {roles.length === 0 ? <div className="opacity-70">No roles yet.</div> : null}
            {roles.map((r) => (
              <div key={r.role_key} className="rounded-xl border p-2">
                <div className="font-medium">{r.role_key}</div>
                <div className="opacity-70 break-words">{(r.permissions || []).join(', ')}</div>
              </div>
            ))}
          </div>

          <div className="pt-2 space-y-2">
            <div className="text-sm font-medium">Crear/actualizar role</div>
            <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="role_key (ej: ops)" value={newRoleKey} onChange={(e) => setNewRoleKey(e.target.value)} />
            <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="permissions (csv)" value={newRolePerms} onChange={(e) => setNewRolePerms(e.target.value)} />
            <button className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5" onClick={() => createRole().catch((e) => setErr(e.message))}>
              Guardar role
            </button>
          </div>
        </div>

        <div className="rounded-2xl border p-4 space-y-3">
          <h2 className="font-semibold">Bindings</h2>
          <div className="space-y-2 text-sm">
            {bindings.length === 0 ? <div className="opacity-70">No bindings yet.</div> : null}
            {bindings.map((b, idx) => (
              <div key={`${b.actor}-${b.role_key}-${idx}`} className="flex items-center justify-between rounded-xl border p-2">
                <div>
                  <div className="font-medium">{b.actor}</div>
                  <div className="opacity-70">{b.role_key}</div>
                </div>
                <button className="rounded-lg border px-2 py-1 text-xs hover:bg-black/5" onClick={() => delBinding(b.actor, b.role_key).catch((e) => setErr(e.message))}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 space-y-2">
            <div className="text-sm font-medium">Agregar binding</div>
            <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="actor (admin user)" value={bindActor} onChange={(e) => setBindActor(e.target.value)} />
            <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder={`role_key (ej: ${roleKeys[0] || 'ops'})`} value={bindRole} onChange={(e) => setBindRole(e.target.value)} />
            <div className="flex gap-2">
              <button className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5" onClick={() => addBinding().catch((e) => setErr(e.message))}>
                Add
              </button>
              <button className="rounded-lg border px-3 py-2 text-sm hover:bg-black/5" onClick={() => requestBreakglass().catch((e) => setErr(e.message))}>
                Issue break-glass
              </button>
            </div>
            <div className="text-xs opacity-70">
              Si Two-man rule está activo, break-glass puede quedar pendiente y aparecer en /admin/ops → approvals.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
