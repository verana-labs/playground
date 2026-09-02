#!/usr/bin/env bash
# Provision Caledonian University (demo) - the awarding body: ECS creds and
# the Qualification registry + schema (one credential per qualification,
# degrees and professional certifications alike). Issuance governed,
# verification OPEN; Cirrus Certification joins as a second accredited
# issuer in bhi-07 - qualifications from any number of institutions.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
source "${CAST_DIR}/scripts/lib.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_OID" 3101
API="http://localhost:3100"
OID_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "Caledonian DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$OID_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

SCHEMA_JSON=$(jq -c '.' "${CAST_DIR}/schemas/${SCHEMA_FILE}")
TR_ID=$(ensure_trust_registry "$AGENT_DID" "https://${INGRESS_HOST}" "$EGF_DOC_URL")
CS_ID=$(ensure_schema_with_root "$TR_ID" "$SCHEMA_JSON" "$AGENT_DID")
ensure_validated_issuer_perm "$CS_ID" "$AGENT_DID"
QUAL_JSC_URL=$(ensure_jsc "$API" "$CUSTOM_SCHEMA_BASE_ID" "$CS_ID")
ensure_anoncreds_credential_type "$API" "Qualification" "1.0" "$QUAL_JSC_URL"

ok "Caledonian provisioned: TR=$TR_ID, Qualification CS=$CS_ID."
