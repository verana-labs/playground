#!/usr/bin/env bash
# Provision Umbra Repairs (demo) - the impostor with real credentials.
# Umbra IS a verifiable organization: ECS-Organization from Helvetia, a
# self-issued ECS-Service, and ECS-Badge issuer capability. What it does NOT
# have - deliberately, ever - is the Authorized Repairer credential: only the
# Vesta Repair Network issues those, and it never accredited Umbra. Its
# badges are refused at the Vesta portal and earn no seal at the door.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_HELVETIA" 3101
API="http://localhost:3100"
HELVETIA_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "Umbra DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# ECS-Badge issuer capability (schema is issuer-mode OPEN)
BADGE_ID=$(discover_ecs_badge_schema_id)
ensure_open_perm "$BADGE_ID" issuer "$AGENT_DID"
BADGE_JSC_URL=$(ensure_jsc "$API" "badge" "$BADGE_ID")

# Replace the early unanchored ECS-Badge credential type (created before
# Umbra had any credentials) with one derived from the badge VTJSC.
UNANCHORED_ID=$(curl -sf "${API}/v1/credential-types" \
  | jq -r '.[]? | select(.name == "ECS-Badge" and ((.relatedJsonSchemaCredentialId // "") == "")) | .id' | head -1)
if [ -n "$UNANCHORED_ID" ]; then
  log "Removing unanchored ECS-Badge credential type..."
  curl -s -X DELETE "${API}/v1/credential-types/$(printf '%s' "$UNANCHORED_ID" | jq -sRr @uri)" > /dev/null || true
  ok "Unanchored credential type removed"
fi
ensure_anoncreds_credential_type "$API" "ECS-Badge" "1.0" "$BADGE_JSC_URL"

ok "Umbra provisioned: a verifiable organization - and still no Authorized Repairer, by design."
