# Runbook — verificación de compra (Stripe test)

Este runbook sirve para validar **una compra de prueba ya completada** (Checkout Session
`cs_test_...`) y confirmar que el flujo crítico sigue sano:

1. API de booking responde OK
2. Factura PDF descarga OK
3. Archivo de calendario (.ics) descarga OK

> Nota: este runbook **no crea** la compra. Solo valida el estado posterior.

## 1) Prerrequisitos

- El proyecto corriendo (`npm run dev`) y accesible, por ejemplo en:
  - Local: `http://localhost:3000`
  - Producción: tu dominio en Vercel
- Un `session_id` de Stripe Checkout: `cs_test_...`
- El token `t` de la URL de booking (link token), por ejemplo:
  - `/booking/<session_id>?t=<TOKEN>`

## 2) Validación rápida con script

Desde la raíz del proyecto:

```bash
node scripts/verify_purchase.mjs --session cs_test_... --token <TOKEN> --base http://localhost:3000
```

Si todo está bien, verás:

- `OK booking`
- `OK invoice_pdf`
- `OK calendar_ics`

## 3) Validación manual (curl)

```bash
curl -s "http://localhost:3000/api/bookings/cs_test_...?..." | head
curl -I "http://localhost:3000/api/invoice/cs_test_...?..."
curl -I "http://localhost:3000/api/calendar/cs_test_...?..."
```

Revisa:

- booking: `200` y JSON
- invoice: `200` y `content-type: application/pdf`
- calendar: `200` y `content-type: text/calendar`

## 4) Si falla algo

1. Mira la salida del script: muestra status, content-type y un preview del body.
2. Revisa logs del server (local) o logs de Vercel.
3. Confirma que el `token t` corresponde a ese `session_id`.
