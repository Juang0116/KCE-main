# ADV MAR — Revenue E2E Hardening Sprint 38

## Goal
Move KCE closer to a real release candidate by strengthening the Admin QA desk around the revenue path:

`checkout -> webhook -> booking -> signed links -> invoice/email -> manual account/admin verification`

## What changed
- `src/app/admin/qa/page.tsx`
  - reframed the top copy and release pillars around revenue E2E and recovery
- `src/app/admin/qa/AdminQaClient.tsx`
  - added a **Revenue E2E Desk** block
  - added a **Revenue score** separate from generic QA readiness
  - fixed the release/go-live board to use the **real rc-verify ids**:
    - `events.checkout_paid`
    - `supabase.booking_exists`
    - `events.email_sent`
    - `links.token`
  - added a **Revenue flow board** with stages:
    1. Checkout + paid session
    2. Webhook + event trail
    3. Booking persisted
    4. Email + delivery assets
    5. Manual account/admin check
  - added a **Triage + Delivery** panel with failure recovery guidance
  - surfaces generated `booking_url` and `invoice_url` when available from `links.token`

## Why this matters
The previous QA page already measured readiness, but it still mixed generic QA with revenue validation.
This sprint makes the admin QA page much more useful for the question that matters before go-live:

**Can KCE really charge, persist the booking, and deliver the reservation cleanly?**

## Recommended operator flow
1. Run QA
2. Run RC Verify with a real `session_id`
3. If booking is missing -> `Verificar + Heal booking`
4. If email is missing -> `Reenviar email + PDF`
5. Open booking/invoice links and verify in account/admin
6. Review mobile vertical before moving traffic
