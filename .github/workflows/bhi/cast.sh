#!/usr/bin/env bash
# =============================================================================
# cast.sh — The BHI cast on Verana V4 (devnet)
# =============================================================================
#
# The generic V4 helpers are in .github/workflows/v4/common.sh. This file adds
# the parts of the BHI cast: the releases, the hosts, and the steps that more
# than one member of the cast runs. Sourced by v4-cast-00_core.yml and by the
# scripts in .github/workflows/bhi/scripts/.
#
# Each organization has its own Corporation. The CORPORATION_KEY values are:
# oid, tvs, institute, northbank, caledonian, cirrus, meridian, jobsearch and
# halcyon. corporation_did_for (common.sh) makes the Corporation DID from the
# key.
#
# =============================================================================

# shellcheck source=../v4/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/../v4/common.sh"

# ---------------------------------------------------------------------------
# Releases and hosts
# ---------------------------------------------------------------------------

# Helm release names (also the in-cluster service names).
R_OID="orchestrating-identity"
R_TVS="tvs"
R_INSTITUTE="institute"
R_NORTHBANK="northbank"
R_CALEDONIAN="caledonian"
R_CIRRUS="cirrus"
# The verandia cast has the release "meridian-bank" in the same namespace, so
# this release is "meridian-tech". The public host is "meridian.<zone>".
R_MERIDIAN="meridian-tech"
R_JOBSEARCH="jobsearch"
R_HALCYON="halcyon"

# Public hosts: <org>.bhi.playground.<network>.verana.network
bhi_zone() { echo "bhi.playground.${NETWORK:-devnet}.verana.network"; }

# The public host of a release.
# Usage: bhi_host_of <release>
bhi_host_of() {
  case "$1" in
    "$R_MERIDIAN") echo "meridian.$(bhi_zone)" ;;
    *) echo "$1.$(bhi_zone)" ;;
  esac
}

OID_HOST="$(bhi_host_of "$R_OID")"
TVS_HOST="$(bhi_host_of "$R_TVS")"
INSTITUTE_HOST="$(bhi_host_of "$R_INSTITUTE")"
NORTHBANK_HOST="$(bhi_host_of "$R_NORTHBANK")"
CALEDONIAN_HOST="$(bhi_host_of "$R_CALEDONIAN")"
CIRRUS_HOST="$(bhi_host_of "$R_CIRRUS")"
MERIDIAN_HOST="$(bhi_host_of "$R_MERIDIAN")"
JOBSEARCH_HOST="$(bhi_host_of "$R_JOBSEARCH")"
HALCYON_HOST="$(bhi_host_of "$R_HALCYON")"
export OID_HOST TVS_HOST INSTITUTE_HOST NORTHBANK_HOST CALEDONIAN_HOST
export CIRRUS_HOST MERIDIAN_HOST JOBSEARCH_HOST HALCYON_HOST

# JSON Schema titles of the cast schemas (schemas/*.json).
TITLE_DVS="DVSAlignedProviderCredential"
TITLE_RRP="RecognisedRecTechProviderCredential"
TITLE_VE="VerifiedEmployerCredential"
TITLE_RTW="RightToWorkCredential"
TITLE_EMP="EmploymentCredential"
TITLE_QUAL="QualificationCredential"

# ---------------------------------------------------------------------------
# Lookups
# ---------------------------------------------------------------------------

# Read a schema file and resolve the network placeholder in its $id.
# Usage: bhi_schema_json <file>
bhi_schema_json() {
  sed "s/__NETWORK__/${NETWORK}/g" "${CAST_DIR}/schemas/$1" | jq -c '.'
}

# Find a schema of the Ecosystem that the agent at a host controls. The
# function writes no error, so a script can use it to test if a step of
# another workflow is complete.
# Usage: bhi_find_schema <controller_host> <title>
bhi_find_schema() {
  local did ecosystem_id
  did=$(fetch_did_from_log "https://$1") || return 1
  ecosystem_id=$(find_ecosystem_by_did "$did") || return 1
  find_schema_by_title "$ecosystem_id" "$2"
}

# Find a schema of the Ecosystem that the agent at a host controls. Stop with
# an error that names the workflow to run first.
# Usage: bhi_require_schema <controller_host> <title> <workflow>
bhi_require_schema() {
  local schema_id
  schema_id=$(bhi_find_schema "$1" "$2") \
    || { err "${1} controls no Ecosystem with the schema '${2}'. Run ${3} first."; return 1; }
  echo "$schema_id"
}

