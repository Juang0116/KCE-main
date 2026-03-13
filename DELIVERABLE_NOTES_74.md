# Deliverable 74 — public shell separation + discover cleanup + public simplification

## Included
- Separated public chrome from admin routes:
  - public header/footer/chat/WhatsApp hidden on `/admin` and `/{locale}/admin`
  - implemented via `src/components/AppChrome.tsx`
- Rebuilt `discover` as a lightweight public inspiration hub:
  - removed admin/growth decks from public page
  - focused on tours, destinations, personalized plan, content cards
- Simplified public marketing surfaces:
  - home: removed several growth strips/decks and softened internal copy
  - tours: removed growth strips/decks and shifted CTA language toward traveler guidance
  - destinations: rewrote internal/growth copy into customer-facing language and removed extra growth sections
- Footer remains public-only through the new chrome layer.

## Important
- This patch was prepared directly on the codebase and was **not fully validated with `npm run build` in this environment**.
- Recommended next action on your machine:
  1. `npm run build`
  2. send me the next TS/build error if one appears

## Suggested next sprint
- clean remaining public copy in Home/Tours/Why KCE blocks
- finish admin shell isolation (status/banner + spacing polish)
- convert `/quiz` flow content fully into `Plan personalizado`
- define structured response cards for AI concierge/public chat
