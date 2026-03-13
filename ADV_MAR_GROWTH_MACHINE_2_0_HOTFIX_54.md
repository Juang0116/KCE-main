# Sprint 54 hotfix

- Fixed `GrowthMachine20Deck` typing for `highlight?: boolean`.
- Added explicit `GrowthLane` / `DeckLink` types to avoid `as const` union narrowing issues with `exactOptionalPropertyTypes` and property access.
