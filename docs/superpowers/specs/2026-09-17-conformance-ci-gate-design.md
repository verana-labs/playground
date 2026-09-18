# Conformance CI gate

Approved by Maxime on 2026-09-17. Implemented by `docs/superpowers/plans/2026-09-17-conformance-ci-gate.md` (PR A).
PRs B (tier 2 per wallet), C (tier 1 strength) and D (tier 3 on emulators) get their own plans.

## Problem

The nightly `conformance` workflow cannot show a regression. Tier 1 records 75 broken and 17 unknown cells every
night for known reasons (casts not rolled to their pinned vs-agent tag, did:webvh logs from before the 3 August fix,
legacy metadata shape on images up to `.41`, 502 short links, the eventos label bug, the undeployed `ccm` cast).
Because tier 1 fails, tier 2 never runs. An `unknown` cell passes silently. The per-PR tier 1 job has
`continue-on-error: true`, so it never blocks anything.

## Decisions

1. **Vitest does not decide the job result, a gate does.** Tier steps run with `continue-on-error: true` and upload
   their results. A separate `gate` job merges the tiers and fails the workflow.
2. **Known issues are committed with an expiry.** `conformance/known-issues.yaml` lists entries of
   `match` (`tier` and `check` required; `network`, `cast`, `service`, `wallet`, `build`, `scenario` optional; each a
   value or a list), `cause`, optional `reference` URL, and `expires` (ISO date). A `broken` or `unknown` cell
   matched by an entry whose `expires` is today or later is known-broken and does not fail.
3. **The gate fails on:** any `broken` or `unknown` cell no active entry matches (an expired entry matches nothing,
   so its cells fail again); a required tier that produced no cells; and, on scheduled runs only, a cell key present
   in the previous scheduled run on `main` and absent now.
4. **The gate reports without failing:** active entries that matched nothing (fixed, remove them) and expired
   entries.
5. **Tier 1 and tier 2 run in parallel jobs** on the nightly schedule, on `workflow_dispatch`, on push to `main` and
   on same-repository pull requests that touch `conformance/**`, `personal-wallets.yaml`,
   `app/lib/wallet-profiles.ts` or the workflow. Fork pull requests skip, they have no cluster secret. Both tiers
   run with `CONFORMANCE_MINTS=1` and the cluster namespace, so a PR sees the same cells as the nightly. The
   `conformance-t1` job in `ci.yml` is removed.
6. **The first known-issues seed** is exactly the failing cells of nightly run 35178512507 plus tier 2's
   `resolver-production-flag` (the resolver reports `production: true` for demo DIDs; to raise with the team).
   Cast problems expire on 2026-10-01, the v4 move. Tier 2's first real run will surface more failures; each is
   triaged into a fix or an entry.

## Out of scope

Per-wallet tier 2 fidelity, tier 1 hardening, tier 3, a `not-deployed` outcome, triggering conformance after a
cast deploy, and fixing the cast problems themselves (separate ops session).
