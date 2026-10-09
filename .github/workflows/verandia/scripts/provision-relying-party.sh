#!/usr/bin/env bash
# Provision a registered relying party of the Republic on Verana V4 (Tax Buro,
# Meridian Bank):
#   1. The ECS credentials: ecs-org-issuer issues the ECS Organization
#      credential, and the agent issues its own ECS Service credential.
#   2. A VERIFIER entry on the Verandia Citizen ID. The verifier mode is
#      ECOSYSTEM, so the operator of the Civil Registry Corporation validates
#      it: this is the relying-party register of the Republic.
#   3. A VERIFIER entry on the Legal Representative schema. The verifier mode is
#      OPEN, so the entry needs no validation. vs-agent v2 makes no
#      presentation request without an active VERIFIER entry.
# The workflow has already deployed the agent with its own account (AGENT_ADDR)
# and the Corporation of the organization (CORPORATION_ID, CORPORATION).
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

# Find the two schemas first, so that a missing registry stops the run early.
CITIZEN_CS_ID=$(find_registry_schema "$CIVIL_REGISTRY_HOST" "$CITIZEN_ID_TITLE" "verandia-03")
LEGAL_REP_CS_ID=$(find_registry_schema "$BUSINESS_REGISTRY_HOST" "$LEGAL_REP_TITLE" "verandia-01")
ok "Schemas: Citizen ID=$CITIZEN_CS_ID, Legal Representative=$LEGAL_REP_CS_ID"

# 1. ECS credentials
provision_ecs_standalone 3100

# 2. VERIFIER on the Verandia Citizen ID (verifier mode ECOSYSTEM)
CITIZEN_VERIFIER_ID=$(join_under_root "$CITIZEN_CS_ID" "$PP_ROLE_VERIFIER" "$VSOA_VERIFIER" "$R_CIVIL_REGISTRY")

# 3. VERIFIER on the Legal Representative schema (verifier mode OPEN)
LEGAL_REP_VERIFIER_ID=$(join_open "$LEGAL_REP_CS_ID" "$PP_ROLE_VERIFIER" "$VSOA_VERIFIER")

ok "${SERVICE_NAME} provisioned: VERIFIER participants Citizen ID=$CITIZEN_VERIFIER_ID, Legal Representative=$LEGAL_REP_VERIFIER_ID"
