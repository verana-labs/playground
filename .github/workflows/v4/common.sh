#!/usr/bin/env bash
# =============================================================================
# common.sh — Shared helpers for the playground casts on Verana V4 (devnet)
# =============================================================================
#
# Ported from verana-labs/verana-demos common/common.sh (branch
# vs/devnet-example), which uses veranad v0.10.5 and vs-agent v2. Each cast
# sources this file from its own cast.sh, which defines the hosts of the cast
# and the DID of each Corporation (corporation_did_for).
#
# The V4 model:
#   - A Corporation (a group policy account) owns the Ecosystems, the schemas
#     and the Participant entries of one organization. The cast operator account
#     (USER_ACC) holds an OperatorAuthorization of each Corporation and signs
#     every transaction. One account can operate several Corporations.
#   - Each agent has its own Verana account (the vs_operator of its own
#     Participant entries). The chain does not let one account hold both
#     authorization types, so each agent account is different from USER_ACC.
#   - An agent gets its credentials from other agents through a vt-flow
#     onboarding process (DIDComm). The operator creates the Participant entry,
#     the agent sends the onboarding request, and the validator validates it.
#
# Expected environment (exported by the core workflow):
#   NETWORK          devnet
#   NAMESPACE        Kubernetes namespace of the cast agents
#   USER_ACC         veranad key name of the Corporation operator
#   CAST             the cast directory name (demo, vesta, verandia, cexa, bhi)
#   CORPORATION_KEY  the organization of this agent (config.env)
#
# =============================================================================

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

log()  { echo -e "\n\033[1;34m> $1\033[0m" >&2; }
ok()   { echo -e "  \033[1;32mOK $1\033[0m" >&2; }
err()  {
  echo -e "  \033[1;31mERR $1\033[0m" >&2
  # The last lines on stderr can be lost when the step stops. An annotation stays.
  [ -n "${GITHUB_ACTIONS:-}" ] && echo "::error::$1" || true
}
warn() { echo -e "  \033[1;33mWARN $1\033[0m" >&2; }

# ---------------------------------------------------------------------------
# Corporations and governance documents
# ---------------------------------------------------------------------------

# The DID of the Corporation of an organization. The scripts find each
# Corporation by this value, so no workflow has to store a Corporation id.
# A cast can redefine it in its cast.sh.
corporation_did_for() { echo "did:example:playground-${CAST}-$1-${CHAIN_ID}"; }

# The DID of the Corporation of this agent (CORPORATION_KEY in config.env).
corporation_did() { corporation_did_for "${CORPORATION_KEY:?CORPORATION_KEY is not set}"; }

# Governance framework document of the Corporations and of the Ecosystems.
EGF_DOC_URL="${EGF_DOC_URL:-https://verana-labs.github.io/governance-docs/EGF/example.pdf}"

# ---------------------------------------------------------------------------
# Network configuration
# ---------------------------------------------------------------------------

set_network_vars() {
  local network="${1:-devnet}"

  case "$network" in
    devnet)
      CHAIN_ID="${CHAIN_ID:-vna-devnet-1}"
      NODE_RPC="${NODE_RPC:-https://rpc.devnet.verana.network}"
      # The chain minimum is 0.0025uvna. A transaction uses less than 400000
      # gas, so it costs less than TX_FEE_MAX.
      GAS_PRICES="${GAS_PRICES:-0.01uvna}"
      TX_FEE_MAX="${TX_FEE_MAX:-10000}"
      # The Corporation pays the fees of the agent through a fee grant, so the
      # agent account needs funds only to exist on the chain.
      AGENT_FUNDS="${AGENT_FUNDS:-1000uvna}"
      # The faucet needs a wallet signature (ADR-036), for example from the Verana Frontend.
      FAUCET_URL="https://faucet.devnet.verana.network"
      INDEXER_URL="${INDEXER_URL:-https://idx.devnet.verana.network}"
      # The shared ECS Ecosystem (verana-deploy scripts/ecs-ecosystem).
      ECS_ECOSYSTEM_DID="${ECS_ECOSYSTEM_DID:-did:webvh:QmVWnZrJ3B5cR3oGhdBHcbE6YhYe9FHRGwaGxY7c2wPMFN:ecs-ecosystem.devnet.verana.network}"
      # The service that holds the ISSUER entry on the ECS Organization
      # schema. It lives in the chain namespace, not in the cast namespace.
      ECS_ORG_ISSUER_PUBLIC_URL="${ECS_ORG_ISSUER_PUBLIC_URL:-https://ecs-org-issuer.devnet.verana.network}"
      ECS_NAMESPACE="${ECS_NAMESPACE:-vna-devnet-1}"
      ECS_ORG_ISSUER_RELEASE="${ECS_ORG_ISSUER_RELEASE:-ecs-org-issuer}"
      ;;
    *)
      err "Network '$network' is not supported by the V4 casts. Use 'devnet'."
      exit 1
      ;;
  esac

  export CHAIN_ID NODE_RPC GAS_PRICES TX_FEE_MAX AGENT_FUNDS FAUCET_URL INDEXER_URL ECS_ECOSYSTEM_DID
  export ECS_ORG_ISSUER_PUBLIC_URL ECS_NAMESPACE ECS_ORG_ISSUER_RELEASE
}

# ---------------------------------------------------------------------------
# Message types of the authorizations
# ---------------------------------------------------------------------------

# VSOperatorAuthorization, per Participant role. The chain accepts only these
# message types for each role (vsoaPermittedMsgTypes, verana-node
# x/pp/types/types.go).
readonly VSOA_ISSUER="/verana.pp.v1.MsgCreateOrUpdateParticipantSession,/verana.pp.v1.MsgSetParticipantOPToValidated"
readonly VSOA_VERIFIER="/verana.pp.v1.MsgCreateOrUpdateParticipantSession"
readonly VSOA_HOLDER="/verana.pp.v1.MsgTriggerResolver"
# A grantor validates the entries of its members, and nothing else.
readonly VSOA_GRANTOR="/verana.pp.v1.MsgSetParticipantOPToValidated"

# OperatorAuthorization of the cast operator. MsgCreateOrUpdateParticipantSession
# is not in the list: the chain refuses it in this grant and gives it to the
# agents through their VSOperatorAuthorization.
readonly OA_MSGS_CAST='["/verana.ec.v1.MsgCreateEcosystem","/verana.ec.v1.MsgUpdateEcosystem","/verana.ec.v1.MsgArchiveEcosystem","/verana.cs.v1.MsgCreateCredentialSchema","/verana.pp.v1.MsgCreateRootParticipant","/verana.pp.v1.MsgStartParticipantOP","/verana.pp.v1.MsgSetParticipantOPToValidated","/verana.pp.v1.MsgRenewParticipantOP","/verana.pp.v1.MsgCancelParticipantOPLastRequest","/verana.pp.v1.MsgSelfCreateParticipant","/verana.pp.v1.MsgRevokeParticipant","/verana.pp.v1.MsgTriggerResolver"]'

# Onboarding modes of a credential schema (x/cs/v1 enums).
# CAUTION: the V3 numbers differ. In V3, 3 meant ECOSYSTEM; in V4, 3 is GRANTOR.
readonly ONBOARDING_MODE_OPEN=1
readonly ONBOARDING_MODE_ECOSYSTEM=2
readonly ONBOARDING_MODE_GRANTOR=3
# Holders: ISSUER_ONBOARDING_PROCESS for org-to-org credentials (the holder
# gets a HOLDER entry), PERMISSIONLESS for credentials of personal wallets.
readonly HOLDER_MODE_ISSUER_OP=1
readonly HOLDER_MODE_PERMISSIONLESS=2

