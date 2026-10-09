#!/usr/bin/env bash
# Provision Northbank Identity (demo) (bhi-05) on Verana V4, the certified DVS
# issuer of the candidate credentials:
#   1. The ECS credentials: the ECS-Organization credential from ecs-org-issuer
#      and the self-issued ECS-Service credential.
#   2. An Ecosystem controlled by the DID of Northbank, with two schemas and
#      their root entries: RightToWorkCredential (one credential for each
#      person) and EmploymentCredential (one credential for each employment).
#      Issuer onboarding by the Ecosystem, verifier onboarding through a
#      GRANTOR (the certified DVS providers), holders PERMISSIONLESS (personal
#      wallets).
#   3. The ISSUER entries of Northbank on the two schemas.
#   4. The AnonCreds credential definitions on the VTJSCs of the two schemas
#      (DIDComm rail). OID4VC_ROLE in config.env turns on the OpenID4VC rail.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

bhi_start_agent

# 1. ECS credentials
provision_ecs_standalone 3100

# 2. The Ecosystem and the two schemas
ECOSYSTEM_ID=$(ensure_ecosystem "$AGENT_DID")
for FILE in right-to-work.json employment.json; do
  CS_JSON=$(bhi_schema_json "$FILE")
  CS_ID=$(ensure_credential_schema "$ECOSYSTEM_ID" "$CS_JSON" \
    "$ONBOARDING_MODE_ECOSYSTEM" "$ONBOARDING_MODE_GRANTOR" "$HOLDER_MODE_PERMISSIONLESS")
  bhi_ensure_root "$CS_ID" "$AGENT_DID" > /dev/null

  # 3. The own ISSUER entry
  join_under_root "$CS_ID" "$PP_ROLE_ISSUER" "$VSOA_ISSUER" northbank > /dev/null

  # 4. The credential definition on the own VTJSC
  VTJSC_ID=$(bhi_vtjsc_id "$INGRESS_HOST" "$CS_ID")
  ensure_credential_definition "$API" "$VTJSC_ID"
  ok "$(echo "$CS_JSON" | jq -r '.title'): CS=$CS_ID VTJSC=$VTJSC_ID"
done

ok "Northbank provisioned: Ecosystem=$ECOSYSTEM_ID"
