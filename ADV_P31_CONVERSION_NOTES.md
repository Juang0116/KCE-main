# P31 — Conversion Hardening (ADV)

Esta entrega está pensada para **subir conversión sin tocar el core de IA**.

## ¿Qué incluye?
1) **Redirect trackeado y seguro a checkout**
   - Nuevo: `GET /go/checkout/[deal_id]?t=...`
   - Verifica token firmado (`LINK_TOKEN_SECRET`) contra `stripe_session_id` del deal.
   - Registra evento `checkout.opened` antes de redirigir.

2) `POST /api/checkout` ahora retorna también:
   - `goUrl` (opcional): link firmado + trackeado (sin romper compatibilidad: `url` sigue igual).

3) **Trust Bar** en Tour Detail
   - Nuevo componente: `src/features/tours/components/TrustBar.tsx`
   - Insertado en `src/app/(marketing)/tours/[slug]/page.tsx` para reducir fricción.

## Pasos
1) **Configura env** (Vercel/Supabase):
   - `LINK_TOKEN_SECRET` (string largo, aleatorio).
2) Deploy.
3) Valida:
   - Crear checkout normal (botón reservar).
   - Revisar respuesta de `/api/checkout`: debe traer `url` y, si hay `dealId`, `goUrl`.
   - Abrir `goUrl` y confirmar que redirige a Stripe.

## Nota
- Si no existe `LINK_TOKEN_SECRET`, el sistema seguirá funcionando (solo sin `goUrl`).
