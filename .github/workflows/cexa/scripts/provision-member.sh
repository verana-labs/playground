#!/usr/bin/env bash
# Provision a CEXA member (Aurum, Borealis, Novara — exchanges and banks run
# the exact same script: the sector line does not exist in the framework).
#
# Every member brings its own identity: ECS-Organization from Helvetia (an
# accredited issuer of the Verana ECS Ecosystem — being a Verifiable Service
# is an EGF entry requirement, not a membership perk) and a self-issued
# ECS-Service. Then, per MEMBER_ROLES from the org's config.env:
#   issuer   -> validated ISSUER permission on CEXA-Kyc + AnonCreds cred def
#               (schema resolved from the association anchor);
#   verifier -> validated VERIFIER permission on CEXA-Kyc (verification is
#               governed: only members may ask).
# Finally the Association issues the member's CEXA-VerifiedCounterparty
# credential, published on the member's DID as a Linked VP (EGF section 10).
set -eo pipefail
source "${VESTA_DIR}/common.sh"
source "${DEMO_DIR}/scripts/lib.sh"
source "${CAST_DIR}/scripts/lib.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_HELVETIA" 3101
start_port_forward "$R_ASSOCIATION" 3102
API="http://localhost:3100"
HELVETIA_API="http://localhost:3101"
ASSOCIATION_API="http://localhost:3102"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "${SERVICE_NAME} DID: $AGENT_DID"

# The entry requirement: a Verifiable Service in its own right
obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# Discover the CEXA-Kyc schema from the association anchor
KYC_JSC_URL=$(discover_ecs_vtjsc "https://${ASSOCIATION_HOST}" "$KYC_SCHEMA_BASE_ID" | sed -n '1p')
KYC_CS_ID=$(discover_ecs_vtjsc "https://${ASSOCIATION_HOST}" "$KYC_SCHEMA_BASE_ID" | sed -n '2p')
[ -n "$KYC_CS_ID" ] || { err "Could not discover the CEXA-Kyc schema from https://${ASSOCIATION_HOST} — run cexa-01 first"; exit 1; }

case " ${MEMBER_ROLES} " in
  *" issuer "*)
    ensure_validated_issuer_perm "$KYC_CS_ID" "$AGENT_DID"
    # AnonCreds cred def for the DIDComm rail: the anonCredsSchema resolves
    # from the anchor (its registrant), per the demo-cast precedent.
    ASSOCIATION_DID=$(get_webvh_did_from_host "$ASSOCIATION_HOST")
    [ -n "$ASSOCIATION_DID" ] || { err "Could not read the association DID from ${ASSOCIATION_HOST}"; exit 1; }
    ensure_credential_type "$API" "$KYC_JSC_URL" "$ASSOCIATION_DID"
    ;;
esac

case " ${MEMBER_ROLES} " in
  *" verifier "*)
    ensure_validated_verifier_perm "$KYC_CS_ID" "$AGENT_DID"
    ;;
esac

# The Travel Rule identity, issued by the Association, linked on this DID
ensure_counterparty_credential "$API" "$ASSOCIATION_API" "$AGENT_DID"

ok "${SERVICE_NAME} provisioned (MEMBER_ROLES=${MEMBER_ROLES})"
