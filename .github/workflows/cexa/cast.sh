#!/usr/bin/env bash
# =============================================================================
# cast.sh — The cexa cast on Verana V4 (devnet)
# =============================================================================
#
# The generic V4 helpers are in .github/workflows/v4/common.sh. This file adds
# the parts of the cexa cast: the zone, the hosts, the Corporation keys, the
# titles of the two CEXA schemas and the counterparty claims. Sourced by the
# scripts in .github/workflows/cexa/scripts/ and by v4-cast-00_core.yml.
#
# Each organization has its own Corporation. The CORPORATION_KEY of an
# organization (config.env) is equal to its release name, so the Corporation
# DID is did:example:playground-cexa-<release>-<chain id>.
#
# =============================================================================

# shellcheck source=../v4/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/../v4/common.sh"

# Public hosts: <release>.cexa.playground.<network>.verana.network
cast_zone() { echo "cexa.playground.${NETWORK:-devnet}.verana.network"; }
cast_host() { echo "$1.$(cast_zone)"; }

# The Corporation DID of an organization. This value does not use CAST, so a
# script that runs without CAST finds the same Corporation.
corporation_did_for() { echo "did:example:playground-cexa-$1-${CHAIN_ID}"; }

# The release name of the Association agent. It is also the Corporation key of
# the Association (the Corporation that owns the CEXA Ecosystem).
R_ASSOCIATION="association"

ASSOCIATION_HOST="$(cast_host "$R_ASSOCIATION")"

# JSON Schema titles of the CEXA schemas. The app finds each schema by its
# title (app/lib/vtjsc.ts, app/usecases/cexa/counterparty.ts), so a change
# here needs the same change in the app.
KYC_TITLE="CEXAKycCredential"
COUNTERPARTY_TITLE="CEXAVerifiedCounterpartyCredential"

# The schema JSON of a file in schemas/, with the network in its $id.
# Usage: cexa_schema_json <file>
cexa_schema_json() {
  sed "s/__NETWORK__/${NETWORK:-devnet}/g" "${CAST_DIR}/schemas/$1" | jq -c '.'
}

# The DID of the Association agent, from its did:webvh log.
association_did() {
  fetch_did_from_log "https://${ASSOCIATION_HOST}" \
    || { err "Could not read the DID of ${ASSOCIATION_HOST}. Run cexa-01 first."; return 1; }
}

# The id of a CEXA schema, from the Ecosystem that the Association controls.
# Usage: find_cexa_schema <association_did> <title>
find_cexa_schema() {
  find_schema_of "$1" "$2" \
    || { err "The Ecosystem of the Association has no schema '$2'. Run cexa-01 first."; return 1; }
}

# The VTJSC id of a schema. The controller agent publishes the VTJSC some time
# after the chain creates the schema, so this function tries again for up to
# 3 minutes.
# Usage: wait_vtjsc_credential_id <public_base_url> <schema_id>
wait_vtjsc_credential_id() {
  local id i
  for i in $(seq 1 18); do
    id=$(fetch_vtjsc_credential_id "$1" "$2" 2>/dev/null) && { echo "$id"; return 0; }
    sleep 10
  done
  fetch_vtjsc_credential_id "$1" "$2"
}

# Wait until the indexer shows the root Participant entry of a schema. The
# composite steps find the root entry through the indexer, and the indexer can
# be some blocks late after the chain creates the entry.
# Usage: wait_root_participant <schema_id>
wait_root_participant() {
  local i
  for i in $(seq 1 12); do
    find_root_participant "$1" > /dev/null && return 0
    sleep 5
  done
  err "The indexer shows no root participant of schema $1 after 60s"
  return 1
}

# The claims of the CEXAVerifiedCounterpartyCredential of a member, from the
# CP_* values of its config.env (EGF section 10). The claim lei is optional:
# the function sends it only when CP_LEI is not empty.
counterparty_claims() {
  local name
  for name in CP_LEGAL_NAME CP_LICENSING_AUTHORITY CP_LICENSE_IDENTIFIER CP_VASP_CATEGORY CP_COMPLIANCE_CONTACT; do
    if [ -z "${!name:-}" ]; then
      err "$name is not set in the config.env of ${RELEASE_NAME:-this member}"
      return 1
    fi
  done
  jq -c -n \
    --arg legalName "$CP_LEGAL_NAME" \
    --arg lei "${CP_LEI:-}" \
    --arg licensingAuthority "$CP_LICENSING_AUTHORITY" \
    --arg licenseIdentifier "$CP_LICENSE_IDENTIFIER" \
    --arg vaspCategory "$CP_VASP_CATEGORY" \
    --arg complianceContact "$CP_COMPLIANCE_CONTACT" \
    '{legalName: $legalName, licensingAuthority: $licensingAuthority,
      licenseIdentifier: $licenseIdentifier, vaspCategory: $vaspCategory,
      complianceContact: $complianceContact}
     + (if $lei != "" then {lei: $lei} else {} end)'
}
