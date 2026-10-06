#!/usr/bin/env bash
# Provision a Vesta subsidiary (Iberia or Nordics) on Verana V4:
#   1. The ECS credentials of a standalone organization.
#   2. An ISSUER entry on the AuthorizedRepairerCredential schema. The
#      operator validates it with the Corporation of the Vesta Repair Network
#      Ecosystem (vesta).
# A partner gets its Authorized Repairer credential from a subsidiary: the
# partner sends the onboarding request, and the subsidiary agent validates it.
# CAUTION: run vesta-06 (Vesta Repair Network) before this script.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

open_agent
provision_ecs_standalone "$PF_PORT_AGENT"

AR_CS=$(find_cast_schema_id vesta-repair-network "$AR_SCHEMA_TITLE") \
  || { err "No ${AR_SCHEMA_TITLE} schema. Run vesta-06 (Vesta Repair Network) first."; exit 1; }
ISSUER_ID=$(join_under_root "$AR_CS" "$PP_ROLE_ISSUER" "$VSOA_ISSUER" vesta)

ok "${RELEASE_NAME} provisioned: ISSUER participant $ISSUER_ID on schema $AR_CS."
