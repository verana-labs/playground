#!/usr/bin/env bash
# Provision Zenith Repairs (demo): ECS-Organization from Helvetia,
# self-issued ECS-Service, Authorized Repairer credential received from Vesta
# Iberia (org-to-org via Admin APIs), and ECS-Badge issuer capability for its
# technicians.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_HELVETIA" 3101
start_port_forward "$R_IBERIA" 3102
API="http://localhost:3100"
HELVETIA_API="http://localhost:3101"
IBERIA_API="http://localhost:3102"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "Zenith DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# Authorized Repairer — issued by Vesta Iberia, linked on Zenith
AR_SCHEMA_ID=$(discover_ecs_vtjsc "https://${REPAIR_NETWORK_HOST}" "$AR_SCHEMA_BASE_ID" | sed -n '2p')
[ -n "$AR_SCHEMA_ID" ] || { err "Could not discover the Authorized Repairer schema — run vesta-06 first"; exit 1; }

if [ "${FORCE_REFRESH:-false}" != "true" ] && has_linked_vp "https://${INGRESS_HOST}" "$AR_SCHEMA_BASE_ID"; then
  ok "Authorized Repairer credential already linked — skipping"
else
  AR_JSC_URL=$(get_jsc_url "$IBERIA_API" "$AR_SCHEMA_ID")
  [ -n "$AR_JSC_URL" ] || { err "Vesta Iberia has no Authorized Repairer VTJSC — run vesta-08 first"; exit 1; }
  AR_CLAIMS=$(jq -n \
    --arg id "$AGENT_DID" \
    --arg name "$AR_NAME" \
    --arg region "$AR_REGION" \
    --arg since "$AR_SINCE" \
    '{id: $id, name: $name, region: $region, since: $since}')
  issue_remote_and_link "$IBERIA_API" "$API" "$AR_SCHEMA_BASE_ID" "$AR_JSC_URL" "$AGENT_DID" "$AR_CLAIMS"
fi

# ECS-Badge issuer capability for technician badges
BADGE_ID=$(discover_ecs_badge_schema_id)
ensure_open_perm "$BADGE_ID" issuer "$AGENT_DID"
BADGE_JSC_URL=$(ensure_jsc "$API" "badge" "$BADGE_ID")

# AnonCreds credential type so the agent can mint badge offers to wallets
ensure_anoncreds_credential_type "$API" "ECS-Badge" "1.0" "$BADGE_JSC_URL"

ok "Zenith provisioned: authorized repairer + technician badge issuer."
