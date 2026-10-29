#!/usr/bin/env bash
# Provision Meridian Technologies (demo) (bhi-08) on Verana V4, the Verified
# Employer:
#   1. The ECS credentials: the ECS-Organization credential from ecs-org-issuer
#      and the self-issued ECS-Service credential.
#   2. A HOLDER entry on the VerifiedEmployerCredential schema of the
#      Institute. The Verified Employer ISSUER entry of Orchestrating Identity
#      validates it, and its agent issues the credential with the VE_* claims
#      of config.env.
#   3. A VERIFIER entry on each candidate schema (RightToWork, Employment,
#      Qualification). The VERIFIER_GRANTOR entries of Orchestrating Identity
#      validate them.
# Steps 2 and 3 need the second pass of bhi-01 (step=provision after bhi-06).
# OID4VC_ROLE in config.env turns on the OpenID4VC rail.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

bhi_start_agent

# 1. ECS credentials
provision_ecs_standalone 3100

# 2. Verified Employer, issued by Orchestrating Identity
VE_CS_ID=$(bhi_require_schema "$INSTITUTE_HOST" "$TITLE_VE" "bhi-04")
OID_VE_ISSUER_ID=$(bhi_require_participant "$VE_CS_ID" "$PP_IDX_ROLE_ISSUER" "$OID_HOST" \
  "bhi-01 again with step=provision")
VE_CLAIMS=$(jq -n \
  --arg name "$VE_COMPANY_NAME" \
  --arg reg "$VE_COMPANY_REGISTRY_ID" \
  --arg date "$VE_VERIFIED_DATE" \
  '{companyName: $name, companyRegistryId: $reg, verifiedDate: $date}')
bhi_join_under_agent "$VE_CS_ID" "$PP_ROLE_HOLDER" "$VSOA_HOLDER" "$OID_VE_ISSUER_ID" "$R_OID" "$VE_CLAIMS"

# 3. VERIFIER entries, validated by Orchestrating Identity
provision_candidate_verifier "$OID_HOST" "$R_OID" "bhi-01"

ok "Meridian provisioned: a Verified Employer that may ask for exactly what it verifies"
