#!/usr/bin/env bash
# Provision the Vesta Repair Network (demo) on Verana V4. The agent is a
# delegated sub-service of the Vesta anchor:
#   1. A HOLDER entry on the ECS Service schema. The Vesta anchor validates
#      the onboarding request and issues the ECS Service credential. The
#      service shares the ECS Organization credential of Vesta.
#   2. The Vesta Repair Network Ecosystem: the agent DID controls it, and the
#      vesta Corporation owns it. It has one schema,
#      AuthorizedRepairerCredential (SCHEMA_FILE): issuers join through the
#      Ecosystem, verifiers are OPEN, and a holder gets a HOLDER entry from an
#      issuer. The script also creates the root Participant entry.
# CAUTION: run vesta-03 (Vesta anchor) before this script.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

open_agent
provision_ecs_delegated vesta "$(cast_host vesta)"
provision_cast_ecosystem

ok "Vesta Repair Network provisioned."
