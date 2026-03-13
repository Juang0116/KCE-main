# Plan maestro KCE (de MVP vendible → KCE completo)

Este documento define **(1) meta**, **(2) estado actual**, **(3) estrategia de ejecución**, y **(4) roadmap priorizado** para llegar rápido a un KCE “empresa internacional 10/10”, sin perder estabilidad ni seguridad.

## 1) Meta (North Star)

**Meta negocio (MVP vendible):**
- Un usuario entra, descubre tours reales, compra en Stripe, recibe confirmación + factura + calendario, y el equipo puede dar soporte/hacer seguimiento desde el CRM.

**North Star Metric (NSM):**
- `Bookings paid / week` + `Conversion rate (tour → checkout)`

**Métricas soporte/operación:**
- `Time-to-first-response` (tickets)
- `% tickets resueltos < 24h`
- `Refund rate` (control)

## 2) Estado actual (lo que ya está)

### Checkout & entrega
- Checkout Stripe → webhook → booking en Supabase.
- Endpoints seguros por link token (`t`): booking/invoice/calendar.

### CRM mínimo
- Tablas: leads, customers, conversations, messages, tickets, deals, tasks.
- Admin: listado/detalle de tickets y conversaciones.
- Bot/IA: crea conversación + mensajes; crea **ticket** cuando pide humano; crea **deal** cuando hay intención de compra; crea **task** para follow-up.

### Seguridad
- Admin protegido por Basic Auth.
- Tokens firmados para lectura de compra.

## 3) Estrategia para llegar rápido (sin caos)

**Reglas no negociables (para velocidad real):**
1. **Una sola fuente de verdad**: DB ↔ tipos ↔ API ↔ UI.
2. **Observabilidad**: todo evento importante deja rastro (pago, booking, email, error, ticket).
3. **Seguridad por defecto**: RLS + tokens firmados + secretos fuera del repo.
4. **Conversión primero**: lo que no vende/retiene se posterga.

**Cadencia recomendada (2 semanas / sprint):**
- Sprint planning con P0/P1.
- Gate: `npm run build` + QA E2E + verificación Stripe webhook.
- Deploy controlado (staging → production).

## 4) Roadmap priorizado (P0 → P3)

### P0 — Base 100% funcional (máxima prioridad)
**Objetivo:** todo el flujo end-to-end estable y repetible.

Checklist DoD:
- [ ] Tours listan correctamente (sin blank states)
- [ ] Checkout crea sesión (EUR) y redirige a success
- [ ] Webhook confirma pago y crea booking `paid`
- [ ] Booking page funciona con `t` (PC + móvil)
- [ ] Invoice PDF y Calendar ICS descargan sin 403 (con `t`)
- [ ] Logs mínimos + requestId en APIs

### P1 — Conversión + soporte real (CRM usable)
**Objetivo:** que el equipo cierre ventas y resuelva dudas desde admin.

1. Bot + lead capture:
   - Captura explícita de email/WhatsApp + consentimiento.
   - Persistencia de `conversationId` para continuidad.

2. Tickets:
   - Estados: open/pending/in_progress/resolved.
   - En detalle: editar status/priority/subject/summary.

3. Handoff humano:
   - Responder desde ticket → agrega message role=agent → cierra si aplica.

### P2 — Pipeline comercial + seguimiento
**Objetivo:** no perder leads calientes.

- Deals por etapa (new → qualified → proposal → won/lost).
- Tareas automáticas (follow-up 24h) y recordatorios.
- Etiquetas/segmentación (idioma, ciudad, presupuesto).

### P3 — IA productiva (agente vendedor/soporte)
**Objetivo:** IA que vende, no solo responde.

- “Discovery” estructurado: ciudad, fechas, #personas, estilo.
- Recomendación con catálogo real + upsells.
- Generación de itinerario (siempre con tours existentes).
- Escalamiento a humano cuando hay señales de riesgo.

## 5) Plan de ejecución (72h para gran avance)

**Día 1 (estabilidad + conversión)**
- Validar P0 completo en local y staging.
- Fix UI/UX de tours y checkout (microcopy, CTAs).

**Día 2 (CRM + seguimiento)**
- Mejoras de tickets (estatus, edición).
- Captura de contacto en chat.

**Día 3 (ventas + marketing mínimo)**
- Landing/SEO base (FAQ + WhatsApp + trust signals).
- Instrumentación (eventos claves) + dashboard admin simple.

## 6) Siguientes decisiones (para no bloquear)

- Dominio/idiomas prioritarios (ES/EN/DE): define orden.
- 3 tours “core” para vender primero.
- Política de reembolsos / cambios.

---

**Nota:** cada feature nueva debe pasar por el Gate (build + QA E2E + webhook) antes de merge.
