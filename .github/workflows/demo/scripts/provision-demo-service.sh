#!/usr/bin/env bash
# Provision one delegated demo service on Verana V4:
#   1. A HOLDER entry on the ECS Service schema, validated by the ISSUER entry
#      of the Playground Demo anchor. The agent sends its own Service claims
#      (ECS_CLAIMS_SERVICE_*) on the onboarding request, the anchor validates
#      it and issues the ECS Service credential.
#   2. The DemoCredential Participant entry that the role needs (DEMO_PERM in
#      the config.env of the org):
#        issuer   — ISSUER entry, validated by the Corporation operator
#        verifier — VERIFIER entry, self-created (verifier mode is OPEN)
#        none     — no entry, by design (trusted but not accredited)
#   3. The AnonCreds credential definition, when DEMO_CREDDEF=true.
# The workflow has already deployed the agent with its own account (AGENT_ADDR)
# and the cast Corporation (CORPORATION_ID, CORPORATION).
set -eo pipefail
source "${CAST_DIR}/common.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_ANCHOR" 3101
API="http://localhost:3100"
ANCHOR_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read the agent DID"; exit 1; }
ok "${SERVICE_NAME} DID: $AGENT_DID"

ANCHOR_DID=$(fetch_did_from_log "https://${ANCHOR_HOST}") \
  || { err "Could not read the anchor DID from ${ANCHOR_HOST}. Run demo-01 first."; exit 1; }

# 1. Delegated ECS Service credential
ECS_SERVICE_SCHEMA_ID=$(find_ecs_schema_id "ServiceCredential")
ANCHOR_SERVICE_ISSUER_ID=$(find_active_participant "$ECS_SERVICE_SCHEMA_ID" "$PP_IDX_ROLE_ISSUER" "$ANCHOR_DID") \
  || { err "The anchor has no active ISSUER entry on the ECS Service schema. Run demo-01 first."; exit 1; }
SERVICE_HOLDER_ID=$(ensure_participant start "$ECS_SERVICE_SCHEMA_ID" "$PP_ROLE_HOLDER" "$ANCHOR_SERVICE_ISSUER_ID" \
  "$AGENT_DID" "$VSOA_HOLDER")
complete_onboarding "$ANCHOR_API" "$AGENT_DID" "" "$SERVICE_HOLDER_ID"
wait_until_trusted "$AGENT_DID" "$SERVICE_HOLDER_ID"

# 2. DemoCredential Participant entry per role
if [ "${DEMO_PERM:-none}" != "none" ]; then
  CS_ID=$(find_demo_schema_id "$ANCHOR_DID")
  ROOT_ID=$(find_root_participant "$CS_ID") \
    || { err "The DemoCredential schema has no active root participant"; exit 1; }
fi

case "${DEMO_PERM:-none}" in
  issuer)
    PARTICIPANT_ID=$(ensure_participant start "$CS_ID" "$PP_ROLE_ISSUER" "$ROOT_ID" "$AGENT_DID" "$VSOA_ISSUER")
    set_participant_validated "$PARTICIPANT_ID"
    ;;
  verifier)
    ensure_participant self "$CS_ID" "$PP_ROLE_VERIFIER" "$ROOT_ID" "$AGENT_DID" "$VSOA_VERIFIER" > /dev/null
    ;;
  none)
    ok "No DemoCredential entry, by design (trusted, not accredited)"
    ;;
  *)
    err "Unknown DEMO_PERM '${DEMO_PERM}'. Use issuer, verifier or none."
    exit 1
    ;;
esac

# 3. AnonCreds credential definition for the DemoCredential (DIDComm rail).
# DEMO_CREDDEF=true on the issuer services. The credential definition refers to
# the VTJSC that the anchor publishes.
if [ "${DEMO_CREDDEF:-false}" = "true" ]; then
  [ -n "${CS_ID:-}" ] || CS_ID=$(find_demo_schema_id "$ANCHOR_DID")
  VTJSC_ID=$(fetch_vtjsc_credential_id "https://${ANCHOR_HOST}" "$CS_ID")
  ensure_credential_definition "$API" "$VTJSC_ID"
fi

ok "${SERVICE_NAME} provisioned (DEMO_PERM=${DEMO_PERM:-none}, DEMO_CREDDEF=${DEMO_CREDDEF:-false})"
