# Deliverable 81

## Scope
- Chat widget polish for more professional concierge feel
- Tighter `/api/ai` response contract (shorter, cleaner answers)
- `Plan personalizado` page simplified (removed extra strips)
- Discover subpages cleaned to reduce growth/internal wording
- Minor public CTA wording normalized toward `Plan personalizado`

## Main files touched
- `src/features/ai/ChatWidget.tsx`
- `src/app/api/ai/route.ts`
- `src/app/(marketing)/quiz/page.tsx`
- `src/app/(marketing)/discover/{adventure,coffee,cultural,europe,family,luxury}/page.tsx`
- `src/app/(marketing)/destinations/page.tsx`
- `src/app/(marketing)/destinations/[slug]/page.tsx`
- `src/app/(marketing)/tours/page.tsx`
- `src/app/(marketing)/tours/city/[city]/page.tsx`
- `src/app/(marketing)/tours/tag/[tag]/page.tsx`

## Notes
- This phase is focused on premium public cleanup and concierge continuity.
- Build was not validated inside this environment. Please run `npm run build` locally after replacing the project.
