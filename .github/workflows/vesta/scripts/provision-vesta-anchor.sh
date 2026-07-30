#!/usr/bin/env bash
# Provision the Vesta Appliances anchor: ECS-Organization issued by Helvetia
# (org-to-org via Admin APIs), self-issued ECS-Service, and ECS-Badge issuer
# capability (permission + VTJSC) for employee badges.
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
ok "Vesta anchor DID: $AGENT_DID"

# ECS-Organization — issued by Helvetia
obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"

# ECS-Service — self-issued
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# ECS-Badge issuer capability (schema is issuer-mode OPEN)
BADGE_ID=$(discover_ecs_badge_schema_id)
ensure_open_perm "$BADGE_ID" issuer "$AGENT_DID"
ensure_jsc "$API" "badge" "$BADGE_ID" > /dev/null

ok "Vesta anchor provisioned: verifiable organization + badge issuer."
