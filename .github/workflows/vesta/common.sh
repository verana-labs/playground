#!/usr/bin/env bash
# =============================================================================
# common.sh — Shared helpers for the Vesta cast CI/CD (playground)
# =============================================================================
#
# Adapted from verana-labs/verana-demos common/common.sh (v3 flows) and
# extended with cast-specific helpers. Sourced by the scripts in
# .github/workflows/vesta/scripts/. Org-to-org exchanges are provisioned by
# driving the vs-agents' Admin APIs (no DIDComm between verifiable services
# in v3); on-chain objects are created with veranad.
#
# Expected environment (exported by the vesta-00_core workflow):
#   NETWORK     testnet | devnet
#   NAMESPACE   Kubernetes namespace holding the cast's vs-agents
#   USER_ACC    veranad key name (recovered from mnemonic)
#   VESTA_DIR   absolute path of .github/workflows/vesta
#
# =============================================================================

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

log()  { echo -e "\n\033[1;34m> $1\033[0m" >&2; }
ok()   { echo -e "  \033[1;32mOK $1\033[0m" >&2; }
err()  { echo -e "  \033[1;31mERR $1\033[0m" >&2; }
warn() { echo -e "  \033[1;33mWARN $1\033[0m" >&2; }

# ---------------------------------------------------------------------------
# The cast — Helm release names (also the in-cluster service names)
# ---------------------------------------------------------------------------

R_HELVETIA="helvetia-trust"
R_VESTA="vesta"
R_PORTAL="vesta-portal"
R_REPAIR_NETWORK="vesta-repair-network"
R_ISO="iso-certification"
R_NORMACERT="normacert"
R_IBERIA="vesta-iberia"
R_NORDICS="vesta-nordics"
R_ZENITH="zenith"
R_UMBRA="umbra"

# Public hosts derive from the zone: <org>.playground.<network>.verana.network
# and <subservice>.<org>.playground.<network>.verana.network.
cast_zone() { echo "playground.${NETWORK:-testnet}.verana.network"; }

HELVETIA_HOST="${R_HELVETIA}.$(cast_zone)"
VESTA_HOST="${R_VESTA}.$(cast_zone)"
PORTAL_HOST="portal.${R_VESTA}.$(cast_zone)"
REPAIR_NETWORK_HOST="repair-network.${R_VESTA}.$(cast_zone)"
ISO_HOST="${R_ISO}.$(cast_zone)"
NORMACERT_HOST="${R_NORMACERT}.$(cast_zone)"
IBERIA_HOST="${R_IBERIA}.$(cast_zone)"
NORDICS_HOST="${R_NORDICS}.$(cast_zone)"
ZENITH_HOST="${R_ZENITH}.$(cast_zone)"
UMBRA_HOST="${R_UMBRA}.$(cast_zone)"

# ---------------------------------------------------------------------------
# Network configuration
# ---------------------------------------------------------------------------

set_network_vars() {
  local network="${1:-testnet}"

  case "$network" in
    devnet)
      CHAIN_ID="${CHAIN_ID:-vna-devnet-1}"
      NODE_RPC="${NODE_RPC:-https://rpc.devnet.verana.network}"
      FEES="${FEES:-600000uvna}"
      FAUCET_URL="https://faucet-vs.devnet.verana.network/invitation"
      RESOLVER_URL="${RESOLVER_URL:-https://resolver.devnet.verana.network}"
      ECS_TR_ADMIN_API="${ECS_TR_ADMIN_API:-https://admin-ecs-trust-registry.devnet.verana.network}"
      ECS_TR_PUBLIC_URL="${ECS_TR_PUBLIC_URL:-https://ecs-trust-registry.devnet.verana.network}"
      INDEXER_URL="${INDEXER_URL:-https://idx.devnet.verana.network}"
      ;;
    testnet)
      CHAIN_ID="${CHAIN_ID:-vna-testnet-1}"
      NODE_RPC="${NODE_RPC:-https://rpc.testnet.verana.network}"
      FEES="${FEES:-600000uvna}"
      FAUCET_URL="https://faucet-vs.testnet.verana.network/invitation"
      RESOLVER_URL="${RESOLVER_URL:-https://resolver.testnet.verana.network}"
      ECS_TR_ADMIN_API="${ECS_TR_ADMIN_API:-https://admin-ecs-trust-registry.testnet.verana.network}"
      ECS_TR_PUBLIC_URL="${ECS_TR_PUBLIC_URL:-https://ecs-trust-registry.testnet.verana.network}"
      INDEXER_URL="${INDEXER_URL:-https://idx.testnet.verana.network}"
      ;;
    *)
      err "Unknown network: $network. Use 'devnet' or 'testnet'."
      exit 1
      ;;
  esac

  export CHAIN_ID NODE_RPC FEES FAUCET_URL RESOLVER_URL ECS_TR_ADMIN_API ECS_TR_PUBLIC_URL INDEXER_URL
}

