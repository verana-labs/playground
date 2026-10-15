#!/usr/bin/env bash
# Provision Helvetia Trust Services (demo) on Verana V4. Helvetia is an
# ordinary standalone organization of the cast:
#   1. An ISSUER entry on the ECS Service schema (OPEN). The agent issues its
#      own ECS Service credential.
#   2. A HOLDER entry on the ECS Organization schema. ecs-org-issuer validates
#      the onboarding request and issues the ECS Organization credential.
# On V4, Helvetia is not an ECS Organization issuer: ecs-org-issuer issues the
# ECS Organization credential of every standalone organization of the cast.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

open_agent
provision_ecs_standalone "$PF_PORT_AGENT"

ok "Helvetia Trust Services provisioned: ECS Organization and ECS Service credentials."
