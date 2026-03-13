# KCE E2E QA Checklist — March 2026

## Goal
Validate the full commercial path after the build became stable:

1. Core public entry points work (`/`, `/tours`, `/destinations`, `/plan`)
2. Lead capture path works (`/lead-magnets/eu-guide`, newsletter, contact)
3. Checkout path works (tour → checkout → Stripe → success)
4. Post-purchase path works (booking, invoice, calendar, email)
5. Admin QA confirms the environment and RC Verify passes

## Manual flow

### A. Discovery
- Open `/es`
- Open `/es/tours`
- Open `/es/destinations`
- Open `/es/plan`
- Confirm localized links and CTAs navigate correctly

### B. Qualification
- Run the personalized plan and confirm recommendations render
- Open a recommended tour
- Add a tour to wishlist
- Open contact / WhatsApp path

### C. Checkout
- Start checkout from a tour page
- Confirm Stripe redirect works
- Complete payment in test mode
- Confirm redirect to success / booking

### D. Post-purchase
- Open booking page
- Open invoice endpoint / PDF
- Open calendar endpoint
- Confirm booking confirmation email and PDF attachment

### E. Admin verification
- Open `/es/admin/qa`
- Run normal QA
- Run Deep QA when needed
- Run RC Verify with the Stripe `session_id`
- Use healing actions only when the route flags a missing booking or email

## Recommended acceptance bar
- Build passes with `npm run build`
- Dev loads from localhost and LAN without breaking assets
- QA summary shows high readiness
- RC Verify returns green for the checkout tested

## Additional convergence checks
- Confirm `/discover` is treated as an editorial secondary lane (noindex + clear CTA back to core)
- Confirm `/newsletter` and `/social` behave as support layers, not as primary conversion entries
- Confirm footer hierarchy keeps Tours / Destinations / Plan as the visible center of the public site

## Next product sprints after this checklist
- Premium polish on home/tours/destinations mobile
- Revenue ops dashboards with better actionability
- Smarter AI planner flows connected to CRM
- Production hardening / final deployment checklist


## Premium release convergence checks
- Open `/es/contact` and confirm the page clearly separates plan, booking/support and human handoff lanes.
- Verify `/es/plan` and `/es/contact` share the same premium promise and cross-link cleanly to tours.
- Confirm the premium conversion strip sends users to `/tours`, `/plan` and WhatsApp/contact without broken links.
- Review metadata/canonical on `/plan` and `/contact` for release consistency.


## Release hardening checks
- Open `/privacy`, `/terms` and `/cookies` and confirm they expose clear legal/support navigation.
- Confirm `/plan`, `/contact`, `/checkout/success` and `/booking/[session_id]` render the trust/legal rail without broken links.
- Verify `/apple-touch-icon.png`, `/safari-pinned-tab.svg`, `/manifest.webmanifest`, `/site.webmanifest`, `/humans.txt` and `/.well-known/security.txt` return 200.
- Confirm the root layout still loads the correct apple-touch and mask icon tags.
- Review social metadata on legal pages (`/privacy`, `/terms`, `/cookies`) for release consistency.


## Phase 114 mobile convergence checks
- On `/es` mobile width, confirm quick actions keep Tours / Plan / Contact visible above the fold.
- On `/es/tours` mobile width, confirm quick actions appear before the catalog feels heavy and that the decision rail appears before the result grid.
- On `/es/tours/[slug]` mobile width, confirm the sticky CTA offers **Reservar** plus a hesitation-recovery lane (`Plan primero` and help/contact).
- Confirm Home, Tours and detail all repeat the same public hierarchy: **Tours / Destinations / Plan personalizado**.
- Confirm the new `docs/RELEASE_GATE_PUBLIC_114.md` gate can be executed locally together with build/smoke.


## Phase 116 final launch polish checks
- On `/es/account`, confirm the new command deck keeps **reservas / soporte / contacto / tours** visible on mobile and desktop.
- On `/es/account/bookings`, confirm the action deck offers a fast return to support/contact without losing the booking lane.
- On `/es/account/support`, confirm imported context includes booking/ticket/conversation when present and that the quick templates fill the form correctly.
- On `/es/account/support/[id]`, confirm reply templates populate the composer and the ticket keeps visible exits to bookings, support center, contact and account.
- On `/es/checkout/success` and `/booking/[session_id]`, confirm the new action deck keeps booking, account, support and more tours visible, especially on mobile widths.
- Confirm `ReleaseCandidateReadinessRail` appears on Home, Plan, Contact, Checkout Success, Booking and Account Support with the correct variant.
- Confirm support still keeps the rule of one thread per case and preserves imported context before opening a new ticket.


## Phase 118 go-live command checks
- On `/es`, `/es/tours`, `/es/plan` and `/es/contact`, confirm `GoLiveCommandRail` appears and repeats the same public reading: tours / destinations / plan / contact.
- On `/es/checkout/success` and `/booking/[session_id]`, confirm `GoLiveCommandRail` appears after the post-purchase continuity blocks and keeps bookings/account/support/contact visible.
- On `/es/account/support`, confirm the support variant of `GoLiveCommandRail` appears and does not compete with the main support form.
- From `/es/account/support` with imported `bookingId`, `ticket` or `conversation`, confirm the new premium contact link preserves that context in the destination URL.
- Confirm no route introduces new primary navigation noise outside the core launch system.


## Phase 119 production-readiness final checks
- On `/es`, `/es/tours`, `/es/plan` and `/es/contact`, confirm `ProductionReadinessFinalRail` appears after the launch rails and repeats the final public reading: compare / destination / plan / contact.
- On `/es/checkout/success` and `/booking/[session_id]`, confirm `ProductionReadinessFinalRail` appears after `GoLiveCommandRail` and keeps bookings / account / support / contact visible.
- On `/es/account` and `/es/account/bookings`, confirm the account variant of `ProductionReadinessFinalRail` appears and does not compete with the main command deck.
- On `/es/account/support`, confirm the support variant of `ProductionReadinessFinalRail` appears above the support center and keeps one-thread / imported-context behavior aligned.
- Confirm `SupportCenter` copy now talks in terms of production-readiness and still preserves imported booking/ticket/conversation context.
