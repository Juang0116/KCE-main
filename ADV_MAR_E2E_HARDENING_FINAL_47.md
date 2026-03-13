Sprint 47 — E2E hardening final

Incluye:
- RevenueHardeningDeck reutilizable en admin/qa y admin/bookings
- docs/REVENUE_HARDENING_FINAL.md
- QA_E2E ampliado
- verify_purchase.mjs mejorado:
  - token derivado desde success-url
  - valida success_page
  - valida booking_page
  - score final y next actions
- Admin QA con hardening lanes + manual go-live walk

Objetivo:
cerrar la capa final de revenue/recovery para que KCE no solo se vea bien, sino que pueda cobrar, entregar y recuperarse con confianza antes de escalar tráfico.
