#!/usr/bin/env bash
# Provision the Vesta Portal (demo) on Verana V4. The agent is a delegated
# sub-service of the Vesta anchor:
#   1. A HOLDER entry on the ECS Service schema. The Vesta anchor validates
#      the onboarding request and issues the ECS Service credential.
#   2. An OPEN VERIFIER entry on the BadgeCredential schema of the ECS
#      Ecosystem, for the badge login. When the ECS Ecosystem has no
#      BadgeCredential schema, the script logs a warning and skips this step.
# CAUTION: run vesta-03 (Vesta anchor) before this script.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

open_agent
provision_ecs_delegated vesta "$(cast_host vesta)"
provision_badge_verifier

ok "Vesta Portal provisioned: delegated service and badge verifier."
