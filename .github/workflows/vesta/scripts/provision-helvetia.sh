#!/usr/bin/env bash
# Provision Helvetia Trust Services (demo): bootstrap ECS-Organization from
# the ECS trust registry, self-issue ECS-Service. The ISSUER accreditation on
# the ECS-Organization schema is granted separately by vesta-02 (it requires
# the ECS ecosystem account).
set -eo pipefail
source "${VESTA_DIR}/common.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
API="http://localhost:3100"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "Helvetia DID: $AGENT_DID"

# ECS-Organization — bootstrapped from the ECS trust registry's Admin API
obtain_ecs_org_credential "$API" "$ECS_TR_ADMIN_API" "$AGENT_DID"

# ECS-Service — self-issued (ISSUER permission on the ECS-Service schema is
# OPEN, so the account creates it directly)
obtain_service_credential "$API" "$API" "$AGENT_DID" self

ok "Helvetia provisioned. Next: run 'Vesta 02' to accredit it as ECS-Organization issuer."