# Find the active entry of the agent at a host. Stop with an error that names
# the workflow to run first.
# Usage: bhi_require_participant <schema_id> <IDX_ROLE> <host> <workflow>
bhi_require_participant() {
  local did participant_id
  did=$(fetch_did_from_log "https://$3") \
    || { err "Could not read the DID of ${3}. Run ${4} first."; return 1; }
  participant_id=$(find_active_participant "$1" "$2" "$did") \
    || { err "${3} has no active ${2} entry on schema ${1}. Run ${4} first."; return 1; }
  echo "$participant_id"
}

# Find or create the root entry of a schema, and wait until the indexer has
# it. join_under_root finds the root entry through the indexer, and the
# indexer can show a new entry some seconds after the chain creates it.
# Usage: bhi_ensure_root <schema_id> <did>
bhi_ensure_root() {
  local root_id i
  root_id=$(ensure_root_participant "$1" "$2") || return 1
  for i in $(seq 1 20); do
    find_root_participant "$1" > /dev/null && { echo "$root_id"; return 0; }
    sleep 3
  done
  err "The indexer does not show root participant $root_id of schema $1 after 60s"
  return 1
}

# The VTJSC id of a schema. The controller agent publishes the VTJSC after
# the chain creates the schema, so the function tries again for 2 minutes.
# Usage: bhi_vtjsc_id <controller_host> <schema_id>
bhi_vtjsc_id() {
  local id i
  for i in $(seq 1 12); do
    id=$(fetch_vtjsc_credential_id "https://$1" "$2" 2>/dev/null) && { echo "$id"; return 0; }
    sleep 10
  done
  fetch_vtjsc_credential_id "https://$1" "$2"
}

# ---------------------------------------------------------------------------
# vt-flow onboarding of one Participant entry
# ---------------------------------------------------------------------------

# The onboarding state of a Participant entry on the chain (op_state).
# Usage: bhi_participant_op_state <participant_id>
bhi_participant_op_state() {
  veranad query pp get-participant "$1" --node "$NODE_RPC" --output json 2>/dev/null \
    | jq -r '.participant.op_state // empty' 2>/dev/null
}

