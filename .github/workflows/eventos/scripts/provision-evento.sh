#!/usr/bin/env bash
# Provision one event service (Costa Rica, Guatemala or Panamá - the org is
# selected by the calling workflow's config.env): ECS-Organization from
# Helvetia Trust (demo) in the organizer's name, self-issued ECS-Service, and
# self-created VERIFIER permissions on Taquilla's Asistente and Patrocinador
# schemas (verification is OPEN). That is what lets the event landing ask
# for the boleto: a resolvable verifier that may request exactly those two
# credentials.
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
ok "${SERVICE_NAME} DID: $AGENT_DID"

obtain_ecs_org_credential "$API" "$HELVETIA_API" "$AGENT_DID"
obtain_service_credential "$API" "$API" "$AGENT_DID" self

# VERIFIER permissions on the two Taquilla schemas (verification OPEN)
for base in "$ASISTENTE_SCHEMA_BASE_ID" "$PATROCINADOR_SCHEMA_BASE_ID"; do
  cs_id=$(discover_ecs_vtjsc "https://${TAQUILLA_HOST}" "$base" | sed -n '2p')
  [ -n "$cs_id" ] || { err "Could not discover the ${base} schema from https://${TAQUILLA_HOST} - run Eventos 01 first"; exit 1; }
  ensure_open_perm "$cs_id" verifier "$AGENT_DID"
done

ok "${SERVICE_NAME} provisioned: a verifiable event that may ask for the boleto and the sponsor credential."
