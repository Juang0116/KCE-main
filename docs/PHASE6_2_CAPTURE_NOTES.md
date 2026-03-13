# PHASE 6.2 — Capture and marketing conversion notes

## What changed
- `CaptureCtas` is now locale-aware and pushes users toward quiz, newsletter, wishlist, and contact.
- `Discover` now opens with faster conversion paths: quiz, contact, and newsletter.
- Home hero reinforces trust and adds deeper marketing links.
- Newsletter page now explains value better and offers paths to contact or quiz.

## Validate
1. Open `/es`, `/es/discover`, and `/es/newsletter`.
2. Confirm CTA links keep the locale prefix (`/es/...`, `/en/...`, etc.).
3. Check that marketing pages feel more guided and reduce “dead-end” browsing.
4. Run `npm run build` and `npm run qa:smoke`.
