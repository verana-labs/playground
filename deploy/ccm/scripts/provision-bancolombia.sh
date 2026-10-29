#!/usr/bin/env bash
# Provision Bancolombia (demo), the registered relying party of the chamber:
# ECS-Organization from the CCM (demo) — the chamber IS the source of truth
# about Medellin companies, so KYB is a lookup — self-issued ECS-Service,
# and a validated VERIFIER permission on the Representacion Legal schema
# (verifier mode ECOSYSTEM: the chamber's paid relying-party register, one
# registration per verifier, one fee per verification).
set -eo pipefail
source "${VESTA_DIR}/common.sh"
source "${CAST_DIR}/scripts/lib.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_CAMARA" 3101
API="http://localhost:3100"
CAMARA_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "${SERVICE_NAME} DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$CAMARA_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# VERIFIER registration on the Representacion Legal schema (verifier mode is
# ECOSYSTEM — the chamber's relying-party register)
LEGAL_REP_SCHEMA_ID=$(discover_ecs_vtjsc "https://${CAMARA_HOST}" "$LEGAL_REP_SCHEMA_BASE_ID" | sed -n '2p')
[ -n "$LEGAL_REP_SCHEMA_ID" ] || { err "Could not discover the Representacion Legal schema from https://${CAMARA_HOST} — run ccm-01 first"; exit 1; }
ensure_validated_verifier_perm "$LEGAL_REP_SCHEMA_ID" "$AGENT_DID"

ok "${SERVICE_NAME} provisioned: a registered relying party of the chamber."