# Participant roles. The CLI takes lowercase names, the indexer takes uppercase names.
readonly PP_ROLE_ISSUER="issuer"
readonly PP_ROLE_VERIFIER="verifier"
readonly PP_ROLE_HOLDER="holder"
readonly PP_ROLE_ISSUER_GRANTOR="issuer-grantor"
readonly PP_ROLE_VERIFIER_GRANTOR="verifier-grantor"
readonly PP_IDX_ROLE_ISSUER="ISSUER"
readonly PP_IDX_ROLE_VERIFIER="VERIFIER"
readonly PP_IDX_ROLE_HOLDER="HOLDER"
readonly PP_IDX_ROLE_ISSUER_GRANTOR="ISSUER_GRANTOR"
readonly PP_IDX_ROLE_VERIFIER_GRANTOR="VERIFIER_GRANTOR"
readonly PP_IDX_ROLE_ECOSYSTEM="ECOSYSTEM"

# ---------------------------------------------------------------------------
# Port-forwarding to the Admin API of an agent
# ---------------------------------------------------------------------------

PF_PIDS=""

# Start a port-forward and wait until the Admin API answers.
# Usage: start_port_forward <release> <local_port> [namespace]
start_port_forward() {
  local release=$1
  local local_port=$2
  local namespace="${3:-$NAMESPACE}"

  kubectl port-forward -n "$namespace" "svc/${release}" "${local_port}:3000" >/dev/null 2>&1 &
  PF_PIDS="$PF_PIDS ${local_port}:$!"

  local i=0
  while [ $i -lt 15 ]; do
    if curl -sf "http://localhost:${local_port}/v2/agent/health/live" > /dev/null 2>&1; then
      ok "Port-forward: ${namespace}/${release} Admin API on :${local_port}"
      return 0
    fi
    sleep 2
    i=$((i + 1))
  done
  err "Port-forward to ${namespace}/${release} failed. Make sure that the pod runs."
  return 1
}

stop_port_forwards() {
  local entry
  for entry in $PF_PIDS; do
    kill "${entry#*:}" 2>/dev/null || true
  done
  PF_PIDS=""
}

# Stop the port-forward of one local port.
# Usage: stop_port_forward <local_port>
stop_port_forward() {
  local entry kept=""
  for entry in $PF_PIDS; do
    if [ "${entry%%:*}" = "$1" ]; then
      kill "${entry#*:}" 2>/dev/null || true
    else
      kept="$kept $entry"
    fi
  done
  PF_PIDS="$kept"
}

# The DID of an agent, from its Admin API.
# Usage: get_agent_did <admin_api_url>
get_agent_did() {
  curl -sf "$1/v2/agent/info" | jq -r '.did // empty'
}

# The did:webvh of an agent, from its did:webvh log. The did.json document
# gives the did:web alias, and the chain entries use the did:webvh.
# Usage: fetch_did_from_log <public_base_url>
fetch_did_from_log() {
  local did
  did=$(curl -sf "$1/.well-known/did.jsonl" 2>/dev/null | tail -1 | jq -r '.state.id // empty' 2>/dev/null)
  [ -n "$did" ] || return 1
  echo "$did"
}

# ---------------------------------------------------------------------------
# Transaction helpers
# ---------------------------------------------------------------------------

# Extract a value from the events of a transaction.
# Usage: extract_tx_event <tx_hash> <event_type> <attr_key>
extract_tx_event() {
  veranad q tx "$1" --node "$NODE_RPC" --output json 2>/dev/null \
    | jq -r --arg t "$2" --arg k "$3" \
      '.events[] | select(.type == $t) | .attributes[] | select(.key == $k) | .value' \
    | tr -d '"' | head -1
}

# Extract the JSON line from the veranad output (the output can start with a
# "gas estimate:" line).
extract_tx_json() {
  grep -E '^\{' | head -1
}

# Send a transaction as USER_ACC, wait until the chain includes it, and
# print its hash. Stop with an error when the chain rejects it.
# Usage: broadcast <veranad tx ...args>
broadcast() {
  local raw tx_hash
  raw=$("$@" \
    --from "${BROADCAST_FROM:-$USER_ACC}" --chain-id "$CHAIN_ID" --keyring-backend test \
    --gas-prices "$GAS_PRICES" --gas auto --gas-adjustment 1.5 --node "$NODE_RPC" \
    --output json -y 2>&1) || true
  tx_hash=$(echo "$raw" | extract_tx_json | jq -r '.txhash // empty' 2>/dev/null)
  if [ -z "$tx_hash" ]; then
    err "Transaction failed: $*"
    echo "$raw" >&2
    return 1
  fi

  # The broadcast answer only tells that CheckTx accepted the transaction.
  # Read the result, so that an execution failure shows its cause.
  local tx_json="" code="" i
  for i in $(seq 1 10); do
    sleep 3
    tx_json=$(veranad q tx "$tx_hash" --node "$NODE_RPC" --output json 2>/dev/null) && break
  done
  code=$(echo "$tx_json" | jq -r '.code // empty' 2>/dev/null)
  if [ -z "$tx_json" ]; then
    err "Transaction $tx_hash is not in a block after 30s"
    return 1
  fi
  if [ -n "$code" ] && [ "$code" != "0" ]; then
    err "Transaction $tx_hash failed (code $code): $(echo "$tx_json" | jq -r '.raw_log // "no log"' | head -c 400)"
    return 1
  fi
  ok "TX included: $tx_hash"
  echo "$tx_hash"
}

# Make sure that the account of a key has funds. With <min_uvna>, the balance
# must be at least that amount.
# Usage: check_balance <key_name> [min_uvna]
check_balance() {
  local addr balance min="${2:-1}"
  addr=$(veranad keys show "$1" -a --keyring-backend test 2>/dev/null)
  if [ -z "$addr" ]; then
    err "Account '$1' is not in the keyring"
    return 1
  fi
  balance=$(account_balance "$addr") || return 1
  if [ "${balance:-0}" -lt "$min" ]; then
    err "Account '$1' ($addr) has ${balance:-0} uvna and needs at least ${min} uvna. Get funds from the faucet: ${FAUCET_URL}"
    return 1
  fi
  ok "Account '$1' balance: ${balance} uvna"
}

# The uvna balance of an address (0 when the account does not exist). The
# query is tried 5 times. When it fails each time, the function prints an
# error and returns 1, so that a failed query does not look like a balance of 0.
# Usage: account_balance <address>
account_balance() {
  local json i
  for i in 1 2 3 4 5; do
    if json=$(veranad q bank balances "$1" --node "$NODE_RPC" --output json 2>/dev/null) \
       && echo "$json" | jq -e '.balances' > /dev/null 2>&1; then
      echo "$json" | jq -r '[.balances[] | select(.denom == "uvna") | .amount][0] // "0"'
      return 0
    fi
    sleep 3
  done
  err "Could not read the balance of $1 from $NODE_RPC"
  return 1
}

