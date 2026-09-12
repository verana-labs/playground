# Events cast CI/CD

Deploys and provisions the verifiable services of the **events demo**
(the Spanish ticket-broker flow at `/eventos` and the three event landings
at `/eventos/costa-rica`, `/eventos/guatemala` and `/eventos/panama`) on the
Verana testnet, following the Vesta/CCM/BHI cast pattern: each participant
is a separate vs-agent (Business Wallet), and every org-to-org exchange is
provisioned by CI/CD driving the agents' Admin APIs. Personal-wallet flows
(the boleto offer at the broker, the presentation at the event landing)
happen at runtime, not here.

GitHub only picks up workflow files at the top level of `.github/workflows/`,
so the numbered `eventos-*.yml` entry points live there while everything
else (this directory) holds the per-org configs, schemas, OID4VC templates
and provisioning scripts. Generic helpers are shared from the Vesta cast
(`vesta/common.sh`) and the demo cast (`demo/scripts/render-oid4vc-config.sh`);
`scripts/lib.sh` adds the events hosts.

The organizer, INTEXUS, and the sponsors (B-TECH, INTEXUS, HYLAND) appear
with their real names and logos, as requested by the partner; the ticket
broker, Taquilla, is fictional and labeled (demo).

## The cast and their domains

Orgs live at `<org>.eventos.playground.testnet.verana.network`. The event
releases are prefixed (`evento-costa-rica` etc.) because the shared
namespace holds every playground cast; their public hosts keep the bare
country slug.

| # | Workflow | Org / service | What it gets |
|---|---|---|---|
| 01 | Taquilla | ticket broker (demo), the issuer | ECS-Org (Helvetia Trust) + ECS-Service + Ecosistema de Eventos (demo) registry with the Asistente and Patrocinador schemas (Taquilla sole ISSUER, verification OPEN) + AnonCreds types + OID4VC issuer |
| 02 | Evento Costa Rica | event of 17 de septiembre (verifier) | ECS-Org (Helvetia Trust, in INTEXUS's name) + ECS-Service + open VERIFIER perms on both schemas + OID4VC verifier pinned to Taquilla |
| 03 | Evento Guatemala | event of 22 de septiembre (verifier) | same as 02 |
| 04 | Evento Panamá | event of 24 de septiembre (verifier) | same as 02 |

Every ECS-Organization comes from Helvetia Trust (demo), the accredited
ECS issuer of the Vesta cast, so this cast needs **no** ECS-ecosystem
accreditation workflow (no `ECS_ECOSYSTEM_MNEMONIC`).

## The INTEXUS wallet

The pickers on `/eventos` and the three event landings lead with **INTEXUS
Wallet**, a hosted instance of our wwWallet fork carrying the INTEXUS
branding, at `intexus-wallet.eventos.playground.testnet.verana.network`
(backend at `intexus-wallet-api.eventos…`, both under the eventos wildcard).
It is built and deployed by `.github/workflows/wwwallet.yml` (brand
`intexus`: `brand.env` and the `branding/` assets live under
`wwwallet/brands/intexus/`), from the same fork and commit as the default
wwWallet instance; only the logos, favicon, theme and the runtime wallet
name differ. Its `personal-wallets.yaml` entry is scoped to `eventos`, so
it never appears on the main playground or in the other use cases.

## The two schemas

- **Asistente** (`asistente`, AnonCreds type `AsistenteEvento`, OID4VC id
  `eventos-asistente`): the boleto. One per attendee and event: `nombre`,
  `tipo`, `evento`, `pais`, `fecha`, `horario`, `patrocinadores`.
- **Patrocinador** (`patrocinador`, AnonCreds type `PatrocinadorEvento`,
  OID4VC id `eventos-patrocinador`): one per sponsoring organization and
  event: `organizacion`, `lema`, `tipo`, `evento`, `pais`, `fecha`,
  `horario`.

The three events share the same title, so an event landing tells its own
boletos apart by the `pais` claim. Claim names and type ids are the
workflow contract for `app/lib/eventos-cast.ts` and `/api/demo`.

## Prerequisites

Same repository secrets as the Vesta cast: `KUBECONFIG_VERANA_DEV`,
`K8S_NAMESPACE` and `PLAYGROUND_MNEMONIC`.

**DNS + TLS.** A wildcard record must point at the cluster ingress:
`*.eventos.playground.testnet.verana.network` (a single wildcard only
matches one label, so the existing `*.playground…` record does not cover
this zone). Certificates come from cert-manager (`letsencrypt-prod`) per
host.

**The vesta cast must be live**: every org obtains its ECS-Organization
from Helvetia Trust (`helvetia-trust` release in the shared namespace).

**Cast logos.** The `config.env` files reference
`public/images/eventos/cast/<org>.png` and `public/images/eventos/intexus.png`
on the `main` branch; provisioning downloads them into the credentials, so
they must be on `main` before a provision run.

**PENDING confirmations before a provision run intended to stick:**
INTEXUS's NIT and address (`orgs/{costa-rica,guatemala,panama}/config.env`,
placeholders today).

## Run order

First bootstrap: **01 → 02 → 03 → 04** with step `all`. The events need
Taquilla's schemas (02-04 discover them from the Taquilla host) and pin
Taquilla's OID4VC signing fingerprint at deploy time, so 01 must already
run the openid4vc image.

Every workflow is idempotent: permissions, registries, schemas and VTJSCs
are looked up before they are created, and credentials are skipped when the
DID document already presents the linked VP. Use `force_refresh` to re-issue
credentials after changing claims in an org's `config.env`; the `step` input
splits a run into `deploy` and `provision`.

All cast runs share the `vesta-cast` concurrency group (one signing account
across every playground cast): start workflows one at a time.

## After a bootstrap

Read each host's live `did:webvh` value (`https://<host>/.well-known/did.jsonl`,
last entry's `state.id`) into `app/lib/eventos-cast.ts`, replacing the
placeholder SCIDs. The site works without that step (services resolve
their DIDs from the host), but the pinned values spare a discovery fetch
per request.
