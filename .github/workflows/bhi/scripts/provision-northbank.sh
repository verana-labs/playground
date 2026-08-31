#!/usr/bin/env bash
# Provision Northbank Identity (demo) - the certified DVS issuer of the
# candidate credentials: ECS-Organization from Orchestrating Identity,
# self-issued ECS-Service, and its registry with the Right to Work schema
# (exactly one credential per person) and the Employment schema (one
# credential per employment relationship; HMRC is the data source under the
# DUAA 2025 gateway, never the issuer). Issuance governed, verification
# OPEN. Also creates the AnonCreds credential types for the DIDComm rail.
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
ok "Northbank DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$OID_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

TR_ID=$(ensure_trust_registry "$AGENT_DID" "https://${INGRESS_HOST}" "$EGF_DOC_URL")

RTW_JSON=$(jq -c '.' "${CAST_DIR}/schemas/${RTW_SCHEMA_FILE}")
RTW_CS_ID=$(ensure_schema_with_root "$TR_ID" "$RTW_JSON" "$AGENT_DID")
ensure_validated_issuer_perm "$RTW_CS_ID" "$AGENT_DID"
RTW_JSC_URL=$(ensure_jsc "$API" "$RTW_SCHEMA_BASE_ID" "$RTW_CS_ID")
ensure_anoncreds_credential_type "$API" "RightToWork" "1.0" "$RTW_JSC_URL"

EMP_JSON=$(jq -c '.' "${CAST_DIR}/schemas/${EMP_SCHEMA_FILE}")
EMP_CS_ID=$(ensure_schema_with_root "$TR_ID" "$EMP_JSON" "$AGENT_DID")
ensure_validated_issuer_perm "$EMP_CS_ID" "$AGENT_DID"
EMP_JSC_URL=$(ensure_jsc "$API" "$EMP_SCHEMA_BASE_ID" "$EMP_CS_ID")
ensure_anoncreds_credential_type "$API" "Employment" "1.0" "$EMP_JSC_URL"

ok "Northbank provisioned: TR=$TR_ID, RTW CS=$RTW_CS_ID, Employment CS=$EMP_CS_ID."
