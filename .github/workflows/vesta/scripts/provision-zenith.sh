#!/usr/bin/env bash
# Provision Zenith Repairs (demo) on Verana V4:
#   1. The ECS credentials of a standalone organization.
#   2. A HOLDER entry on the AuthorizedRepairerCredential schema. Vesta Iberia
#      validates the onboarding request, sets the AR_* claims and issues the
#      credential.
#   3. The ECS Badge issuer steps (technician badges). When the ECS Ecosystem
#      has no BadgeCredential schema, the script logs a warning and skips them.
# CAUTION: run vesta-08 (Vesta Iberia) before this script.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

open_agent

# 1. ECS credentials
provision_ecs_standalone "$PF_PORT_AGENT"

# 2. Authorized Repairer credential, issued by Vesta Iberia
AR_CS=$(find_cast_schema_id vesta-repair-network "$AR_SCHEMA_TITLE") \
  || { err "No ${AR_SCHEMA_TITLE} schema. Run vesta-06 (Vesta Repair Network) first."; exit 1; }
AR_CLAIMS=$(jq -n \
  --arg name "${AR_NAME:?AR_NAME is not set}" \
  --arg region "${AR_REGION:?AR_REGION is not set}" \
  --arg since "${AR_SINCE:?AR_SINCE is not set}" \
  '{name: $name, region: $region, since: $since}')
hold_credential_from "$AR_CS" vesta-iberia "$AR_CLAIMS"

# 3. ECS Badge issuer (technician badges)
provision_badge_issuer

ok "Zenith provisioned: Authorized Repairer and badge issuer."
