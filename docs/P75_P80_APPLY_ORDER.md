# P75 → P80 — Apply Order (Supabase)

Ejecuta en Supabase SQL Editor, en este orden:

1. `supabase_patch_p75_sequences.sql`
2. `supabase_patch_p76_consent_compliance.sql`
3. `supabase_patch_p77_catalog_premium_rules.sql`
4. `supabase_patch_p78_fx_cohorts.sql`
5. `supabase_patch_p79_ai_playbooks_audit.sql` (opcional pero recomendado)

Luego:

- Admin:
  - `/admin/sequences` (crear secuencias + steps)
  - `/admin/outbound` (enviar / marcar WhatsApp manual)
  - `/admin/catalog` (reglas de precio)
  - `/admin/analytics` (panel ejecutivo)

- Sitio:
  - Banner cookies + `/cookies`
  - `/terms` y `/privacy`

## Cron
- Sequences:
  - `POST /api/admin/sequences/cron` (requiere INTERNAL_HMAC_*)

