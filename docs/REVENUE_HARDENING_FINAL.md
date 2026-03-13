# Revenue Hardening Final – KCE

Objetivo: validar que KCE puede **cobrar, persistir, entregar y recuperarse** antes de mover tráfico o ventas reales.

## 1) Gate técnico base

```bash
npm run build
npm run qa:ci
```

Revisar:
- Home / tours / detail sin errores visibles
- `/admin/qa` y `/admin/system` accesibles
- secretos críticos presentes: Stripe, Supabase, Resend, LINK_TOKEN_SECRET

## 2) Compra de prueba controlada

1. Abre un tour y completa Checkout Stripe.
2. Guarda `session_id` desde `/checkout/success`.
3. Ve a `/admin/qa` y corre:
   - Run checks
   - RC Verify
   - Verificar + Heal booking (si falta)
   - Reenviar email + PDF (si falta)

## 3) Verificación por script

```bash
node scripts/verify_purchase.mjs \
  --success-url "http://localhost:3000/es/checkout/success?session_id=cs_test_...&t=local-dev" \
  --base http://localhost:3000
```

Salida deseada:
- booking 200
- invoice_pdf 200
- calendar_ics 200
- success_page 200
- booking_page 200

## 4) Validación manual operativa

Revisar manualmente:
- `/booking/[session_id]?t=...`
- `/account/bookings`
- `/admin/bookings`
- `/admin/ops/incidents`
- inbox / spam del email de confirmación

## 5) Recovery si algo falla

- **checkout.paid falla** → revisar webhook + Stripe Dashboard
- **booking no existe** → `Verificar + Heal booking`
- **email no salió** → `Reenviar email + PDF`
- **links firmados fallan** → revisar `LINK_TOKEN_SECRET`
- **incidentes operativos** → `/admin/ops/runbooks`

## 6) Go-live mínimo serio

Antes de mover tráfico real:
- QA base en verde
- RC Verify con una compra de prueba reciente
- Booking visible en account y admin
- Email + PDF entregados
- Mobile vertical revisado en home / tours / detail / booking / success
