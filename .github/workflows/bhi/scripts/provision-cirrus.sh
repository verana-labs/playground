#!/usr/bin/env bash
# Provision Cirrus Certification (demo) - the SECOND Qualification issuer:
# ECS creds plus an ISSUER permission on the Qualification schema owned by
# Caledonian's registry (the NormaCert precedent: same controller account
# validates the permission). One credential per qualification, from any
# number of institutions - David's "multiple qualifications" answer, live.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
source "${CAST_DIR}/scripts/lib.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_OID" 3101
API="http://localhost:3100"
OID_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "Cirrus DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$OID_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

QUAL_SCHEMA_ID=$(discover_ecs_vtjsc "https://${CALEDONIAN_HOST}" "$QUAL_SCHEMA_BASE_ID" | sed -n '2p')
[ -n "$QUAL_SCHEMA_ID" ] || { err "Could not discover the Qualification schema from https://${CALEDONIAN_HOST} - run bhi-06 first"; exit 1; }
ensure_validated_issuer_perm "$QUAL_SCHEMA_ID" "$AGENT_DID"
QUAL_JSC_URL=$(ensure_jsc "$API" "$QUAL_SCHEMA_BASE_ID" "$QUAL_SCHEMA_ID")
ensure_anoncreds_credential_type "$API" "Qualification" "1.0" "$QUAL_JSC_URL"

ok "Cirrus provisioned: second accredited Qualification issuer."