# Send a message as a group proposal of the Corporation, vote YES, and run it.
# Usage: exec_group_proposal <corporation_policy_address> <description> <message_json>
exec_group_proposal() {
  local corporation=$1
  local description=$2
  local message_json=$3
  local user_addr tmpfile prop_tx prop_id
  user_addr=$(veranad keys show "$USER_ACC" -a --keyring-backend test)

  tmpfile=$(mktemp)
  jq -n --arg c "$corporation" --arg p "$user_addr" --arg d "$description" --argjson m "$message_json" \
    '{group_policy_address: $c, proposers: [$p], metadata: $d, messages: [$m], title: $d, summary: $d}' > "$tmpfile"
  prop_tx=$(broadcast veranad tx group submit-proposal "$tmpfile") || { rm -f "$tmpfile"; return 1; }
  rm -f "$tmpfile"

  prop_id=$(extract_tx_event "$prop_tx" "cosmos.group.v1.EventSubmitProposal" "proposal_id")
  if [ -z "$prop_id" ]; then
    err "Could not read the proposal id (tx $prop_tx)"
    return 1
  fi
  broadcast veranad tx group vote "$prop_id" "$user_addr" VOTE_OPTION_YES "" --exec 1 > /dev/null
}

# Compute the SHA-384 SRI digest of the content of a URL.
compute_sri_digest() {
  local hash
  hash=$(curl -sfL "$1" | openssl dgst -sha384 -binary | openssl base64 -A)
  if [ -z "$hash" ]; then
    err "Could not compute the SRI digest of $1"
    return 1
  fi
  echo "sha384-${hash}"
}

# ---------------------------------------------------------------------------
# Agent accounts
# ---------------------------------------------------------------------------

# Make sure that an agent has its own Verana account, and import it into the
# keyring as "<release>-agent". The mnemonic stays in the Kubernetes secret
# "<release>-verana-account" (key "mnemonic"); the chart gives it to the agent
# as VERANA_ACCOUNT_MNEMONIC. A new account gets AGENT_FUNDS from USER_ACC, so that
# it exists on the chain. The agent pays its fees through the fee grant of
# its VSOperatorAuthorization.
# Sets AGENT_ADDR.
# Usage: ensure_agent_account <release>
ensure_agent_account() {
  local release=$1
  local secret="${release}-verana-account"
  local key="${release}-agent"
  local mnemonic

  mnemonic=$(kubectl -n "$NAMESPACE" get secret "$secret" -o jsonpath='{.data.mnemonic}' 2>/dev/null | base64 -d)
  if [ -z "$mnemonic" ]; then
    log "Creating the Verana account of ${release}..."
    mnemonic=$(veranad keys add "${key}-new" --keyring-backend test --output json 2>/dev/null | jq -r '.mnemonic')
    veranad keys delete "${key}-new" --keyring-backend test -y > /dev/null 2>&1 || true
    if [ -z "$mnemonic" ] || [ "$mnemonic" = "null" ]; then
      err "Could not create a mnemonic for ${release}"
      return 1
    fi
    kubectl -n "$NAMESPACE" create secret generic "$secret" --from-literal=mnemonic="$mnemonic" > /dev/null
    ok "Secret ${secret} created"
  fi

  veranad keys delete "$key" --keyring-backend test -y > /dev/null 2>&1 || true
  echo "$mnemonic" | veranad keys add "$key" --recover --keyring-backend test > /dev/null 2>&1
  AGENT_ADDR=$(veranad keys show "$key" -a --keyring-backend test)
  export AGENT_ADDR
  ok "Agent account of ${release}: $AGENT_ADDR"

  local agent_balance
  agent_balance=$(account_balance "$AGENT_ADDR") || return 1
  if [ "$agent_balance" = "0" ]; then
    log "Funding ${AGENT_ADDR} with ${AGENT_FUNDS}, so that the account exists on the chain..."
    # The transfer and its fee.
    check_balance "$USER_ACC" $((${AGENT_FUNDS%uvna} + TX_FEE_MAX))
    broadcast veranad tx bank send "$USER_ACC" "$AGENT_ADDR" "$AGENT_FUNDS" > /dev/null
  fi
}

# ---------------------------------------------------------------------------
# Corporation (verana.co.v1 / verana.de.v1)
# ---------------------------------------------------------------------------

# Find the Corporation that has a given DID.
# Usage: find_corporation_by_did <did>
# Prints "<id>\t<policy_address>" and returns 0 when found.
find_corporation_by_did() {
  local match
  match=$(veranad query co list-corporations --response-max-size 1024 --node "$NODE_RPC" --output json 2>/dev/null \
    | jq -r --arg did "$1" 'first((.corporations // [])[] | select(.did == $did) | "\(.id)\t\(.policy_address)") // empty')
  [ -n "$match" ] || return 1
  echo "$match"
}