# ---------------------------------------------------------------------------
# Port-forwarding (all cast agents live in the same cluster/namespace)
# ---------------------------------------------------------------------------

PF_PIDS=""

# Start a kubectl port-forward to a vs-agent's admin API and wait until ready.
# Usage: start_port_forward <release> <local_port>
start_port_forward() {
  local release=$1
  local local_port=$2

  kubectl port-forward -n "$NAMESPACE" "svc/${release}" "${local_port}:3000" >/dev/null 2>&1 &
  PF_PIDS="$PF_PIDS $!"

  local i=0
  while [ $i -lt 15 ]; do
    if curl -sf "http://localhost:${local_port}/v1/agent" > /dev/null 2>&1; then
      ok "Port-forward: ${release} admin API on :${local_port}"
      return 0
    fi
    sleep 2
    i=$((i + 1))
  done
  err "Port-forward to ${release} failed — is the pod running in namespace ${NAMESPACE}?"
  return 1
}

stop_port_forwards() {
  local pid
  for pid in $PF_PIDS; do
    kill "$pid" 2>/dev/null || true
  done
  PF_PIDS=""
}

# ---------------------------------------------------------------------------
# Transaction helpers
# ---------------------------------------------------------------------------

# Extract a value from tx events JSON
extract_tx_event() {
  local tx_hash=$1
  local event_type=$2
  local attr_key=$3
  veranad q tx "$tx_hash" --node "$NODE_RPC" --output json 2>/dev/null \
    | jq -r ".events[] | select(.type == \"$event_type\") | .attributes[] | select(.key == \"$attr_key\") | .value" \
    | head -1
}

# Extract JSON from veranad tx output (strips "gas estimate:" prefix line)
extract_tx_json() {
  grep -E '^\{' | head -1
}

# Check that the veranad account has sufficient balance for on-chain transactions.
# Usage: check_balance <user_acc>
check_balance() {
  local user_acc=$1
  local addr
  addr=$(veranad keys show "$user_acc" -a --keyring-backend test 2>/dev/null)
  if [ -z "$addr" ]; then
    err "Account '$user_acc' not found in keyring"
    return 1
  fi

  local balance
  balance=$(veranad q bank balances "$addr" --node "$NODE_RPC" --output json 2>/dev/null \
    | jq -r '.balances[]? | select(.denom == "uvna") | .amount // "0"' 2>/dev/null || echo "0")

  if [ -z "$balance" ] || [ "$balance" = "0" ]; then
    err "Account '$user_acc' ($addr) has no uvna balance."
    err "On-chain transactions require funds. Top up using the faucet:"
    err ""
    err "  ${FAUCET_URL}"
    err ""
    return 1
  fi

  ok "Account balance: ${balance} uvna"
}

# Submit a veranad tx command, wait for confirmation, and extract an event value.
# Usage: submit_tx <event_type> <attr_key> <veranad tx ...args>
# Returns the extracted value on stdout; fails loudly otherwise.
submit_tx() {
  local event_type=$1; shift
  local attr_key=$1; shift

  local raw_output
  raw_output=$("$@" \
    --from "$USER_ACC" --chain-id "$CHAIN_ID" --keyring-backend test \
    --fees "$FEES" --gas auto --node "$NODE_RPC" \
    --output json -y 2>&1) || true

  local result
  result=$(echo "$raw_output" | extract_tx_json)

  local tx_hash
  tx_hash=$(echo "$result" | jq -r '.txhash // empty')
  if [ -z "$tx_hash" ]; then
    err "TX failed. Raw output:"
    echo "$raw_output" >&2
    return 1
  fi
  ok "TX submitted: $tx_hash"

  sleep 8

  local value
  value=$(extract_tx_event "$tx_hash" "$event_type" "$attr_key")
  if [ -z "$value" ]; then
    sleep 6
    value=$(extract_tx_event "$tx_hash" "$event_type" "$attr_key")
  fi
  if [ -z "$value" ]; then
    err "Could not extract '$attr_key' from event '$event_type' (tx: $tx_hash)"
    return 1
  fi

  echo "$value"
}

# ---------------------------------------------------------------------------
# VS Agent API helpers
# ---------------------------------------------------------------------------

# Public DID of an agent, via its admin API
# Usage: get_agent_did <admin_api_url>
get_agent_did() {
  curl -sf "$1/v1/agent" | jq -r '.publicDid // empty'
}

# Public DID of an agent, via its published DID documents.
# Prefers the did:webvh log (did.jsonl): the agents SIGN with their webvh DID,
# while did.json serves a did:web compatibility alias — permissions bound to
# the alias never match the issuer of any credential.
# Usage: get_public_did_from_host <host>
get_public_did_from_host() {
  local host=$1
  local did
  did=$(curl -sf "https://${host}/.well-known/did.jsonl" 2>/dev/null \
    | tail -1 | jq -r '.state.id // empty' 2>/dev/null)
  if [ -z "$did" ]; then
    did=$(curl -sf "https://${host}/.well-known/did.json" | jq -r '.id // empty')
  fi
  echo "$did"
}

