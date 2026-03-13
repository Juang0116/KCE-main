// src/app/api/booking/[session_id]/route.ts
import 'server-only';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Re-export handler (solo GET)
export { GET } from '../../bookings/[session_id]/route';
