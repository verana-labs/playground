#!/usr/bin/env bash
# =============================================================================
# cast.sh — The vesta cast on Verana V4 (devnet)
# =============================================================================
#
# The generic V4 helpers are in .github/workflows/v4/common.sh. This file adds
# the parts of the vesta cast: the hosts of the cast members, the schema
# titles, and the composite steps that several members use. Sourced by the
# scripts in .github/workflows/vesta/scripts/ and by v4-cast-00_core.yml.
#
# Each organization of the cast has its own Corporation (CORPORATION_KEY in
# config.env). The default corporation_did_for of v4/common.sh gives its DID:
# did:example:playground-vesta-<key>-<chain id>.
#
# CAUTION: vesta/common.sh is the V3 library of the bolivia, ccm and eventos
# casts. This cast does not use it.
#
# =============================================================================

# shellcheck source=../v4/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/../v4/common.sh"

# ---------------------------------------------------------------------------
# Hosts
# ---------------------------------------------------------------------------

# The DNS zone of the cast: playground.<network>.verana.network.
cast_zone() { echo "playground.${NETWORK:-devnet}.verana.network"; }

# The public host of a release of the cast. The delegated sub-services of
# Vesta are in the zone of Vesta: <service>.vesta.playground.<network>...
# Usage: cast_host <release>
cast_host() {
  case "$1" in
    vesta-portal)         echo "portal.vesta.$(cast_zone)" ;;
    vesta-repair-network) echo "repair-network.vesta.$(cast_zone)" ;;
    *)                    echo "$1.$(cast_zone)" ;;
  esac
}

# The did:webvh of a release of the cast, from its did:webvh log.
# Usage: cast_did <release>
cast_did() {
  fetch_did_from_log "https://$(cast_host "$1")" \
    || { err "Could not read the DID of $(cast_host "$1"). Deploy $1 first."; return 1; }
}

# The host of the ECS Ecosystem controller (the last segment of its DID).
ecs_host() { echo "${ECS_ECOSYSTEM_DID##*:}"; }

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

# The JSON Schema titles of the schemas that the cast uses.
ISO_SCHEMA_TITLE="ISO9001DemoCredential"
AR_SCHEMA_TITLE="AuthorizedRepairerCredential"
BADGE_SCHEMA_TITLE="BadgeCredential"

# Read a schema file of the cast as compact JSON, with the network in its $id.
# Usage: read_cast_schema <file>
read_cast_schema() {
  sed "s/__NETWORK__/${NETWORK:-devnet}/g" "${CAST_DIR}/schemas/$1" | jq -c '.'
}

# Find a schema of the Ecosystem that a release of the cast controls.
# Usage: find_cast_schema_id <release> <title>
find_cast_schema_id() {
  local did
  did=$(cast_did "$1") || return 1
  find_schema_of "$did" "$2"
}

# Find the BadgeCredential schema of the ECS Ecosystem. The devnet ECS
# Ecosystem does not have this schema yet, so a missing schema is a warning
# and not an error: the caller skips the badge steps.
# Usage: find_badge_schema_id
find_badge_schema_id() {
  local schema_id
  if ! schema_id=$(find_ecs_schema_id "$BADGE_SCHEMA_TITLE" 2>/dev/null); then
    warn "The ECS Ecosystem has no ${BADGE_SCHEMA_TITLE} schema (or the indexer did not answer). Skipping the badge steps."
    # The caller reads stdout, so the annotation goes to stderr.
    if [ -n "${GITHUB_ACTIONS:-}" ]; then
      echo "::warning::No ${BADGE_SCHEMA_TITLE} schema in the ECS Ecosystem. The badge steps did not run. Run this workflow again (step=provision) when the schema exists." >&2
    fi
    return 1
  fi
  echo "$schema_id"
}

# ---------------------------------------------------------------------------
# The agent that a script provisions
# ---------------------------------------------------------------------------

# Local port of the port-forward to the Admin API of the agent.
PF_PORT_AGENT=3100
AGENT_API="http://localhost:${PF_PORT_AGENT}"

