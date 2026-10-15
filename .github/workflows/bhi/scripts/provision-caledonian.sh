#!/usr/bin/env bash
# Provision Caledonian University (demo) (bhi-06) on Verana V4, the awarding
# body:
#   1. The ECS credentials: the ECS-Organization credential from ecs-org-issuer
#      and the self-issued ECS-Service credential.
#   2. An Ecosystem controlled by the DID of Caledonian, with the
#      QualificationCredential schema (one credential for each qualification)
#      and its root entry. Issuer onboarding by the Ecosystem, verifier
#      onboarding through a GRANTOR (the certified DVS providers), holders
#      PERMISSIONLESS (personal wallets).
#   3. The ISSUER entry of Caledonian. Cirrus gets a second ISSUER entry in
#      bhi-07.
#   4. The AnonCreds credential definition on the VTJSC (DIDComm rail).
#      OID4VC_ROLE in config.env turns on the OpenID4VC rail.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

bhi_start_agent

# 1. ECS credentials
provision_ecs_standalone 3100

# 2. The Ecosystem and the Qualification schema
QUAL_JSON=$(bhi_schema_json "qualification.json")
ECOSYSTEM_ID=$(ensure_ecosystem "$AGENT_DID")
QUAL_CS_ID=$(ensure_credential_schema "$ECOSYSTEM_ID" "$QUAL_JSON" \
  "$ONBOARDING_MODE_ECOSYSTEM" "$ONBOARDING_MODE_GRANTOR" "$HOLDER_MODE_PERMISSIONLESS")
bhi_ensure_root "$QUAL_CS_ID" "$AGENT_DID" > /dev/null

# 3. The own ISSUER entry
ISSUER_ID=$(join_under_root "$QUAL_CS_ID" "$PP_ROLE_ISSUER" "$VSOA_ISSUER" caledonian)

# 4. The credential definition on the own VTJSC
VTJSC_ID=$(bhi_vtjsc_id "$INGRESS_HOST" "$QUAL_CS_ID")
ensure_credential_definition "$API" "$VTJSC_ID"

ok "Caledonian provisioned: Ecosystem=$ECOSYSTEM_ID, Qualification CS=$QUAL_CS_ID (ISSUER=$ISSUER_ID), VTJSC=$VTJSC_ID"
