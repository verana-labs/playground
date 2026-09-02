#!/usr/bin/env bash
# Provision JobSearch (demo) - the recognised verifier, onboarded by the
# SECOND grantor: its ECS-Organization comes from Trustworthy Verification
# Services (demo), not from Orchestrating Identity - same schemas, same
# rules, same verdict in the candidate's wallet; nothing depends on which
# certified provider did the onboarding. Also receives the Recognised
# RecTech Provider credential from BHI (ECOSYSTEM issuance) and self-creates
# VERIFIER permissions on the three candidate schemas.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
source "${CAST_DIR}/scripts/lib.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_TVS" 3101
start_port_forward "$R_INSTITUTE" 3102
API="http://localhost:3100"
TVS_API="http://localhost:3101"
INSTITUTE_API="http://localhost:3102"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "JobSearch DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$TVS_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# Recognised RecTech Provider, issued by BHI
RRP_SCHEMA_ID=$(discover_ecs_vtjsc "https://${INSTITUTE_HOST}" "$RRP_SCHEMA_BASE_ID" | sed -n '2p')
[ -n "$RRP_SCHEMA_ID" ] || { err "Could not discover the Recognised RecTech Provider schema from https://${INSTITUTE_HOST} - run bhi-04 first"; exit 1; }
RRP_JSC_URL=$(get_jsc_url "$INSTITUTE_API" "$RRP_SCHEMA_ID")
[ -n "$RRP_JSC_URL" ] || RRP_JSC_URL="https://${INSTITUTE_HOST}/vt/schemas-${RRP_SCHEMA_BASE_ID}-jsc.json"

if [ "${FORCE_REFRESH:-false}" != "true" ] && has_linked_vp "https://${INGRESS_HOST}" "$RRP_SCHEMA_BASE_ID"; then
  ok "JobSearch already presents its Recognised RecTech Provider credential - skipping"
else
  RRP_CLAIMS=$(jq -n \
    --arg id "$AGENT_DID" \
    --arg name "$RRP_PROVIDER_NAME" \
    --arg since "$RRP_MEMBER_SINCE" \
    '{id: $id, providerName: $name, memberSince: $since}')
  issue_remote_and_link "$INSTITUTE_API" "$API" "$RRP_SCHEMA_BASE_ID" "$RRP_JSC_URL" "$AGENT_DID" "$RRP_CLAIMS"
fi

# VERIFIER permissions on the candidate schemas (verification OPEN)
for pair in "${NORTHBANK_HOST}:${RTW_SCHEMA_BASE_ID}" "${NORTHBANK_HOST}:${EMP_SCHEMA_BASE_ID}" "${CALEDONIAN_HOST}:${QUAL_SCHEMA_BASE_ID}"; do
  host="${pair%%:*}"; base="${pair##*:}"
  cs_id=$(discover_ecs_vtjsc "https://${host}" "$base" | sed -n '2p')
  [ -n "$cs_id" ] || { err "Could not discover the ${base} schema from https://${host}"; exit 1; }
  ensure_open_perm "$cs_id" verifier "$AGENT_DID"
done

ok "JobSearch provisioned: recognised verifier, onboarded by the second grantor."
