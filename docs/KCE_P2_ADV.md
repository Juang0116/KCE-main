# KCE — P2 (Conversión real + automatización)

## Objetivo
Reducir fricción para cerrar ventas:
- Crear **link de pago** (Stripe Checkout) desde CRM en 30s.
- Conectar **Deal ↔ Booking** para marcar `won` automáticamente cuando Stripe confirma pago.
- Aplicar **playbooks** (secuencias de tareas 24h/48h) para que el seguimiento sea consistente.

## Lo que incluye este avance
### UI
- `/admin/deals/board`: acciones por deal:
  - **Checkout**: genera link de pago (copia automático) usando `/api/bot/create-checkout`.
  - **Playbook**: crea tareas 24h/48h usando `/api/admin/deals/[id]/playbook`.
- `/admin/tickets/[id]`: panel **Deal / Checkout rápido**
  - Detecta deal activo por `lead_id` / `customer_id`
  - Botones playbook: 24h / Propuesta / Checkout
  - Form para generar link de pago (copia automático)

### API
- `/api/admin/deals?lead_id=&customer_id=`: filtros para resolver deal activo desde ticket.
- `/api/admin/deals/[id]/playbook`: crea tareas estándar y devuelve plantillas sugeridas.

### Automación de cierre
- El webhook Stripe ya marca el deal como `won` cuando existe `deal_id` en metadata del checkout.
  - Fuente: `src/app/api/webhooks/stripe/route.ts` (markDealWonFromSession)

## Cómo usarlo (operación)
1. Desde un ticket, abre el panel “Deal / Checkout rápido”.
2. Si el cliente está listo:
   - Completa `tour slug`, `fecha`, `personas` → **Crear link de pago (copia)** → pegar en WhatsApp/email.
3. Si el cliente aún no decide:
   - **Playbook 24h** para seguimiento sistemático.

## Siguiente paso recomendado (P2.5 / P3)
- “Checkout preset” por tour: selector de tour desde catálogo en UI (sin escribir slug).
- “Canned responses” por idioma (ES/EN/DE).
- Métricas: funnel lead → deal → checkout → booking con dashboard semanal.
