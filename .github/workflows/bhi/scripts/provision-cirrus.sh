#!/usr/bin/env bash
# Provision Cirrus Certification (demo) (bhi-07) on Verana V4, the second
# Qualification issuer:
#   1. The ECS credentials: the ECS-Organization credential from ecs-org-issuer
#      and the self-issued ECS-Service credential.
#   2. An ISSUER entry on the QualificationCredential schema of Caledonian
#      (bhi-06). The root entry is the validator, so the operator validates
#      the entry with the Corporation of Caledonian.
#   3. The AnonCreds credential definition on the VTJSC that Caledonian
#      publishes (DIDComm rail). OID4VC_ROLE in config.env turns on the
#      OpenID4VC rail.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

bhi_start_agent

# 1. ECS credentials
provision_ecs_standalone 3100

# 2. The ISSUER entry on the Qualification schema of Caledonian
QUAL_CS_ID=$(bhi_require_schema "$CALEDONIAN_HOST" "$TITLE_QUAL" "bhi-06")
ISSUER_ID=$(join_under_root "$QUAL_CS_ID" "$PP_ROLE_ISSUER" "$VSOA_ISSUER" caledonian)

# 3. The credential definition on the VTJSC of Caledonian
VTJSC_ID=$(bhi_vtjsc_id "$CALEDONIAN_HOST" "$QUAL_CS_ID")
ensure_credential_definition "$API" "$VTJSC_ID"

ok "Cirrus provisioned: second Qualification issuer (CS=$QUAL_CS_ID, ISSUER=$ISSUER_ID)"
