# KCE Phase 121 — Deliverable Notes

**Date:** 2026-03-13
**Phase:** 121 — AI Agents: Gemini primary, itinerary-builder connected, plan display upgraded
**Status:** ✅ Complete

---

## Summary

Phase 121 connects the full AI agent stack. Gemini 2.0 Flash is now the primary model across
all three AI surfaces (concierge chat, itinerary builder, quiz planner). The `/plan` form now
fires two parallel requests and shows the richest plan available.

---

## Changes

### 1. `quiz/submit/route.ts` — Gemini primary itinerary generation
- Replaced the OpenAI-only `generateItineraryWithAI` function
- New `callGeminiItinerary` + `callOpenAIItinerary` with `resolveProviderOrder()` (reads `AI_PRIMARY` / `AI_SECONDARY` env vars)
- Default: Gemini 2.0 Flash → OpenAI gpt-4o-mini fallback
- Timeout 14s, stripFences, JSON parse validation

### 2. `itinerary-builder/route.ts` — Real catalog + full schema prompt
- Added `import { listTours }` — now fetches real Supabase tours (mock fallback on error)
- `fetchCatalogForPrompt(city)` injects live tour slugs + URLs into the AI prompt
- System prompt rewritten with full explicit JSON schema (no more `(…tu esquema…)` placeholder)
- `userPayload` includes `startDate`, `budgetBandCOP`, `pace`
- Model aligned to `gemini-2.0-flash`

### 3. `QuizForm.tsx` — Parallel calls + rich plan display
- `onSubmit` now runs `Promise.allSettled([quiz/submit, itinerary-builder])` in parallel
- New `RichPlan` + `RichMarketing` types matching itinerary-builder output schema
- Three-layer display: rich plan (Gemini blocks) → simple AiItinerary fallback → tour cards
- Rich plan shows: headline, budget COP/day, blocks with time+neighborhood+cost, safety per day, tips, upsells, WhatsApp CTA from marketing copy

### 4. `ai/route.ts` — Upgraded concierge system prompt
- New section `CAPACIDADES` — agent now knows it can build day-by-day itineraries in chat
- New `## Plan día a día` format section in prompt
- Model: `gemini-2.0-flash`

### 5. `AssistantMessageBlocks.tsx` — Plan section support
- New `SectionKey: 'plan'`
- `detectHeading` recognises: `plan día a día`, `plan de viaje`, `itinerario`
- Renders plan section as a styled dark-blue card with `🗓` badge
- Chip `Itinerario` appears in the tag row when a plan is detected

### 6. `ChatWidget.tsx` — Better quick prompts
- Added `'Arma un plan de 3 días en Cartagena'` to trigger itinerary requests

### 7. `public/images/tours/placeholder.svg` — Created
- Brand SVG: blue gradient + KCE mark
- `TourCard.tsx` + `TourCardPremium.tsx` references updated

### 8. `.env.example` — Aligned
- `GEMINI_MODEL=gemini-2.0-flash` (was `gemini-2.5-flash`)

---

## AI Agent Flow (after Phase 121)

```
User fills /plan form
  ↓
QuizForm.onSubmit → Promise.allSettled([
  /api/plan/submit   → CRM lead, Supabase, email, simple itinerary (Gemini → OpenAI)
  /api/itinerary-builder → Rich plan JSON: blocks+COP+safety+marketing (Gemini → OpenAI)
])
  ↓
Display priority:
  1. RichPlan (itinerary-builder) — full day blocks, costs, safety, WhatsApp CTA
  2. AiItinerary (quiz/submit fallback) — morning/afternoon/evening cards
  3. Tour cards (no AI) — catalog recommendations

Chat widget (/api/ai):
  Gemini 2.0 Flash → can now generate ## Plan día a día inline
  AssistantMessageBlocks renders plan section with dark-blue itinerary card
```

---

## Pre-Production Gate (Phase 122)

- [ ] `npm run build` clean — certifies all TS
- [ ] Test `/plan` form end-to-end with `GEMINI_API_KEY` set
- [ ] Test chat with "Arma un plan de 3 días en Cartagena"
- [ ] Verify `itinerary-builder` returns valid schema (no `(…tu esquema…)` placeholder leaking)
- [ ] QA 9 critical routes
- [ ] Vercel deploy + smoke scripts