# Remove non-VPR self-generated VTJSCs (and their linked VPs) left by agent
# init, so the DID document only presents the cast's real credentials.
# Usage: cleanup_self_generated_jscs <admin_api_url>
cleanup_self_generated_jscs() {
  local admin_api=$1
  local self_jscs jsc_id
  self_jscs=$(curl -sf "${admin_api}/v1/vt/json-schema-credentials" \
    | jq -r '.data[] | select(.schemaId | startswith("vpr:") | not) | .credential.id' 2>/dev/null)
  [ -z "$self_jscs" ] && return 0
  log "Removing self-generated (non-VPR) VTJSCs..."
  for jsc_id in $self_jscs; do
    curl -s -X DELETE "${admin_api}/v1/vt/linked-credentials" \
      -H 'Content-Type: application/json' \
      -d "{\"credentialSchemaId\": \"$jsc_id\"}" > /dev/null 2>&1 || true
    curl -s -X DELETE "${admin_api}/v1/vt/json-schema-credentials" \
      -H 'Content-Type: application/json' \
      -d "{\"id\": \"$jsc_id\"}" > /dev/null 2>&1 || true
  done
  ok "Self-generated VTJSCs cleaned up"
}

# ---------------------------------------------------------------------------
# Schema helpers
# ---------------------------------------------------------------------------

# Compute SHA-384 SRI digest of a URL's content
compute_sri_digest() {
  local url=$1
  local hash
  hash=$(curl -sfL "$url" | openssl dgst -sha384 -binary | openssl base64 -A)
  if [ -z "$hash" ]; then
    err "Failed to compute SRI digest for $url"
    return 1
  fi
  echo "sha384-${hash}"
}

# Download an image from a URL and return it as a data URI.
# Usage: download_logo_data_uri <url>
download_logo_data_uri() {
  local url=$1
  local tmp_body="/tmp/logo_body_$$"
  local tmp_headers="/tmp/logo_headers_$$"

  local http_code
  http_code=$(curl -sfL -D "$tmp_headers" -o "$tmp_body" -w '%{http_code}' "$url")

  if [ "$http_code" != "200" ] || [ ! -s "$tmp_body" ]; then
    err "Failed to download logo from $url (HTTP $http_code)"
    rm -f "$tmp_body" "$tmp_headers"
    return 1
  fi

  local content_type
  content_type=$(grep -i '^content-type:' "$tmp_headers" | tail -1 | tr -d '\r' | sed 's/^[^:]*:[[:space:]]*//' | cut -d';' -f1 | xargs)

  # The ECS schemas validate logos against ^data:image/(png|jpeg|svg+xml);base64,
  # so anything else (webp included) is rejected at issuance — fail here instead.
  case "$content_type" in
    image/png|image/jpeg|image/svg+xml) ;;
    *)
      case "$url" in
        *.png)          content_type="image/png" ;;
        *.jpg|*.jpeg)   content_type="image/jpeg" ;;
        *.svg)          content_type="image/svg+xml" ;;
        *)
          err "Could not determine image content type for $url (got: ${content_type:-empty})"
          rm -f "$tmp_body" "$tmp_headers"
          return 1
          ;;
      esac
      warn "Content-Type header not image/*; using $content_type (from URL extension)"
      ;;
  esac

  local b64
  b64=$(base64 < "$tmp_body" | tr -d '\n')
  rm -f "$tmp_body" "$tmp_headers"

  if [ -z "$b64" ]; then
    err "Failed to base64-encode logo from $url"
    return 1
  fi

  echo "data:${content_type};base64,${b64}"
}

# ---------------------------------------------------------------------------
# Discovery helpers
# ---------------------------------------------------------------------------

