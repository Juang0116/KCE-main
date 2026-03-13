# KCE 3.0 — Release checklist (pre-producción y producción)

Este checklist es para reducir “sorpresas” en el primer release vendible.

## 1) Seguridad (bloqueante)

- [ ] Llaves rotadas: Supabase anon/service role, Stripe secret/webhook, Resend, OpenAI/Gemini.
- [ ] `.env.local` nunca en git (verificar `.gitignore`).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` solo se usa en runtime `nodejs`.
- [ ] RLS habilitado en tablas públicas; CRM/admin tables solo admin.

## 2) Salud del sistema

- [ ] `/api/health` → ok
- [ ] `/admin/qa` → all PASS

## 3) Aceptación de flujos (runbook)

- [ ] `/admin/runbook` → todos los pasos PASS (o ticket/plan de mitigación por cada FAIL).

## 4) Stripe

- [ ] Moneda EUR en Checkout.
- [ ] Webhook idempotente (sin duplicar booking/email).
- [ ] Email invoice llega una sola vez.

## 5) Contenido y marketing

- [ ] OG/metadata correcto al compartir.
- [ ] Header/Footer con redes actualizadas.
- [ ] Blog/Vlog publica sin tocar código.

## 6) Observabilidad

- [ ] `events` registra: checkout.started, checkout.paid, email.invoice_sent, review_submitted,
      marketing.utm_capture, quiz.completed.

## 7) Backups / Operación

- [ ] Export/backup inicial de schema.
- [ ] Usuario admin creado.

## CORS (si aplica)

- Si tu frontend y APIs corren en dominios distintos, configura `CORS_ALLOW_ORIGINS` con una
  allowlist exacta.
- Si todo corre en el mismo dominio (monolito Next), déjalo vacío.
