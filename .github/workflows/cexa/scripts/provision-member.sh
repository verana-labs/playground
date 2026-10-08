#!/usr/bin/env bash
# Provision a CEXA member on Verana V4: Aurum, Novara and Borealis. Exchanges
# and banks use the same script: the EGF has one membership class.
#   1. The ECS credentials of the member (standalone agent): the ECS
#      Organization credential from ecs-org-issuer and the self-issued ECS
#      Service credential. Each member is a Verifiable Service before it
#      joins (EGF section 4).
#   2. The CEXAKycCredential Participant entries of MEMBER_ROLES (config.env).
#      The Corporation operator of the Association validates each entry
#      against the root entry of the schema:
#        issuer   — ISSUER entry, and an AnonCreds credential definition
#                   that refers to the VTJSC of the Association;
#        verifier — VERIFIER entry (verification of CEXAKycCredential is
#                   governed: only members can ask for it).
#   3. The CEXAVerifiedCounterpartyCredential of the member: a HOLDER entry,
#      validated by the ISSUER entry of the Association. The Association agent
#      issues the credential with the CP_* claims of config.env, and the
#      member agent publishes it as a Linked VP on its DID (EGF section 10).
# The workflow has already deployed the agent with its own account (AGENT_ADDR)
# and the Corporation of the member (CORPORATION_ID, CORPORATION).
set -eo pipefail
source "${CAST_DIR}/cast.sh"
trap stop_port_forwards EXIT
set_network_vars "${NETWORK:-devnet}"

start_port_forward "$RELEASE_NAME" 3100
API="http://localhost:3100"

AGENT_DID=$(get_agent_did "$API")
[ -n "$AGENT_DID" ] || { err "Could not read the agent DID"; exit 1; }
ok "${SERVICE_NAME} DID: $AGENT_DID"

# CAUTION: do the CEXA steps only when cexa-01 is complete. Find the CEXA
# schemas first, so that the script stops before it changes the chain.
ASSOCIATION_DID=$(association_did)
KYC_CS_ID=$(find_cexa_schema "$ASSOCIATION_DID" "$KYC_TITLE")
CP_CS_ID=$(find_cexa_schema "$ASSOCIATION_DID" "$COUNTERPARTY_TITLE")
CP_ISSUER_ID=$(find_active_participant "$CP_CS_ID" "$PP_IDX_ROLE_ISSUER" "$ASSOCIATION_DID") \
  || { err "The Association has no active ISSUER entry on the counterparty schema. Run cexa-01 first."; exit 1; }
CP_CLAIMS=$(counterparty_claims)
ok "CEXA schemas: ${KYC_TITLE}=$KYC_CS_ID ${COUNTERPARTY_TITLE}=$CP_CS_ID (Association ISSUER participant $CP_ISSUER_ID)"

# 1. ECS credentials
provision_ecs_standalone 3100

# 2. CEXAKycCredential Participant entries
case " ${MEMBER_ROLES:-} " in
  *" issuer "*)
    join_under_root "$KYC_CS_ID" "$PP_ROLE_ISSUER" "$VSOA_ISSUER" "$R_ASSOCIATION" > /dev/null
    # AnonCreds credential definition for the DIDComm rail. The agent takes
    # the AnonCreds schema from the Association, the issuer of the VTJSC.
    KYC_VTJSC_ID=$(wait_vtjsc_credential_id "https://${ASSOCIATION_HOST}" "$KYC_CS_ID")
    ensure_credential_definition "$API" "$KYC_VTJSC_ID"
    ;;
esac
case " ${MEMBER_ROLES:-} " in
  *" verifier "*)
    join_under_root "$KYC_CS_ID" "$PP_ROLE_VERIFIER" "$VSOA_VERIFIER" "$R_ASSOCIATION" > /dev/null
    ;;
esac

# 3. CEXAVerifiedCounterpartyCredential, issued by the Association agent
join_under_agent "$CP_CS_ID" "$PP_ROLE_HOLDER" "$VSOA_HOLDER" "$CP_ISSUER_ID" "$R_ASSOCIATION" "$CP_CLAIMS"

ok "${SERVICE_NAME} provisioned (MEMBER_ROLES=${MEMBER_ROLES:-none})"
