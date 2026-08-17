#!/usr/bin/env bash
# Provision DarkPool Exchange (demo), the outsider of the CEXA cast: a REAL,
# verifiable exchange - ECS-Organization from Helvetia, self-issued
# ECS-Service - that never joined the Association. Deliberately NOTHING
# else: no membership, no CEXA-VerifiedCounterparty, no permission on any
# CEXA schema. Trust is not membership: DarkPool must resolve TRUSTED while
# both membership checks show red. It appearing in either CEXA participant
# tree, or publishing a CEXA-VerifiedCounterparty VP, is a paging incident.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
source "${DEMO_DIR}/scripts/lib.sh"
source "${CAST_DIR}/scripts/lib.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_HELVETIA" 3101
API="http://localhost:3100"
HELVETIA_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "${SERVICE_NAME} DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

ok "${SERVICE_NAME} provisioned: verifiable, and deliberately outside the Association."
