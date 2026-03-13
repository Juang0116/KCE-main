# KCE · Final Admin Cabin Simplification Sprint 68

## Scope
Executive simplification pass for:
- `/admin/bookings`
- `/admin/marketing`
- `/admin/sales`

## What changed
- Introduced `src/components/admin/AdminOperatorWorkbench.tsx` as a reusable admin workbench header.
- Simplified page-level wrappers for bookings, marketing and sales using the same decision-first grammar already applied to Command Center / Launch HQ / Revenue.
- Reduced deck sprawl in those pages and replaced it with:
  - a clearer executive intro
  - action-first focus items
  - short operator notes
- Upgraded client surfaces:
  - `AdminBookingsClient` now opens with a workbench summary and cleaner action links
  - `AdminMarketingClient` now opens with a lane/bottleneck/CTA workbench summary
  - `AdminSalesCockpitClient` now opens with a hot-close / rescue / pipeline / support-pressure workbench summary
- Fixed a coherence issue in bookings by removing a broken `/admin/account` admin link and replacing it with a valid `/admin/customers` route.

## Intent
This sprint is not about adding more functionality.
It is about making the admin cabin feel more executive, faster to read and easier to operate under pressure.

## Validation performed
- TS/TSX syntax validated with `typescript.transpileModule` for all modified files.

## Suggested local verification
- `npm run build`
- Review:
  - `/admin/bookings`
  - `/admin/marketing`
  - `/admin/sales`
- Confirm visual consistency with:
  - `/admin/command-center`
  - `/admin/launch-hq`
  - `/admin/revenue`
