# PHASE 8.1 — Commercial Autopilot

This phase sharpens the daily execution loop inside admin:

- Sales cockpit shows visible/hot/checkout/waiting/tardy counts.
- Outbound shows pending/sent/replied/paid/failed counts.
- Quick chips help focus the team on the right queue without touching backend logic.
- Newsletter locale helper is preserved to avoid regressions.

Validation:
- npm run build
- npm run qa:smoke
- Review /admin/sales and /admin/outbound
