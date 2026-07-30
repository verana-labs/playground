#!/usr/bin/env bash
# Provision one Playground demo cast service: delegated ECS-Service issued by
# the Playground Demo anchor (inherits the Playground Organization ECS-Org),
# plus the DemoCredential permission its role requires (DEMO_PERM from the
# org's config.env):
#   issuer   — ecosystem-validated ISSUER permission + local VTJSC
#   verifier — self-created VERIFIER permission (verifier mode is OPEN)
#   none     — no permission by design (the trusted-but-unaccredited services)
set -eo pipefail
source "${VESTA_DIR}/common.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

R_ANCHOR="playground-demo"
ANCHOR_HOST="${R_ANCHOR}.$(cast_zone)"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_ANCHOR" 3101
API="http://localhost:3100"
ANCHOR_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "${SERVICE_NAME} DID: $AGENT_DID"

# Delegated ECS-Service — issued by the Playground Demo anchor
obtain_service_credential "$API" "$ANCHOR_API" "$AGENT_DID" delegated

# DemoCredential permission per role
case "${DEMO_PERM:-none}" in
  issuer)
    CS_ID=$(discover_ecs_vtjsc "https://${ANCHOR_HOST}" "demo-credential" | sed -n '2p')
    [ -n "$CS_ID" ] || { err "Could not discover the DemoCredential schema from ${ANCHOR_HOST}"; exit 1; }
    ensure_validated_issuer_perm "$CS_ID" "$AGENT_DID"
    ensure_jsc "$API" "demo-credential" "$CS_ID" > /dev/null
    ;;
  verifier)
    CS_ID=$(discover_ecs_vtjsc "https://${ANCHOR_HOST}" "demo-credential" | sed -n '2p')
    [ -n "$CS_ID" ] || { err "Could not discover the DemoCredential schema from ${ANCHOR_HOST}"; exit 1; }
    ensure_open_perm "$CS_ID" verifier "$AGENT_DID"
    ;;
  none)
    ok "No DemoCredential permission by design (trusted, unaccredited)"
    ;;
  *)
    err "Unknown DEMO_PERM '${DEMO_PERM}' — use issuer | verifier | none"
    exit 1
    ;;
esac

ok "${SERVICE_NAME} provisioned (DEMO_PERM=${DEMO_PERM:-none})"
