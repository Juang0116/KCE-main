#!/usr/bin/env bash
set -euo pipefail

# KCE CRM Smoke Test (local)
#
# Run:
#   ADMIN_USER='your_admin_user' ADMIN_PASS='your_admin_pass' ./scripts/crm_smoke_test.sh
#
# Optional:
#   BASE_URL=http://localhost:3000

BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_USER="${ADMIN_USER:?Set ADMIN_USER env var}"
ADMIN_PASS="${ADMIN_PASS:?Set ADMIN_PASS env var}"
AUTH="$ADMIN_USER:$ADMIN_PASS"

echo "==> 1) Health"
curl -s "$BASE_URL/api/health" | head -c 400
echo -e "\n"

echo "==> 2) List tickets (grab first ticketId + conversationId)"
TICKETS_JSON=$(curl -s -u "$AUTH" "$BASE_URL/api/admin/tickets")

TICKET_ID=$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(0,'utf8')); process.stdout.write(j?.items?.[0]?.id||'')" <<<"$TICKETS_JSON")
CONV_ID=$(node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(0,'utf8')); process.stdout.write(j?.items?.[0]?.conversation_id||'')" <<<"$TICKETS_JSON")

if [[ -z "$TICKET_ID" ]]; then
  echo "No tickets found. Create one in Supabase or via your UI first." >&2
  exit 1
fi

echo "ticketId=$TICKET_ID"
echo "conversationId=$CONV_ID"

echo "==> 3) Reply to ticket (creates message + updates ticket status)"
curl -s -u "$AUTH" \
  -X POST "$BASE_URL/api/admin/tickets/$TICKET_ID/reply" \
  -H "Content-Type: application/json" \
  -d '{"content":"Smoke test reply ✅"}'

echo -e "\n"

echo "==> 4) Fetch ticket detail (should include ticket + conversation + messages)"
curl -s -u "$AUTH" "$BASE_URL/api/admin/tickets/$TICKET_ID" | head -c 2500

echo -e "\n"

echo "==> 5) Close ticket"
curl -s -u "$AUTH" \
  -X POST "$BASE_URL/api/admin/tickets/$TICKET_ID/reply" \
  -H "Content-Type: application/json" \
  -d '{"content":"Closing via smoke test ✅","close":true}'

echo -e "\nDone ✅"
