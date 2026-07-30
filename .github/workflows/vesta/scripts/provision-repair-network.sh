#!/usr/bin/env bash
# Provision the Vesta Repair Network (demo): delegated ECS-Service issued by
# the Vesta anchor (the registry inherits Vesta's ECS-Organization), plus the
# Repair Network trust registry with the Authorized Repairer schema.
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
ok "Repair Network registry DID: $AGENT_DID"

# Delegated ECS-Service — issued by the Vesta anchor; ECS-Organization is
# inherited from the issuer, so none is linked here.
obtain_service_credential "$API" "$VESTA_API" "$AGENT_DID" delegated

# Trust registry + Authorized Repairer schema + root permission + VTJSC
SCHEMA_JSON=$(jq -c '.' "${VESTA_DIR}/schemas/${SCHEMA_FILE}")
TR_ID=$(ensure_trust_registry "$AGENT_DID" "https://${INGRESS_HOST}" "$EGF_DOC_URL")
CS_ID=$(ensure_schema_with_root "$TR_ID" "$SCHEMA_JSON" "$AGENT_DID")
ensure_jsc "$API" "$CUSTOM_SCHEMA_BASE_ID" "$CS_ID" > /dev/null

ok "Vesta Repair Network provisioned: TR=$TR_ID, CS=$CS_ID"
