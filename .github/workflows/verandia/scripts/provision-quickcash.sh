#!/usr/bin/env bash
# Provision QuickCash Loans (demo), the over-asking verifier, on Verana V4.
# QuickCash is a verifiable company: ecs-org-issuer issues its ECS
# Organization credential, and the agent issues its own ECS Service
# credential. Thus Q1 gives TRUSTED.
#
# By design, QuickCash gets no VERIFIER entry on a Verandia schema. The
# verifier mode of the Verandia Citizen ID is ECOSYSTEM, and QuickCash never
# registered as a relying party. Its config.env sets
# UNSAFE_SKIP_OWN_AUTHORIZATION, so the agent makes the request all the same,
# and every compliant wallet refuses it (Q3). Trust is not authorization.
# The workflow has already deployed the agent with its own account (AGENT_ADDR)
# and the Corporation of the organization (CORPORATION_ID, CORPORATION).
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

start_port_forward "$RELEASE_NAME" 3100

AGENT_DID=$(get_agent_did "http://localhost:3100")
[ -n "$AGENT_DID" ] || { err "Could not read the agent DID"; exit 1; }
export AGENT_DID
ok "${SERVICE_NAME} DID: $AGENT_DID"

provision_ecs_standalone 3100

ok "${SERVICE_NAME} provisioned: a verifiable company with no VERIFIER entry on the Verandia Citizen ID, by design"