# Make sure that the OperatorAuthorization of the operator covers every
# message type in the list. Grants the union, so no message type is removed.
# Usage: ensure_operator_authorization <corporation_id> <corporation_policy_address> <grantee> <msg_types_json>
ensure_operator_authorization() {
  local corporation_id=$1
  local corporation=$2
  local grantee=$3
  local required=$4
  local granted missing union grant_msg

  granted=$(veranad query de list-operator-authorizations --node "$NODE_RPC" --output json 2>/dev/null \
    | jq -c --arg g "$grantee" --arg c "$corporation_id" '[(.operator_authorizations // [])[]
        | select(.operator == $g and (.corporation_id|tostring) == $c and (.revoked // null) == null)
        | .msg_types[]] | unique') || granted='[]'
  [ -n "$granted" ] || granted='[]'

  missing=$(jq -c -n --argjson have "$granted" --argjson want "$required" '$want - $have')
  if [ "$missing" = "[]" ]; then
    ok "The operator authorization covers every required message type"
    return 0
  fi
  warn "The operator authorization does not cover: $(echo "$missing" | jq -r 'join(", ")')"

  union=$(jq -c -n --argjson have "$granted" --argjson want "$required" '($have + $want) | unique')
  grant_msg=$(jq -c -n --arg c "$corporation" --arg g "$grantee" --argjson m "$union" \
    '{"@type":"/verana.de.v1.MsgGrantOperatorAuthorization",corporation:$c,operator:$c,grantee:$g,msg_types:$m,with_feegrant:true}')
  exec_group_proposal "$corporation" "Grant operator authorization to $grantee" "$grant_msg"
  ok "Operator authorization granted"
}

# Keep a float of funds in the Corporation. When its balance is less than
# CORPORATION_MIN_FUNDS (default: half of CORPORATION_FUNDS), USER_ACC sends
# the difference up to CORPORATION_FUNDS. The Corporation spends the float on
# the fees of its agents.
# Usage: top_up_corporation <policy_address>
top_up_corporation() {
  local funds="${CORPORATION_FUNDS:-20000000uvna}"
  local target="${funds%uvna}"
  local min="${CORPORATION_MIN_FUNDS:-$((target / 2))uvna}"
  local balance
  balance=$(account_balance "$1") || return 1
  if [ "$balance" -ge "${min%uvna}" ]; then
    ok "Corporation balance: ${balance} uvna"
    return 0
  fi
  local missing=$((target - balance))
  check_balance "$USER_ACC" $((missing + TX_FEE_MAX)) || return 1
  broadcast veranad tx bank send "$USER_ACC" "$1" "${missing}uvna" > /dev/null || return 1
  ok "Corporation funded with ${missing} uvna (balance was ${balance} uvna)"
}

# Keep the float of the Corporation that owns a validator entry. The validator
# agent sends the validation transaction, and its Corporation pays the fee
# through the fee grant. vs-agent uses a gas price of 1uvna, so a validator
# that validates many entries uses its float quickly.
# Usage: top_up_validator_corporation <validator_participant_id>
top_up_validator_corporation() {
  local corporation_id policy
  corporation_id=$(veranad query pp get-participant "$1" --node "$NODE_RPC" --output json 2>/dev/null \
    | jq -r '.participant.corporation_id // empty')
  [ -n "$corporation_id" ] || { err "Could not read the Corporation of participant $1"; return 1; }
  policy=$(veranad query co get-corporation "$corporation_id" --node "$NODE_RPC" --output json 2>/dev/null \
    | jq -r '.corporation.policy_address // empty')
  [ -n "$policy" ] || { err "Could not read the policy address of Corporation $corporation_id"; return 1; }
  top_up_corporation "$policy"
}

# Find the Corporation of this agent (corporation_did), or create it when the
# argument is "create". The Corporation is a group with USER_ACC as its only
# member. It keeps a float of CORPORATION_FUNDS (see top_up_corporation), and
# USER_ACC gets the OperatorAuthorization of the cast. The Corporation pays
# the fees of its agents through fee grants. The casts set no validation,
# issuance or verification fees, so they need no deposits.
# Sets CORPORATION_ID and CORPORATION (the policy address).
# Usage: ensure_corporation [create]
ensure_corporation() {
  local create="${1:-}"
  local did found user_addr
  did=$(corporation_did)
  user_addr=$(veranad keys show "$USER_ACC" -a --keyring-backend test)

  if found=$(find_corporation_by_did "$did"); then
    CORPORATION_ID=$(echo "$found" | cut -f1)
    CORPORATION=$(echo "$found" | cut -f2)
    ok "Corporation $did: id=$CORPORATION_ID policy_address=$CORPORATION"
  elif [ "$create" = "create" ]; then
    log "Creating the Corporation $did..."
    # The Corporation funds, the funds of the agent account, and the fees of
    # the next transactions: create, send, proposal, vote and the agent transfer.
    local corporation_funds="${CORPORATION_FUNDS:-20000000uvna}"
    check_balance "$USER_ACC" $((${corporation_funds%uvna} + ${AGENT_FUNDS%uvna} + 5 * TX_FEE_MAX))
    local digest tx_hash
    digest=$(compute_sri_digest "$EGF_DOC_URL")
    tx_hash=$(broadcast veranad tx co create-corporation \
      --did "$did" --language en \
      --doc-url "$EGF_DOC_URL" --doc-digest-sri "$digest" \
      --group-metadata "playground ${CAST:-demo} cast" --group-policy-metadata "playground ${CAST:-demo} cast policy" \
      --members "{\"address\":\"${user_addr}\",\"weight\":\"1\",\"metadata\":\"cast operator\"}" \
      --decision-policy '{"@type":"/cosmos.group.v1.ThresholdDecisionPolicy","threshold":"1","windows":{"voting_period":"432000s","min_execution_period":"0s"}}') || return 1
    CORPORATION_ID=$(extract_tx_event "$tx_hash" "create_corporation" "corporation_id")
    CORPORATION=$(extract_tx_event "$tx_hash" "create_corporation" "policy_address")
    if [ -z "$CORPORATION_ID" ] || [ -z "$CORPORATION" ]; then
      err "Could not read the Corporation id and policy address (tx $tx_hash)"
      return 1
    fi
    ok "Corporation created: id=$CORPORATION_ID policy_address=$CORPORATION"
  else
    err "No Corporation has the DID $did. Run the first workflow of the organization with step=all."
    return 1
  fi

  top_up_corporation "$CORPORATION" || return 1
  ensure_operator_authorization "$CORPORATION_ID" "$CORPORATION" "$user_addr" "$OA_MSGS_CAST"
  export CORPORATION_ID CORPORATION
}

# The policy address of the Corporation of another organization of the cast.
# A validator signs with the Corporation that owns the validator entry.
# Usage: corporation_policy_of <corporation_key>
corporation_policy_of() {
  local found
  found=$(find_corporation_by_did "$(corporation_did_for "$1")") \
    || { err "No Corporation has the DID $(corporation_did_for "$1"). Run the workflows of '$1' first."; return 1; }
  echo "$found" | cut -f2
}

# ---------------------------------------------------------------------------
# Ecosystem and credential schema (verana.ec.v1 / verana.cs.v1)
# ---------------------------------------------------------------------------

# Find the active Ecosystem of a Corporation that a DID controls.
# Usage: find_ecosystem_for_did <corporation_id> <did>
find_ecosystem_for_did() {
  local eco_id
  eco_id=$(veranad query ec list-ecosystems --corporation-id "$1" --node "$NODE_RPC" --output json 2>/dev/null \
    | jq -r --arg did "$2" 'first((.ecosystems // [])[] | select(.did == $did and .archived == null) | .id) // empty')
  [ -n "$eco_id" ] || return 1
  echo "$eco_id"
}

# Find or create the Ecosystem that a DID controls.
# Usage: ensure_ecosystem <did>
ensure_ecosystem() {
  local did=$1
  local eco_id digest tx_hash
  if eco_id=$(find_ecosystem_for_did "$CORPORATION_ID" "$did"); then
    ok "Ecosystem exists: id=$eco_id"
    echo "$eco_id"
    return 0
  fi
  log "Creating the Ecosystem of $did..."
  digest=$(compute_sri_digest "$EGF_DOC_URL")
  tx_hash=$(broadcast veranad tx ec create-ecosystem "$CORPORATION" "$did" en "$EGF_DOC_URL" "$digest") || return 1
  eco_id=$(extract_tx_event "$tx_hash" "create_ecosystem" "ecosystem_id")
  [ -n "$eco_id" ] || { err "Could not read the ecosystem id (tx $tx_hash)"; return 1; }
  ok "Ecosystem created: id=$eco_id"
  echo "$eco_id"
}

# Find a schema of an Ecosystem by its JSON Schema title.
# Usage: find_schema_by_title <ecosystem_id> <title>
find_schema_by_title() {
  local schema_id
  schema_id=$(veranad query cs list-schemas --ecosystem_id "$1" --node "$NODE_RPC" --output json 2>/dev/null \
    | jq -r --arg t "$2" 'first((.schemas // [])[]
        | select(.archived == null and ((.json_schema | fromjson | .title) == $t)) | .id) // empty')
  [ -n "$schema_id" ] || return 1
  echo "$schema_id"
}

# Find or create a credential schema. The default modes: issuers onboard
# through the Ecosystem, verifiers are OPEN, holders need no Participant entry.
# Usage: ensure_credential_schema <ecosystem_id> <schema_json> [issuer_mode] [verifier_mode] [holder_mode]
ensure_credential_schema() {
  local ecosystem_id=$1
  local schema_json=$2
  local issuer_mode="${3:-$ONBOARDING_MODE_ECOSYSTEM}"
  local verifier_mode="${4:-$ONBOARDING_MODE_OPEN}"
  local holder_mode="${5:-$HOLDER_MODE_PERMISSIONLESS}"
  local title schema_id tx_hash
  title=$(echo "$schema_json" | jq -r '.title')

  if schema_id=$(find_schema_by_title "$ecosystem_id" "$title"); then
    ok "Schema '$title' exists: id=$schema_id"
    echo "$schema_id"
    return 0
  fi
  log "Creating the schema '$title' in Ecosystem $ecosystem_id..."
  tx_hash=$(broadcast veranad tx cs create-credential-schema \
    "$ecosystem_id" "$schema_json" \
    "$issuer_mode" "$verifier_mode" "$holder_mode" \
    1 tu sha384 \
    --corporation "$CORPORATION" \
    --issuer-grantor-validation-validity-period '{"value":0}' \
    --verifier-grantor-validation-validity-period '{"value":0}' \
    --issuer-validation-validity-period '{"value":0}' \
    --verifier-validation-validity-period '{"value":0}' \
    --holder-validation-validity-period '{"value":0}') || return 1
  schema_id=$(extract_tx_event "$tx_hash" "create_credential_schema" "credential_schema_id")
  [ -n "$schema_id" ] || { err "Could not read the schema id (tx $tx_hash)"; return 1; }
  ok "Schema created: id=$schema_id"
  echo "$schema_id"
}

# Find the active Ecosystem that a DID controls, in any Corporation.
# Usage: find_ecosystem_by_did <did>
find_ecosystem_by_did() {
  local ecosystem_id
  ecosystem_id=$(curl -sf "${INDEXER_URL}/v4/ecosystem/list" 2>/dev/null \
    | jq -r --arg did "$1" 'first((.ecosystems // [])[]
        | select(.did == $did and (.archived == null or .archived == false)) | .id) // empty')
  [ -n "$ecosystem_id" ] || return 1
  echo "$ecosystem_id"
}

# Find a schema by its JSON Schema title, in the Ecosystem that a DID controls.
# Usage: find_schema_of <controller_did> <title>
find_schema_of() {
  local ecosystem_id
  ecosystem_id=$(find_ecosystem_by_did "$1") \
    || { err "The indexer has no Ecosystem with the DID $1"; return 1; }
  find_schema_by_title "$ecosystem_id" "$2" \
    || { err "Ecosystem $ecosystem_id ($1) has no schema '$2'"; return 1; }
}

# Find an ECS schema by its JSON Schema title.
# Usage: find_ecs_schema_id <OrganizationCredential|ServiceCredential|...>
find_ecs_schema_id() {
  find_schema_of "$ECS_ECOSYSTEM_DID" "$1"
}

# ---------------------------------------------------------------------------
# Participant entries (verana.pp.v1)
# ---------------------------------------------------------------------------

# Find an active Participant entry of a DID.
# Usage: find_active_participant <schema_id> <ISSUER|VERIFIER|ECOSYSTEM|HOLDER> <did>
find_active_participant() {
  local url="${INDEXER_URL}/v4/participant/list?schema_id=$1&role=$2&did=$(printf '%s' "$3" | jq -sRr @uri)&participant_state=ACTIVE"
  local participant_id
  participant_id=$(curl -sf "$url" 2>/dev/null \
    | jq -r 'first((.participants // [])[] | select(.revoked == null and .slashed == null) | .id) // empty')
  [ -n "$participant_id" ] || return 1
  echo "$participant_id"
}

# Find the active root (ECOSYSTEM) Participant entry of a schema.
# Usage: find_root_participant <schema_id>
find_root_participant() {
  local participant_id
  participant_id=$(curl -sf "${INDEXER_URL}/v4/participant/list?schema_id=$1&role=${PP_IDX_ROLE_ECOSYSTEM}&participant_state=ACTIVE" 2>/dev/null \
    | jq -r '.participants[0].id // empty')
  [ -n "$participant_id" ] || return 1
  echo "$participant_id"
}

# Find a Participant entry of a DID that is not revoked, also when it is
# PENDING. Prints "<id>\t<vs_operator>".
# Usage: find_participant_with_vs_operator <schema_id> <issuer|verifier|holder> <did>
find_participant_with_vs_operator() {
  veranad query pp list-participants --schema-id "$1" --role "$2" --node "$NODE_RPC" --output json 2>/dev/null \
    | jq -r --arg did "$3" '(.participants // [])[]
        | select(.did == $did and .revoked == null and .slashed == null and .op_state != "TERMINATED")
        | [(.id|tostring), (.vs_operator // "")] | @tsv' \
    | head -1
}

# Revoke a Participant entry.
# Usage: revoke_participant <participant_id>
revoke_participant() {
  broadcast veranad tx pp revoke-participant "$1" --corporation "$CORPORATION" > /dev/null
}

# Find or create the root Participant entry of a schema.
# Usage: ensure_root_participant <schema_id> <did>
ensure_root_participant() {
  local schema_id=$1
  local did=$2
  local participant_id tx_hash
  if participant_id=$(find_root_participant "$schema_id"); then
    ok "Root participant of schema $schema_id exists: id=$participant_id"
    echo "$participant_id"
    return 0
  fi
  log "Creating the root participant of schema $schema_id..."
  # No effective_from: the chain (v0.10.3+) then uses the block time, so the
  # entry is ACTIVE in the block that creates it.
  tx_hash=$(broadcast veranad tx pp create-root-participant \
    "$schema_id" "$did" 0 0 0 \
    --corporation "$CORPORATION") || return 1
  participant_id=$(extract_tx_event "$tx_hash" "create_root_participant" "root_participant_id")
  [ -n "$participant_id" ] || { err "Could not read the root participant id (tx $tx_hash)"; return 1; }
  ok "Root participant created: id=$participant_id"
  echo "$participant_id"
}

# Make sure that a DID has a Participant entry with AGENT_ADDR as its
# vs_operator. When an entry names another vs_operator, revoke it and create
# a new one: the chain freezes the vs_operator at creation.
#   start — StartParticipantOP: the agent then runs the onboarding process.
#   self  — SelfCreateParticipant: OPEN mode, no onboarding process.
# Usage: ensure_participant <start|self> <schema_id> <role> <validator_participant_id> <did> <vsoa_msg_types>
# Prints the participant id.
ensure_participant() {
  local how=$1
  local schema_id=$2
  local role=$3
  local validator_id=$4
  local did=$5
  local msg_types=$6
  local existing existing_id existing_op tx_hash participant_id event

  existing=$(find_participant_with_vs_operator "$schema_id" "$role" "$did")
  existing_id=$(echo "$existing" | cut -f1)
  existing_op=$(echo "$existing" | cut -f2)
  if [ -n "$existing_id" ] && [ "$existing_op" = "$AGENT_ADDR" ]; then
    ok "The $role participant of schema $schema_id exists: id=$existing_id"
    echo "$existing_id"
    return 0
  fi
  if [ -n "$existing_id" ]; then
    warn "The $role participant $existing_id names vs_operator '$existing_op'. Revoking it."
    revoke_participant "$existing_id"
  fi

  # The chain needs a fee spend limit for the fee grant. It applies the limit
  # once in each vs_operator fee period (24h).
  local vsoa_args=(--vs-operator "$AGENT_ADDR"
                   --vs-operator-authz-msg-types "$msg_types"
                   --vs-operator-authz-with-feegrant
                   --vs-operator-authz-fee-spend-limit "${VSOA_FEE_SPEND_LIMIT:-50000000uvna}")

  if [ "$how" = "start" ]; then
    log "Starting the $role onboarding process of $did (validator $validator_id)..."
    tx_hash=$(broadcast veranad tx pp start-participant-op \
      "$role" "$validator_id" "$did" --corporation "$CORPORATION" "${vsoa_args[@]}") || return 1
    event="start_participant_op"
  else
    log "Creating the $role participant of $did (validator $validator_id)..."
    # No effective_from: the chain (v0.10.3+) then uses the block time, so the
    # entry is ACTIVE when the agent sees the event. An agent issues its own ECS
    # credential only for an ACTIVE ISSUER entry, and only on that event.
    tx_hash=$(broadcast veranad tx pp self-create-participant \
      "$role" "$validator_id" "$did" --corporation "$CORPORATION" \
      "${vsoa_args[@]}") || return 1
    event="create_participant"
  fi
  participant_id=$(extract_tx_event "$tx_hash" "$event" "participant_id")
  [ -n "$participant_id" ] || { err "Could not read the participant id (tx $tx_hash)"; return 1; }
  ok "Participant $role created: id=$participant_id"
  echo "$participant_id"
}

# Validate a PENDING participant as the Corporation operator. Use this when
# the validator is an ECOSYSTEM entry: no agent can get the authority to
# validate against an Ecosystem that it controls. Sign with the Corporation
# that owns the validator entry (default: the Corporation of this agent).
# Usage: set_participant_validated <participant_id> [validator_corporation_policy]
set_participant_validated() {
  local participant_id=$1
  local validator_corporation="${2:-$CORPORATION}"
  local state="" i
  state=$(veranad query pp get-participant "$participant_id" --node "$NODE_RPC" --output json 2>/dev/null \
    | jq -r '.participant.op_state // empty')
  if [ "$state" = "VALIDATED" ]; then
    ok "Participant $participant_id is VALIDATED"
    return 0
  fi
  log "Validating participant $participant_id as the Corporation operator..."
  broadcast veranad tx pp set-participant-op-validated "$participant_id" \
    --corporation "$validator_corporation" \
    --validation-fees 0 --issuance-fees 0 --verification-fees 0 > /dev/null || return 1
  for i in $(seq 1 15); do
    state=$(veranad query pp get-participant "$participant_id" --node "$NODE_RPC" --output json 2>/dev/null \
      | jq -r '.participant.op_state // empty')
    [ "$state" = "VALIDATED" ] && break
    sleep 4
  done
  if [ "$state" != "VALIDATED" ]; then
    err "Participant $participant_id is in state '${state:-unknown}', not VALIDATED"
    return 1
  fi
  ok "Participant validated: id=$participant_id"
}

# ---------------------------------------------------------------------------
# Self-issued ECS Service credential
# ---------------------------------------------------------------------------

# True when the DID document of a host presents its self-issued ECS Service credential.
has_service_credential() {
  curl -sf "https://$1/.well-known/did.json" 2>/dev/null \
    | jq -e '[.service[]? | select(.id | endswith("#vpr-schemas-service-vtc-vp"))] | length > 0' > /dev/null
}

# Make sure that a standalone agent presents its self-issued ECS Service credential.
# The agent issues it when it sees the event of its own ISSUER entry, but only when
# the entry is ACTIVE. An entry created with a future effective_from (as the
# scripts did before) is not ACTIVE at that event, so the agent skips it. The
# agent checks its ISSUER entries again when it starts, so restart it in that case.
# Usage: ensure_self_issued_service_credential <release> <host> <issuer_participant_id>
ensure_self_issued_service_credential() {
  local release=$1
  local host=$2
  local participant_id=$3
  local effective_from wait_s i

  if has_service_credential "$host"; then
    ok "$host presents its ECS Service credential"
    return 0
  fi

  effective_from=$(veranad query pp get-participant "$participant_id" --node "$NODE_RPC" --output json 2>/dev/null \
    | jq -r '.participant.effective_from // empty')
  if [ -n "$effective_from" ]; then
    wait_s=$(( $(date -u -d "$effective_from" +%s) - $(date -u +%s) + 5 ))
    if [ "$wait_s" -gt 0 ]; then
      log "Waiting ${wait_s}s until ISSUER participant $participant_id is effective..."
      sleep "$wait_s"
    fi
  fi

  for i in $(seq 1 6); do
    has_service_credential "$host" && { ok "$host presents its ECS Service credential"; return 0; }
    sleep 5
  done

  log "Restarting $release, so that it issues its ECS Service credential..."
  kubectl rollout restart statefulset "$release" -n "$NAMESPACE" > /dev/null
  kubectl rollout status statefulset "$release" -n "$NAMESPACE" --timeout=600s
  for i in $(seq 1 24); do
    has_service_credential "$host" && { ok "$host presents its ECS Service credential"; return 0; }
    sleep 5
  done
  err "$host does not present its ECS Service credential after the restart"
  return 1
}

# ---------------------------------------------------------------------------
# vt-flow onboarding (/v2/vt/flows on the validator agent)
# ---------------------------------------------------------------------------

# Validate the onboarding request of an applicant DID on the validator agent.
# For an ECS schema, the applicant sends its own claims (ECS_CLAIMS_*
# variables). For another schema the applicant sends no claims, so the
# validator gives them (claims_json) before it validates. Waits up to 2
# minutes for the request. Sets FLOW_SUBMISSION: AGENT when the validator agent
# sent the validation transaction, OPERATOR when the Corporation operator must
# send it (set_participant_validated). One applicant can onboard several
# entries with the same validator, so give the id of the applicant entry when
# it is known: the step then reads only the flow of that entry.
# Usage: complete_onboarding <validator_admin_api> <applicant_did> [claims_json] [applicant_participant_id]
complete_onboarding() {
  local admin_api=$1
  local peer_did=$2
  local claims_json="${3:-}"
  local applicant_participant_id="${4:-}"
  local query flows session_id http_code i
  FLOW_SUBMISSION=""
  query="role=validator&peerDid=$(printf '%s' "$peer_did" | jq -sRr @uri)"
  [ -n "$applicant_participant_id" ] && query="${query}&applicantParticipantId=${applicant_participant_id}"

  for i in $(seq 1 12); do
    flows=$(curl -sf "${admin_api}/v2/vt/flows?${query}" 2>/dev/null) || flows='{}'
    # The validator keeps a finished flow. A flow in one of these states needs
    # no new decision.
    if echo "$flows" | jq -e '[(.items // [])[] | .flowState
          | select(. == "COMPLETED" or . == "VALIDATED" or . == "CRED_OFFERED"
                   or . == "AWAITING_VALIDATION_TX" or . == "VALIDATION_TX_SUBMITTED")] | length > 0' > /dev/null; then
      ok "The onboarding of $peer_did is validated"
      FLOW_SUBMISSION="DONE"
      return 0
    fi
    # AWAITING_OR is not in the list: the validator accepts the request at once
    # (VALIDATING), and the claims and the validation need that state.
    session_id=$(echo "$flows" | jq -r '
      [(.items // [])[]
       | select(.flowState == "VALIDATING"
                or .flowState == "OOB_PENDING" or .flowState == "VALIDATED_PENDING_CLAIMS"
                or .flowState == "VALIDATION_TX_FAILED")]
      | sort_by(.lastEventAt // .createdAt) | last | .participantSessionId // empty')
    [ -n "$session_id" ] && break
    sleep 10
  done
  if [ -z "$session_id" ]; then
    err "No onboarding request from $peer_did on $admin_api after 2 minutes"
    err "States: $(echo "$flows" | jq -r '[(.items // [])[].flowState] | join(", ")')"
    return 1
  fi

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

  # A schema with no validity period makes effectiveUntil mandatory. The value
  # becomes the validUntil of the credential.
  http_code=$(curl -s -o /tmp/vt_flow_validate.json -w '%{http_code}' \
    -X POST -H 'Content-Type: application/json' \
    -d "{\"effectiveUntil\":\"${VT_FLOW_EFFECTIVE_UNTIL:-$(date -u -d '+1 year' +%Y-%m-%dT00:00:00Z)}\"}" \
    "${admin_api}/v2/vt/flows/${session_id}/validate")
  if [ "$http_code" != "200" ] && [ "$http_code" != "201" ]; then
    err "Could not validate flow $session_id (HTTP $http_code): $(cat /tmp/vt_flow_validate.json)"
    return 1
  fi
  FLOW_SUBMISSION=$(jq -r '.validation.submission // "unknown"' /tmp/vt_flow_validate.json)
  ok "Flow validated: $session_id (submission: $FLOW_SUBMISSION)"
}

# ---------------------------------------------------------------------------
# VTJSC and AnonCreds
# ---------------------------------------------------------------------------

# The VTJSC id of a schema, from the DID document of the Ecosystem controller.
# The controller publishes the LinkedVerifiablePresentation
# #vpr-schemas-<schema_id>-vtjsc-vp for each schema of its Ecosystem.
# Usage: fetch_vtjsc_credential_id <public_base_url> <schema_id>
fetch_vtjsc_credential_id() {
  local vp_url cred_id
  vp_url=$(curl -sf "$1/.well-known/did.json" 2>/dev/null \
    | jq -r --arg frag "vpr-schemas-$2-vtjsc-vp" '
        first(.service[]? | select(.type == "LinkedVerifiablePresentation")
        | select(.id | endswith($frag)) | .serviceEndpoint) // empty')
  if [ -z "$vp_url" ]; then
    err "$1 publishes no VTJSC for schema $2"
    return 1
  fi
  cred_id=$(curl -sf "$vp_url" 2>/dev/null | jq -r '.verifiableCredential[0].id // empty')
  [ -n "$cred_id" ] || { err "The presentation at $vp_url has no credential id"; return 1; }
  echo "$cred_id"
}

# Make sure that the agent has an AnonCreds credential definition for a VTJSC.
# The agent takes the AnonCreds schema from the VTJSC issuer.
# Usage: ensure_credential_definition <admin_api> <vtjsc_id>
ensure_credential_definition() {
  local admin_api=$1
  local vtjsc_id=$2
  local existing http
  existing=$(curl -sf "${admin_api}/v2/anoncreds/credential-definitions" 2>/dev/null \
    | jq -r --arg jsc "$vtjsc_id" 'first((.items // [])[] | select(.relatedJsonSchemaCredentialId == $jsc) | .id) // empty')
  if [ -n "$existing" ]; then
    ok "Credential definition exists: $existing"
    return 0
  fi
  log "Creating the AnonCreds credential definition for $vtjsc_id..."
  http=$(curl -s -o /tmp/cd_resp.json -w '%{http_code}' \
    -X POST "${admin_api}/v2/anoncreds/credential-definitions" \
    -H 'Content-Type: application/json' \
    -d "$(jq -n --arg jsc "$vtjsc_id" '{relatedJsonSchemaCredentialId: $jsc}')")
  if [ "$http" -ge 400 ]; then
    err "Could not create the credential definition (HTTP $http): $(cat /tmp/cd_resp.json)"
    return 1
  fi
  ok "Credential definition created: $(jq -r '.id // empty' /tmp/cd_resp.json)"
}

# ---------------------------------------------------------------------------
# Composite steps of a cast member
# ---------------------------------------------------------------------------
# These steps expect AGENT_DID, AGENT_ADDR, RELEASE_NAME, INGRESS_HOST,
# CORPORATION_ID and CORPORATION of the agent that the script provisions.

# Local ports of the port-forwards that the composite steps open.
readonly PF_PORT_ECS_ISSUER=3190
readonly PF_PORT_VALIDATOR=3191

# Wait until the indexer resolves the DID of the agent as trusted. When an
# onboarding request arrives, the validator agent checks that the applicant is
# a Verifiable Service (VS-CONN-VS). A request that comes before the indexer
# knows the new ECS credentials of the applicant ends in the ERROR state.
# The indexer evaluates a DID again only on a chain event, and it keeps a DID
# document for 5 minutes. An evaluation that ran while the agent still changed
# its credentials stays wrong. While the DID is not trusted, the step sends
# TriggerResolver each minute. Only the vs_operator of a HOLDER entry can send
# it, so the agent account (key "<release>-agent") signs, and the Corporation
# pays the fee through its fee grant.
# Usage: wait_until_trusted <did> <holder_participant_id>
wait_until_trusted() {
  local i
  for i in $(seq 1 96); do
    if curl -sf -m 20 -X POST "${INDEXER_URL}/v4/verifiable-trust/resolve" \
         -H 'Content-Type: application/json' -d "$(jq -cn --arg d "$1" '{did: $d}')" \
         | jq -e '.trusted == true' > /dev/null 2>&1; then
      ok "The indexer resolves $1 as trusted"
      return 0
    fi
    # After 15 seconds, and then each minute.
    if [ $((i % 12)) -eq 3 ]; then
      log "The indexer does not resolve $1 as trusted. Sending TriggerResolver on participant $2..."
      BROADCAST_FROM="${RELEASE_NAME}-agent" broadcast veranad tx pp trigger-resolver "$2" \
        --corporation "$CORPORATION" --fee-granter "$CORPORATION" > /dev/null || true
    fi
    sleep 5
  done
  err "The indexer does not resolve $1 as trusted after 8 minutes"
  return 1
}

# ECS credentials of a standalone agent:
#   1. an ISSUER entry on the ECS Service schema (OPEN). The agent issues its
#      own ECS Service credential, and the ECS Service credentials of its
#      delegated sub-services;
#   2. a HOLDER entry on the ECS Organization schema, validated by
#      ecs-org-issuer, which issues the ECS Organization credential. The agent
#      sends the ECS_CLAIMS_ORG_* values on the onboarding request.
# A restart of the agent can be necessary (ensure_self_issued_service_credential),
# so the step opens the port-forward of the agent again on agent_local_port.
# Usage: provision_ecs_standalone <agent_local_port>
provision_ecs_standalone() {
  local agent_port=$1
  local org_schema service_schema issuer_did issuer_participant service_root service_issuer

  org_schema=$(find_ecs_schema_id "OrganizationCredential") || return 1
  service_schema=$(find_ecs_schema_id "ServiceCredential") || return 1
  issuer_did=$(fetch_did_from_log "$ECS_ORG_ISSUER_PUBLIC_URL") \
    || { err "Could not read the DID of $ECS_ORG_ISSUER_PUBLIC_URL"; return 1; }
  issuer_participant=$(find_active_participant "$org_schema" "$PP_IDX_ROLE_ISSUER" "$issuer_did") \
    || { err "$issuer_did has no active ISSUER entry on the ECS Organization schema"; return 1; }
  service_root=$(find_root_participant "$service_schema") \
    || { err "The ECS Service schema has no active root participant"; return 1; }

  service_issuer=$(ensure_participant self "$service_schema" "$PP_ROLE_ISSUER" "$service_root" \
    "$AGENT_DID" "$VSOA_ISSUER") || return 1
  # HOLDER is the only role whose vs_operator can send TriggerResolver.
  local holder_id
  holder_id=$(ensure_participant start "$org_schema" "$PP_ROLE_HOLDER" "$issuer_participant" \
    "$AGENT_DID" "$VSOA_HOLDER") || return 1

  start_port_forward "$ECS_ORG_ISSUER_RELEASE" "$PF_PORT_ECS_ISSUER" "$ECS_NAMESPACE" || return 1
  complete_onboarding "http://localhost:${PF_PORT_ECS_ISSUER}" "$AGENT_DID" "" "$holder_id" || return 1
  stop_port_forward "$PF_PORT_ECS_ISSUER"

  ensure_self_issued_service_credential "$RELEASE_NAME" "$INGRESS_HOST" "$service_issuer" || return 1
  stop_port_forward "$agent_port"
  start_port_forward "$RELEASE_NAME" "$agent_port"
  wait_until_trusted "$AGENT_DID" "$holder_id"
}

# ECS Service credential of a delegated agent: a HOLDER entry on the ECS
# Service schema, validated by the ISSUER entry of the parent agent. The agent
# sends its ECS_CLAIMS_SERVICE_* values on the onboarding request, and the
# parent agent validates it and issues the credential.
# Usage: provision_ecs_delegated <parent_release> <parent_host>
provision_ecs_delegated() {
  local parent_release=$1
  local parent_host=$2
  local parent_did service_schema parent_issuer

  parent_did=$(fetch_did_from_log "https://${parent_host}") \
    || { err "Could not read the DID of ${parent_host}. Deploy and provision the parent first."; return 1; }
  service_schema=$(find_ecs_schema_id "ServiceCredential") || return 1
  parent_issuer=$(find_active_participant "$service_schema" "$PP_IDX_ROLE_ISSUER" "$parent_did") \
    || { err "${parent_host} has no active ISSUER entry on the ECS Service schema. Provision the parent first."; return 1; }
  local holder_id
  top_up_validator_corporation "$parent_issuer" || return 1
  holder_id=$(ensure_participant start "$service_schema" "$PP_ROLE_HOLDER" "$parent_issuer" \
    "$AGENT_DID" "$VSOA_HOLDER") || return 1

  start_port_forward "$parent_release" "$PF_PORT_VALIDATOR" || return 1
  complete_onboarding "http://localhost:${PF_PORT_VALIDATOR}" "$AGENT_DID" "" "$holder_id" || return 1
  stop_port_forward "$PF_PORT_VALIDATOR"
  wait_until_trusted "$AGENT_DID" "$holder_id"
}

# Make the agent a participant of a schema, validated by the root (ECOSYSTEM)
# entry of the schema. The operator validates it with the Corporation that owns
# the Ecosystem: no agent can validate against an Ecosystem that it controls.
# Use it for an ISSUER or VERIFIER entry on an ECOSYSTEM-mode schema, and for
# an ISSUER_GRANTOR or VERIFIER_GRANTOR entry on a GRANTOR-mode schema.
# Usage: join_under_root <schema_id> <role> <vsoa_msg_types> <ecosystem_corporation_key>
# Prints the participant id.
join_under_root() {
  local schema_id=$1
  local role=$2
  local msg_types=$3
  local ecosystem_corporation=$4
  local root_id participant_id policy

  root_id=$(find_root_participant "$schema_id") \
    || { err "Schema $schema_id has no active root participant"; return 1; }
  participant_id=$(ensure_participant start "$schema_id" "$role" "$root_id" "$AGENT_DID" "$msg_types") || return 1
  policy=$(corporation_policy_of "$ecosystem_corporation") || return 1
  set_participant_validated "$participant_id" "$policy" || return 1
  echo "$participant_id"
}

# Start the onboarding process of the agent with a validator agent, and make
# sure that the validator has a live flow for it. An entry that an earlier run
# left PENDING can have no live flow: the validator ended the flow with ERROR
# (for example, the applicant was not yet trusted), or the request never came
# (for example, the applicant did not trust the validator). The applicant
# cannot send the request again, so the operator cancels the entry (the chain
# sets it to TERMINATED) and starts a new entry.
# Prints the id of the entry.
# Usage: start_onboarding_with <schema_id> <role> <vsoa_msg_types> <validator_participant_id> <validator_admin_api>
start_onboarding_with() {
  local schema_id=$1
  local role=$2
  local msg_types=$3
  local validator_id=$4
  local admin_api=$5
  local prior_id participant_id op_state flows states

  top_up_validator_corporation "$validator_id" || return 1
  prior_id=$(find_participant_with_vs_operator "$schema_id" "$role" "$AGENT_DID" | cut -f1)
  participant_id=$(ensure_participant start "$schema_id" "$role" "$validator_id" "$AGENT_DID" "$msg_types") || return 1
  # A new entry: the validator gets the request now.
  if [ -z "$prior_id" ] || [ "$participant_id" != "$prior_id" ]; then
    echo "$participant_id"
    return 0
  fi
  op_state=$(veranad query pp get-participant "$participant_id" --node "$NODE_RPC" --output json 2>/dev/null \
    | jq -r '.participant.op_state // empty')
  if [ "$op_state" = "PENDING" ]; then
    # Do not cancel when the Admin API of the validator does not answer.
    flows=$(curl -sf "${admin_api}/v2/vt/flows?role=validator&applicantParticipantId=${participant_id}") \
      || { err "Could not read the flows of the validator on $admin_api"; return 1; }
    states=$(echo "$flows" | jq -r '[(.items // [])[].flowState] | unique | join(",")')
    if [ -z "$states" ] || [ "$states" = "ERROR" ]; then
      warn "The validator has no live flow for the PENDING entry $participant_id (states: ${states:-none}). Cancelling the entry to start again."
      broadcast veranad tx pp cancel-participant-op-request "$participant_id" --corporation "$CORPORATION" > /dev/null || return 1
      participant_id=$(ensure_participant start "$schema_id" "$role" "$validator_id" "$AGENT_DID" "$msg_types") || return 1
    fi
  fi
  echo "$participant_id"
}

# Make the agent a participant of a schema, validated by the entry of another
# agent: an ISSUER entry validates a HOLDER (an org-to-org credential), a
# grantor entry validates an ISSUER or a VERIFIER. The validator agent
# validates the onboarding request of this agent. For a HOLDER entry, give
# the claims of the credential: the applicant sends no claims for a schema
# that is not an ECS schema.
# Usage: join_under_agent <schema_id> <role> <vsoa_msg_types> <validator_participant_id> <validator_release> [claims_json]
join_under_agent() {
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
  complete_onboarding "http://localhost:${PF_PORT_VALIDATOR}" "$AGENT_DID" "$claims_json" "$participant_id" || return 1
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

# Make the agent a participant of a schema in OPEN mode (no onboarding process).
# Usage: join_open <schema_id> <role> <vsoa_msg_types>
join_open() {
  local schema_id=$1
  local root_id
  root_id=$(find_root_participant "$schema_id") \
    || { err "Schema $schema_id has no active root participant"; return 1; }
  ensure_participant self "$schema_id" "$2" "$root_id" "$AGENT_DID" "$3"
}
