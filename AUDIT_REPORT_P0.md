# Auditoría rápida (P0 → listo para producción)

## ✅ Cambios aplicados en este update

1. **Middleware** (`src/middleware.ts`)

- i18n por prefijo (rewrite) + cookie `kce.locale`.
- BasicAuth sólido para `/admin` y `/api/admin` (incluye prefijos de idioma).
- Preflight `OPTIONS` para `/api/admin/*`.
- Headers de seguridad ligeros y coherentes con `next.config.ts`.
- `Cache-Control: no-store` para admin.

2. **Tickets Reply API**

- `POST /api/admin/tickets/[id]/reply` ahora **reabre** la conversación (`status='open'`,
  `closed_at=null`) cuando el agente responde.

3. **SQL alineado con el código**

- `supabase_schema.sql`: `conversations` alineado con columnas usadas por APIs
  (locale/status/updated_at).
- `uq_tickets_active_per_conversation` incluye `in_progress`.
- Nuevo patch: `supabase_patch_p35_tickets_active_index.sql`.

4. **SEO / seguridad de producción**

- `src/app/robots.ts` y `src/app/sitemap.ts` (sitemap simple multi-idioma).
- `ROBOTS_DISABLE_INDEXING=1` para preview/staging.
- `/admin` ahora tiene `metadata.robots = noindex`.
- Rutas de diagnóstico (`/_debug/*`) protegidas con BasicAuth y `/_debug/env` retorna 404 en
  producción.

5. **URL base robusta en Vercel**

- `SITE_URL` hace fallback a `VERCEL_URL` en server para evitar errores en preview cuando falta
  `NEXT_PUBLIC_SITE_URL`.

## Próximos pasos (para terminar rápido)

- Deploy en Vercel + configurar env vars.
- Supabase: schema + seed (o patches).
- Stripe: webhook configurado.
- Validar: `/api/health`, `/admin`, `/api/admin/tickets`.
