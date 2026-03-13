# Dev mobile testing (LAN + HTTPS tunnel)

This project supports testing from your phone while running `npm run dev` on your PC.

## 1) Test over your Wi‑Fi LAN

1. Run the dev server:
   - `npm run dev`
2. Find the Network URL printed by Next.js, e.g.
   - `http://192.168.1.65:3000`
3. Open on your phone (same Wi‑Fi):
   - `http://192.168.1.65:3000/es`

Note: Browsers may show a warning when downloading files (PDF/ICS) over plain HTTP. In production on
Vercel it will be HTTPS, so those warnings disappear.

## 2) If you want HTTPS in local dev (recommended for mobile downloads)

### Option A — Cloudflare Tunnel (free)

1. Install `cloudflared`
2. From your project root, with the dev server running on port 3000:
   - `cloudflared tunnel --url http://localhost:3000`

Cloudflare will give you a public HTTPS URL you can open from your phone.

### Option B — ngrok

1. Install ngrok
2. Run:
   - `ngrok http 3000`

Open the HTTPS forwarding URL on your phone.

## 3) Verifying a purchase end‑to‑end

You can verify booking + invoice PDF + calendar ICS endpoints from terminal:

```bash
npm run dev

# use the real Stripe session_id from /checkout/success?session_id=...
npm run verify:purchase -- \
  --session cs_test_... \
  --token local-dev \
  --base http://localhost:3000
```

If you run it from the wrong folder and get `MODULE_NOT_FOUND`, make sure you're inside the
repository root (the one that contains the `scripts/` folder).
