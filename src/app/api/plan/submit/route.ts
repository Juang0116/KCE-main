// src/app/api/plan/submit/route.ts
// Alias of /api/quiz/submit — same handler, own runtime declarations for Next.js 15 compat
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 25;

export { POST } from '../../quiz/submit/route';
