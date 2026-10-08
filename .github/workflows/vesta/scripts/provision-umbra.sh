#!/usr/bin/env bash
# Provision Umbra Repairs (demo), the impostor with real credentials, on
# Verana V4:
#   1. The ECS credentials of a standalone organization.
#   2. The ECS Badge issuer steps. The ISSUER entry on the BadgeCredential
#      schema is OPEN, so Umbra creates it without a demo flag. When the ECS
#      Ecosystem has no BadgeCredential schema, the script logs a warning and
#      skips them.
# Umbra never gets an Authorized Repairer credential. The Vesta portal
# refuses its badges for this reason only.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

open_agent
provision_ecs_standalone "$PF_PORT_AGENT"
provision_badge_issuer

ok "Umbra provisioned: a verifiable organization and a badge issuer, with no Authorized Repairer credential."
