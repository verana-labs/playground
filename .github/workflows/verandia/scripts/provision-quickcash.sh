#!/usr/bin/env bash
# Provision QuickCash Loans (demo) - the over-asking verifier. QuickCash IS
# a verifiable company: ECS-Organization from the National Business Registry
# and a self-issued ECS-Service, so Q1 resolves TRUSTED. What it does NOT
# have - deliberately, ever - is a VERIFIER permission on the Verandia Citizen
# ID: verification of that schema is ecosystem-governed and QuickCash never
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
ok "QuickCash DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$BUSINESS_REGISTRY_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

ok "QuickCash provisioned: a verifiable company - and still no Citizen ID VERIFIER permission, by design."
