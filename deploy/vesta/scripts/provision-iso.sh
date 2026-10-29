#!/usr/bin/env bash
# Provision the ISO Certification Ecosystem (demo) on Verana V4:
#   1. The ECS credentials of a standalone organization.
#   2. The ISO Certification Ecosystem: the agent DID controls it. It has one
#      schema, ISO9001DemoCredential (SCHEMA_FILE): issuers join through the
#      Ecosystem, verifiers are OPEN, and a holder gets a HOLDER entry from an
#      issuer. The script also creates the root Participant entry.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

open_agent
provision_ecs_standalone "$PF_PORT_AGENT"
provision_cast_ecosystem

ok "ISO Certification Ecosystem provisioned."
