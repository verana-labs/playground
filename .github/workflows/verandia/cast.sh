#!/usr/bin/env bash
# =============================================================================
# cast.sh — The verandia cast on Verana V4 (devnet)
# =============================================================================
#
# The generic V4 helpers are in .github/workflows/v4/common.sh. This file adds
# the parts of the verandia cast: the zone, the hosts, the Corporation keys and
# the titles of the two Verandia schemas. Sourced by the scripts in
# .github/workflows/verandia/scripts/ and by v4-cast-00_core.yml.
#
# Each organization has its own Corporation. The CORPORATION_KEY of an
# organization (config.env) is equal to its release name, so the Corporation
# DID is did:example:playground-verandia-<release>-<chain id>.
#
# =============================================================================

# shellcheck source=../v4/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/../v4/common.sh"

# Public hosts: <release>.verandia.playground.<network>.verana.network
cast_zone() { echo "verandia.playground.${NETWORK:-devnet}.verana.network"; }
cast_host() { echo "$1.$(cast_zone)"; }

# The two registries: their release names, which are also their Corporation keys.
R_BUSINESS_REGISTRY="business-registry"
R_CIVIL_REGISTRY="civil-registry"

BUSINESS_REGISTRY_HOST="$(cast_host "$R_BUSINESS_REGISTRY")"
CIVIL_REGISTRY_HOST="$(cast_host "$R_CIVIL_REGISTRY")"

# JSON Schema titles of the Verandia schemas. The app finds each VTJSC by its
# title (app/lib/vtjsc.ts), so a change here needs the same change in the app.
LEGAL_REP_TITLE="LegalRepresentativeCredential"
CITIZEN_ID_TITLE="VerandiaCitizenIDCredential"

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

# The schema id of a Verandia schema, from the Ecosystem that a registry controls.
# Usage: find_registry_schema <registry_host> <title> <workflow>
find_registry_schema() {
  local did
  did=$(fetch_did_from_log "https://$1") \
    || { err "Could not read the DID of $1. Run $3 first."; return 1; }
  find_schema_of "$did" "$2" \
    || { err "The Ecosystem of $1 has no schema '$2'. Run $3 first."; return 1; }
}
