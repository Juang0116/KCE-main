# Phase 106 — Plan convergence + chat productization

## What changed

### 1) Personalized Plan became a real public route
- Added `src/app/(marketing)/plan/page.tsx` as the main public route for the tailored planning flow.
- Converted `src/app/(marketing)/quiz/page.tsx` into a legacy redirect to `/plan`.
- Updated public navigation, CTAs, marketing links and sitemap to prioritize `/plan`.
- Added `/api/plan/submit` as an alias to the current quiz submission handler so the new naming can be used without breaking the existing CRM/routing logic.

### 2) Public surface got tighter
- Header and footer now point to `/plan` instead of `/quiz`.
- Public marketing pages that pushed the traveler to the old route now point to `/plan`.
- Discover hub was marked `noindex` and removed from the sitemap core route list to reduce premature editorial weight in indexing.

### 3) Chat was productized visually
- Added `src/features/ai/AssistantMessageBlocks.tsx`.
- Public chat and Admin AI Lab now render structured assistant responses as functional blocks:
  - summary / status
  - options
  - next step
  - continuity
- This keeps the premium assistant from feeling like a wall of text even when markdown is valid.

### 4) AI response contract was tightened
- `/api/ai` prompt was updated to push the assistant toward visible sectioned answers:
  - `## Resumen` / `## Estado`
  - `## Opciones`
  - `## Siguiente paso`
  - `## Continuidad` when relevant
- Fallback assistant responses now follow that same structure.

## What remains for the next big phase
- Replace remaining internal/public wording like "matcher" / legacy "quiz" terminology where it still survives.
- Unify the plan naming deeper in analytics/admin language when it is strategically safe.
- Push the next major phase into public-surface simplification and deeper Discover rationalization.
