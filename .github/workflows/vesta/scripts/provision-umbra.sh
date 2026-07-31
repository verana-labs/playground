#!/usr/bin/env bash
# Provision Umbra Repairs (demo) - the impostor. Deliberately NO credentials,
# NO permissions, NO linked VPs: trust resolution must fail. The one thing it
# gets is an AnonCreds ECS-Badge credential type with explicit attributes
# (anchored to nothing), so it can offer badges the wallet flags red and the
# Vesta portal refuses at login.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
API="http://localhost:3100"

ensure_anoncreds_credential_type "$API" "ECS-Badge" "1.0" "" \
  "badgeNumber,name,photo,title,department,birthDate,biometricPattern,biometricPatternScheme"

ok "Umbra provisioned: unauthorized badge offers only - everything else stays unverifiable."
