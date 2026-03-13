# QA E2E – Compra → Booking → Factura → Calendario

Checklist para validar el flujo end‑to‑end:

1. Selección de tour → 2) Checkout Stripe → 3) Webhook crea booking → 4) Descargas (PDF + ICS)

## Local (http://localhost:3000)

### 1) Ejecutar el flujo de compra

```bash
npm run dev
```

- Abre un tour y completa el checkout (Stripe test).
- En la URL de success verás `session_id=cs_test_...`.

### 2) Verificar por script (rápido)

Opción A: con `--session`:

```bash
node scripts/verify_purchase.mjs \
  --session cs_test_XXXXXXXX \
  --token local-dev \
  --base http://localhost:3000
```

Opción B: pegando la URL completa de success:

```bash
node scripts/verify_purchase.mjs \
  --success-url "http://localhost:3000/es/checkout/success?session_id=cs_test_..." \
  --token local-dev \
  --base http://localhost:3000
```

Salida esperada:

- `OK booking 200`
- `OK invoice_pdf 200`
- `OK calendar_ics 200`
- `OK success_page 200`
- `OK booking_page 200`

### Nota sobre el warning “download not secure” en móvil

Si pruebas desde el celular con `http://192.168.x.x:3000`, Chrome puede mostrar un aviso de descarga
“no segura” por ser **HTTP**. En producción (HTTPS) ese aviso desaparece.

## Producción (Vercel / HTTPS)

### Release Candidate (recomendado)

Ejecuta el gate completo (local + opcional remoto) antes de probar compra real:

```bash
# Solo local
npm run qa:rc

# Local + smoke remoto
BASE_URL=https://TU-DOMINIO npm run qa:rc
```

Salida esperada: `[RC] PASS ✅`

### 0) Smoke remoto (rápido)

Antes del flujo completo, valida que el deploy expone rutas críticas:

```bash
BASE_URL=https://TU-DOMINIO npm run qa:smoke:remote
```

Salida esperada: `SMOKE_REMOTE_OK ✅`

- Repite el flujo de compra.
- Ejecuta el script apuntando al dominio:

```bash
node scripts/verify_purchase.mjs \
  --success-url "https://TU-DOMINIO/es/checkout/success?session_id=cs_live_..." \
  --token <TOKEN_REAL> \
  --base https://TU-DOMINIO
```

En prod el token NO es `local-dev`; debe ser el token firmado (`t`) que genera el sistema para ese
`session_id`.

## Troubleshooting

- **404 Booking not found**: el booking no se creó (webhook no corrió) o el `session_id` es
  incorrecto.
- **StripeInvalidRequestError (No such checkout.session)**: estás usando un `session_id` que no
  existe en esa cuenta/entorno (test vs live) o una key Stripe distinta.


## Hardening final

Para release candidato real, usa también:

- `docs/REVENUE_HARDENING_FINAL.md`
- `/admin/qa`
- `/admin/bookings`
- `/admin/ops/runbooks`
