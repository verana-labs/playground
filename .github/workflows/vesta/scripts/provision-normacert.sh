#!/usr/bin/env bash
# Provision NormaCert (demo): verifiable issuer (ECS-Organization from
# Helvetia + self-issued ECS-Service), ISSUER accreditation on the ISO
# 9001-style (demo) schema, and issuance of the certification credential to
# the Vesta anchor (org-to-org via Admin APIs).
set -eo pipefail
source "${VESTA_DIR}/common.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_HELVETIA" 3101
start_port_forward "$R_VESTA" 3102
API="http://localhost:3100"
HELVETIA_API="http://localhost:3101"
VESTA_API="http://localhost:3102"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "NormaCert DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# ISSUER accreditation on the ISO 9001-style (demo) schema
ISO_SCHEMA_ID=$(discover_ecs_vtjsc "https://${ISO_HOST}" "$ISO_SCHEMA_BASE_ID" | sed -n '2p')
[ -n "$ISO_SCHEMA_ID" ] || { err "Could not discover the ISO schema from https://${ISO_HOST} — run vesta-04 first"; exit 1; }
ensure_validated_issuer_perm "$ISO_SCHEMA_ID" "$AGENT_DID"
ISO_JSC_URL=$(ensure_jsc "$API" "$ISO_SCHEMA_BASE_ID" "$ISO_SCHEMA_ID")

# Issue the ISO 9001-style (demo) credential to the Vesta anchor
VESTA_DID=$(get_agent_did "$VESTA_API")
[ -n "$VESTA_DID" ] || { err "Could not read the Vesta anchor DID — run vesta-03 first"; exit 1; }

if [ "${FORCE_REFRESH:-false}" != "true" ] && has_linked_vp "https://${VESTA_HOST}" "$ISO_SCHEMA_BASE_ID"; then
  ok "Vesta already presents the ISO 9001-style (demo) credential — skipping"
else
  ISO_CLAIMS=$(jq -n \
    --arg id "$VESTA_DID" \
    --arg num "$ISO_CERT_NUMBER" \
    --arg std "$ISO_STANDARD" \
    --arg scope "$ISO_SCOPE" \
    --arg until "$ISO_VALID_UNTIL" \
    '{id: $id, certificateNumber: $num, standard: $std, scope: $scope, validUntil: $until}')
  issue_remote_and_link "$API" "$VESTA_API" "$ISO_SCHEMA_BASE_ID" "$ISO_JSC_URL" "$VESTA_DID" "$ISO_CLAIMS"
fi

ok "NormaCert provisioned; Vesta anchor now presents the ISO 9001-style (demo) credential."
