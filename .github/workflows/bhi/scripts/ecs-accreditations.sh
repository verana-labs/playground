#!/usr/bin/env bash
# ECS-side accreditation for the BHI cast. Runs with the ECS ecosystem
# controller account (ECS_ECOSYSTEM_MNEMONIC): the ECS-Organization schema
# is issuer-mode ECOSYSTEM, so only that account can accredit the certified
# DVS providers - Orchestrating Identity and Trustworthy Verification
# Services (demo) - as ECS-Organization issuers. The Verana Council
# decision, on-chain: DVS certification is the accreditation criterion.
# Orgs whose DID does not resolve yet are skipped (run again after bhi-03).
# No kubectl needed - everything works from public DID documents + the chain.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
source "${CAST_DIR}/scripts/lib.sh"
set_network_vars "${NETWORK:-testnet}"

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

GRANTED=0
for entry in "Orchestrating Identity:${OID_HOST}" "Trustworthy Verification Services (demo):${TVS_HOST}"; do
  NAME="${entry%%:*}"; HOST="${entry##*:}"
  DID=$(get_public_did_from_host "$HOST" || true)
  if [ -z "$DID" ]; then
    warn "${NAME}: DID not resolvable from https://${HOST} yet - skipping (deploy it, then re-run this workflow)"
    continue
  fi
  ok "${NAME} DID: $DID"
  if EXISTING=$(find_active_issuer_perm "$ORG_SCHEMA_ID" "$DID"); then
    ok "${NAME} already holds an active ISSUER permission on ECS-Organization: $EXISTING"
  else
    # ECOSYSTEM mode rejects direct create-perm; the permission VP flow
    # (start + validate, reusing any previously started VP) is the way.
    log "Granting ${NAME} an ISSUER permission on ECS-Organization (schema $ORG_SCHEMA_ID)..."
    ensure_validated_issuer_perm "$ORG_SCHEMA_ID" "$DID"
  fi
  GRANTED=$((GRANTED+1))
done

[ "$GRANTED" -gt 0 ] || { err "No cast DVS provider is resolvable yet - run bhi-01 first"; exit 1; }
