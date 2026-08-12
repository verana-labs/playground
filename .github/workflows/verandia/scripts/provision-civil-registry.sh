#!/usr/bin/env bash
# Provision the National Civil Registry (demo): ECS-Organization from the
# National Business Registry (the Republic dogfoods its own register),
# self-issued ECS-Service, and the Verandia Citizen ID trust registry — both
# directions governed: issuance (only the Civil Registry issues) AND
# verification (relying parties must register as VERIFIER, the eIDAS 2
# relying-party rule made structural).
set -eo pipefail
source "${VESTA_DIR}/common.sh"
source "${CAST_DIR}/scripts/lib.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_BUSINESS_REGISTRY" 3101
API="http://localhost:3100"
BUSINESS_REGISTRY_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "Civil Registry DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$BUSINESS_REGISTRY_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# Verandia Citizen ID trust registry + governed schema + root permission + VTJSC
SCHEMA_JSON=$(jq -c '.' "${CAST_DIR}/schemas/${SCHEMA_FILE}")
TR_ID=$(ensure_trust_registry "$AGENT_DID" "https://${INGRESS_HOST}" "$EGF_DOC_URL")
CS_ID=$(ensure_governed_schema_with_root "$TR_ID" "$SCHEMA_JSON" "$AGENT_DID")
ensure_validated_issuer_perm "$CS_ID" "$AGENT_DID"
CITIZEN_JSC_URL=$(ensure_jsc "$API" "$CUSTOM_SCHEMA_BASE_ID" "$CS_ID")

# AnonCreds credential type for the DIDComm offer rail (workflow contract:
# app/lib/verandia-cast.ts looks this type up by name)
ensure_anoncreds_credential_type "$API" "VerandiaCitizenID" "1.0" "$CITIZEN_JSC_URL"

ok "Civil Registry provisioned: TR=$TR_ID, CS=$CS_ID — issuance and verification both governed."
