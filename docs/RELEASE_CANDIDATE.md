# Release Candidate – MVP Vendible

Este documento define el **gate profesional** para decir: “este build está listo para vender”.

## Comando único

```bash
# Solo local
npm run qa:rc

# Local + producción (smoke remoto)
BASE_URL=https://TU-DOMINIO npm run qa:rc
```

Qué hace:

1) Valida envs críticos (Supabase/Stripe/Resend/tokens)
2) Ejecuta `qa:ci` (lint + types + prettier + qa-gate + build)
3) Ejecuta `qa:smoke` (producción local con `next start`)
4) Si defines `BASE_URL`, ejecuta `qa:smoke:remote` contra tu deploy

## Variables requeridas (mínimo vendible)

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `LINK_TOKEN_SECRET`

> Si estás en un entorno donde aún no quieres exigirlas, puedes ejecutar:
>
> ```bash
> RC_ALLOW_MISSING=1 npm run qa:rc
> ```

## Checklist final “MVP vendible” (operación)

Una vez el RC está en verde, valida también:

- [ ] Compra real (test/live según configuración)
- [ ] Webhook confirma pago y crea booking
- [ ] Email de confirmación llega (Resend)
- [ ] Descarga de factura PDF funciona
- [ ] Descarga de calendario (ICS) funciona
- [ ] Canales de contacto listos (WhatsApp/Email)
- [ ] Políticas visibles (términos, privacidad, cancelación)
