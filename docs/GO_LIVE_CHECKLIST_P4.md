# KCE — Go‑Live Checklist (P4)

Este checklist es para cerrar "security + RBAC + panel consistente" antes de activar **RBAC_REQUIRED=1** en producción.

## 0) Pre‑requisitos
- Build pasa: `npm run build`
- QA gate pasa (si aplica): `npm run qa` / `npm run qa:smoke`
- `.env.local` NO está trackeado (`git ls-files .env.local` no devuelve nada)

## 1) Secrets / env
- `ADMIN_TOKEN` configurado en Vercel (prod) y funciona para /admin
- `SIGNED_ACTIONS_SECRET` configurado
- `SIGNED_ACTIONS_MODE=soft` (24–48h) → luego `required`
- `RBAC_BOOTSTRAP_SECRET` configurado

## 2) RBAC (P4)
- Crear roles en `/admin/rbac` (al menos `owner`, `ops_admin`, `crm_agent`, `content_editor`)
- Asignar actor (tu usuario admin) al role `owner` (o equivalente)
- Activar enforcement:
  - `RBAC_REQUIRED=1` (prod)
  - Verificar que los endpoints /api/admin bloquean correctamente si faltan permisos

## 3) Signed Actions
- Con `SIGNED_ACTIONS_MODE=soft`, revisar logs de eventos: qué rutas mutan y si están pidiendo/recibiendo firmas
- Luego cambiar a `SIGNED_ACTIONS_MODE=required` y validar:
  - Create/update/delete en CRM
  - Ops actions (breakglass, backups, circuit breaker)

## 4) Exports
- Verificar que export endpoints responden y tienen límites:
  - `.../customers/export?limit=2000`
  - `.../leads/export?limit=2000`
  - `.../deals/export?limit=2000`
  - `.../tasks/export?limit=2000`
  - `.../audit/export?limit=2000`
- Probar rate limit: múltiples exports seguidos → debe retornar 429 en exceso

## 5) UI consistencia
- El menú admin debe ocultar módulos sin permisos
- El dashboard `/admin` solo muestra cards permitidas

## 6) Rollout recomendado
1) `SIGNED_ACTIONS_MODE=soft`, `RBAC_REQUIRED=0` por 1–2 días en prod
2) `RBAC_REQUIRED=1` (observa 403 por permisos)
3) `SIGNED_ACTIONS_MODE=required`

