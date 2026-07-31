#!/usr/bin/env bash
# Render the openid4vc.json for one demo cast member (stdout).
#
# Expected environment:
#   OID4VC_ROLE   issuer | verifier (which template to render)
#   SERVICE_NAME  display/common name of this service
#   NETWORK       testnet | devnet
#   NAMESPACE     k8s namespace of the cast (verifier role only)
#   CAST_DIR      absolute path of .github/workflows/demo
#
# For the verifier role, the issuers' development-signing leaf fingerprints
# are read live from each issuer agent's internal admin API
# (GET /v1/oid4vc/certificates, from vs-agent PR #532) via kubectl
# port-forward - so the issuers MUST already run the openid4vc image.
set -eo pipefail

log() { echo -e "\033[1;34m> $1\033[0m" >&2; }
err() { echo -e "\033[1;31mERR $1\033[0m" >&2; }

ISSUER_RELEASES="demo-issuer-accredited demo-issuer-unaccredited"

TPL="${CAST_DIR}/oid4vc/${OID4VC_ROLE}.json.tpl"
[ -f "$TPL" ] || { err "Unknown OID4VC_ROLE '${OID4VC_ROLE}' - no $TPL"; exit 1; }

CONFIG=$(sed -e "s/__NETWORK__/${NETWORK}/g" -e "s/__SERVICE_NAME__/${SERVICE_NAME}/g" "$TPL")

if [ "$OID4VC_ROLE" = "verifier" ]; then
  FINGERPRINTS=""
  PF_PID=""
  trap '[ -n "$PF_PID" ] && kill "$PF_PID" 2>/dev/null || true' EXIT

  for release in $ISSUER_RELEASES; do
    log "Reading OID4VC issuer certificate fingerprint from ${release}..."
    kubectl port-forward -n "$NAMESPACE" "svc/${release}" 3300:3000 >/dev/null 2>&1 &
    PF_PID=$!

    fingerprint=""
    for _ in $(seq 1 15); do
      fingerprint=$(curl -sf "http://localhost:3300/v1/oid4vc/certificates" 2>/dev/null \
        | jq -r '.certificates[]? | select(.role == "issuer") | .fingerprint' | head -1) && \
        [ -n "$fingerprint" ] && break
      sleep 2
    done
    kill "$PF_PID" 2>/dev/null || true
    PF_PID=""

    if [ -z "$fingerprint" ]; then
      err "Could not read the issuer fingerprint from ${release} - is it running the openid4vc image with its issuer config?"
      exit 1
    fi
    log "  ${release}: ${fingerprint}"
    FINGERPRINTS="${FINGERPRINTS:+${FINGERPRINTS}, }\"${fingerprint}\""
  done

  CONFIG=${CONFIG//__ISSUER_FINGERPRINTS__/$FINGERPRINTS}
fi

# Fail loudly on malformed output before it reaches the agent
echo "$CONFIG" | jq -e . >/dev/null || { err "Rendered openid4vc.json is not valid JSON"; exit 1; }
echo "$CONFIG"
