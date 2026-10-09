#!/usr/bin/env bash
# Provision Orchestrating Identity (bhi-01) on Verana V4:
#   1. The ECS credentials: the ECS-Organization credential from ecs-org-issuer
#      and the self-issued ECS-Service credential.
#   2. The DVS-Aligned Provider Ecosystem (demo), controlled by the DID of
#      Orchestrating Identity, with the DVSAlignedProviderCredential schema
#      and its root entry. Issuer onboarding by the Ecosystem, verifier
#      onboarding OPEN, holders onboard through an issuer.
#   3. The ISSUER entry of Orchestrating Identity on that schema. This entry
#      validates the HOLDER entries of the other certified providers (TVS).
#   4. The Verified Employer branch (provision_ve_issuer_branch, cast.sh),
#      when the Institute Ecosystem exists (bhi-04).
#   5. The VERIFIER_GRANTOR entries on the candidate schemas
#      (provision_verifier_grantor_branches, cast.sh), when the Northbank and
#      Caledonian Ecosystems exist (bhi-05, bhi-06).
# Steps 4 and 5 need workflows that run later. Run this workflow again with
# step=provision after bhi-06. Each step is idempotent.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

bhi_start_agent

# 1. ECS credentials
provision_ecs_standalone 3100

# 2. DVS-Aligned Provider Ecosystem (demo)
DVS_JSON=$(bhi_schema_json "dvs-aligned-provider.json")
ECOSYSTEM_ID=$(ensure_ecosystem "$AGENT_DID")
DVS_CS_ID=$(ensure_credential_schema "$ECOSYSTEM_ID" "$DVS_JSON" \
  "$ONBOARDING_MODE_ECOSYSTEM" "$ONBOARDING_MODE_OPEN" "$HOLDER_MODE_ISSUER_OP")
bhi_ensure_root "$DVS_CS_ID" "$AGENT_DID" > /dev/null

# 3. The own ISSUER entry. Orchestrating Identity has no DVS-Aligned Provider
# credential of its own: this entry is the proof of its role.
DVS_ISSUER_ID=$(join_under_root "$DVS_CS_ID" "$PP_ROLE_ISSUER" "$VSOA_ISSUER" oid)

# 4. and 5. The grantor branches
provision_ve_issuer_branch
provision_verifier_grantor_branches

ok "Orchestrating Identity provisioned: Ecosystem=$ECOSYSTEM_ID, DVS CS=$DVS_CS_ID, ISSUER=$DVS_ISSUER_ID"
