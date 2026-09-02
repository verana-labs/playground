#!/usr/bin/env bash
# Provision Meridian Technologies (demo) - the Verified Employer: ECS creds,
# the Verified Employer credential issued by Orchestrating Identity under
# BHI's Recruitment Trust Network (reusable KYB: the validating provider
# identifies Meridian by the ECS-Organization already on its DID), and
# self-created VERIFIER permissions on the three candidate schemas
# (verification is OPEN). That is what stands behind the "Apply with
# Verifiable Credentials" flag: a resolvable credential chain.
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
ok "Meridian DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$OID_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# Verified Employer, issued by OID under the Recruitment Trust Network
VE_SCHEMA_ID=$(discover_ecs_vtjsc "https://${INSTITUTE_HOST}" "$VE_SCHEMA_BASE_ID" | sed -n '2p')
[ -n "$VE_SCHEMA_ID" ] || { err "Could not discover the Verified Employer schema from https://${INSTITUTE_HOST} - run bhi-04 first"; exit 1; }
VE_JSC_URL=$(get_jsc_url "$OID_API" "$VE_SCHEMA_ID")
[ -n "$VE_JSC_URL" ] || VE_JSC_URL="https://${OID_HOST}/vt/schemas-${VE_SCHEMA_BASE_ID}-jsc.json"

if [ "${FORCE_REFRESH:-false}" != "true" ] && has_linked_vp "https://${INGRESS_HOST}" "$VE_SCHEMA_BASE_ID"; then
  ok "Meridian already presents its Verified Employer credential - skipping"
else
  VE_CLAIMS=$(jq -n \
    --arg id "$AGENT_DID" \
    --arg name "$VE_COMPANY_NAME" \
    --arg reg "$VE_COMPANY_REGISTRY_ID" \
    --arg date "$VE_VERIFIED_DATE" \
    '{id: $id, companyName: $name, companyRegistryId: $reg, verifiedDate: $date}')
  issue_remote_and_link "$OID_API" "$API" "$VE_SCHEMA_BASE_ID" "$VE_JSC_URL" "$AGENT_DID" "$VE_CLAIMS"
fi

# VERIFIER permissions on the candidate schemas (verification OPEN)
for pair in "${NORTHBANK_HOST}:${RTW_SCHEMA_BASE_ID}" "${NORTHBANK_HOST}:${EMP_SCHEMA_BASE_ID}" "${CALEDONIAN_HOST}:${QUAL_SCHEMA_BASE_ID}"; do
  host="${pair%%:*}"; base="${pair##*:}"
  cs_id=$(discover_ecs_vtjsc "https://${host}" "$base" | sed -n '2p')
  [ -n "$cs_id" ] || { err "Could not discover the ${base} schema from https://${host}"; exit 1; }
  ensure_open_perm "$cs_id" verifier "$AGENT_DID"
done

ok "Meridian provisioned: a Verified Employer that may ask for exactly what it verifies."
