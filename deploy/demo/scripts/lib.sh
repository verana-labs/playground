#!/usr/bin/env bash
# Demo-cast-specific helpers, shared by the provision-* scripts in this
# directory. Sourced AFTER vesta/common.sh (uses its log/ok/err).

# webvh DID of an agent from its published DID document (falls back to .id).
# Usage: get_webvh_did_from_host <host>
get_webvh_did_from_host() {
  curl -sf "https://$1/.well-known/did.json" \
    | jq -r '(.alsoKnownAs // [] | map(select(startswith("did:webvh:"))) | .[0]) // .id'
}

# Ensure the agent has an AnonCreds credential type (schema + cred def)
# linked to a VTJSC — this is what "enables AnonCreds" for the DemoCredential
# on a service, and what the OOB credential-offer / presentation-request
# invitation endpoints need. When schema_issuer_did is given, the AnonCreds
# schema is resolved from that DID's host (the ecosystem anchor) instead of
# being registered locally.
# Usage: ensure_credential_type <admin_api> <vtjsc_url> [schema_issuer_did]
ensure_credential_type() {
  local admin_api=$1
  local vtjsc_url=$2
  local issuer_did=${3:-}

  local existing
  existing=$(curl -sf "${admin_api}/v1/credential-types" 2>/dev/null \
    | jq -r --arg jsc "$vtjsc_url" \
      '.[] | select(.relatedJsonSchemaCredentialId == $jsc) | .id' | head -1)
  if [ -n "$existing" ]; then
    ok "Credential type already exists for this VTJSC: $existing — skipping"
    return 0
  fi

  log "Creating AnonCreds credential type (VTJSC: $vtjsc_url)..."
  local body
  body=$(jq -n --arg jsc "$vtjsc_url" --arg did "$issuer_did" \
    '{relatedJsonSchemaCredentialId: $jsc} + (if $did != "" then {issuerDid: $did} else {} end)')

  local http resp
  http=$(curl -s -o /tmp/ct_resp.json -w '%{http_code}' \
    -X POST "${admin_api}/v1/credential-types" \
    -H 'Content-Type: application/json' -d "$body")
  resp=$(cat /tmp/ct_resp.json)

  if [ "$http" -ge 400 ]; then
    if echo "$resp" | grep -qi "already exists"; then
      ok "Credential type already exists — skipping"
      return 0
    fi
    err "Failed to create credential type (HTTP $http): $resp"
    return 1
  fi
  ok "Credential type created: $(echo "$resp" | jq -r '.id // empty')"
}
