#!/usr/bin/env bash
# =============================================================================
# common.sh — The demo cast on Verana V4 (devnet)
# =============================================================================
#
# The generic V4 helpers are in .github/workflows/v4/common.sh. This file adds
# the parts of the demo cast: the anchor, the hosts, and the one Corporation of
# the cast. Sourced by the scripts in .github/workflows/demo/scripts/ and by
# demo-00_core.yml.
#
# =============================================================================

# shellcheck source=../v4/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/../v4/common.sh"

# Release name of the anchor (also its in-cluster service name).
R_ANCHOR="playground-demo"

# Public hosts: <release>.playground.<network>.verana.network
cast_zone() { echo "playground.${NETWORK:-devnet}.verana.network"; }
ANCHOR_HOST="${R_ANCHOR}.$(cast_zone)"

# The demo cast has one Corporation: the Playground Organization (demo) owns
# the anchor and its delegated services.
cast_corporation_did() { echo "did:example:playground-demo-${CHAIN_ID}"; }
corporation_did() { cast_corporation_did; }

# The id of the DemoCredential schema in the Ecosystem of the anchor.
# Usage: find_demo_schema_id <anchor_did>
find_demo_schema_id() {
  local ecosystem_id schema_id
  ecosystem_id=$(find_ecosystem_for_did "$CORPORATION_ID" "$1") \
    || { err "The anchor controls no Ecosystem. Run demo-01 first."; return 1; }
  schema_id=$(find_schema_by_title "$ecosystem_id" "DemoCredential") \
    || { err "Ecosystem $ecosystem_id has no DemoCredential schema. Run demo-01 first."; return 1; }
  echo "$schema_id"
}
