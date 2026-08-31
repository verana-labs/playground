#!/usr/bin/env bash
# Provision Orchestrating Identity: ECS-Organization from Helvetia Trust
# (the vesta cast's accredited KYB issuer), self-issued ECS-Service, and the
# DVS-Aligned Provider Ecosystem (demo) - a registry that mirrors the OfDIA
# DVS register (it does not constitute it): eligibility is register status
# and nothing else. OID is its operator and first credentialed provider. Its
# own ISSUER accreditation on ECS-Organization (the Verana Council decision:
# DVS certification is the accreditation criterion) is granted separately by
# the bhi-02 workflow.
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
ok "Orchestrating Identity DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# DVS-Aligned Provider Ecosystem (demo): registry + schema + root + VTJSC
SCHEMA_JSON=$(jq -c '.' "${CAST_DIR}/schemas/${SCHEMA_FILE}")
TR_ID=$(ensure_trust_registry "$AGENT_DID" "https://${INGRESS_HOST}" "$EGF_DOC_URL")
CS_ID=$(ensure_schema_with_root "$TR_ID" "$SCHEMA_JSON" "$AGENT_DID")
ensure_validated_issuer_perm "$CS_ID" "$AGENT_DID"
DVS_JSC_URL=$(ensure_jsc "$API" "$CUSTOM_SCHEMA_BASE_ID" "$CS_ID")

# OID is itself a certified provider: self-issue its DVS-Aligned Provider
# credential and present it as a linked VP.
if [ "${FORCE_REFRESH:-false}" != "true" ] && has_linked_vp "https://${INGRESS_HOST}" "$CUSTOM_SCHEMA_BASE_ID"; then
  ok "Orchestrating Identity already presents its DVS-Aligned Provider credential - skipping"
else
  DVS_CLAIMS=$(jq -n \
    --arg id "$AGENT_DID" \
    --arg name "$DVS_PROVIDER_NAME" \
    --arg status "$DVS_REGISTER_STATUS" \
    --arg checked "$DVS_CHECKED_DATE" \
    '{id: $id, providerName: $name, registerStatus: $status, lastCheckedDate: $checked}')
  issue_remote_and_link "$API" "$API" "$CUSTOM_SCHEMA_BASE_ID" "$DVS_JSC_URL" "$AGENT_DID" "$DVS_CLAIMS"
fi

ok "Orchestrating Identity provisioned: TR=$TR_ID, CS=$CS_ID. Next: run 'BHI 02' to accredit it as ECS-Organization issuer."
