#!/usr/bin/env bash
# Bolivia-cast-specific helpers, shared by the provision-* scripts in this
# directory. Sourced AFTER vesta/common.sh (uses its helpers throughout —
# the demo-cast lib.sh precedent).

# ---------------------------------------------------------------------------
# The cast — Helm release names (also the in-cluster service names)
# ---------------------------------------------------------------------------

R_BUSINESS_REGISTRY="seprec"
R_CIVIL_REGISTRY="segip"
R_TAX_BURO="impuestos"
R_MERIDIAN_BANK="banco-union"
R_QUICKCASH="prestamista"

# Public hosts derive from the Bolivia zone:
# <org>.bolivia.playground.<network>.verana.network
bolivia_zone() { echo "bolivia.$(cast_zone)"; }

BUSINESS_REGISTRY_HOST="${R_BUSINESS_REGISTRY}.$(bolivia_zone)"
CIVIL_REGISTRY_HOST="${R_CIVIL_REGISTRY}.$(bolivia_zone)"
TAX_BURO_HOST="${R_TAX_BURO}.$(bolivia_zone)"
MERIDIAN_BANK_HOST="${R_MERIDIAN_BANK}.$(bolivia_zone)"
QUICKCASH_HOST="${R_QUICKCASH}.$(bolivia_zone)"

# ---------------------------------------------------------------------------
# Governed-verification helpers (the Vesta cast never needed these: its
# schemas are all verifier-mode OPEN, while the Cedula Digital is
# verifier-mode ECOSYSTEM — the relying-party register)
# ---------------------------------------------------------------------------

# Find or create a credential schema (canonical JSON compare) plus its root
# permission, like ensure_schema_with_root — but issuer mode 3 AND verifier
# mode 3 (both ecosystem-governed): the Cedula Digital relying-party rule.
# Usage: ensure_governed_schema_with_root <tr_id> <schema_json> <did>
# Echoes the credential schema ID.
ensure_governed_schema_with_root() {
  local tr_id=$1
  local schema_json=$2
  local did=$3

  local local_canon
  local_canon=$(echo "$schema_json" | jq -Sc 'del(."$id")')

  local cs_url="${INDEXER_URL}/verana/cs/v1/list?tr_id=${tr_id}&only_active=true"
  log "Querying indexer for existing schemas: $cs_url"
  local cs_resp cs_http cs_body
  cs_resp=$(curl -s -w '\n%{http_code}' "$cs_url")
  cs_http=$(echo "$cs_resp" | tail -1)
  cs_body=$(echo "$cs_resp" | sed '$d')
  if [ "$cs_http" -ne 200 ]; then
    err "Indexer schema query failed (HTTP $cs_http). Aborting."
    return 1
  fi

  local cs_id="" entry on_chain_js on_chain_canon
  while IFS= read -r entry; do
    [ -z "$entry" ] && continue
    on_chain_js=$(echo "$entry" | jq -r '.json_schema // empty')
    [ -z "$on_chain_js" ] && continue
    on_chain_canon=$(echo "$on_chain_js" | jq -Sc 'del(."$id")')
    if [ "$local_canon" = "$on_chain_canon" ]; then
      cs_id=$(echo "$entry" | jq -r '.id')
      break
    fi
  done <<< "$(echo "$cs_body" | jq -c '.schemas[]?' 2>/dev/null)"

  if [ -n "$cs_id" ]; then
    ok "Schema already exists on-chain: CS=$cs_id — skipping creation"
  else
    log "Creating credential schema (issuer AND verifier ecosystem-governed)..."
    check_balance "$USER_ACC"
    cs_id=$(submit_tx "create_credential_schema" "credential_schema_id" \
      veranad tx cs create-credential-schema "$tr_id" "$schema_json" \
      --issuer-grantor-validation-validity-period '{"value":0}' \
      --verifier-grantor-validation-validity-period '{"value":0}' \
      --issuer-validation-validity-period '{"value":0}' \
      --verifier-validation-validity-period '{"value":0}' \
      --holder-validation-validity-period '{"value":0}' \
      3 3)
    ok "Credential schema created: CS=$cs_id"
  fi

  # The root permission is ensured independently of schema creation: a prior
  # run may have created the schema and died before the root perm landed
  # (e.g. a transient broadcast failure), and re-runs must converge instead
  # of skipping past the missing root.
  if discover_active_root_perm "$cs_id" > /dev/null 2>&1; then
    ok "Root permission already active for CS=$cs_id — skipping"
  else
    check_balance "$USER_ACC"
    local effective_from root_perm
    effective_from=$(future_timestamp 15)
    root_perm=$(submit_tx "create_root_permission" "root_permission_id" \
      veranad tx perm create-root-perm \
      "$cs_id" "$did" \
      "${VALIDATION_FEES:-0}" "${ISSUANCE_FEES:-0}" "${VERIFICATION_FEES:-0}" \
      --effective-from "$effective_from")
    ok "Root permission created: PERM=$root_perm"
    sleep 21
  fi

  echo "$cs_id"
}

