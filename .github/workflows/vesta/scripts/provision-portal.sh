#!/usr/bin/env bash
# Provision the Vesta Portal (demo): delegated ECS-Service issued by the
# Vesta anchor (inherits Vesta's ECS-Organization) and a VERIFIER permission
# on the ECS-Badge schema so it can request badge presentations at login.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_VESTA" 3101
API="http://localhost:3100"
VESTA_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "Portal DID: $AGENT_DID"

# Delegated ECS-Service — issued by the Vesta anchor
obtain_service_credential "$API" "$VESTA_API" "$AGENT_DID" delegated

# VERIFIER permission on ECS-Badge (verifier mode is OPEN)
BADGE_ID=$(discover_ecs_badge_schema_id)
ensure_open_perm "$BADGE_ID" verifier "$AGENT_DID"

ok "Vesta Portal provisioned: delegated service + ECS-Badge verifier."
