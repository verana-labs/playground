#!/usr/bin/env bash
# Provision the Crypto Exchange Association (demo) on Verana V4:
#   1. The ECS credentials of the Association (standalone agent): the
#      ECS Organization credential from ecs-org-issuer and the self-issued
#      ECS Service credential. The Association is NOT an ECS Organization
#      issuer (EGF section 4).
#   2. The Ecosystem "Crypto Exchange Association (demo)". The Association
#      agent is its controller. The EGF document is EGF_DOC_URL (config.env).
#   3. The CEXAKycCredential schema and its root Participant entry. Issuers
#      and verifiers onboard through the Ecosystem, holders are PERMISSIONLESS.
#   4. The CEXAVerifiedCounterpartyCredential schema and its root Participant
#      entry. Issuers onboard through the Ecosystem, verifiers are OPEN, and
#      holders get a HOLDER entry from an issuer (ISSUER_ONBOARDING_PROCESS).
#   5. The ISSUER entry of the Association on the counterparty schema. The
#      Association agent validates the HOLDER onboarding of each member with it.
# The workflow has already deployed the agent with its own account (AGENT_ADDR)
# and the Corporation of the Association (CORPORATION_ID, CORPORATION).
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

start_port_forward "$RELEASE_NAME" 3100
API="http://localhost:3100"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read the agent DID"; exit 1; }
ok "Association DID: $AGENT_DID"

# 1. ECS credentials
provision_ecs_standalone 3100

# 2. The Ecosystem of the Association
ECOSYSTEM_ID=$(ensure_ecosystem "$AGENT_DID")

# 3. CEXAKycCredential: governed on both sides, holders PERMISSIONLESS
KYC_JSON=$(cexa_schema_json "cexa-kyc.json")
KYC_CS_ID=$(ensure_credential_schema "$ECOSYSTEM_ID" "$KYC_JSON" \
  "$ONBOARDING_MODE_ECOSYSTEM" "$ONBOARDING_MODE_ECOSYSTEM" "$HOLDER_MODE_PERMISSIONLESS")
ensure_root_participant "$KYC_CS_ID" "$AGENT_DID" > /dev/null

# 4. CEXAVerifiedCounterpartyCredential: issuance governed, verification OPEN,
#    one HOLDER entry for each member
CP_JSON=$(cexa_schema_json "cexa-verified-counterparty.json")
CP_CS_ID=$(ensure_credential_schema "$ECOSYSTEM_ID" "$CP_JSON" \
  "$ONBOARDING_MODE_ECOSYSTEM" "$ONBOARDING_MODE_OPEN" "$HOLDER_MODE_ISSUER_OP")
ensure_root_participant "$CP_CS_ID" "$AGENT_DID" > /dev/null

# 5. The ISSUER entry of the Association on the counterparty schema. The
#    Corporation operator validates it against the root entry.
wait_root_participant "$CP_CS_ID"
CP_ISSUER_ID=$(join_under_root "$CP_CS_ID" "$PP_ROLE_ISSUER" "$VSOA_ISSUER" "$CORPORATION_KEY")

# The agent publishes a VTJSC for each schema. The members need them.
KYC_VTJSC_ID=$(wait_vtjsc_credential_id "https://${INGRESS_HOST}" "$KYC_CS_ID")
CP_VTJSC_ID=$(wait_vtjsc_credential_id "https://${INGRESS_HOST}" "$CP_CS_ID")

ok "Association provisioned: Ecosystem=$ECOSYSTEM_ID"
ok "  ${KYC_TITLE}: schema=$KYC_CS_ID VTJSC=$KYC_VTJSC_ID"
ok "  ${COUNTERPARTY_TITLE}: schema=$CP_CS_ID VTJSC=$CP_VTJSC_ID ISSUER participant=$CP_ISSUER_ID"
ok "  EGF document: $EGF_DOC_URL"
