#!/usr/bin/env bash
# Provision the ISO Certification Ecosystem (demo): verifiable registry
# service (ECS-Organization from Helvetia + self-issued ECS-Service) owning a
# trust registry with the ISO 9001-style (demo) schema.
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
ok "ISO registry DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# Trust registry + ISO 9001-style (demo) schema + root permission + VTJSC
SCHEMA_JSON=$(jq -c '.' "${VESTA_DIR}/schemas/${SCHEMA_FILE}")
TR_ID=$(ensure_trust_registry "$AGENT_DID" "https://${INGRESS_HOST}" "$EGF_DOC_URL")
CS_ID=$(ensure_schema_with_root "$TR_ID" "$SCHEMA_JSON" "$AGENT_DID")
ensure_jsc "$API" "$CUSTOM_SCHEMA_BASE_ID" "$CS_ID" > /dev/null

ok "ISO Certification Ecosystem provisioned: TR=$TR_ID, CS=$CS_ID"
