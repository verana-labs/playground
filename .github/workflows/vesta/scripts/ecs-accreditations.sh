#!/usr/bin/env bash
# ECS-side accreditations for the Vesta cast. Runs with the ECS ecosystem
# controller account (ECS_ECOSYSTEM_MNEMONIC): the ECS-Organization schema is
# issuer-mode ECOSYSTEM, so only that account can accredit Helvetia as an
# ECS-Organization issuer. Also makes sure the ECS-Badge schema has a root
# permission (best effort).
# No kubectl needed — everything works from public DID documents + the chain.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
set_network_vars "${NETWORK:-testnet}"

# ---------------------------------------------------------------------------
# 1. Accredit Helvetia as an ISSUER of ECS-Organization
# ---------------------------------------------------------------------------

HELVETIA_DID=$(get_public_did_from_host "$HELVETIA_HOST")
[ -n "$HELVETIA_DID" ] || { err "Could not resolve Helvetia DID from https://${HELVETIA_HOST} — deploy vesta-01 first"; exit 1; }
ok "Helvetia DID: $HELVETIA_DID"

ORG_SCHEMA_ID=$(discover_ecs_vtjsc "$ECS_TR_PUBLIC_URL" "organization" | sed -n '2p')
[ -n "$ORG_SCHEMA_ID" ] || { err "Could not discover the ECS-Organization schema"; exit 1; }

if EXISTING=$(find_active_issuer_perm "$ORG_SCHEMA_ID" "$HELVETIA_DID"); then
  ok "Helvetia already holds an active ISSUER permission on ECS-Organization: $EXISTING"
else
  log "Granting Helvetia an ISSUER permission on ECS-Organization (schema $ORG_SCHEMA_ID)..."
  check_balance "$USER_ACC"
  EFFECTIVE_FROM=$(future_timestamp 15)
  if PERM=$(submit_tx "create_permission" "permission_id" \
      veranad tx perm create-perm "$ORG_SCHEMA_ID" issuer "$HELVETIA_DID" \
      --effective-from "$EFFECTIVE_FROM"); then
    sleep 21
    ok "Helvetia accredited: ISSUER permission $PERM"
  else
    warn "Direct create-perm failed — falling back to the permission VP flow"
    ensure_validated_issuer_perm "$ORG_SCHEMA_ID" "$HELVETIA_DID"
  fi
fi

# ---------------------------------------------------------------------------
# 2. Ensure the ECS-Badge schema has a root (ECOSYSTEM) permission
# ---------------------------------------------------------------------------

BADGE_ID=$(discover_ecs_badge_schema_id) || BADGE_ID=""
if [ -z "$BADGE_ID" ]; then
  warn "ECS-Badge schema not found — skipping root permission check"
else
  ROOT=$(discover_active_root_perm "$BADGE_ID" 2>/dev/null) || ROOT=""
  if [ -n "$ROOT" ]; then
    ok "ECS-Badge root permission already exists: $ROOT"
  else
    # The on-chain registry DID (did:webvh with SCID) — the served did.json id
    # is did:web, so take the DID from the indexer instead.
    ECS_DID=$(curl -sf "${INDEXER_URL}/verana/tr/v1/list?only_active=true" \
      | jq -r --arg host "${ECS_TR_PUBLIC_URL#https://}" \
        '[.trust_registries[]? | select(.did | endswith($host))] | first | .did // empty')
    [ -n "$ECS_DID" ] || { warn "Could not resolve the ECS registry DID — skipping badge root permission"; exit 0; }
    log "Creating root permission for ECS-Badge (schema $BADGE_ID, DID $ECS_DID)..."
    check_balance "$USER_ACC"
    EFFECTIVE_FROM=$(future_timestamp 15)
    if ROOT=$(submit_tx "create_root_permission" "root_permission_id" \
        veranad tx perm create-root-perm "$BADGE_ID" "$ECS_DID" 0 0 0 \
        --effective-from "$EFFECTIVE_FROM"); then
      ok "ECS-Badge root permission created: $ROOT"
    else
      warn "Could not create the ECS-Badge root permission (badge issuance is OPEN, so the cast still works)"
    fi
  fi
fi
