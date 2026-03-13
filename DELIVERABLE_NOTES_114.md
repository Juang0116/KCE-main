# Deliverable Notes — Phase 114

## Theme
Mobile release gate + core decision convergence.

## Applied changes
- Added shared `PublicCoreDecisionRail` and reused it on Home, Tours and tour detail.
- Added `MobileQuickActions` to Home and Tours to keep the public core visible on smaller screens.
- Upgraded `MobileStickyBookingCta` so tour detail keeps reserve as the primary action but also offers `Plan primero` and contact/help as recovery lanes.
- Added `docs/RELEASE_GATE_PUBLIC_114.md` and updated release status / E2E QA notes.

## Intent
This phase does not open more product surface. It makes the public hierarchy clearer and safer for launch, especially on mobile.
