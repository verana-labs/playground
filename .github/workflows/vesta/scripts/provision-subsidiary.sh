#!/usr/bin/env bash
# Provision a Vesta subsidiary (Iberia / Nordics): ECS-Organization from
# Helvetia, self-issued ECS-Service, ISSUER accreditation on the Authorized
# Repairer schema of the Vesta Repair Network, and its own VTJSC so it can
# issue Authorized Repairer credentials to partners.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_HELVETIA" 3101
API="http://localhost:3100"
HELVETIA_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "Subsidiary DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# ISSUER accreditation on Authorized Repairer (ecosystem-governed)
AR_SCHEMA_ID=$(discover_ecs_vtjsc "https://${REPAIR_NETWORK_HOST}" "$AR_SCHEMA_BASE_ID" | sed -n '2p')
[ -n "$AR_SCHEMA_ID" ] || { err "Could not discover the Authorized Repairer schema from https://${REPAIR_NETWORK_HOST} — run vesta-06 first"; exit 1; }
ensure_validated_issuer_perm "$AR_SCHEMA_ID" "$AGENT_DID"
ensure_jsc "$API" "$AR_SCHEMA_BASE_ID" "$AR_SCHEMA_ID" > /dev/null

ok "Subsidiary provisioned: accredited Authorized Repairer issuer."
