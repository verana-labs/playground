# Networks and branches

The playground runs on one Verana network: testnet. The `main` branch deploys it.

| Branch | Network | Verana protocol | Playground URL |
| --- | --- | --- | --- |
| `main` | testnet (`vna-testnet-1`) | V4 | https://playground.testnet.verana.network |

Testnet runs Verana V4: veranad v0.10.5 and vs-agent v2. No network runs Verana V3 anymore. The V3 code paths in the app and the V3 casts (bolivia, ccm, eventos) stay in the repository for reference. Their workflows stop at the "Check network protocol" step.

## How the workflows select the network

Each deploy workflow and each cast workflow sets `NETWORK` to `testnet`:

```yaml
NETWORK: testnet
```

The workflows use `NETWORK` for these items:

- The public hosts: `<org>.playground.<network>.verana.network`.
- The chain, RPC, indexer and ECS endpoints (see `set_network_vars` in `.github/workflows/v4/common.sh`).
- The Docker build argument `NEXT_PUBLIC_VERANA_NETWORK` of the app.
- The `VERANA_NETWORK` variable of the hosted wwWallet (`.github/workflows/wwwallet/manifests.yaml`).

To deploy to another network by hand, set `NETWORK` in the workflow and add the network to `set_network_vars`. The app has a `devnet` entry in `app/lib/network.ts` for a local build.

## Secrets

| Secret | Value |
| --- | --- |
| `KUBECONFIG_VERANA_DEV` | The kubeconfig of the cluster, as plain YAML (not base64). The workflows write it to `~/.kube/config` as is. |
| `KUBECONFIG_VERANA_TESTNET` | The kubeconfig of the chain cluster, as plain YAML. The cast workflows use it only for the port-forward to the Admin API of `ecs-org-issuer` (namespace `vna-testnet-1`). It needs the permission to list services and to create port-forwards in that namespace. When it is empty, the workflows use `KUBECONFIG_VERANA_DEV` for that port-forward too. |
| `K8S_NAMESPACE` | The Kubernetes namespace of the playground and of the cast agents. |
| `PLAYGROUND_MNEMONIC` | The operator account of the casts. It must have funds (see below). |
| `DOCKER_HUB_LOGIN`, `DOCKER_HUB_PWD` | The registry account of the images. |
| variable `CLUSTER_POD_CIDR` | Optional. The pod CIDR of the cluster (default `10.2.0.0/16`). The agents trust Admin API calls from this network. |
| variable `NEXT_PUBLIC_FIDES_USECASE_URL` | Optional. The URL of the Fides use case. |

Each deploy workflow and each core workflow stop at the "Check network secrets" step when `K8S_NAMESPACE` is empty.

The chain services run on another cluster than the playground. Every standalone agent gets its ECS Organization credential through an onboarding flow that the workflow validates on the Admin API of `ecs-org-issuer`. The workflow port-forwards to it in `ECS_NAMESPACE` (`set_network_vars`, default `vna-testnet-1`) with `KUBECONFIG_VERANA_TESTNET`.

## The app

The Docker build gets `NEXT_PUBLIC_VERANA_NETWORK` from `NETWORK`. The app reads it in `app/lib/network.ts` and selects the endpoints:

| Item | Value |
| --- | --- |
| Protocol | V4 |
| Trust resolution | `POST https://idx.testnet.verana.network/v4/verifiable-trust/resolve` |
| vs-agent Admin API | `/v2` |
| ECS Ecosystem | `did:webvh:QmVEcKodsZWNhMx6UT7Sq4V8JBrcvohdJTutG6q88WQPhQ:ecs-ecosystem.testnet.verana.network` |

The default network of a build is testnet.

## The casts (Verana V4)

| Cast | Workflows | Core | Corporations |
| --- | --- | --- | --- |
| demo (Personal Wallets) | `demo-01` to `demo-08` | `demo-00_core.yml` | One for the cast |
| vesta, verandia, cexa, bhi (Use Cases) | `<cast>-01` and the next ones | `<cast>-00_core.yml`, which calls `v4-cast-00_core.yml` | One for each organization |

The shared V4 helpers are in `.github/workflows/v4/common.sh`. Each V4 cast adds its hosts in `.github/workflows/<cast>/cast.sh`. See the README of each cast for its run order.

Every agent gets its ECS Organization credential from `ecs-org-issuer`, the organization issuer of the testnet ECS Ecosystem.

The casts use these testnet services:

- `https://idx.testnet.verana.network` (the indexer, which also resolves trust)
- `https://ecs-ecosystem.testnet.verana.network` (the ECS Ecosystem)
- `https://ecs-org-issuer.testnet.verana.network` (the issuer of the ECS Organization credential)

Testnet has no trust resolver service. On V4 the indexer resolves trust.

The app finds the DIDs and the chain ids of the casts at run time. A new bootstrap of a cast does not need a code change.

### Fund the operator account

The testnet faucet is `https://faucet.testnet.verana.network` ([verana-faucet](https://github.com/verana-labs/verana-faucet)). It sends funds only to the account that signs its challenge (ADR-036), so request them from a wallet that holds the operator key, for example through the Verana Frontend at `https://app.testnet.verana.network`.

The first `demo-01` run spends about 21 VNA: 20 VNA for the Corporation (`CORPORATION_FUNDS`), 0.001 VNA for each agent account (`AGENT_FUNDS`), and the very small fees of the operator account.

The Use Case casts create one Corporation for each organization. `v4-cast-00_core.yml` keeps a float of 1 VNA in each Corporation (`CORPORATION_FUNDS`). Each run fills the float again when it is less than half (`CORPORATION_MIN_FUNDS`). The Corporation pays the fees of its agents through fee grants, and vs-agent uses a gas price of 1uvna, so an agent transaction costs about 0.2 VNA. Each agent account gets 0.001 VNA (`AGENT_FUNDS`), so that it exists on the chain. The operator account pays its own fees at the gas price `GAS_PRICES` (0.01uvna), so they are very small. Plan about 1 VNA for each organization.

## Bootstrap on a new cluster

A new cluster starts with no namespace and no agent. Follow these steps:

1. Set the secrets above. `KUBECONFIG_VERANA_DEV` points at the cluster of the playground, `KUBECONFIG_VERANA_TESTNET` at the chain cluster.
2. Fund the operator account through the faucet.
3. Push `main`. The deploy workflow builds the image and rolls out the playground.
4. Run `demo-01` to `demo-08` one at a time, with `step: all`.
5. Run the vesta, verandia, cexa and bhi casts in the run order of their READMEs.
6. Run **Deploy wwWallet** once by hand.

The workflows do not touch the old cluster. Remove its namespace by hand when the DNS records point at the new cluster.
