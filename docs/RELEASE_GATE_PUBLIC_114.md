# Release Gate Public 114 — Core public convergence

## Goal
Close a sharper release gate for the public-facing KCE core before opening more growth or editorial surface.

## What this gate protects
- Public hierarchy stays obvious: **Tours / Destinations / Plan personalizado**.
- Mobile visitors can still move forward without being forced into a single path.
- Tour detail does not trap hesitant users in a dead end; it offers reserve, guided plan, or human help.
- Home, catalog and detail repeat the same commercial promise instead of competing with each other.

## Manual checks
1. Open `/es` on mobile width.
   - Confirm quick actions appear and keep Tours / Plan / Contact visible.
   - Confirm the entry rail repeats the same core hierarchy.
2. Open `/es/tours` on mobile width.
   - Confirm quick actions appear before the catalog gets visually heavy.
   - Confirm the decision rail appears before the result grid.
3. Open any `/es/tours/[slug]` on mobile width.
   - Confirm sticky CTA shows **Reservar** plus an alternate lane (`Plan primero` and help/contact).
   - Confirm the page still offers a visible way back to Destinations / Plan without abandoning the traveler.
4. Open `/es`, `/es/tours`, and `/es/tours/[slug]` on desktop.
   - Confirm the shared hierarchy still feels premium, compact and coherent.
5. Run build and smoke checks locally.
   - `npm run build`
   - `npm run qa:smoke` (or current smoke path)

## Acceptance bar
- No public lane competes with Tours / Destinations / Plan.
- Mobile flow feels clearer than before on Home, Tours and detail.
- Detail page offers reserve + hesitation recovery, not just reserve.
- Build and smoke remain green locally.
