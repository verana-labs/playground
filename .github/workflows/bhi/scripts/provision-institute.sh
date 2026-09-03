#!/usr/bin/env bash
# Provision the Better Hiring Institute anchor: ECS-Organization from
# Orchestrating Identity (Council-accredited, DVS-certified), self-issued
# ECS-Service, and the Recruitment Trust Network - deliberately narrow: two
# schemas, both about organisations. Recognised RecTech Provider is issued
# by BHI itself (ECOSYSTEM issuance); Verified Employer is issued by the
# certified DVS providers (OID and, when live, TVS receive ISSUER
# permissions under BHI's ecosystem - v3's closest fit for the GRANTOR
# story). Verification of both schemas is OPEN, per the source spec.
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
ok "BHI DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$OID_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# Recruitment Trust Network: one registry, two schemas
TR_ID=$(ensure_trust_registry "$AGENT_DID" "https://${INGRESS_HOST}" "$EGF_DOC_URL")

RRP_JSON=$(jq -c '.' "${CAST_DIR}/schemas/${RRP_SCHEMA_FILE}")
RRP_CS_ID=$(ensure_schema_with_root "$TR_ID" "$RRP_JSON" "$AGENT_DID")
ensure_validated_issuer_perm "$RRP_CS_ID" "$AGENT_DID"
ensure_jsc "$API" "$RRP_SCHEMA_BASE_ID" "$RRP_CS_ID" > /dev/null

VE_JSON=$(jq -c '.' "${CAST_DIR}/schemas/${VE_SCHEMA_FILE}")
VE_CS_ID=$(ensure_schema_with_root "$TR_ID" "$VE_JSON" "$AGENT_DID")
# The registry owner publishes the canonical VTJSC on its own DID document -
# bhi-08/09 discover the schema id from the institute host (the vesta ISO
# pattern: owner JSC for discovery, issuer-local JSC for issuance).
ensure_jsc "$API" "$VE_SCHEMA_BASE_ID" "$VE_CS_ID" > /dev/null

# The certified DVS providers issue Verified Employer under BHI's ecosystem
OID_DID=$(get_agent_did "$OID_API")
[ -n "$OID_DID" ] || { err "Could not read the Orchestrating Identity DID - run bhi-01 first"; exit 1; }
ensure_validated_issuer_perm "$VE_CS_ID" "$OID_DID"
ensure_jsc "$OID_API" "$VE_SCHEMA_BASE_ID" "$VE_CS_ID" > /dev/null

TVS_DID=$(get_public_did_from_host "$TVS_HOST" || true)
if [ -n "$TVS_DID" ]; then
  ensure_validated_issuer_perm "$VE_CS_ID" "$TVS_DID"
else
  warn "TVS is not live yet - re-run this workflow after bhi-03 to grant its Verified Employer ISSUER permission"
fi

ok "BHI provisioned: TR=$TR_ID, RRP CS=$RRP_CS_ID, VE CS=$VE_CS_ID."
