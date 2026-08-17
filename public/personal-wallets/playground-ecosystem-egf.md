# Ecosystem Governance Framework of the Playground Ecosystem (demo)

**Document:** PG-EGF · **Version:** 1.0-example · **Status:** example document
**Controller:** Playground Organization (demo), through its anchor service Playground Demo
**Ecosystem:** Playground Ecosystem (demo), a trust ecosystem on the Verana Verifiable Public Registry (testnet)
**Date:** 2026-08-17 · **Locale:** en

> **This is a demonstration document.** The Playground Organization (demo), its services and its credential are fictional, created for the Verana Playground. Nothing here is legal advice, and no real institution is bound by it. It exists so the personal-wallets demos can anchor a realistic, digest-verifiable governance framework - the way any real ecosystem would.

---

## 1. Purpose

The Playground Ecosystem (demo), "the Ecosystem", exists for exactly one thing: letting anyone with a personal wallet experience the Verifiable Trust model end to end, in minutes, with nothing at stake. It governs one credential, **DemoCredential**, and deploys the full spread of counterparties a wallet must be able to tell apart:

1. **An accredited issuer** whose credential offer succeeds: it is a Verifiable Service and holds a validated ISSUER permission.
2. **A trusted but unaccredited issuer** whose offer MUST be refused by the wallet: it is a perfectly Verifiable Service, but holds no permission on the schema.
3. **An untrusted issuer** that compliant wallets reject before any data is exchanged: it is not a Verifiable Service at all.
4. **The verifier mirror of each case**, so presentation requests exercise the same three-way distinction.

The negative cases are not failures of the ecosystem: they ARE the product. This framework governs them as deliberately as the positive one.

## 2. Definitions

- **Ecosystem**: the Playground Ecosystem (demo), controlled by the Playground Organization (demo) through its anchor service, controller of this framework and of the ecosystem trust registry on the Verana VPR.
- **DemoCredential**: the single credential defined in section 5.
- **Holder**: any visitor of the playground's personal-wallets demos to whom a DemoCredential is issued.
- **Accredited issuer**: a service holding a validated ISSUER participant entry on the DemoCredential schema.
- **Trust resolution**: the Verifiable Trust resolution of a DID against the Verana VPR, returning the credentials it presents and their permission chains.
- **VPR**: the Verana Verifiable Public Registry. **EGF**: this document, anchored by digest from the ecosystem trust registry.

## 3. Governance of this framework

- The Ecosystem controls the ecosystem trust registry and this EGF. Each version of this document is published at a stable URL and anchored on the VPR by digest; the active version is the one referenced by the registry's current governance framework version.
- Amendments take effect when the new version is anchored.
- Contact: `governance@playground.example` (demo).

## 4. Identity prerequisite: participants bring their own

- Every trusted cast member, the anchor included, is a **Verifiable Service**: an ECS-Organization credential issued by an accredited issuer of the **Verana ECS Ecosystem**, and an ECS-Service credential (self-issued, or delegated by the anchor for sub-services), published on its DID.
- The untrusted cast members deliberately satisfy none of this. They are deployed and operated, but never provisioned into the trust layer: their offers and requests exist so wallets have something real to refuse.

## 5. Credential schema

The ecosystem trust registry defines one schema at this version; its JSON Schema credential (VTJSC) is published by the anchor service:

| Schema | Purpose | Issuance | Verification | JSC |
|---|---|---|---|---|
| **DemoCredential** | playground walkthrough credential | governed: validated issuers only | open and free | `/vt/schemas-demo-credential-jsc.json` |

**Claims:** name (chosen by the visitor), demoId (a playground-assigned identifier).

Both retail rails are supported: AnonCreds over DIDComm and OpenID4VC SD-JWT, with identical claims.

## 6. Issuance rules

1. **Governed issuance.** Only services holding a validated ISSUER permission may issue. The wallet-side consequence is the demo's first lesson: an offer from a service without the permission MUST be refused by the wallet, however trustworthy the service itself is.
2. **Instant, free, worthless by design.** The DemoCredential is issued instantly, free of charge, to any visitor, and attests nothing beyond participation in the demo. It MUST NOT be relied on for any real-world purpose.
3. **No real personal data.** Visitors are told to use any name they like. Issuers MUST NOT solicit real identity attributes.

## 7. Verification rules

1. **Open verification.** Any Verifiable Service may request presentation of the DemoCredential; no permission is required. Wallets still trust-resolve the requester and refuse requests from services that are not Verifiable Services - the demo's second lesson.
2. **Selective disclosure** applies as everywhere else, though the claim set is deliberately trivial.

## 8. Revocation and slashing

- The Ecosystem MAY revoke issued credentials and participant entries at any time, without cause: the cast is rebuilt regularly and holders have no continuity expectation.
- The ecosystem's slashing powers per the network's rules apply to participant entries; in practice the playground exercises them for demonstration purposes only.

## 9. Liability

This is a demonstration framework: no warranty, no liability, no real obligation is created. The DemoCredential attests nothing, and nobody may rely on it for anything beyond the demo itself.

---

## Annex A: Fee schedule (example values)

All fees are zero. Deposit-bound amounts (trust units) and agent rewards apply per the network's global parameters.

| Fee | Amount | Paid by | Received by |
|---|---|---|---|
| DemoCredential issuance | 0 | - | - |
| Verification of DemoCredential | 0 | - | - |

## Annex B: Schema references

Published by the anchor service (host: `playground-demo.playground.testnet.verana.network`):

- DemoCredential VTJSC: `/vt/schemas-demo-credential-jsc.json`
- On-chain schema: `vpr:verana:vna-testnet-1:cs:253` · rendered at `https://idx.testnet.verana.network/verana/cs/v1/js/253`

## Annex C: The cast

| Service | Role in the demo | Trust status |
|---|---|---|
| Playground Demo (anchor) | ecosystem owner | Verifiable Service |
| Accredited Issuer (demo) | validated ISSUER, offers succeed | Verifiable Service |
| Unaccredited Issuer (demo) | no permission, offers MUST be refused | Verifiable Service |
| Accredited Verifier (demo) | open VERIFIER, requests succeed | Verifiable Service |
| Unaccredited Verifier (demo) | requests still succeed (verification is open) | Verifiable Service |
| Untrusted Issuer (demo) | rejected at trust resolution | not a Verifiable Service |
| Untrusted Verifier (demo) | rejected at trust resolution | not a Verifiable Service |

## Annex D: Contacts

- Governance: `governance@playground.example` (demo)
- Security and incident reports: `security@playground.example` (demo)
