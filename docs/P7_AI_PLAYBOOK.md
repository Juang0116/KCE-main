# P7 — IA Playbook (consistencia + “auto‑aprendizaje” seguro)

Este paso agrega un **Playbook de IA**: snippets curados (FAQ, políticas, tono, reglas) que **un administrador aprueba** y que el endpoint `/api/ai` inyecta en el *system prompt*.

La idea es lograr:

- **Consistencia de marca**: respuestas alineadas con reglas de KCE.
- **Seguridad**: no “auto‑entrenamos” el modelo. Solo usamos contenido aprobado por humanos.
- **Evolución**: a medida que aprendes, agregas snippets → la IA mejora automáticamente.

## 1) Aplicar el patch SQL

En Supabase SQL Editor ejecuta:

- `supabase_patch_p70_ai_playbook.sql`

Esto crea:

- `public.ai_playbook_snippets` (snippets aprobados)
- `public.ai_insights` (opcional; reservado para un paso futuro de “insights”)

> Por diseño, **NO** se añaden policies permisivas. Los endpoints admin usan `SUPABASE_SERVICE_ROLE_KEY`.

## 2) Endpoints nuevos (Admin)

- `GET /api/admin/ai/playbook/snippets` (lista)
- `POST /api/admin/ai/playbook/snippets` (crear)
- `PATCH /api/admin/ai/playbook/snippets/:id` (editar / activar/desactivar)
- `DELETE /api/admin/ai/playbook/snippets/:id` (borrar)

Requieren RBAC:

- Ver: `system_view`
- Crear/editar/borrar: `system_admin`

## 3) UI nueva (Admin)

- `.../admin/ai/playbook`

Desde `.../admin/ai` hay un botón “Abrir IA Playbook”.

## 4) Cómo se usa en `/api/ai`

En cada llamada:

1) Se construye el system prompt normal (catálogo, tono, etc.).
2) Se cargan hasta 12 snippets habilitados.
3) Se anexan al prompt (si existen).

Si no has aplicado el patch SQL, no pasa nada: la IA sigue funcionando sin playbook.

## 5) Recomendación de primeros snippets

1) **Política de reembolsos/cancelaciones** (clara, con plazos).
2) **Métodos de pago** y moneda.
3) **Cómo reservar** (paso a paso + qué datos pedimos).
4) **Qué incluye / qué no incluye** (evita sorpresas).
5) **Seguridad y expectativas** (puntualidad, clima, requisitos).
6) **Escalamiento a humano** (cuando pedir WhatsApp / llamada).
