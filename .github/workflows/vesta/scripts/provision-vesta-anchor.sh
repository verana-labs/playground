#!/usr/bin/env bash
# Provision the Vesta Appliances anchor on Verana V4:
#   1. The ECS credentials of a standalone organization (ecs-org-issuer issues
#      the ECS Organization credential, the agent issues its own ECS Service
#      credential, and later the ECS Service credentials of its delegated
#      sub-services vesta-portal and vesta-repair-network).
#   2. The ECS Badge issuer steps: an OPEN ISSUER entry on the BadgeCredential
#      schema and an AnonCreds credential definition. When the ECS Ecosystem
#      has no BadgeCredential schema, the script logs a warning and skips them.
#   3. A HOLDER entry on the ISO 9001-style (demo) schema. NormaCert validates
#      the onboarding request, sets the ISO_* claims and issues the credential.
# CAUTION: step 3 needs the ISO Ecosystem (vesta-04) and the ISSUER entry of
# NormaCert (vesta-05). Run vesta-04 and vesta-05 before this script.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

open_agent

# 1. ECS credentials
provision_ecs_standalone "$PF_PORT_AGENT"

# 2. ECS Badge issuer (employee badges)
provision_badge_issuer

# 3. ISO 9001-style (demo) credential, issued by NormaCert
ISO_CS=$(find_cast_schema_id iso-certification "$ISO_SCHEMA_TITLE") \
  || { err "No ${ISO_SCHEMA_TITLE} schema. Run vesta-04 (ISO Certification) first."; exit 1; }
ISO_CLAIMS=$(jq -n \
  --arg num "${ISO_CERT_NUMBER:?ISO_CERT_NUMBER is not set}" \
  --arg std "${ISO_STANDARD:?ISO_STANDARD is not set}" \
  --arg scope "${ISO_SCOPE:?ISO_SCOPE is not set}" \
  --arg until "${ISO_VALID_UNTIL:?ISO_VALID_UNTIL is not set}" \
  '{certificateNumber: $num, standard: $std, scope: $scope, validUntil: $until}')
hold_credential_from "$ISO_CS" normacert "$ISO_CLAIMS"

ok "Vesta anchor provisioned: ECS credentials, badge issuer, ISO 9001-style (demo) credential."
