#!/usr/bin/env bash
# Provision Prestamista en linea (simulado) - the over-asking verifier. el prestamista IS
# a verifiable company: ECS-Organization from the SEPREC (demo)
# and a self-issued ECS-Service, so Q1 resolves TRUSTED. What it does NOT
# have - deliberately, ever - is a VERIFIER permission on the Bolivia Citizen
# ID: verification of that schema is ecosystem-governed and el prestamista never
# registered as a relying party. Its presentation requests reach the wallet
# and are refused there (Q3). Trust is not authorization.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
source "${CAST_DIR}/scripts/lib.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_BUSINESS_REGISTRY" 3101
API="http://localhost:3100"
BUSINESS_REGISTRY_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "el prestamista DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$BUSINESS_REGISTRY_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

ok "el prestamista provisioned: a verifiable company - and still no Cedula Digital VERIFIER permission, by design."
