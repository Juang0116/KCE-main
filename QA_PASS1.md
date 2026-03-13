# QA Pass 1 (local)

This pass is designed to quickly surface “red flags” before you run the full runbook.

## Preconditions

- Server running on port 3000:

```bash
npm run dev -- -p 3000
```

- Your environment is loaded (`.env.local`) and **Supabase + Stripe** are configured (as
  applicable).

## Run

```bash
BASE_URL=http://localhost:3000 npm run qa:pass1
```

Optional:

- If `ADMIN_BASIC_USER/PASS` is enabled in production-like setups:

```bash
ADMIN_BASIC_USER=... ADMIN_BASIC_PASS=... BASE_URL=http://localhost:3000 npm run qa:pass1
```

- To test availability, pass a concrete tour UUID:

```bash
TOUR_ID=<uuid> BASE_URL=http://localhost:3000 npm run qa:pass1
```

## What it checks

- `/api/health`
- `/api/tours?limit=5`
- `/api/events/view-tour?slug=...`
- `/api/availability?tour_id=...` (optional)
- `/api/checkout` (best-effort; requires Stripe)
- `/api/qr?text=...`

## Next

After this pass, use:

- `/admin/qa` (smoke + prod preflight)
- `/admin/runbook` (full acceptance with PASS/FAIL + optional events logging)
