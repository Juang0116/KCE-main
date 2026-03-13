# P75 — Sequences + Outbound

Este patch agrega campañas drip (secuencias) para Email/WhatsApp.

## Activación
1) Ejecuta `supabase_patch_p75_sequences.sql`
2) En Admin: `/admin/sequences`
3) Corre el cron: `POST /api/admin/sequences/cron`

## WhatsApp
WhatsApp se maneja como **manual send** (Abrir WA + Marcar enviado) en `/admin/outbound`.
