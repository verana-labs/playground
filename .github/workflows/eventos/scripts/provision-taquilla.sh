#!/usr/bin/env bash
# Provision Taquilla (demo) - the ticket broker that issues the boletos:
# ECS-Organization from Helvetia Trust (demo), self-issued ECS-Service, and
# the Ecosistema de Eventos (demo) registry with the Asistente schema (one
# boleto per attendee and event) and the Patrocinador schema (one credential
# per sponsoring organization and event). Issuance governed (only Taquilla
# issues), verification OPEN (each event self-registers as a verifier).
# Also creates the AnonCreds credential types for the DIDComm rail; the
# openid4vc issuer config covers the SD-JWT rail.
set -eo pipefail
source "${VESTA_DIR}/common.sh"
source "${CAST_DIR}/scripts/lib.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-testnet}"

start_port_forward "$RELEASE_NAME" 3100
start_port_forward "$R_HELVETIA" 3101
API="http://localhost:3100"
HELVETIA_API="http://localhost:3101"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read agent DID"; exit 1; }
ok "Taquilla DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# Ecosistema de Eventos (demo): one registry, two schemas
TR_ID=$(ensure_trust_registry "$AGENT_DID" "https://${INGRESS_HOST}" "$EGF_DOC_URL")

ASISTENTE_JSON=$(jq -c '.' "${CAST_DIR}/schemas/${ASISTENTE_SCHEMA_FILE}")
ASISTENTE_CS_ID=$(ensure_schema_with_root "$TR_ID" "$ASISTENTE_JSON" "$AGENT_DID")
ensure_validated_issuer_perm "$ASISTENTE_CS_ID" "$AGENT_DID"
ASISTENTE_JSC_URL=$(ensure_jsc "$API" "$ASISTENTE_SCHEMA_BASE_ID" "$ASISTENTE_CS_ID")
# Workflow contract: app/lib/eventos-cast.ts looks these types up by name
ensure_anoncreds_credential_type "$API" "AsistenteEvento" "1.0" "$ASISTENTE_JSC_URL"

PATROCINADOR_JSON=$(jq -c '.' "${CAST_DIR}/schemas/${PATROCINADOR_SCHEMA_FILE}")
PATROCINADOR_CS_ID=$(ensure_schema_with_root "$TR_ID" "$PATROCINADOR_JSON" "$AGENT_DID")
ensure_validated_issuer_perm "$PATROCINADOR_CS_ID" "$AGENT_DID"
PATROCINADOR_JSC_URL=$(ensure_jsc "$API" "$PATROCINADOR_SCHEMA_BASE_ID" "$PATROCINADOR_CS_ID")
ensure_anoncreds_credential_type "$API" "PatrocinadorEvento" "1.0" "$PATROCINADOR_JSC_URL"

ok "Taquilla provisioned: TR=$TR_ID, Asistente CS=$ASISTENTE_CS_ID, Patrocinador CS=$PATROCINADOR_CS_ID. Next: run Eventos 02-04 for the three event services."
