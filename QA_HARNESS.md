# QA Harness (P4.6)

Este módulo agrega una pantalla interna **/admin/qa** que ejecuta _smoke tests_ guiados para
verificar que:

1. Las variables de entorno mínimas están cargadas.
2. Supabase (service-role) puede leer/escribir.
3. Storage es accesible y buckets esperados existen.
4. Stripe tiene credenciales con formato válido (y opcionalmente valida por red).

## URLs

- **UI:** `/admin/qa`
- **API:** `GET /api/admin/qa/run?deep=0|1`

## Qué hace el endpoint

El endpoint devuelve JSON con:

- `ok` (todos los checks PASS)
- `checks[]` con `id`, `label`, `ok`, `ms`, `detail`
- `summary.passed/failed`

Por defecto **NO llama Stripe por red**. Si pasas `deep=1`, hace una llamada ligera a
`stripe.accounts.retrieve()`.

## Flujo recomendado antes de testeos masivos

1. Abre `http://localhost:3000/api/health`.
2. Abre `http://localhost:3000/admin/qa` y ejecuta checks.
3. Corrige env/keys si algún check falla.
4. Inicia los testeos funcionales (checkout/webhook/email/reviews/bot) usando `QA_CHECKLIST.md`.

## Seguridad

- El endpoint está bajo `/api/admin/*` y hereda la protección existente (Basic Auth / middleware).
- No devuelve secretos. Solo booleanos y mensajes de error.

## Production preflight (recommended before deploy)

En **/admin/qa**, activa **Production preflight** para ejecutar validaciones más estrictas (por
ejemplo: `NEXT_PUBLIC_SITE_URL` debe ser https y no localhost, `STRIPE_WEBHOOK_SECRET` requerido,
CORS allowlist debe incluir el origin del sitio, etc.).

También puedes llamar directo:

- `GET /api/admin/qa/run?mode=prod&deep=1`
