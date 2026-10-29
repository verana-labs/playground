#!/usr/bin/env bash
# Provision JobSearch (demo) (bhi-09) on Verana V4, the recognised verifier
# under the second grantor:
#   1. The ECS credentials: the ECS-Organization credential from ecs-org-issuer
#      and the self-issued ECS-Service credential.
#   2. A HOLDER entry on the RecognisedRecTechProviderCredential schema. The
#      ISSUER entry of the Institute validates it, and its agent issues the
#      credential with the RRP_* claims of config.env.
#   3. A VERIFIER entry on each candidate schema (RightToWork, Employment,
#      Qualification). The VERIFIER_GRANTOR entries of Trustworthy
#      Verification Services (demo) validate them, not those of Orchestrating
#      Identity.
# Step 3 needs the second pass of bhi-03 (step=provision after bhi-06).
# OID4VC_ROLE in config.env turns on the OpenID4VC rail.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

bhi_start_agent

# 1. ECS credentials
provision_ecs_standalone 3100

# 2. Recognised RecTech Provider, issued by the Institute
RRP_CS_ID=$(bhi_require_schema "$INSTITUTE_HOST" "$TITLE_RRP" "bhi-04")
RRP_ISSUER_ID=$(bhi_require_participant "$RRP_CS_ID" "$PP_IDX_ROLE_ISSUER" "$INSTITUTE_HOST" "bhi-04")
RRP_CLAIMS=$(jq -n \
  --arg name "$RRP_PROVIDER_NAME" \
  --arg since "$RRP_MEMBER_SINCE" \
  '{providerName: $name, memberSince: $since}')
bhi_join_under_agent "$RRP_CS_ID" "$PP_ROLE_HOLDER" "$VSOA_HOLDER" "$RRP_ISSUER_ID" "$R_INSTITUTE" "$RRP_CLAIMS"

# 3. VERIFIER entries, validated by TVS
provision_candidate_verifier "$TVS_HOST" "$R_TVS" "bhi-03"

ok "JobSearch provisioned: a recognised verifier, onboarded by the second grantor"