# Validate the onboarding request of one applicant entry on the validator
# agent. complete_onboarding (common.sh) selects the flows by the peer DID
# only. An applicant that onboards more than one entry with the same
# validator (Meridian on Orchestrating Identity, JobSearch on TVS) then finds
# the finished flow of its first entry and validates no other entry. This
# function is different:
#   - The entry is done when the chain shows it VALIDATED. A run that
#     starts again does not need the old flow.
#   - It selects the pending flow of the applicant entry
#     (applicantParticipantId). When no flow gives that entry, it uses a
#     pending flow that gives no applicant entry. It never uses a finished
#     flow of another entry.
# Sets FLOW_SUBMISSION (see complete_onboarding): DONE when the entry was
# already VALIDATED, else the submission of the last validation.
# Usage: bhi_complete_onboarding <validator_admin_api> <applicant_did> <applicant_participant_id> [claims_json]
bhi_complete_onboarding() {
  local admin_api=$1
  local peer_did=$2
  local pid=$3
  local claims_json="${4:-}"
  local query flows pending session_id state http_code i
  local validated_session=""
  FLOW_SUBMISSION=""
  query="role=validator&peerDid=$(printf '%s' "$peer_did" | jq -sRr @uri)"

  for i in $(seq 1 18); do
    if [ "$(bhi_participant_op_state "$pid")" = "VALIDATED" ]; then
      ok "Participant $pid of $peer_did is VALIDATED"
      [ -n "$FLOW_SUBMISSION" ] || FLOW_SUBMISSION="DONE"
      return 0
    fi
    # After a validation by the operator, the agent sends no transaction.
    [ "$FLOW_SUBMISSION" = "OPERATOR" ] && return 0

    flows=$(curl -sf "${admin_api}/v2/vt/flows?${query}" 2>/dev/null) || flows='{}'
    pending=$(echo "$flows" | jq -c '[(.items // [])[]
        | select(.flowState == "AWAITING_OR" or .flowState == "VALIDATING"
                 or .flowState == "OOB_PENDING" or .flowState == "VALIDATED_PENDING_CLAIMS"
                 or .flowState == "VALIDATION_TX_FAILED")]
      | sort_by(.lastEventAt // .createdAt)')
    # The pending flow of this entry. The id can have a prefix, so compare the end.
    session_id=$(echo "$pending" | jq -r --arg p "$pid" '[.[]
        | select((.applicantParticipantId // "" | tostring) as $a
                 | $a == $p or ($a | endswith(":" + $p)))]
      | last | .participantSessionId // empty')
    if [ -z "$session_id" ]; then
      session_id=$(echo "$pending" | jq -r '[.[] | select(.applicantParticipantId == null)]
        | last | .participantSessionId // empty')
    fi

    # Validate a flow one time. Validate it again only after a failed transaction.
    state=$(echo "$pending" | jq -r --arg s "$session_id" 'first(.[] | select(.participantSessionId == $s) | .flowState) // empty')
    if [ -n "$session_id" ] && [ "$session_id" = "$validated_session" ] && [ "$state" != "VALIDATION_TX_FAILED" ]; then
      session_id=""
    fi

    if [ -n "$session_id" ]; then
      if [ -n "$claims_json" ]; then
        http_code=$(curl -s -o /tmp/vt_flow_claims.json -w '%{http_code}' \
          -X PUT -H 'Content-Type: application/json' \
          -d "$(jq -n --argjson c "$claims_json" '{claims: $c}')" \
          "${admin_api}/v2/vt/flows/${session_id}/claims")
        if [ "$http_code" != "200" ] && [ "$http_code" != "201" ]; then
          err "Could not set the claims of flow $session_id (HTTP $http_code): $(cat /tmp/vt_flow_claims.json)"
          return 1
        fi
        ok "Claims set on flow $session_id"
      fi

      # A schema with no validity period makes effectiveUntil mandatory.
      http_code=$(curl -s -o /tmp/vt_flow_validate.json -w '%{http_code}' \
        -X POST -H 'Content-Type: application/json' \
        -d "{\"effectiveUntil\":\"${VT_FLOW_EFFECTIVE_UNTIL:-$(date -u -d '+1 year' +%Y-%m-%dT00:00:00Z)}\"}" \
        "${admin_api}/v2/vt/flows/${session_id}/validate")
      if [ "$http_code" != "200" ] && [ "$http_code" != "201" ]; then
        err "Could not validate flow $session_id (HTTP $http_code): $(cat /tmp/vt_flow_validate.json)"
        return 1
      fi
      FLOW_SUBMISSION=$(jq -r '.validation.submission // "unknown"' /tmp/vt_flow_validate.json)
      validated_session="$session_id"
      ok "Flow validated: $session_id (submission: $FLOW_SUBMISSION)"
    fi
    sleep 10
  done
  err "Participant $pid of $peer_did is not VALIDATED after 3 minutes (validator $admin_api)"
  err "Flows: $(echo "$flows" | jq -r '[(.items // [])[] | "\(.applicantParticipantId // "?"):\(.flowState)"] | join(", ")')"
  return 1
}

# join_under_agent (common.sh) with the flow selection of
# bhi_complete_onboarding. The BHI scripts use it for each onboarding on the
# agent of another cast member.
# Usage: bhi_join_under_agent <schema_id> <role> <vsoa_msg_types> <validator_participant_id> <validator_release> [claims_json]
bhi_join_under_agent() {
  local schema_id=$1
  local role=$2
  local msg_types=$3
  local validator_id=$4
  local validator_release=$5
  local claims_json="${6:-}"
  local participant_id

  start_port_forward "$validator_release" "$PF_PORT_VALIDATOR" || return 1
  participant_id=$(start_onboarding_with "$schema_id" "$role" "$msg_types" "$validator_id" \
    "http://localhost:${PF_PORT_VALIDATOR}") || return 1
  bhi_complete_onboarding "http://localhost:${PF_PORT_VALIDATOR}" "$AGENT_DID" "$participant_id" "$claims_json" || return 1
  stop_port_forward "$PF_PORT_VALIDATOR"
  if [ "$FLOW_SUBMISSION" = "OPERATOR" ]; then
    err "The agent ${validator_release} holds no authorization to validate. Check its VSOperatorAuthorization."
    return 1
  fi
  # The agent publishes the new credential, and the indexer evaluates the DID
  # again. Make sure that the agent is still trusted after that.
  if [ "$role" = "$PP_ROLE_HOLDER" ]; then
    sleep 45
    wait_until_trusted "$AGENT_DID" "$participant_id" || return 1
  fi
}

# ---------------------------------------------------------------------------
# Grantor branches of the certified DVS providers (Orchestrating Identity, TVS)
# ---------------------------------------------------------------------------

# The Verified Employer branch of a certified DVS provider:
#   1. an ISSUER_GRANTOR entry on the Verified Employer schema (GRANTOR mode),
#      validated by the root entry of the Institute Ecosystem;
#   2. an ISSUER entry on the same schema. The validator is the ISSUER_GRANTOR
#      entry of the same provider. An agent cannot run a vt-flow with itself,
#      so the operator validates it with the Corporation of the provider.
# The ISSUER entry then validates the HOLDER entries of the employers.
# The step needs the Institute Ecosystem (bhi-04). When it does not exist, the
# step writes a warning and does nothing. Run the workflow again after bhi-04.
provision_ve_issuer_branch() {
  local ve_schema grantor_id issuer_id
  if ! ve_schema=$(bhi_find_schema "$INSTITUTE_HOST" "$TITLE_VE"); then
    warn "No Verified Employer schema yet. Run this workflow again with step=provision after bhi-04."
    return 0
  fi
  log "Verified Employer branch on schema $ve_schema..."
  grantor_id=$(join_under_root "$ve_schema" "$PP_ROLE_ISSUER_GRANTOR" "$VSOA_GRANTOR" institute) || return 1
  issuer_id=$(ensure_participant start "$ve_schema" "$PP_ROLE_ISSUER" "$grantor_id" "$AGENT_DID" "$VSOA_ISSUER") || return 1
  set_participant_validated "$issuer_id" "$CORPORATION" || return 1
  ok "Verified Employer branch: ISSUER_GRANTOR=$grantor_id ISSUER=$issuer_id"
}

# The verifier branches of a certified DVS provider: a VERIFIER_GRANTOR entry
# on each candidate schema (verifier mode GRANTOR), validated by the root
# entry of the schema. The grantor agent then validates the VERIFIER entries
# of the employers and of the job boards.
# The step needs the Northbank (bhi-05) and Caledonian (bhi-06) Ecosystems. It
# skips a schema that does not exist yet, with a warning. Run the workflow
# again after bhi-06.
provision_verifier_grantor_branches() {
  local entry host title corporation_key schema_id grantor_id
  for entry in \
    "${NORTHBANK_HOST}|${TITLE_RTW}|northbank" \
    "${NORTHBANK_HOST}|${TITLE_EMP}|northbank" \
    "${CALEDONIAN_HOST}|${TITLE_QUAL}|caledonian"; do
    IFS='|' read -r host title corporation_key <<< "$entry"
    if ! schema_id=$(bhi_find_schema "$host" "$title"); then
      warn "No ${title} schema yet. Run this workflow again with step=provision after bhi-05 and bhi-06."
      continue
    fi
    grantor_id=$(join_under_root "$schema_id" "$PP_ROLE_VERIFIER_GRANTOR" "$VSOA_GRANTOR" "$corporation_key") || return 1
    ok "VERIFIER_GRANTOR on ${title}: $grantor_id"
  done
}

# Make the agent a VERIFIER of the three candidate schemas. A VERIFIER_GRANTOR
# entry of the grantor agent validates each entry.
# Usage: provision_candidate_verifier <grantor_host> <grantor_release> <grantor_workflow>
provision_candidate_verifier() {
  local grantor_host=$1
  local grantor_release=$2
  local grantor_workflow=$3
  local entry host title owner_workflow schema_id grantor_id
  for entry in \
    "${NORTHBANK_HOST}|${TITLE_RTW}|bhi-05" \
    "${NORTHBANK_HOST}|${TITLE_EMP}|bhi-05" \
    "${CALEDONIAN_HOST}|${TITLE_QUAL}|bhi-06"; do
    IFS='|' read -r host title owner_workflow <<< "$entry"
    schema_id=$(bhi_require_schema "$host" "$title" "$owner_workflow") || return 1
    grantor_id=$(bhi_require_participant "$schema_id" "$PP_IDX_ROLE_VERIFIER_GRANTOR" "$grantor_host" \
      "${grantor_workflow} again with step=provision") || return 1
    bhi_join_under_agent "$schema_id" "$PP_ROLE_VERIFIER" "$VSOA_VERIFIER" "$grantor_id" "$grantor_release" || return 1
    ok "VERIFIER on ${title}, validated by ${grantor_release}"
  done
}

# ---------------------------------------------------------------------------
# Start of a provision script
# ---------------------------------------------------------------------------

# Open the port-forward of the agent on port 3100, and set API and AGENT_DID.
bhi_start_agent() {
  start_port_forward "$RELEASE_NAME" 3100 || return 1
  API="http://localhost:3100"
  AGENT_DID=$(get_agent_did "$API")
  [ -n "$AGENT_DID" ] || { err "Could not read the agent DID"; return 1; }
  export API AGENT_DID
  ok "${SERVICE_NAME:-$RELEASE_NAME} DID: $AGENT_DID"
}
