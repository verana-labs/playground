#!/usr/bin/env bash
# Provision the Playground Demo anchor on Verana V4:
#   1. The ECS Participant entries of the anchor: an ISSUER entry on the ECS
#      Service schema (OPEN) and a HOLDER entry on the ECS Organization schema.
#   2. The onboarding on ecs-org-issuer, which issues the ECS Organization
#      credential. The agent then issues its own ECS Service credential.
#   3. The Playground Ecosystem (demo), the DemoCredential schema and its root
#      Participant entry.
# The workflow has already deployed the agent with its own account (AGENT_ADDR)
# and the cast Corporation (CORPORATION_ID, CORPORATION).
set -eo pipefail
source "${CAST_DIR}/common.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

start_port_forward "$RELEASE_NAME" 3100
API="http://localhost:3100"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read the agent DID"; exit 1; }
ok "Playground Demo anchor DID: $AGENT_DID"

# 1. ECS Participant entries
ECS_ORG_SCHEMA_ID=$(find_ecs_schema_id "OrganizationCredential")
ECS_SERVICE_SCHEMA_ID=$(find_ecs_schema_id "ServiceCredential")
ok "ECS schemas: organization=$ECS_ORG_SCHEMA_ID service=$ECS_SERVICE_SCHEMA_ID"

ECS_ORG_ISSUER_DID=$(fetch_did_from_log "$ECS_ORG_ISSUER_PUBLIC_URL") \
  || { err "Could not read the DID of $ECS_ORG_ISSUER_PUBLIC_URL"; exit 1; }
ECS_ORG_ISSUER_PARTICIPANT_ID=$(find_active_participant "$ECS_ORG_SCHEMA_ID" "$PP_IDX_ROLE_ISSUER" "$ECS_ORG_ISSUER_DID") \
  || { err "$ECS_ORG_ISSUER_DID has no active ISSUER entry on the ECS Organization schema"; exit 1; }
ECS_SERVICE_ROOT_ID=$(find_root_participant "$ECS_SERVICE_SCHEMA_ID") \
  || { err "The ECS Service schema has no active root participant"; exit 1; }

# The anchor issues its own ECS Service credential, and the ECS Service
# credentials of the delegated demo services.
SERVICE_ISSUER_ID=$(ensure_participant self "$ECS_SERVICE_SCHEMA_ID" "$PP_ROLE_ISSUER" "$ECS_SERVICE_ROOT_ID" \
  "$AGENT_DID" "$VSOA_ISSUER")
# HOLDER is the only role whose vs_operator can send TriggerResolver.
ensure_participant start "$ECS_ORG_SCHEMA_ID" "$PP_ROLE_HOLDER" "$ECS_ORG_ISSUER_PARTICIPANT_ID" \
  "$AGENT_DID" "$VSOA_HOLDER" > /dev/null

# 2. The onboarding on ecs-org-issuer (in the chain namespace)
start_port_forward "$ECS_ORG_ISSUER_RELEASE" 3101 "$ECS_NAMESPACE"
complete_onboarding "http://localhost:3101" "$AGENT_DID"

# The self-issued ECS Service credential (see ensure_self_issued_service_credential).
# A restart ends the port-forward to the anchor, so stop it first.
stop_port_forwards
ensure_self_issued_service_credential "$RELEASE_NAME" "$INGRESS_HOST" "$SERVICE_ISSUER_ID"

# 3. Playground Ecosystem (demo) + DemoCredential schema + root participant
SCHEMA_JSON=$(sed "s/__NETWORK__/${NETWORK}/g" "${CAST_DIR}/schemas/${SCHEMA_FILE}" | jq -c '.')
ECOSYSTEM_ID=$(ensure_ecosystem "$AGENT_DID")
CS_ID=$(ensure_credential_schema "$ECOSYSTEM_ID" "$SCHEMA_JSON")
ROOT_ID=$(ensure_root_participant "$CS_ID" "$AGENT_DID")

ok "Playground Demo anchor provisioned: Ecosystem=$ECOSYSTEM_ID, CS=$CS_ID, root participant=$ROOT_ID"
