# Sprint 41 — CRM + AI handoff connected

## Objetivo
Conectar mejor la transición entre concierge IA, captura de lead, ticket humano y seguimiento comercial.

## Cambios
- ChatWidget ahora puede:
  - guardar contacto directo en CRM (`/api/bot/create-lead`)
  - solicitar handoff humano (`/api/bot/create-ticket`)
  - persistir leadId / ticketId en localStorage para continuidad
- Admin IA ahora muestra mejor el puente hacia tickets, leads y sales.
- Nuevo deck compartido `AiHandoffControlDeck` usado en IA, leads, tickets y sales.
- Admin AI Lab:
  - corrige lectura de `content`
  - permite adjuntar lead
  - permite forzar handoff
  - muestra provider / model / conversationId / ticketId

## Resultado esperado
KCE queda más cerca de un flujo real:
chat → lead → ticket/deal → human follow-up → sales/revenue
