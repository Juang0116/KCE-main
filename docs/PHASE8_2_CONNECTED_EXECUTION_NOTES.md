# Phase 8.2 — Connected execution loop

This phase tightens the operational loop between admin panels so the team can move faster:

- Sales now frames the daily loop: detect → execute → confirm.
- Outbound now frames the queue in execution order: pending → replies → failures.
- Metrics now makes navigation to action panels explicit.
- Revenue now makes navigation to the exact optimization panels explicit.

## Validation

1. `npm run build`
2. `npm run qa:smoke`
3. Review visually:
   - `/admin/sales`
   - `/admin/outbound`
   - `/admin/metrics`
   - `/admin/revenue`

## Goal

Make the admin feel like one connected execution system, not isolated dashboards.
