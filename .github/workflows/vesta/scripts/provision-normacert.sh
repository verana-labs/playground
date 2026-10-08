#!/usr/bin/env bash
# Provision NormaCert (demo) on Verana V4:
#   1. The ECS credentials of a standalone organization.
#   2. An ISSUER entry on the ISO 9001-style (demo) schema. The operator
#      validates it with the Corporation of the ISO Ecosystem (iso).
# NormaCert issues the ISO credential to Vesta when vesta-03 runs: Vesta
# sends the onboarding request, and the NormaCert agent validates it.
# CAUTION: run vesta-04 (ISO Certification) before this script.
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

open_agent
provision_ecs_standalone "$PF_PORT_AGENT"

ISO_CS=$(find_cast_schema_id iso-certification "$ISO_SCHEMA_TITLE") \
  || { err "No ${ISO_SCHEMA_TITLE} schema. Run vesta-04 (ISO Certification) first."; exit 1; }
ISSUER_ID=$(join_under_root "$ISO_CS" "$PP_ROLE_ISSUER" "$VSOA_ISSUER" iso)

ok "NormaCert provisioned: ISSUER participant $ISSUER_ID on schema $ISO_CS."
