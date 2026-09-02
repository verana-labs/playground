#!/usr/bin/env bash
# Provision Halcyon Talent (demo) - the impostor with real credentials.
# Halcyon IS a verifiable organisation: ECS-Organization from Orchestrating
# Identity and a self-issued ECS-Service, so Q1 resolves TRUSTED. What it
# never gets - deliberately, ever - is a Verified Employer credential or any
# VERIFIER permission on the candidate schemas: the wallet refuses its
# requests before any data moves. Legitimate organisation, wrong network.
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
ok "Halcyon DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$OID_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

ok "Halcyon provisioned: a verifiable organisation - and still no Verified Employer, by design."
