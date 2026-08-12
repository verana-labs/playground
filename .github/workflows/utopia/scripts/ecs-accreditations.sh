#!/usr/bin/env bash
# ECS-side accreditation for the Utopia cast. Runs with the ECS ecosystem
# controller account (ECS_ECOSYSTEM_MNEMONIC): the ECS-Organization schema is
# issuer-mode ECOSYSTEM, so only that account can accredit the National
# Business Registry as an ECS-Organization issuer — the keystone decision:
# Business IDs are plain ECS-Organization credentials issued by the register
# that IS the source of truth about Utopian companies.
# No kubectl needed — everything works from public DID documents + the chain.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
source "${CAST_DIR}/scripts/lib.sh"
set_network_vars "${NETWORK:-testnet}"

BUSINESS_REGISTRY_DID=$(get_public_did_from_host "$BUSINESS_REGISTRY_HOST")
[ -n "$BUSINESS_REGISTRY_DID" ] || { err "Could not resolve the Business Registry DID from https://${BUSINESS_REGISTRY_HOST} — deploy utopia-01 first"; exit 1; }
ok "Business Registry DID: $BUSINESS_REGISTRY_DID"

ORG_SCHEMA_ID=$(discover_ecs_vtjsc "$ECS_TR_PUBLIC_URL" "organization" | sed -n '2p')
[ -n "$ORG_SCHEMA_ID" ] || { err "Could not discover the ECS-Organization schema"; exit 1; }

# Guard: only the ECS root permission grantee can validate accreditations on
# the ECS-Organization schema (issuer-mode ECOSYSTEM). Fail fast with the
# expected address instead of burning fees on a doomed transaction.
ACC_ADDR=$(veranad keys show "$USER_ACC" -a --keyring-backend test)
ROOT_GRANTEE=$(curl -sf "${INDEXER_URL}/verana/perm/v1/list?schema_id=${ORG_SCHEMA_ID}" \
  | jq -r '.permissions[]? | select(.type == "ECOSYSTEM" and .perm_state == "ACTIVE") | .grantee' | head -1)
ok "Imported account: $ACC_ADDR"
ok "ECS root permission grantee: $ROOT_GRANTEE"
if [ -n "$ROOT_GRANTEE" ] && [ "$ACC_ADDR" != "$ROOT_GRANTEE" ]; then
  err "Secret ECS_ECOSYSTEM_MNEMONIC recovers ${ACC_ADDR},"
  err "but the ECS trust registry is controlled by ${ROOT_GRANTEE}."
  err "Set the secret to the mnemonic of the controller account and re-run."
  exit 1
fi

if EXISTING=$(find_active_issuer_perm "$ORG_SCHEMA_ID" "$BUSINESS_REGISTRY_DID"); then
  ok "The Business Registry already holds an active ISSUER permission on ECS-Organization: $EXISTING"
else
  # ECOSYSTEM mode rejects direct create-perm; the permission VP flow
  # (start + validate, reusing any previously started VP) is the way.
  log "Granting the Business Registry an ISSUER permission on ECS-Organization (schema $ORG_SCHEMA_ID)..."
  ensure_validated_issuer_perm "$ORG_SCHEMA_ID" "$BUSINESS_REGISTRY_DID"
fi
