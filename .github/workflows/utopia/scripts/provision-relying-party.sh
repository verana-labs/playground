#!/usr/bin/env bash
# Provision a registered relying party of the Republic (Tax Buro, Meridian
# Bank): ECS-Organization from the National Business Registry, self-issued
# ECS-Service, a validated VERIFIER permission on the Utopia Citizen ID
# (verifier mode ECOSYSTEM — the on-chain relying-party register) and a
# self-created VERIFIER permission on the Legal Representative schema
# (verifier mode OPEN). Shared by both relying-party orgs, like the Vesta
# subsidiaries share provision-subsidiary.sh.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
source "${CAST_DIR}/scripts/lib.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_BUSINESS_REGISTRY" 3101
API="http://localhost:3100"
BUSINESS_REGISTRY_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "${SERVICE_NAME} DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$BUSINESS_REGISTRY_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# VERIFIER registration on the Utopia Citizen ID (verifier mode is ECOSYSTEM)
CITIZEN_SCHEMA_ID=$(discover_ecs_vtjsc "https://${CIVIL_REGISTRY_HOST}" "$CITIZEN_SCHEMA_BASE_ID" | sed -n '2p')
[ -n "$CITIZEN_SCHEMA_ID" ] || { err "Could not discover the Citizen ID schema from https://${CIVIL_REGISTRY_HOST} — run utopia-03 first"; exit 1; }
ensure_validated_verifier_perm "$CITIZEN_SCHEMA_ID" "$AGENT_DID"

# VERIFIER permission on the Legal Representative schema (verifier mode is OPEN)
LEGAL_REP_SCHEMA_ID=$(discover_ecs_vtjsc "https://${BUSINESS_REGISTRY_HOST}" "$LEGAL_REP_SCHEMA_BASE_ID" | sed -n '2p')
[ -n "$LEGAL_REP_SCHEMA_ID" ] || { err "Could not discover the Legal Representative schema from https://${BUSINESS_REGISTRY_HOST} — run utopia-01 first"; exit 1; }
ensure_open_perm "$LEGAL_REP_SCHEMA_ID" verifier "$AGENT_DID"

ok "${SERVICE_NAME} provisioned: a registered relying party of the Republic."
