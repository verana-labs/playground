#!/usr/bin/env bash
# Provision the Crypto Exchange Association (demo) anchor: ECS-Organization
# from Helvetia (the Association is NOT an ECS-Organization issuer — only
# accredited issuers of the Verana ECS Ecosystem issue identity), self-issued
# ECS-Service, and the CEXA trust registry anchored on the example EGF with:
#   - CEXA-Kyc, governed on BOTH sides (issuer mode 3, verifier mode 3):
#     both sides of the market are memberships;
#   - CEXA-VerifiedCounterparty (issuer mode 3, verifier mode open/1): the
#     Travel Rule identity, issued only by the Association, free to verify.
# The AnonCreds schema for CEXA-Kyc registers HERE (the VTJSC issuer's host):
# member cred defs resolve it from the anchor DID (the demo-cast precedent).
set -eo pipefail
source "${VESTA_DIR}/common.sh"
source "${DEMO_DIR}/scripts/lib.sh"
source "${CAST_DIR}/scripts/lib.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_HELVETIA" 3101
API="http://localhost:3100"
HELVETIA_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "Association anchor DID: $AGENT_DID"

# ECS-Organization — issued by Helvetia (Verana ECS Ecosystem)
obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"

# ECS-Service — self-issued
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# CEXA trust registry, anchored on the example EGF served by the playground
TR_ID=$(ensure_trust_registry "$AGENT_DID" "https://${INGRESS_HOST}" "$EGF_DOC_URL")

# CEXA-Kyc: governed both sides + root permission + VTJSC
KYC_SCHEMA_JSON=$(jq -c '.' "${CAST_DIR}/schemas/${KYC_SCHEMA_FILE}")
KYC_CS_ID=$(ensure_governed_schema_with_root "$TR_ID" "$KYC_SCHEMA_JSON" "$AGENT_DID")
KYC_JSC_URL=$(ensure_jsc "$API" "$KYC_SCHEMA_BASE_ID" "$KYC_CS_ID")

# AnonCreds schema + cred def for CEXA-Kyc on the anchor (dual rail): this is
# where member cred defs resolve the anonCredsSchema from at presentation time
ensure_credential_type "$API" "$KYC_JSC_URL"

# CEXA-VerifiedCounterparty: issuance governed (Association only), open and
# free verification + root permission + VTJSC + validated ISSUER perm so the
# anchor can issue it to members
CP_SCHEMA_JSON=$(jq -c '.' "${CAST_DIR}/schemas/${COUNTERPARTY_SCHEMA_FILE}")
CP_CS_ID=$(ensure_schema_with_root "$TR_ID" "$CP_SCHEMA_JSON" "$AGENT_DID")
ensure_validated_issuer_perm "$CP_CS_ID" "$AGENT_DID"
CP_JSC_URL=$(ensure_jsc "$API" "$COUNTERPARTY_SCHEMA_BASE_ID" "$CP_CS_ID")

ok "Association provisioned: TR=$TR_ID, CEXA-Kyc CS=$KYC_CS_ID (governed both sides), CEXA-VerifiedCounterparty CS=$CP_CS_ID"
ok "EGF anchored from: $EGF_DOC_URL"
