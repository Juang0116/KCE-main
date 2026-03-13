# ADV MAR STABILIZATION SPRINT 14

## Fixes
- Removed unused `nlPending` variable in `src/app/api/admin/metrics/marketing/route.ts` to satisfy `unused-imports/no-unused-vars`.
- Fixed duplicated union constituent in `src/lib/adminAuth.ts` by simplifying `requireAdminScope` signature from `Capability | string | { cap?: string } | null` to `Capability | { cap?: string } | null` because `Capability` is already `string`.

## Outcome
- Addresses the current ESLint blockers after TypeScript compilation passed.
