# P71 — Release Gates (Operativo)

Este documento define **cómo validar que KCE está “release-ready”** con un criterio operativo (no “features bonitas”).

## Qué es P71

P71 agrega 3 cosas:

1) **Admin → /admin/system**: health checks (env, Supabase, colas, pagos recientes).
2) **Endpoint** `GET /api/admin/system/status?deep=0|1` (admin-only) que consolida gates.
3) **Scripts** para gatear releases:

- `npm run env:parity` — evita drift entre `.env.example` y `src/lib/env.ts`.
- `npm run verify:e2e` — check remoto rápido vía `/api/admin/system/status`.
- `npm run qa:p71` — gate completo: parity + CI + smoke + remoto (si `BASE_URL`).

## Uso (local)

1) Instala deps

```bash
npm i
```

2) Corre gates

```bash
npm run qa:p71
```

**Definition of done (local):** `PASS ✅`.

## Uso (preview / producción)

Requiere credenciales de admin para llamar el gate remoto.

### Opción A — Basic Auth

```bash
BASE_URL=https://TU-DOMINIO.com \
ADMIN_BASIC_USER=... \
ADMIN_BASIC_PASS=... \
npm run qa:p71
```

### Opción B — Admin token (si lo usas)

```bash
BASE_URL=https://TU-DOMINIO.com \
ADMIN_TOKEN=... \
npm run qa:p71
```

## Qué valida `/admin/system`

### Shallow

- Env mínimo presente (Supabase/Stripe/Resend/link token, etc.)
- Ping Supabase (tabla `events`)
- Colas: `crm_outbound_messages` queued
- “último pago” (evento `checkout.paid` si existe)

### Deep (opcional)

- Stripe: `balance.retrieve()` con timeout
- Resend: `domains.list()` con timeout

> Deep puede fallar por permisos/plan/red sin que el sistema esté roto. Úsalo como *signal*, no como “bloqueo absoluto”, salvo que tú lo decidas.

## Checklist final antes de “release”

1) `npm run env:parity` pasa ✅
2) `npm run qa:ci` pasa ✅
3) `npm run qa:smoke` pasa ✅
4) `BASE_URL=... npm run verify:e2e` pasa ✅
5) En `/admin/system` ves:
   - DB OK
   - colas controladas
   - pagos/eventos entrando

---

Si quieres, el siguiente paso (P72) lo hacemos ya con **observabilidad tipo “SRE-lite”**:
- panel de incidentes con runbooks accionables
- alertas (Slack/email) por umbrales
- “automatic mitigation” con playbooks (rate-limit tighten, pause channels, etc.)
