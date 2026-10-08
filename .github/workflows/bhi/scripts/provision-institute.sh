#!/usr/bin/env bash
# Provision the Better Hiring Institute (bhi-04) on Verana V4:
#   1. The ECS credentials: the ECS-Organization credential from ecs-org-issuer
#      and the self-issued ECS-Service credential.
#   2. The Recruitment Trust Network: an Ecosystem controlled by the DID of
#      the Institute, with two schemas and their root entries:
#        RecognisedRecTechProviderCredential — issuer onboarding by the
#          Ecosystem, verifier onboarding OPEN, holders onboard through an
#          issuer;
#        VerifiedEmployerCredential — issuer onboarding through a GRANTOR,
#          verifier onboarding OPEN, holders onboard through an issuer. The
#          certified DVS providers hold the ISSUER_GRANTOR entries (bhi-01 and
#          bhi-03, second pass).
#   3. The ISSUER entry of the Institute on the Recognised RecTech Provider
#      schema. This entry validates the HOLDER entry of JobSearch (bhi-09).
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

bhi_start_agent

# 1. ECS credentials
provision_ecs_standalone 3100

# 2. The Recruitment Trust Network
ECOSYSTEM_ID=$(ensure_ecosystem "$AGENT_DID")

RRP_JSON=$(bhi_schema_json "recognised-rectech-provider.json")
RRP_CS_ID=$(ensure_credential_schema "$ECOSYSTEM_ID" "$RRP_JSON" \
  "$ONBOARDING_MODE_ECOSYSTEM" "$ONBOARDING_MODE_OPEN" "$HOLDER_MODE_ISSUER_OP")
bhi_ensure_root "$RRP_CS_ID" "$AGENT_DID" > /dev/null

VE_JSON=$(bhi_schema_json "verified-employer.json")
VE_CS_ID=$(ensure_credential_schema "$ECOSYSTEM_ID" "$VE_JSON" \
  "$ONBOARDING_MODE_GRANTOR" "$ONBOARDING_MODE_OPEN" "$HOLDER_MODE_ISSUER_OP")
bhi_ensure_root "$VE_CS_ID" "$AGENT_DID" > /dev/null

# 3. The own ISSUER entry on the Recognised RecTech Provider schema
RRP_ISSUER_ID=$(join_under_root "$RRP_CS_ID" "$PP_ROLE_ISSUER" "$VSOA_ISSUER" institute)

ok "Better Hiring Institute provisioned: Ecosystem=$ECOSYSTEM_ID, RRP CS=$RRP_CS_ID (ISSUER=$RRP_ISSUER_ID), VE CS=$VE_CS_ID"
ok "Next: run bhi-05 and bhi-06, then bhi-01 and bhi-03 again with step=provision (Verified Employer branches)."
