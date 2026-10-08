#!/usr/bin/env bash
# Provision Trustworthy Verification Services (demo) (bhi-03) on Verana V4,
# the second certified grantor:
#   1. The ECS credentials: the ECS-Organization credential from ecs-org-issuer
#      and the self-issued ECS-Service credential.
#   2. A HOLDER entry on the DVSAlignedProviderCredential schema. The ISSUER
#      entry of Orchestrating Identity validates it, and its agent issues the
#      DVS-Aligned Provider credential with the DVS_* claims of config.env.
#   3. The Verified Employer branch (provision_ve_issuer_branch, cast.sh),
#      when the Institute Ecosystem exists (bhi-04).
#   4. The VERIFIER_GRANTOR entries on the candidate schemas
#      (provision_verifier_grantor_branches, cast.sh), when the Northbank and
#      Caledonian Ecosystems exist (bhi-05, bhi-06). TVS validates the
#      VERIFIER entries of JobSearch (bhi-09).
# Steps 3 and 4 need workflows that run later. Run this workflow again with
# step=provision after bhi-06. Each step is idempotent.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

bhi_start_agent

# 1. ECS credentials
provision_ecs_standalone 3100

# 2. DVS-Aligned Provider credential, issued by Orchestrating Identity
DVS_CS_ID=$(bhi_require_schema "$OID_HOST" "$TITLE_DVS" "bhi-01")
OID_DVS_ISSUER_ID=$(bhi_require_participant "$DVS_CS_ID" "$PP_IDX_ROLE_ISSUER" "$OID_HOST" "bhi-01")
DVS_CLAIMS=$(jq -n \
  --arg name "$DVS_PROVIDER_NAME" \
  --arg status "$DVS_REGISTER_STATUS" \
  --arg checked "$DVS_CHECKED_DATE" \
  '{providerName: $name, registerStatus: $status, lastCheckedDate: $checked}')
bhi_join_under_agent "$DVS_CS_ID" "$PP_ROLE_HOLDER" "$VSOA_HOLDER" "$OID_DVS_ISSUER_ID" "$R_OID" "$DVS_CLAIMS"

# 3. and 4. The grantor branches
provision_ve_issuer_branch
provision_verifier_grantor_branches

ok "TVS provisioned: HOLDER of the DVS-Aligned Provider credential, a certified grantor"
