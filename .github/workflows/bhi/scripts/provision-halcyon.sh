#!/usr/bin/env bash
# Provision Halcyon Talent (demo) (bhi-10) on Verana V4, the impostor:
#   1. The ECS credentials: the ECS-Organization credential from ecs-org-issuer
#      and the self-issued ECS-Service credential.
# That is all. Halcyon is a verifiable organisation, but it gets no Verified
# Employer credential and no VERIFIER entry on the candidate schemas, by
# design. UNSAFE_SKIP_OWN_AUTHORIZATION in config.env lets its agent make
# presentation requests all the same, so that a wallet can refuse them.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

bhi_start_agent

# 1. ECS credentials
provision_ecs_standalone 3100

ok "Halcyon provisioned: a verifiable organisation, with no Verified Employer credential, by design"
