#!/usr/bin/env bash
# Provision DarkPool Exchange (demo), the outsider of the CEXA cast, on
# Verana V4. DarkPool is a real, verifiable exchange (standalone agent): it
# gets the ECS Organization credential from ecs-org-issuer and issues its own
# ECS Service credential. It did not join the Association, so this script
# makes no CEXA Participant entry and no CEXAVerifiedCounterpartyCredential.
#
# CAUTION: a DarkPool entry in a CEXA participant tree, or a
# CEXAVerifiedCounterpartyCredential on its DID, is an incident. The demo
# shows that trust is not membership.
#
# DarkPool asks wallets for the CEXAKycCredential although it holds no
# VERIFIER entry (UNSAFE_SKIP_OWN_AUTHORIZATION in config.env, demo only).
# The wallet must refuse the request.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

start_port_forward "$RELEASE_NAME" 3100
API="http://localhost:3100"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read the agent DID"; exit 1; }
ok "${SERVICE_NAME} DID: $AGENT_DID"

provision_ecs_standalone 3100

ok "${SERVICE_NAME} provisioned: verifiable, and outside the Association."
