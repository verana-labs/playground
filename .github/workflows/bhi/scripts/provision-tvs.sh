#!/usr/bin/env bash
# Provision Trustworthy Verification Services (demo) - the SECOND certified
# grantor, the openness argument of the story: ECS-Organization from
# Orchestrating Identity, self-issued ECS-Service, and its DVS-Aligned
# Provider credential from OID's registry. Re-run 'BHI 02' afterwards so the
# ECS ecosystem also accredits TVS as an ECS-Organization issuer (it issues
# JobSearch's ECS-Org in bhi-09).
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
ok "TVS DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$OID_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# DVS-Aligned Provider credential, issued by OID (the ecosystem operator)
DVS_SCHEMA_ID=$(discover_ecs_vtjsc "https://${OID_HOST}" "$DVS_SCHEMA_BASE_ID" | sed -n '2p')
[ -n "$DVS_SCHEMA_ID" ] || { err "Could not discover the DVS-Aligned Provider schema from https://${OID_HOST} - run bhi-01 first"; exit 1; }
DVS_JSC_URL=$(get_jsc_url "$OID_API" "$DVS_SCHEMA_ID")
[ -n "$DVS_JSC_URL" ] || DVS_JSC_URL="https://${OID_HOST}/vt/schemas-${DVS_SCHEMA_BASE_ID}-jsc.json"

if [ "${FORCE_REFRESH:-false}" != "true" ] && has_linked_vp "https://${INGRESS_HOST}" "$DVS_SCHEMA_BASE_ID"; then
  ok "TVS already presents its DVS-Aligned Provider credential - skipping"
else
  DVS_CLAIMS=$(jq -n \
    --arg id "$AGENT_DID" \
    --arg name "$DVS_PROVIDER_NAME" \
    --arg status "$DVS_REGISTER_STATUS" \
    --arg checked "$DVS_CHECKED_DATE" \
    '{id: $id, providerName: $name, registerStatus: $status, lastCheckedDate: $checked}')
  issue_remote_and_link "$OID_API" "$API" "$DVS_SCHEMA_BASE_ID" "$DVS_JSC_URL" "$AGENT_DID" "$DVS_CLAIMS"
fi

ok "TVS provisioned. Next: re-run 'BHI 02' to accredit it as ECS-Organization issuer."
