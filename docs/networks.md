# Networks, releases and deployment

The playground runs on one Verana network: testnet (`vna-testnet-1`, Verana V4), at https://playground.testnet.verana.network.

**This repository builds; verana-labs/verana-deploy deploys.**

- This repository holds the site, its tests, and the wwWallet branding. Each release publishes the images under its tag.
- [verana-labs/verana-deploy](https://github.com/verana-labs/verana-deploy) deploys the site, wwWallet and the 37 cast agents (demo, vesta, verandia, cexa, bhi). It also provisions them on chain, under the Verana Foundation corporation. See `docs/playground.md` there: the workflow is **Playground Setup**, and the pinned versions are in `playground/versions.env`.

## Releases

1. Merge to `main` with Conventional Commits. **Release Please** keeps a release PR open.
2. Merge the release PR. Release Please creates the GitHub release and the `v*` tag, then publishes the images of that tag:

   | Image | Workflow |
   | --- | --- |
   | `veranalabs/playground:<tag>` | `publish.yml` |
   | `veranalabs/wwwallet-backend:<tag>` | `wwwallet.yml` |
   | `veranalabs/wwwallet-frontend:<tag>` (brand wwwallet) | `wwwallet.yml` |

3. In verana-deploy, set the new tags in `playground/versions.env` and run **Playground Setup** (target `site` or `wwwallet`).

Both publishing workflows can also run by hand for an existing tag.

## The network in the app

The Docker build gets `NEXT_PUBLIC_VERANA_NETWORK=testnet`. The app reads it in `app/lib/network.ts`:

| Item | Value |
| --- | --- |
| Protocol | V4 |
| Trust resolution | `POST https://idx.testnet.verana.network/v4/verifiable-trust/resolve` |
| vs-agent Admin API | `/v2` |
| ECS Ecosystem (Verana Council) | `did:webvh:QmaG8Zk91utJCRpHZ6ruVKwedNEWXUm1vnXvttf6pENZHM:council.testnet.verana.network` |

The app has a `devnet` entry for a local build. It finds the DIDs and the chain ids of the casts at run time, so a new deployment of a cast needs no code change.

The site reaches each cast agent's Admin API at `http://<release>:3000` in its namespace. It creates the AnonCreds credential definition an issuer needs the first time that issuer makes an offer.

## Secrets of this repository

| Secret | Used by |
| --- | --- |
| `DOCKER_HUB_LOGIN`, `DOCKER_HUB_PWD` | The publishing workflows |
| variable `NEXT_PUBLIC_FIDES_USECASE_URL` | The site image build (optional) |

This repository holds no cluster credentials. The live conformance tiers run in verana-deploy (workflow **Playground Conformance**); see `conformance/README.md`. The old secrets `KUBECONFIG_VERANA_TESTNET`, `K8S_NAMESPACE` and `PLAYGROUND_MNEMONIC` can be deleted.
