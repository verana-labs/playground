# Playground demo cast CI/CD

The shared demo services of the **user-wallet playground pages** (spec §4 —
[verana-spec → playground/spec.md](https://github.com/verana-labs/verana-spec/blob/main/playground/spec.md)):
one cast, six scenarios, identical on every wallet page.

This branch runs the cast on **Verana V4 (devnet)** with veranad v0.10.5 and
vs-agent v2. See [`docs/networks.md`](../../../docs/networks.md).

The **Playground Organization (demo)** is a Corporation on the chain. The
anchor VS **Playground Demo** controls the **Playground Ecosystem (demo)** and
its single **DemoCredential** schema (`schemas/demo-credential.json`; issuer
onboarding by the Ecosystem, verifier onboarding OPEN, holders PERMISSIONLESS).
Four trusted services are its delegated sub-services:

| Workflow | Release | Agent mode | DemoCredential |
| --- | --- | --- | --- |
| demo-01 | `playground-demo` (anchor) | standalone | Ecosystem controller, root Participant |
| demo-02 | `demo-issuer-accredited` | delegated | ISSUER Participant (validated) |
| demo-03 | `demo-issuer-unaccredited` | delegated | none, by design (mints anyway, demo flag) |
| demo-04 | `demo-verifier-accredited` | delegated | VERIFIER Participant (OPEN) |
| demo-05 | `demo-verifier-unaccredited` | delegated | none, by design (requests anyway, demo flag) |
| demo-06 | `demo-untrusted` | standalone | n/a — deploy-only, no ECS credentials |
| demo-07 | `demo-issuer-untrusted` | standalone | n/a — no ECS credentials, mints anyway (demo flag), credential definition only |
| demo-08 | `demo-verifier-untrusted` | standalone | n/a — deploy-only, no ECS credentials, requests anyway (demo flag) |

## The V4 model

- **Corporation.** `demo-01` creates the Corporation with the DID
  `did:example:playground-demo-<chain id>`. The other members find it by this
  DID. The operator account (`PLAYGROUND_V4_MNEMONIC`) holds its
  OperatorAuthorization and signs every transaction.
- **Agent accounts.** Each agent has its own Verana account, the
  `vs_operator` of its Participant entries. The workflow creates the mnemonic
  once, keeps it in the Kubernetes secret `<release>-verana-account`, and
  sends 0.001 VNA (`AGENT_FUNDS`) to the new account. The chain does not let one account hold an
  OperatorAuthorization and a VSOperatorAuthorization, so an agent account is
  never the operator account.
- **ECS credentials.** The agents get them through vt-flow onboarding
  processes (DIDComm). The operator creates the Participant entry, the agent
  sends the onboarding request with its `ECS_CLAIMS_*` values, and the
  validator side validates it:
  - The anchor gets its ECS-Organization credential from `ecs-org-issuer` and
    issues its own ECS-Service credential.
  - A delegated service gets its ECS-Service credential from the anchor.
- **VTJSC.** The anchor agent publishes the VTJSC, the SD-JWT Type Metadata
  and the AnonCreds schema of the DemoCredential when the schema is created.

## Running

Each numbered workflow is a `workflow_dispatch` that calls
`demo-00_core.yml` with `step` = `deploy` | `provision` | `all`. Select the
`v4` branch. Run them **in order, one at a time** (all runs serialize on the
`vesta-cast-<network>` concurrency group):

1. `demo-01` with `step=all`: Corporation, anchor agent, ECS onboarding,
   Ecosystem, DemoCredential schema and root Participant.
2. `demo-02` … `demo-05` with `step=all`: delegated services, their
   ECS-Service onboarding, and their `DEMO_PERM` Participant entry.
3. `demo-06` and `demo-08`: deploy-only. `demo-07` with `step=all`: it also
   creates its AnonCreds credential definition.

Secrets and variables: see [`docs/networks.md`](../../../docs/networks.md).

## Dual rail

The DemoCredential is served over AnonCreds/DIDComm (Track N wallets, Hologram)
and OpenID4VCI/OpenID4VP SD-JWT (Track B wallets):

- Services with `OID4VC_ROLE` in their `config.env` get an empty
  `openid4vc.config`. This turns on the OpenID4VC plugin with development
  signing. The agent takes the credential types, the display name, the `vct`
  and the trust decision from the VPR.
- The issuers with `DEMO_CREDDEF=true` create an AnonCreds credential
  definition that refers to the anchor's VTJSC.
- vs-agent v2 refuses to make an offer or a request when the agent has no
  active ISSUER or VERIFIER Participant entry. The unaccredited and untrusted
  services set `UNSAFE_SKIP_OWN_AUTHORIZATION="true"` in their `config.env`,
  which sets the chart value `unsafeSkipOwnAuthorization` (vs-agent
  `AGENT_UNSAFE_SKIP_OWN_AUTHORIZATION`, from v2.0.0-pr766.2). This flag is
  for demos only and is not in the spec: the agent then makes the offer or
  the request, and the wallet must refuse it.

## Monitoring invariant

A demo service in the wrong trust state is a paging incident — **including
`demo-untrusted` resolving as anything but UNTRUSTED** (spec §6).
