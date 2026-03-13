# KCE-clean-main — P8 Advance (2026-02-15)

## What landed

### 1) CRM Templates editable in Supabase
- New table: `public.crm_templates` (key + locale + channel) with `subject/body/enabled`.
- New SQL patch: `supabase_patch_p46_crm_templates.sql`.
- Optional seed: `supabase_seed_p46_crm_templates.sql`.

### 2) Admin UI to manage templates
- New page: `/admin/templates`.
- CRUD via Admin Basic Auth APIs.

### 3) Runtime rendering + outbound logging
- New API: `POST /api/admin/templates/render` renders templates with `{placeholders}`.
- Automatically logs `crm.outbound_message` into `events` via `logEvent()`.

### 4) Sales Cockpit + Tickets now use DB templates (fallback safe)
- `/admin/sales` actions (Copy/WhatsApp/Email) now request templates from DB and fallback to local playbook if missing.
- `/admin/tickets/[id]` quick templates now use DB keys (`ticket.first_reply`, `ticket.followup_24h`, etc.) and fallback to local.
- Removed an accidental duplicate function definition in `AdminTicketClient.tsx`.

## Placeholders supported
`{name}`, `{tour}`, `{date}`, `{people}`, `{checkout_url}`, `{price}`

## How to apply
1. Run `supabase_patch_p46_crm_templates.sql` in Supabase SQL editor.
2. (Optional) Run `supabase_seed_p46_crm_templates.sql`.
3. Deploy.
4. Open `/admin/templates` and customize.

## Notes
- If templates are missing, the UI keeps working (fallback).
- Logging is best-effort; if events insert fails, rendering still returns.
