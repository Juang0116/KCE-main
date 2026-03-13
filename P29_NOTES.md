# P29 — RBAC admin UI + strict coverage + break-glass via UI (Two-man compatible)

Fecha: 2026-02-15

## Objetivo
- Extender enforcement RBAC a más rutas admin (superficie /api/admin).
- Añadir UI para gestionar roles y bindings sin SQL manual.
- Emitir break-glass desde UI y respetar Two-man rule (approval flow).

## Pasos
1. Ejecutar `supabase_patch_p60_rbac_admin_ui.sql` en Supabase.
2. Deploy.
3. Ir a `/admin/rbac` para gestionar roles/bindings.
4. Si activas RBAC estricto: `OPS_RBAC_REQUIRED=true`, asegúrate de bindear roles.

## Seguridad
- Break-glass issuance queda auditado.
- Si Two-man rule está activo, se crea un approval antes de emitir el token.
