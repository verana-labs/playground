#!/usr/bin/env bash
# CEXA-cast-specific helpers, shared by the provision-* scripts in this
# directory. Sourced AFTER vesta/common.sh and demo/scripts/lib.sh (uses
# their helpers throughout — the verandia-cast precedent). The governed
# helpers are copied from the verandia cast lib (the bolivia precedent:
# each cast carries its own copy rather than coupling across cast dirs).

# ---------------------------------------------------------------------------
# The cast — Helm release names (also the in-cluster service names)
# ---------------------------------------------------------------------------

R_ASSOCIATION="association"
R_AURUM="aurum"
R_BOREALIS="borealis"
R_NOVARA="novara"
R_DARKPOOL="darkpool"

# Public hosts derive from the CEXA zone:
# <org>.cexa.playground.<network>.verana.network
cexa_zone() { echo "cexa.$(cast_zone)"; }

ASSOCIATION_HOST="${R_ASSOCIATION}.$(cexa_zone)"
AURUM_HOST="${R_AURUM}.$(cexa_zone)"
BOREALIS_HOST="${R_BOREALIS}.$(cexa_zone)"
NOVARA_HOST="${R_NOVARA}.$(cexa_zone)"
DARKPOOL_HOST="${R_DARKPOOL}.$(cexa_zone)"

# Schema base ids (workflow contract with app/lib/cexa-cast.ts: the VTJSCs
# publish as /vt/schemas-<base>-jsc.json on the association anchor)
KYC_SCHEMA_BASE_ID="cexa-kyc"
COUNTERPARTY_SCHEMA_BASE_ID="cexa-verified-counterparty"

# ---------------------------------------------------------------------------
# Governed-verification helpers (copied from the verandia cast lib): the
# CEXA-Kyc schema is issuer mode ECOSYSTEM AND verifier mode ECOSYSTEM —
# both sides of the market are memberships.
# ---------------------------------------------------------------------------

# Find or create a credential schema (canonical JSON compare) plus its root
# permission, like ensure_schema_with_root — but issuer mode 3 AND verifier
# mode 3 (both ecosystem-governed).
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
  # run may have created the schema and died before the root perm landed,
  # and re-runs must converge instead of skipping past the missing root.
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
# Mirrors ensure_validated_issuer_perm; works because the cast's registry is
# controlled by the same veranad account.
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

# ---------------------------------------------------------------------------
# CEXA-VerifiedCounterparty issuance: the Association issues the member's
# Travel Rule identity, published on the member's DID as a Linked VP
# (EGF section 10). Free to verify: no session, plain trust resolution.
# Usage: ensure_counterparty_credential <member_api> <association_api> <member_did>
# Claims come from the org's CP_* config.env variables.
# ---------------------------------------------------------------------------
ensure_counterparty_credential() {
  local member_api=$1
  local association_api=$2
  local member_did=$3

  if [ "${FORCE_REFRESH:-false}" != "true" ] \
    && has_linked_vp "https://${INGRESS_HOST}" "$COUNTERPARTY_SCHEMA_BASE_ID"; then
    ok "CEXA-VerifiedCounterparty already linked — skipping"
    return 0
  fi

  local cp_jsc_url
  cp_jsc_url=$(discover_ecs_vtjsc "https://${ASSOCIATION_HOST}" "$COUNTERPARTY_SCHEMA_BASE_ID" | sed -n '1p')
  [ -n "$cp_jsc_url" ] || { err "Could not discover the CEXA-VerifiedCounterparty VTJSC from ${ASSOCIATION_HOST} — run cexa-01 first"; return 1; }

  local claims
  claims=$(jq -n \
    --arg legalName "$CP_LEGAL_NAME" \
    --arg lei "$CP_LEI" \
    --arg licensingAuthority "$CP_LICENSING_AUTHORITY" \
    --arg licenseIdentifier "$CP_LICENSE_IDENTIFIER" \
    --arg vaspCategory "$CP_VASP_CATEGORY" \
    --arg complianceContact "$CP_COMPLIANCE_CONTACT" \
    '{legalName: $legalName, licensingAuthority: $licensingAuthority,
      licenseIdentifier: $licenseIdentifier, vaspCategory: $vaspCategory,
      complianceContact: $complianceContact}
     + (if $lei != "" then {lei: $lei} else {} end)')

  issue_remote_and_link "$association_api" "$member_api" \
    "$COUNTERPARTY_SCHEMA_BASE_ID" "$cp_jsc_url" "$member_did" "$claims"
  ok "CEXA-VerifiedCounterparty issued and linked for ${SERVICE_NAME}"
}
