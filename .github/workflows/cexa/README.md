# The CEXA cast CI/CD

Deploys and provisions the cast of the Crypto Exchange Association (demo)
use case (`/usecases/cexa`, unlisted): reusable KYC for exchanges and banks,
plus Travel Rule counterparty proof. One vs-agent per member on the
`cexa.playground.<network>.verana.network` zone.

## The cast

| Workflow | Org | Role | What it provisions |
|---|---|---|---|
| CEXA 01 | `association` | ecosystem anchor | ECS-Org from Helvetia + self ECS-Service; CEXA trust registry anchored on the **example EGF** (`/cexa/cexa-egf.md` on the playground site); `CEXA-Kyc` schema **governed both sides** (issuer 3 / verifier 3) + VTJSC + AnonCreds schema; `CEXA-VerifiedCounterparty` schema (issuer 3 / verifier open) + VTJSC |
| CEXA 02 | `aurum` | ISSUER + VERIFIER member | own ECS-Org from Helvetia + self ECS-Service; validated ISSUER + VERIFIER perms on CEXA-Kyc; cred def (schema from the anchor); CEXA-VerifiedCounterparty linked VP; OID4VC issuer |
| CEXA 03 | `borealis` | VERIFIER member | own ECS-Org + self ECS-Service; validated VERIFIER perm; CEXA-VerifiedCounterparty linked VP; OID4VC verifier (pins aurum + novara fingerprints) |
| CEXA 04 | `novara` | bank member, ISSUER + VERIFIER | same as aurum - exchanges and banks run the same `provision-member.sh` |
| CEXA 05 | `darkpool` | untrusted | deploy-only, no provisioning; OID4VC verifier so Track B wallets get a real request to refuse at Q1 |

## Run order

1. `CEXA 01` (the anchor: registry, schemas, EGF digest)
2. `CEXA 02` and `CEXA 04` (the issuers - borealis pins their OID4VC fingerprints at deploy)
3. `CEXA 03` (the verifier)
4. `CEXA 05` (deploy-only)
5. Wire the live DIDs into `app/lib/cexa-cast.ts` (from each host's
   `/.well-known/did.jsonl`, `state.id`) - the use case demos gate on them.

Workflows share the `vesta-cast` concurrency group with every other cast:
all casts sign with the same veranad account, so start one workflow at a
time.

## Invariants worth knowing

- **The Association is NOT an ECS-Organization issuer.** Every member's
  ECS-Org comes from Helvetia (an accredited issuer of the Verana ECS
  Ecosystem); being a Verifiable Service is an EGF entry requirement. There
  is deliberately no `ecs-accreditations` workflow in this cast.
- **Verification of CEXA-Kyc is governed** (mode 3): this is the first cast
  where the VERIFIER membership is the core story, not a side plot - only
  accredited members may ask a wallet for the credential.
- **CEXA-VerifiedCounterparty is free to verify**: published as a Linked VP
  on each member's DID, checked by plain trust resolution (the Travel Rule
  counterparty registry). Issued only by the Association; claims come from
  the org's `CP_*` config.env values; revoked on license loss per the EGF.
- **`darkpool` resolving as anything but UNTRUSTED is a paging incident.**
- Fees on-chain are 0 for now (the v3 testnet); the fee story
  (0.90 + 0.10 example values) lives in the use case pages and the EGF, and
  goes live with the next network upgrade.

## Secrets

`PLAYGROUND_MNEMONIC` (the `vesta-playground-admin` account, controls the
CEXA registry), `KUBECONFIG_VERANA_DEV`, `K8S_NAMESPACE`. No
`ECS_ECOSYSTEM_MNEMONIC` needed - this cast makes no ECS accreditation.

## Shared machinery

`vesta/common.sh` (all base helpers), `demo/scripts/lib.sh`
(`ensure_credential_type`, `get_webvh_did_from_host`),
`demo/scripts/render-oid4vc-config.sh` (template render + live fingerprint
pinning). Cast-local: `scripts/lib.sh` (hosts, governed-schema and
validated-verifier helpers - the bolivia precedent of per-cast copies - and
`ensure_counterparty_credential`).