# Ensure a VERIFIER permission exists for a schema whose verification is
# governed by its ecosystem (VP flow: start-perm-vp + set-perm-vp-validated).
# Mirrors ensure_validated_issuer_perm; works because the cast's registries
# are controlled by the same veranad account.
# Usage: ensure_validated_verifier_perm <schema_id> <did>
ensure_validated_verifier_perm() {
  local schema_id=$1
  local did=$2

  local existing
  if existing=$(find_active_verifier_perm "$schema_id" "$did"); then
    ok "Active VERIFIER permission already exists: $existing — skipping"
    return 0
  fi

  local verifier_perm
  # Reuse a previously started (not yet validated) permission VP if one exists
  # — a prior run may have started it and failed before validation.
  verifier_perm=$(curl -s "${INDEXER_URL}/verana/perm/v1/list?schema_id=${schema_id}" \
    | jq -r --arg did "$did" '
      .permissions[]? |
      select(.type == "VERIFIER" and .did == $did) |
      select(.perm_state | test("REVOKED|TERMINATED|EXPIRED|SLASHED") | not) |
      .id' | head -1)

  if [ -n "$verifier_perm" ]; then
    ok "Reusing pending VERIFIER permission VP: $verifier_perm"
  else
    local root_perm_id
    root_perm_id=$(discover_active_root_perm "$schema_id")

    log "Starting VERIFIER permission VP for $did (root perm $root_perm_id)..."
    check_balance "$USER_ACC"

    local start_result start_tx_hash
    start_result=$(veranad tx perm start-perm-vp \
      verifier "$root_perm_id" \
      --did "$did" \
      --from "$USER_ACC" --chain-id "$CHAIN_ID" --keyring-backend test \
      --fees "$FEES" --gas auto --node "$NODE_RPC" \
      --output json -y 2>&1 | extract_tx_json)
    start_tx_hash=$(echo "$start_result" | jq -r '.txhash // empty')
    if [ -z "$start_tx_hash" ]; then
      err "Failed to start VERIFIER permission VP"
      return 1
    fi
    sleep 8
    verifier_perm=$(extract_tx_event "$start_tx_hash" "start_permission_vp" "permission_id")
    if [ -z "$verifier_perm" ]; then
      sleep 6
      verifier_perm=$(extract_tx_event "$start_tx_hash" "start_permission_vp" "permission_id")
    fi
    if [ -z "$verifier_perm" ]; then
      err "Could not extract permission_id from start_permission_vp (tx: $start_tx_hash)"
      return 1
    fi
  fi

  check_balance "$USER_ACC"
  veranad tx perm set-perm-vp-validated \
    "$verifier_perm" \
    --from "$USER_ACC" --chain-id "$CHAIN_ID" --keyring-backend test \
    --fees "$FEES" --gas auto --node "$NODE_RPC" \
    --output json -y > /dev/null
  sleep 6
  ok "VERIFIER permission validated: $verifier_perm"
}
