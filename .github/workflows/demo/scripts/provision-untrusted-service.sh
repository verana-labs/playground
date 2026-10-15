#!/usr/bin/env bash
# Provision an untrusted demo service on Verana V4. The service gets no ECS
# credentials and no Participant entry, by design: wallets must refuse it at
# Q1. It only gets the AnonCreds credential definition of the DemoCredential
# (DEMO_CREDDEF=true), so that it can make DIDComm offers. vs-agent makes the
# offers because the service sets UNSAFE_SKIP_OWN_AUTHORIZATION (demo only).
set -eo pipefail
source "${CAST_DIR}/common.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

if [ "${DEMO_CREDDEF:-false}" != "true" ]; then
  ok "${SERVICE_NAME}: nothing to provision"
  exit 0
fi

start_port_forward "$RELEASE_NAME" 3100
API="http://localhost:3100"

ANCHOR_DID=$(fetch_did_from_log "https://${ANCHOR_HOST}") \
  || { err "Could not read the anchor DID from ${ANCHOR_HOST}. Run demo-01 first."; exit 1; }
CS_ID=$(find_demo_schema_id "$ANCHOR_DID")
VTJSC_ID=$(fetch_vtjsc_credential_id "https://${ANCHOR_HOST}" "$CS_ID")
ensure_credential_definition "$API" "$VTJSC_ID"

ok "${SERVICE_NAME} provisioned (credential definition only)"
