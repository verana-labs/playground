#!/usr/bin/env bash
# Provision the Camara de Comercio de Medellin (demo): ECS-Organization from
# Helvetia (KYB, trivial for the chamber that IS the register), self-issued
# ECS-Service, and the Ecosistema Camara de Comercio (demo) with the
# Representacion Legal schema — issuance ecosystem-governed (only the
# chamber issues) AND verification ecosystem-governed (relying parties must
# register with the chamber: the on-chain seat of the per-verification fee).
# Its ISSUER accreditation on ECS-Organization is granted by ccm-02.
#
# Target deployment note: in production, Confecamaras would own this
# ecosystem and accredit all 57 chambers as issuers; the demo collapses that
# hierarchy into the CCM (demo) to keep the cast at two agents.
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
ok "Camara de Comercio de Medellin DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# Ecosistema Camara de Comercio (demo): trust registry + governed schema +
# root permission (carrying the issuance/verification fees) + VTJSC
SCHEMA_JSON=$(jq -c '.' "${CAST_DIR}/schemas/${SCHEMA_FILE}")
TR_ID=$(ensure_trust_registry "$AGENT_DID" "https://${INGRESS_HOST}" "$EGF_DOC_URL")
CS_ID=$(ensure_governed_schema_with_root "$TR_ID" "$SCHEMA_JSON" "$AGENT_DID")
ensure_validated_issuer_perm "$CS_ID" "$AGENT_DID"
LEGAL_REP_JSC_URL=$(ensure_jsc "$API" "$CUSTOM_SCHEMA_BASE_ID" "$CS_ID")

# AnonCreds credential type for the DIDComm offer rail (workflow contract:
# app/lib/ccm-cast.ts looks this type up by name)
ensure_anoncreds_credential_type "$API" "RepresentacionLegal" "1.0" "$LEGAL_REP_JSC_URL"

ok "CCM provisioned: TR=$TR_ID, CS=$CS_ID — issuance and verification both governed. Next: run 'CCM 02' to accredit it as ECS-Organization issuer."
