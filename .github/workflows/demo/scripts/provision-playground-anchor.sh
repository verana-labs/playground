#!/usr/bin/env bash
# Provision the Playground Demo anchor: ECS-Organization issued by Helvetia
# (from the vesta cast, same cluster/namespace), self-issued ECS-Service, and
# the Playground Ecosystem (demo) trust registry with the DemoCredential
# schema, root permission and VTJSC. Shares common.sh with the vesta cast.
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
ok "Playground Demo anchor DID: $AGENT_DID"

# ECS-Organization — issued by Helvetia
obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"

# ECS-Service — self-issued
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# Playground Ecosystem (demo): trust registry + DemoCredential schema
# (issuer mode ecosystem-governed, verifier mode open) + root perm + VTJSC
SCHEMA_JSON=$(jq -c '.' "${CAST_DIR}/schemas/${SCHEMA_FILE}")
TR_ID=$(ensure_trust_registry "$AGENT_DID" "https://${INGRESS_HOST}" "$EGF_DOC_URL")
CS_ID=$(ensure_schema_with_root "$TR_ID" "$SCHEMA_JSON" "$AGENT_DID")
ensure_jsc "$API" "$CUSTOM_SCHEMA_BASE_ID" "$CS_ID" > /dev/null

ok "Playground Demo anchor provisioned: TR=$TR_ID, CS=$CS_ID"
