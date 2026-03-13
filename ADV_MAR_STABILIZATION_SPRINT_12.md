# ADV MAR STABILIZATION SPRINT 12

## Goal
Unblock the current Next.js build error in `src/services/leadMagnetEuGuidePdf.ts` and harden the PDF generator against strict TypeScript array-index checks.

## Changes
- Replaced indexed loop over `lines[i]` with `for...of` to avoid `string | undefined` under strict array access.
- Replaced direct `sections[0/1/2]` access with guarded destructuring.
- Added explicit error if PDF sections become incomplete in future edits.

## Why
The project is using strict TypeScript settings that treat indexed array access as potentially undefined. This patch removes that class of error cleanly instead of weakening types.
