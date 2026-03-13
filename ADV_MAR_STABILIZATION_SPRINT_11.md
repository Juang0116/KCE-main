# ADV MAR STABILIZATION SPRINT 11

## Fixes applied
- Resolved `exactOptionalPropertyTypes` mismatch between `src/app/layout.tsx` and `src/components/Header.tsx`.
- `Header` props now explicitly accept `string | undefined` for `envLabel` and `envHint`.
- `layout.tsx` now only passes `envHint` when it exists, following the project's strict optional-props convention.

## Why this matters
This removes a build blocker in the root layout and hardens the app shell against similar strict-typing regressions.
