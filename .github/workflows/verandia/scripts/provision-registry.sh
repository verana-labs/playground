#!/usr/bin/env bash
# Provision a registry of the Republic on Verana V4 (National Business
# Registry, National Civil Registry):
#   1. The ECS credentials: ecs-org-issuer issues the ECS Organization
#      credential, and the agent issues its own ECS Service credential.
#   2. The Ecosystem of the registry, its schema (SCHEMA_FILE) and the root
#      Participant entry. Issuers onboard through the Ecosystem, holders are
#      PERMISSIONLESS (personal wallets), and verifiers onboard as
#      SCHEMA_VERIFIER_MODE tells (OPEN or ECOSYSTEM).
#   3. The ISSUER entry of the registry on its own schema. The Corporation
#      operator validates it, because the root entry is the validator.
#   4. The AnonCreds credential definition on the VTJSC of the schema, for the
#      DIDComm offers. The agent takes the OpenID4VC types from the VPR.
# The workflow has already deployed the agent with its own account (AGENT_ADDR)
# and the Corporation of the registry (CORPORATION_ID, CORPORATION).
#
# CAUTION: the root (ECOSYSTEM) entry and the ISSUER entry name the same DID on
# the same schema. The V4 casts did not use this before.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

start_port_forward "$RELEASE_NAME" 3100
API="http://localhost:3100"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read the agent DID"; exit 1; }
export AGENT_DID
ok "${SERVICE_NAME} DID: $AGENT_DID"

case "${SCHEMA_VERIFIER_MODE:-}" in
  OPEN)      VERIFIER_MODE=$ONBOARDING_MODE_OPEN ;;
  ECOSYSTEM) VERIFIER_MODE=$ONBOARDING_MODE_ECOSYSTEM ;;
  *)
    err "Unknown SCHEMA_VERIFIER_MODE '${SCHEMA_VERIFIER_MODE:-}'. Use OPEN or ECOSYSTEM."
    exit 1
    ;;
esac

# 1. ECS credentials
provision_ecs_standalone 3100

# 2. Ecosystem + schema + root participant
SCHEMA_JSON=$(sed "s/__NETWORK__/${NETWORK}/g" "${CAST_DIR}/schemas/${SCHEMA_FILE}" | jq -c '.')
ECOSYSTEM_ID=$(ensure_ecosystem "$AGENT_DID")
CS_ID=$(ensure_credential_schema "$ECOSYSTEM_ID" "$SCHEMA_JSON" \
  "$ONBOARDING_MODE_ECOSYSTEM" "$VERIFIER_MODE" "$HOLDER_MODE_PERMISSIONLESS")
ROOT_ID=$(ensure_root_participant "$CS_ID" "$AGENT_DID")

# 3. The ISSUER entry of the registry, validated by its own Corporation
wait_root_participant "$CS_ID"
ISSUER_ID=$(join_under_root "$CS_ID" "$PP_ROLE_ISSUER" "$VSOA_ISSUER" "$CORPORATION_KEY")

# 4. AnonCreds credential definition (DIDComm rail)
VTJSC_ID=$(wait_vtjsc_credential_id "https://${INGRESS_HOST}" "$CS_ID")
ensure_credential_definition "$API" "$VTJSC_ID"

ok "${SERVICE_NAME} provisioned: Ecosystem=$ECOSYSTEM_ID, CS=$CS_ID, root participant=$ROOT_ID, issuer participant=$ISSUER_ID"
ok "VTJSC: $VTJSC_ID"