# Discover a VTJSC from a trust registry / issuer by resolving its DID document.
# Finds the LinkedVerifiablePresentation entry matching "<schema_base_id>-jsc-vp"
# (vs-agent <= v1.11.x) or "<schema_base_id>-vtjsc-vp" (v1.12.0-oidc4vc line),
# fetches the VP and extracts the VTJSC credential URL plus the VPR schema ID.
# Works for the ECS TR ("organization", "service") and for cast registries
# ("iso-9001-demo", "authorized-repairer").
#
# Usage: discover_ecs_vtjsc <public_url> <schema_base_id>
# Outputs two lines: VTJSC credential URL, numeric VPR schema ID.
discover_ecs_vtjsc() {
  local public_url=$1
  local schema_name=$2

  log "Resolving DID document at ${public_url} for '$schema_name' VTJSC..."

  local did_doc
  did_doc=$(curl -sf "${public_url}/.well-known/did.json")
  if [ -z "$did_doc" ]; then
    err "Failed to fetch DID document from ${public_url}/.well-known/did.json"
    return 1
  fi

  # vs-agent <= v1.11.x publishes VTJSC VPs as '<base>-jsc-vp'; the
  # v1.12.0-oidc4vc line renamed the fragment to '<base>-vtjsc-vp'
  # (v4 spec naming). Accept both.
  local vp_url
  vp_url=$(echo "$did_doc" | jq -r --arg pat "${schema_name}-(vt)?jsc-vp" '
    .service[] | select(.type == "LinkedVerifiablePresentation") |
    select(.id | test($pat)) | .serviceEndpoint' | head -1)

  if [ -z "$vp_url" ]; then
    err "No LinkedVerifiablePresentation matching '${schema_name}-(vt)?jsc-vp' in DID document"
    return 1
  fi
  ok "VTJSC VP endpoint: $vp_url"

  local vp
  vp=$(curl -sf "$vp_url")
  if [ -z "$vp" ]; then
    err "Failed to fetch VTJSC VP from $vp_url"
    return 1
  fi

  local vtjsc_url
  vtjsc_url=$(echo "$vp" | jq -r '.verifiableCredential[0].id // empty')
  if [ -z "$vtjsc_url" ]; then
    err "Could not extract VTJSC URL from VP"
    return 1
  fi

  local schema_ref
  schema_ref=$(echo "$vp" | jq -r '.verifiableCredential[0].credentialSubject.jsonSchema."$ref" // empty')
  if [ -z "$schema_ref" ]; then
    err "Could not extract jsonSchema.\$ref from VTJSC"
    return 1
  fi

  local schema_id
  schema_id=$(echo "$schema_ref" | grep -oE '[0-9]+$')
  if [ -z "$schema_id" ]; then
    err "Could not parse schema ID from ref: $schema_ref"
    return 1
  fi

  ok "VTJSC '$schema_name' -> URL: $vtjsc_url, schema ID: $schema_id"
  echo "$vtjsc_url"
  echo "$schema_id"
}

# Return the ECS trust registry id, anchored on the ECS-Organization schema
# (discovered from the ECS TR DID document). The plain tr/v1/list endpoint
# paginates newest-first, so the ECS registry never shows up there.
# Usage: discover_ecs_tr_id
discover_ecs_tr_id() {
  local org_schema_id tr_id
  org_schema_id=$(discover_ecs_vtjsc "$ECS_TR_PUBLIC_URL" "organization" | sed -n '2p')
  if [ -z "$org_schema_id" ]; then
    err "Could not discover the ECS-Organization schema"
    return 1
  fi
  tr_id=$(curl -sf "${INDEXER_URL}/verana/cs/v1/get/${org_schema_id}" | jq -r '.schema.tr_id // empty')
  if [ -z "$tr_id" ]; then
    err "Could not resolve the ECS trust registry id from schema ${org_schema_id}"
    return 1
  fi
  echo "$tr_id"
}

# Discover the ECS-Badge (BadgeCredential) schema ID: find the ECS trust
# registry via discover_ecs_tr_id, then look for the BadgeCredential title
# among its active schemas (the ECS TR publishes no badge VTJSC VP).
# Override with BADGE_SCHEMA_ID env var to skip discovery.
# Usage: discover_ecs_badge_schema_id
discover_ecs_badge_schema_id() {
  if [ -n "${BADGE_SCHEMA_ID:-}" ]; then
    echo "$BADGE_SCHEMA_ID"
    return 0
  fi

  log "Discovering ECS-Badge schema via indexer..."
  local tr_id badge_id
  tr_id=$(discover_ecs_tr_id) || return 1

  badge_id=$(curl -sf "${INDEXER_URL}/verana/cs/v1/list?tr_id=${tr_id}&only_active=true" \
    | jq -r '.schemas[]? | select((.json_schema | fromjson? | .title // "") == "BadgeCredential") | .id' \
    | head -1)
  if [ -z "$badge_id" ]; then
    err "No BadgeCredential schema found in ECS trust registry ${tr_id}"
    return 1
  fi

  ok "ECS-Badge schema: CS=$badge_id (TR=$tr_id)"
  echo "$badge_id"
}

# Discover the active root permission (ECOSYSTEM type) for a given schema.
# Usage: discover_active_root_perm <schema_id>
discover_active_root_perm() {
  local schema_id=$1
  local url="${INDEXER_URL}/verana/perm/v1/list?schema_id=${schema_id}"

  log "Discovering active root permission for schema $schema_id via indexer..."

  local perms http_code
  local max_retries=3
  local attempt=0

  while [ $attempt -lt $max_retries ]; do
    attempt=$((attempt + 1))
    http_code=$(curl -s -o /tmp/indexer_response.json -w '%{http_code}' "$url")
    if [ "$http_code" = "200" ]; then
      perms=$(cat /tmp/indexer_response.json)
      break
    fi
    log "Indexer request attempt $attempt/$max_retries returned HTTP $http_code, retrying in 5s..."
    sleep 5
  done

  if [ "$http_code" != "200" ] || [ -z "$perms" ]; then
    err "Failed to query indexer (HTTP $http_code) at $url"
    return 1
  fi

  local root_perm_id
  root_perm_id=$(echo "$perms" | jq -r '
    .permissions[] |
    select(.type == "ECOSYSTEM" and .perm_state == "ACTIVE") |
    .id' | head -1)

  if [ -z "$root_perm_id" ]; then
    err "No active ECOSYSTEM permission found for schema $schema_id"
    return 1
  fi

  ok "Active root permission: $root_perm_id"
  echo "$root_perm_id"
}

# ---------------------------------------------------------------------------
# Permission helpers
# ---------------------------------------------------------------------------

# Check if a DID already has an active permission of a given type for a schema.
# Usage: find_active_perm <schema_id> <ISSUER|VERIFIER> <did>
find_active_perm() {
  local schema_id=$1
  local perm_type=$2
  local did=$3
  local url="${INDEXER_URL}/verana/perm/v1/list?schema_id=${schema_id}"

  local perms http_code
  http_code=$(curl -s -o /tmp/perm_check.json -w '%{http_code}' "$url")
  if [ "$http_code" != "200" ]; then
    return 1
  fi
  perms=$(cat /tmp/perm_check.json)

  local perm_id
  perm_id=$(echo "$perms" | jq -r --arg did "$did" --arg pt "$perm_type" '
    .permissions[]? |
    select(.type == $pt and .perm_state == "ACTIVE" and .did == $did) |
    .id' | head -1)

  if [ -n "$perm_id" ]; then
    echo "$perm_id"
    return 0
  fi
  return 1
}

find_active_issuer_perm()   { find_active_perm "$1" "ISSUER" "$2"; }
find_active_verifier_perm() { find_active_perm "$1" "VERIFIER" "$2"; }

# Ensure an ISSUER or VERIFIER permission exists for a schema in OPEN mode
# (self-created by our account, no validation needed).
# Usage: ensure_open_perm <schema_id> <issuer|verifier> <did>
ensure_open_perm() {
  local schema_id=$1
  local perm_kind=$2
  local did=$3
  local perm_type
  perm_type=$(echo "$perm_kind" | tr '[:lower:]' '[:upper:]')

  local existing
  if existing=$(find_active_perm "$schema_id" "$perm_type" "$did"); then
    ok "Active $perm_type permission already exists: $existing — skipping"
    return 0
  fi

  log "Creating $perm_type permission for $did on schema $schema_id (OPEN mode)..."
  check_balance "$USER_ACC"
  local effective_from perm_id
  effective_from=$(future_timestamp 15)
  perm_id=$(submit_tx "create_permission" "permission_id" \
    veranad tx perm create-perm "$schema_id" "$perm_kind" "$did" \
    --effective-from "$effective_from")
  sleep 21
  ok "$perm_type permission created: $perm_id"
}

# Ensure an ISSUER permission exists for a schema whose issuance is governed
# by its ecosystem (VP flow: start-perm-vp + set-perm-vp-validated). Works
# because the cast's registries are controlled by the same veranad account.
# Usage: ensure_validated_issuer_perm <schema_id> <did>
ensure_validated_issuer_perm() {
  local schema_id=$1
  local did=$2

  local existing
  if existing=$(find_active_issuer_perm "$schema_id" "$did"); then
    ok "Active ISSUER permission already exists: $existing — skipping"
    return 0
  fi

  local issuer_perm
  # Reuse a previously started (not yet validated) permission VP if one exists
  # — a prior run may have started it and failed before validation.
  issuer_perm=$(curl -s "${INDEXER_URL}/verana/perm/v1/list?schema_id=${schema_id}" \
    | jq -r --arg did "$did" '
      .permissions[]? |
      select(.type == "ISSUER" and .did == $did) |
      select(.perm_state | test("REVOKED|TERMINATED|EXPIRED|SLASHED") | not) |
      .id' | head -1)

  if [ -n "$issuer_perm" ]; then
    ok "Reusing pending ISSUER permission VP: $issuer_perm"
  else
    local root_perm_id
    root_perm_id=$(discover_active_root_perm "$schema_id")

    log "Starting ISSUER permission VP for $did (root perm $root_perm_id)..."
    check_balance "$USER_ACC"

    local start_result start_tx_hash
    start_result=$(veranad tx perm start-perm-vp \
      issuer "$root_perm_id" \
      --did "$did" \
      --from "$USER_ACC" --chain-id "$CHAIN_ID" --keyring-backend test \
      --fees "$FEES" --gas auto --node "$NODE_RPC" \
      --output json -y 2>&1 | extract_tx_json)
    start_tx_hash=$(echo "$start_result" | jq -r '.txhash // empty')
    if [ -z "$start_tx_hash" ]; then
      err "Failed to start ISSUER permission VP"
      return 1
    fi
    sleep 8
    issuer_perm=$(extract_tx_event "$start_tx_hash" "start_permission_vp" "permission_id")
    if [ -z "$issuer_perm" ]; then
      sleep 6
      issuer_perm=$(extract_tx_event "$start_tx_hash" "start_permission_vp" "permission_id")
    fi
    if [ -z "$issuer_perm" ]; then
      err "Could not extract permission_id from start_permission_vp (tx: $start_tx_hash)"
      return 1
    fi
  fi

  check_balance "$USER_ACC"
  veranad tx perm set-perm-vp-validated \
    "$issuer_perm" \
    --from "$USER_ACC" --chain-id "$CHAIN_ID" --keyring-backend test \
    --fees "$FEES" --gas auto --node "$NODE_RPC" \
    --output json -y > /dev/null
  sleep 6
  ok "ISSUER permission validated: $issuer_perm"
}

# ---------------------------------------------------------------------------
# Trust registry + schema helpers
# ---------------------------------------------------------------------------

# Find or create a trust registry for a DID, archiving duplicates.
# Usage: ensure_trust_registry <did> <aka_url> <egf_doc_url> [egf_language]
# Echoes the trust registry ID.
ensure_trust_registry() {
  local did=$1
  local aka_url=$2
  local egf_doc_url=$3
  local egf_language="${4:-en}"

  local controller_addr
  controller_addr=$(veranad keys show "$USER_ACC" -a --keyring-backend test)

  local tr_url="${INDEXER_URL}/verana/tr/v1/list?controller=${controller_addr}&only_active=true"
  log "Querying indexer for existing trust registries: $tr_url"
  local tr_resp tr_http tr_body
  tr_resp=$(curl -s -w '\n%{http_code}' "$tr_url")
  tr_http=$(echo "$tr_resp" | tail -1)
  tr_body=$(echo "$tr_resp" | sed '$d')
  if [ "$tr_http" -ne 200 ]; then
    err "Indexer query failed (HTTP $tr_http). Aborting to avoid duplicate trust registries."
    return 1
  fi

  local matching_tr_ids tr_id
  matching_tr_ids=$(echo "$tr_body" | jq -r --arg did "$did" \
    '[.trust_registries[] | select(.did == $did)] | sort_by(.id) | .[].id')
  tr_id=$(echo "$matching_tr_ids" | head -1)

  if [ -n "$tr_id" ]; then
    ok "Found existing active trust registry: TR=$tr_id (DID=$did)"

    local stale_tr_ids stale_tr
    stale_tr_ids=$(echo "$matching_tr_ids" | tail -n +2)
    if [ -n "$stale_tr_ids" ]; then
      for stale_tr in $stale_tr_ids; do
        log "Archiving duplicate trust registry: TR=$stale_tr"
        check_balance "$USER_ACC"
        veranad tx tr archive-trust-registry "$stale_tr" true \
          --from "$USER_ACC" --chain-id "$CHAIN_ID" --keyring-backend test \
          --fees "$FEES" --node "$NODE_RPC" \
          --output json -y > /dev/null 2>&1 || true
        ok "Archived duplicate trust registry: TR=$stale_tr"
      done
    fi
  else
    log "No active trust registry found for DID=$did — creating..."
    local egf_doc_digest
    egf_doc_digest=$(compute_sri_digest "$egf_doc_url")
    ok "EGF digest: $egf_doc_digest"

    check_balance "$USER_ACC"
    tr_id=$(submit_tx "create_trust_registry" "trust_registry_id" \
      veranad tx tr create-trust-registry \
      "$did" "$egf_language" "$egf_doc_url" "$egf_doc_digest" \
      --aka "$aka_url")
    ok "Trust registry created: TR=$tr_id"
  fi

  echo "$tr_id"
}

# Find or create a credential schema (canonical JSON compare) plus its root
# permission. Issuer mode 3 (ecosystem-governed), verifier mode 1 (open) —
# same as the verana-demos custom schema.
# Usage: ensure_schema_with_root <tr_id> <schema_json> <did>
# Echoes the credential schema ID.
ensure_schema_with_root() {
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
    log "Creating credential schema..."
    check_balance "$USER_ACC"
    cs_id=$(submit_tx "create_credential_schema" "credential_schema_id" \
      veranad tx cs create-credential-schema "$tr_id" "$schema_json" \
      --issuer-grantor-validation-validity-period '{"value":0}' \
      --verifier-grantor-validation-validity-period '{"value":0}' \
      --issuer-validation-validity-period '{"value":0}' \
      --verifier-validation-validity-period '{"value":0}' \
      --holder-validation-validity-period '{"value":0}' \
      3 1)
    ok "Credential schema created: CS=$cs_id"

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

# ---------------------------------------------------------------------------
# VTJSC (JSON Schema Credential) helpers
# ---------------------------------------------------------------------------

# Return the local VTJSC credential URL for a VPR schema, if the agent has one.
# Usage: get_jsc_url <admin_api> <schema_id>
get_jsc_url() {
  local admin_api=$1
  local schema_id=$2
  local vpr_ref="vpr:verana:${CHAIN_ID}/cs/v1/js/${schema_id}"

  curl -sf "${admin_api}/v1/vt/json-schema-credentials" 2>/dev/null \
    | jq -r --arg sid "$vpr_ref" \
      '.data[] | select(.schemaId == $sid) | .credential.id // empty' 2>/dev/null \
    | head -1
}

# Ensure the agent has a VTJSC for a VPR schema (creating it if missing).
# Usage: ensure_jsc <admin_api> <schema_base_id> <schema_id>
# Echoes the VTJSC credential URL.
ensure_jsc() {
  local admin_api=$1
  local schema_base_id=$2
  local schema_id=$3
  local vpr_ref="vpr:verana:${CHAIN_ID}/cs/v1/js/${schema_id}"

  local existing
  existing=$(get_jsc_url "$admin_api" "$schema_id")
  if [ -n "$existing" ]; then
    ok "VTJSC already exists for CS=$schema_id — skipping"
    echo "$existing"
    return 0
  fi

  log "Creating VTJSC '${schema_base_id}' (CS=$schema_id)..."
  local jsc_resp jsc_http jsc_body
  jsc_resp=$(curl -s -w '\n%{http_code}' -X POST "${admin_api}/v1/vt/json-schema-credentials" \
    -H 'Content-Type: application/json' \
    -d "{\"schemaBaseId\": \"${schema_base_id}\", \"jsonSchemaRef\": \"${vpr_ref}\"}")
  jsc_http=$(echo "$jsc_resp" | tail -1)
  jsc_body=$(echo "$jsc_resp" | sed '$d')
  if [ "$jsc_http" -ge 400 ]; then
    err "Failed to create VTJSC '${schema_base_id}' (HTTP $jsc_http): $jsc_body"
    return 1
  fi
  ok "VTJSC created for '${schema_base_id}' (CS=$schema_id)"

  get_jsc_url "$admin_api" "$schema_id"
}

# ---------------------------------------------------------------------------
# Credential issuance helpers
# ---------------------------------------------------------------------------

# Check if a LinkedVerifiablePresentation already exists in a DID document.
# Linked credential VPs use the '<base>-c-vp' fragment on every vs-agent
# generation (the earlier '-jsc-vp' pattern here never matched, so the skip
# logic always re-issued).
# Usage: has_linked_vp <public_url> <schema_base_id>
has_linked_vp() {
  local public_url=$1
  local schema_base_id=$2

  local did_doc
  did_doc=$(curl -sf "${public_url}/.well-known/did.json" 2>/dev/null) || return 1

  local match
  match=$(echo "$did_doc" | jq -r \
    --arg sbi "$schema_base_id" \
    '.service[] |
     select(.type == "LinkedVerifiablePresentation") |
     select(.id | test($sbi + "-c-vp")) |
     .id' 2>/dev/null | head -1)

  [ -n "$match" ]
}

# Issue a credential from a REMOTE admin API and link it on the LOCAL agent.
# Self-issuance is the same call with remote == local.
# Usage: issue_remote_and_link <remote_admin_api> <local_admin_api> <schema_base_id> <jsc_url> <target_did> <claims_json>
issue_remote_and_link() {
  local remote_api=$1
  local local_api=$2
  local schema_base_id=$3
  local jsc_url=$4
  local target_did=$5
  local claims_json=$6

  local request_body
  request_body=$(jq -n \
    --arg fmt "jsonld" \
    --arg did "$target_did" \
    --arg jsc "$jsc_url" \
    --argjson claims "$claims_json" \
    '{format: $fmt, did: $did, jsonSchemaCredentialId: $jsc, claims: $claims}')

  local issue_url="${remote_api}/v1/vt/issue-credential"
  log "Requesting credential from: $issue_url"

  local http_code credential
  http_code=$(curl -s -o /tmp/issue_response.json -w '%{http_code}' \
    -X POST "$issue_url" \
    -H 'Content-Type: application/json' \
    -d "$request_body")
  credential=$(cat /tmp/issue_response.json)

  if [ "$http_code" != "200" ] && [ "$http_code" != "201" ]; then
    err "Issuer API returned HTTP $http_code"
    err "Response: $credential"
    return 1
  fi

  if [ -z "$credential" ] || echo "$credential" | jq -e '.statusCode' > /dev/null 2>&1; then
    err "Issuer API failed to issue credential. Response: $credential"
    return 1
  fi
  ok "Credential received (HTTP $http_code)"

  local signed_cred
  signed_cred=$(echo "$credential" | jq '.credential')
  if [ "$signed_cred" = "null" ] || [ -z "$signed_cred" ]; then
    signed_cred="$credential"
  fi

  local link_url="${local_api}/v1/vt/linked-credentials"
  curl -s -X DELETE "${link_url}" \
    -H 'Content-Type: application/json' \
    -d "{\"credentialSchemaId\": \"$jsc_url\"}" > /dev/null 2>&1 || true
  log "Linking credential on local agent: $link_url"

  local link_body
  link_body=$(jq -n \
    --arg sbi "$schema_base_id" \
    --argjson cred "$signed_cred" \
    '{schemaBaseId: $sbi, credential: $cred}')

  local link_code link_result
  link_code=$(curl -s -o /tmp/link_response.json -w '%{http_code}' \
    -X POST "$link_url" \
    -H 'Content-Type: application/json' \
    -d "$link_body")
  link_result=$(cat /tmp/link_response.json)

  if [ "$link_code" != "200" ] && [ "$link_code" != "201" ]; then
    err "Failed to link credential (HTTP $link_code). Response: $link_result"
    return 1
  fi
  ok "Credential linked as VP (schemaBaseId: $schema_base_id)"
}

# ---------------------------------------------------------------------------
# Cast composite helpers
# ---------------------------------------------------------------------------

# Obtain an ECS-Organization credential from an issuer's admin API and link it.
# Uses ORG_NAME / ORG_LOGO_URL / ORG_REGISTRY_ID / ORG_ADDRESS / ORG_COUNTRY
# and INGRESS_HOST from the org's config.env. Skips when a VP is already
# linked, unless FORCE_REFRESH=true.
# Usage: obtain_ecs_org_credential <local_admin_api> <issuer_admin_api> <target_did>
obtain_ecs_org_credential() {
  local local_api=$1
  local issuer_api=$2
  local target_did=$3

  if [ "${FORCE_REFRESH:-false}" != "true" ] && has_linked_vp "https://${INGRESS_HOST}" "organization"; then
    ok "ECS-Organization credential already linked — skipping"
    return 0
  fi

  cleanup_self_generated_jscs "$local_api"

  local org_jsc_url
  org_jsc_url=$(discover_ecs_vtjsc "$ECS_TR_PUBLIC_URL" "organization" | sed -n '1p')

  local org_logo_data_uri org_claims
  org_logo_data_uri=$(download_logo_data_uri "$ORG_LOGO_URL")
  org_claims=$(jq -n \
    --arg id "$target_did" \
    --arg name "$ORG_NAME" \
    --arg logo "$org_logo_data_uri" \
    --arg rid "$ORG_REGISTRY_ID" \
    --arg addr "$ORG_ADDRESS" \
    --arg cc "$ORG_COUNTRY" \
    '{id: $id, name: $name, logo: $logo, registryId: $rid, address: $addr, countryCode: $cc}')

  issue_remote_and_link "$issuer_api" "$local_api" "organization" "$org_jsc_url" "$target_did" "$org_claims"
}

# Obtain an ECS-Service credential and link it. In "self" mode the target DID
# is granted an ISSUER permission on the ECS-Service schema (OPEN) and signs
# its own credential; in "delegated" mode the issuer is the parent anchor
# (which must already hold that permission) and the sub-service inherits the
# anchor's ECS-Organization per the Verifiable Trust spec.
# Uses SERVICE_* env vars and INGRESS_HOST from the org's config.env.
# Usage: obtain_service_credential <local_admin_api> <issuer_admin_api> <target_did> <self|delegated>
obtain_service_credential() {
  local local_api=$1
  local issuer_api=$2
  local target_did=$3
  local mode=$4

  if [ "${FORCE_REFRESH:-false}" != "true" ] && has_linked_vp "https://${INGRESS_HOST}" "service"; then
    ok "ECS-Service credential already linked — skipping"
    return 0
  fi

  cleanup_self_generated_jscs "$local_api"

  local service_vtjsc_output service_jsc_url service_schema_id
  service_vtjsc_output=$(discover_ecs_vtjsc "$ECS_TR_PUBLIC_URL" "service")
  service_jsc_url=$(echo "$service_vtjsc_output" | sed -n '1p')
  service_schema_id=$(echo "$service_vtjsc_output" | sed -n '2p')

  if [ "$mode" = "self" ]; then
    ensure_open_perm "$service_schema_id" issuer "$target_did"
  fi

  local service_logo_data_uri service_claims
  service_logo_data_uri=$(download_logo_data_uri "$SERVICE_LOGO_URL")
  service_claims=$(jq -n \
    --arg id "$target_did" \
    --arg name "$SERVICE_NAME" \
    --arg type "$SERVICE_TYPE" \
    --arg desc "$SERVICE_DESCRIPTION" \
    --arg logo "$service_logo_data_uri" \
    --argjson age "${SERVICE_MIN_AGE:-0}" \
    --arg terms "${SERVICE_TERMS:-}" \
    --arg privacy "${SERVICE_PRIVACY:-}" \
    '{id: $id, name: $name, type: $type, description: $desc, logo: $logo, minimumAgeRequired: $age, termsAndConditions: $terms, privacyPolicy: $privacy}')

  issue_remote_and_link "$issuer_api" "$local_api" "service" "$service_jsc_url" "$target_did" "$service_claims"
}

# ---------------------------------------------------------------------------
# Date helper (macOS + Linux compatible)
# ---------------------------------------------------------------------------

# Return a UTC timestamp N seconds in the future
future_timestamp() {
  local seconds=${1:-15}
  date -u -v+"${seconds}"S +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null \
    || date -u -d "+${seconds} seconds" +"%Y-%m-%dT%H:%M:%SZ"
}
