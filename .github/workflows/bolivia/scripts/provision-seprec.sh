#!/usr/bin/env bash
# Provision the SEPREC (demo): ECS-Organization from
# Helvetia, self-issued ECS-Service, and the Legal Representation trust
# registry with the Legal Representative schema (issuance ecosystem-governed,
# verification open). The register is the ecosystem's sole issuer, so the
# only ISSUER permission in the tree is its own. Its ISSUER accreditation on
# ECS-Organization (Business IDs) is granted separately by bolivia-02.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
source "${CAST_DIR}/scripts/lib.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_HELVETIA" 3101
API="http://localhost:3100"
HELVETIA_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "Business Registry DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# Legal Representation trust registry + schema + root permission + VTJSC
SCHEMA_JSON=$(jq -c '.' "${CAST_DIR}/schemas/${SCHEMA_FILE}")
TR_ID=$(ensure_trust_registry "$AGENT_DID" "https://${INGRESS_HOST}" "$EGF_DOC_URL")
CS_ID=$(ensure_schema_with_root "$TR_ID" "$SCHEMA_JSON" "$AGENT_DID")
ensure_validated_issuer_perm "$CS_ID" "$AGENT_DID"
LEGAL_REP_JSC_URL=$(ensure_jsc "$API" "$CUSTOM_SCHEMA_BASE_ID" "$CS_ID")

# AnonCreds credential type for the DIDComm offer rail (workflow contract:
# app/lib/bolivia-cast.ts looks this type up by name)
ensure_anoncreds_credential_type "$API" "LegalRepresentative" "1.0" "$LEGAL_REP_JSC_URL"

ok "Business Registry provisioned: TR=$TR_ID, CS=$CS_ID. Next: run 'Bolivia 02' to accredit it as ECS-Organization issuer."