# Open the port-forward to the agent (RELEASE_NAME) and read its DID.
# Sets AGENT_DID.
# Usage: open_agent
open_agent() {
  start_port_forward "$RELEASE_NAME" "$PF_PORT_AGENT" || return 1
  AGENT_DID=$(get_agent_did "$AGENT_API")
  [ -n "$AGENT_DID" ] || { err "Could not read the DID of ${RELEASE_NAME}"; return 1; }
  export AGENT_DID
  ok "${RELEASE_NAME} DID: $AGENT_DID"
}

# ---------------------------------------------------------------------------
# ECS Badge
# ---------------------------------------------------------------------------

# Make the agent an issuer of the ECS Badge: an OPEN ISSUER entry on the
# BadgeCredential schema, and an AnonCreds credential definition on the badge
# VTJSC (the ECS Ecosystem controller publishes it). When the schema does not
# exist, log a warning and do nothing.
# Usage: provision_badge_issuer
provision_badge_issuer() {
  local badge_cs vtjsc_id
  badge_cs=$(find_badge_schema_id) || return 0
  join_open "$badge_cs" "$PP_ROLE_ISSUER" "$VSOA_ISSUER" > /dev/null || return 1
  vtjsc_id=$(fetch_vtjsc_credential_id "https://$(ecs_host)" "$badge_cs") || return 1
  ensure_credential_definition "$AGENT_API" "$vtjsc_id" || return 1
  ok "${RELEASE_NAME} is an ECS Badge issuer (schema $badge_cs)"
}

# Make the agent a verifier of the ECS Badge: an OPEN VERIFIER entry on the
# BadgeCredential schema. When the schema does not exist, log a warning and
# do nothing.
# Usage: provision_badge_verifier
provision_badge_verifier() {
  local badge_cs
  badge_cs=$(find_badge_schema_id) || return 0
  join_open "$badge_cs" "$PP_ROLE_VERIFIER" "$VSOA_VERIFIER" > /dev/null || return 1
  ok "${RELEASE_NAME} is an ECS Badge verifier (schema $badge_cs)"
}

# ---------------------------------------------------------------------------
# Ecosystem of a cast member
# ---------------------------------------------------------------------------

# Make the agent the controller of an Ecosystem with one credential schema
# (SCHEMA_FILE in config.env) and its root Participant entry. Issuers join
# through the Ecosystem, verifiers are OPEN, and a holder gets a HOLDER entry
# from an issuer (the holders are organizations).
# Usage: provision_cast_ecosystem
provision_cast_ecosystem() {
  local schema_json ecosystem_id cs_id root_id
  schema_json=$(read_cast_schema "${SCHEMA_FILE:?SCHEMA_FILE is not set}") || return 1
  ecosystem_id=$(ensure_ecosystem "$AGENT_DID") || return 1
  cs_id=$(ensure_credential_schema "$ecosystem_id" "$schema_json" \
    "$ONBOARDING_MODE_ECOSYSTEM" "$ONBOARDING_MODE_OPEN" "$HOLDER_MODE_ISSUER_OP") || return 1
  root_id=$(ensure_root_participant "$cs_id" "$AGENT_DID") || return 1
  ok "Ecosystem=$ecosystem_id, schema=$cs_id, root participant=$root_id"
}

# ---------------------------------------------------------------------------
# Org-to-org credentials
# ---------------------------------------------------------------------------

# Make the agent the HOLDER of a credential that the ISSUER entry of another
# cast agent validates. The validator agent sets the claims and issues the
# credential over DIDComm.
# Usage: hold_credential_from <schema_id> <issuer_release> <claims_json>
hold_credential_from() {
  local schema_id=$1
  local issuer_release=$2
  local claims_json=$3
  local issuer_did issuer_participant
  issuer_did=$(cast_did "$issuer_release") || return 1
  issuer_participant=$(find_active_participant "$schema_id" "$PP_IDX_ROLE_ISSUER" "$issuer_did") \
    || { err "${issuer_release} has no active ISSUER entry on schema ${schema_id}. Provision ${issuer_release} first."; return 1; }
  join_under_agent "$schema_id" "$PP_ROLE_HOLDER" "$VSOA_HOLDER" \
    "$issuer_participant" "$issuer_release" "$claims_json" || return 1
  ok "${RELEASE_NAME} holds the credential of schema ${schema_id} from ${issuer_release}"
}
