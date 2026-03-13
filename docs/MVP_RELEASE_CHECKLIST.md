# KCE — MVP vendible (Release Checklist)

Este checklist define **qué significa "MVP vendible"** para KCE y cómo validarlo en producción.

## 0) Pre-requisitos (antes de validar)

- Deploy en Vercel (producción) actualizado.
- Variables de entorno en Vercel (**Production**) configuradas y coherentes.
- Stripe Webhook en modo Live apuntando al endpoint de producción.
- Resend con dominio (o remitente) verificado y API key activa.

## 1) Validación automatizada (RC)

Ejecuta RC remoto contra producción:

```bash
BASE_URL=https://knowingcultures.vercel.app npm run qa:rc
```

**Resultado esperado:** PASS ✅ (sin missing env).

> Nota: si lo corres local, necesita tus envs locales (no es un bug). RC valida que el build local tiene el “shape” de un entorno vendible.

## 2) Smoke remoto (sanidad básica)

```bash
BASE_URL=https://knowingcultures.vercel.app npm run qa:smoke:remote
```

**Resultado esperado:** SMOKE_REMOTE_OK ✅

## 3) Compra real de prueba (Live)

### 3.1 Compra

1. Entra a /es/tours, abre un tour.
2. Completa el checkout **con pago real** (monto mínimo posible).
3. Debes terminar en **/es/checkout/success** y luego ver **/es/booking/[session_id]**.

### 3.2 Confirmaciones obligatorias (todas deben estar ✅)

- **Webhook crea booking** (status `paid`) en Supabase.
- **Email de confirmación** llega al correo del comprador.
- **PDF invoice** descarga/abre sin 403.
- **ICS calendar** descarga/abre sin 403.

### 3.3 Validación forense (rápida)

1. Abre **/admin/ops** (Basic Auth).
2. En “Buscar por Stripe session_id”, pega el `cs_...`.
3. Te lleva a **/admin/events** (timeline) con el session_id cargado.

**Resultado esperado:** ver eventos tipo:

- `checkout.created`
- `stripe.webhook.processed`
- `booking.paid` / `booking.created`
- `email.sent`
- `invoice.generated` / `calendar.generated`

## 4) Cuando todo está ✅ → MVP vendible = LISTO

Si los puntos 1 + 3 (especialmente 3.2) pasan, se considera que KCE ya puede vender.

---

## Apéndice: qué hacer si falla un punto

Consulta `docs/OPERATIONS_RUNBOOK.md` y usa el panel **/admin/ops** + **/admin/events** para diagnosticar.
