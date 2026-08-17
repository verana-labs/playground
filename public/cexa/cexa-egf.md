# Ecosystem Governance Framework of the Crypto Exchange Association (demo)

**Document:** CEXA-EGF · **Version:** 1.0-example · **Status:** example document
**Controller:** Crypto Exchange Association (demo)
**Ecosystem:** Crypto Exchange Association (demo), a trust ecosystem on the Verana Verifiable Public Registry (testnet)
**Date:** 2026-08-16 · **Locale:** en

> **This is a demonstration document.** The Crypto Exchange Association (demo), its members, its people and its fee amounts are fictional, created for the Verana Playground. Nothing here is legal, regulatory or investment advice, and no real institution is bound by it. It exists so the playground demos can anchor a realistic, digest-verifiable governance framework - the way a real association would. Fee amounts are example values: any framework sets its own schedule.

---

## 1. Purpose

The Crypto Exchange Association (demo), "the Association", is a trust ecosystem founded by licensed crypto exchanges and open to the banks that serve them. It exists to remove two industry-wide redundancies:

1. **Retail re-onboarding.** Every member re-runs the same identity checks on the same customers. The Association governs one reusable credential, CEXA-Kyc, checked once by one member and relied on by all others, with the original issuer paid on every reuse.
2. **Counterparty re-verification.** The Travel Rule obliges members to identify the institution behind a transfer. The FATF standard sets a 1,000 USD/EUR baseline; in the EU, Regulation (EU) 2023/1113 (applied since 30 December 2024) removes the floor entirely: originator and beneficiary data travel with every crypto transfer, whatever the amount (the 1,000 EUR line survives only for self-hosted wallet ownership checks). The Association governs one counterparty identity credential, CEXA-VerifiedCounterparty, published by every member and free to verify.

The Association deliberately does **not**: carry transaction data, operate a Travel Rule messaging protocol, hold customer PII in any central database, or issue organizational identity (see section 4).

## 2. Definitions

- **Association**: the Crypto Exchange Association (demo), controller of this framework and of the ecosystem trust registry on the Verana VPR.
- **Member**: a corporation holding at least one active ISSUER or VERIFIER participant entry in the ecosystem.
- **ISSUER member / VERIFIER member**: a member accredited to issue, respectively verify, the CEXA-Kyc credential.
- **Holder**: the natural person to whom a CEXA-Kyc credential is issued.
- **Authorized provider**: an IDV provider listed in Annex C, the only providers members may use for the original check.
- **Evidence bundle**: the sealed archive of all evidence produced by the original check (provider report, document captures, liveness artifacts, screening results), digest-bound to the credential and carried in the holder's wallet.
- **Re-binding**: the check a verifier performs at every reuse to confirm the presenting person is the credential subject (section 8.3).
- **Trust resolution**: the Verifiable Trust resolution of a DID against the Verana VPR, returning the credentials it presents and their permission chains.
- **VPR**: the Verana Verifiable Public Registry. **EGF**: this document, anchored by digest from the ecosystem trust registry.

## 3. Governance of this framework

- The Association controls the ecosystem trust registry and this EGF. Each version of this document is published at a stable URL and anchored on the VPR by digest; the active version is the one referenced by the registry's current governance framework version.
- Amendments follow the Association's internal decision process and take effect when the new version is anchored. Fee schedule changes never apply retroactively to a running membership year (section 9).
- Contact: `governance@cexa.example` (demo).

## 4. Identity prerequisite: members bring their own

The Association issues membership identities, not identity itself.

- Every applicant MUST already be a **Verifiable Service**: an ECS-Organization credential issued by an accredited issuer of the **Verana ECS Ecosystem**, and a self-issued ECS-Service credential, both published on its DID.
- The Association is NOT an ECS-Organization issuer. Only the ECS Ecosystem's accredited issuers issue organizational identity; the Association verifies it at onboarding and relies on it thereafter.

## 5. Eligibility and membership

- **Who may join:** licensed crypto-asset service providers (exchanges) and credit institutions (banks), crypto-native or not, that satisfy section 4.
- **One membership class.** Exchanges and banks join under the same rules, the same fee schedule and the same duties. The sector line does not exist in this framework.
- **Roles.** A member may hold the ISSUER role, the VERIFIER role, or both. Each role is granted through its own on-chain onboarding process, validated by the Association, and is valid for 365 days, renewable.
- **Application evidence.** Applicants supply: proof of DID control, licenses and registrations (authority, identifier, category), contracts with at least one authorized provider (ISSUER applicants), evidence-handling undertakings (section 7), re-binding undertakings (VERIFIER applicants, section 8), and a compliance contact endpoint.
- **On validation** the Association: releases the applicant's dues from escrow, activates the participant entry, and issues the member's CEXA-VerifiedCounterparty credential (section 10).

## 6. Credential schemas

The ecosystem trust registry defines two schemas at this version; their JSON Schema credentials (VTJSC) are published by the Association's anchor service:

| Schema | Purpose | Issuance | Verification | JSC |
|---|---|---|---|---|
| **CEXA-Kyc** | reusable retail identity check | governed: ISSUER members only | governed: VERIFIER members only, paid session | `/vt/schemas-cexa-kyc-jsc.json` |
| **CEXA-VerifiedCounterparty** | Travel Rule counterparty identity | Association only | open and free (public Linked VP) | `/vt/schemas-cexa-verified-counterparty-jsc.json` |

**CEXA-Kyc claims:** subject identity (fullName, birthDate, nationality), check facts (kycLevel, screeningDate, provider), binding (documentNumberHash: a salted hash of the identity document number, so re-binding can match a passport chip without disclosing the number), integrity (evidenceDigest: digest of the sealed evidence bundle), validity (issuanceDate, expiry: 12 months).

**CEXA-VerifiedCounterparty claims:** legalName, lei (where held), licensingAuthority, licenseIdentifier, vaspCategory (including "credit institution"), complianceContact (endpoint for compliance-to-compliance requests), validity aligned to the membership year.

A CEXA-Kyb schema for corporate customers is reserved for a future version of this framework.

Both retail rails are supported: AnonCreds over DIDComm and OpenID4VC SD-JWT.

## 7. Issuance rules (ISSUER members)

1. **Authorized providers only.** The original check MUST be performed through a provider listed in Annex C, covering document authenticity, liveness and face match, and AML screening. The provider used is named in the credential claims.
2. **Seal the evidence.** The issuer MUST seal the complete evidence of the check into an evidence bundle, compute its digest, and place the digest in the credential.
3. **The evidence travels with the holder.** The bundle is delivered into the holder's wallet together with the credential, digest-bound. The issuer keeps its own record for its own regulatory duties, but the reuse flow never depends on it.
4. **Free issuance.** Issuance fees are zero (Annex A). The issuance session is still created on the VPR: it anchors the credential digest and gives the wallet a receipt to check before accepting.
5. **No issuance without the bundle.** Issuing a CEXA-Kyc credential without the sealed evidence bundle is a slashing cause (section 12).

## 8. Verification and reuse rules (VERIFIER members)

1. **Trust resolution first.** Before requesting anything, the verifier's service is trust-resolved by the holder's wallet; the wallet only surfaces requests from members in good standing holding the VERIFIER permission.
2. **Paid, receipted sessions.** Every presentation request runs against a paid verification session on the VPR, split per Annex A. Wallets MUST refuse requests without a valid session; attempting to obtain a presentation outside a paid session is a slashing cause.
3. **Re-binding is mandatory.** At every reuse the verifier MUST confirm the presenting person is the credential subject: passport NFC proof of possession matched against documentNumberHash, face match against the portrait in the evidence bundle, and the verifier's own sanctions screening. Re-binding failures MUST NOT be overridden.
4. **Evidence at presentation, automatically.** The verifier obtains the sealed evidence bundle in the same presentation, verifies it against the credential's digest, and stores it as its own complete customer due diligence record from the moment of onboarding.
5. **No phone home.** Contacting the issuer about a reuse, before or after, is prohibited by design. The issuer is compensated through the session and learns nothing about where the holder presents.
6. **Reliance stays yours.** Relying on a member-issued credential does not transfer the verifier's own regulatory responsibility. This framework exists to make that reliance defensible: vetted issuers, bonded trust scores, named providers, and the full evidence file in the verifier's own records.

## 9. Fees and trust economics

- The fee schedule is defined in Annex A. All business fees are denominated and settled in USDC on the VPR; deposit-bound amounts and agent rewards settle in the network's native denom per the network's global parameters.
- Fees are agreed at onboarding and **frozen across renewals** for a running membership; schedule changes apply from the next membership year.
- Every fee paid or earned mints trust units to the payer's and the payee's trust deposits per the network parameters: each member's public trust score grows with its actual usage, and stands behind it as slashable collateral.
- Wallet user agents and user agents receive the protocol rewards on paid sessions per the network parameters.

## 10. Travel Rule counterparty verification

1. Every member publishes its CEXA-VerifiedCounterparty credential on its DID as a Linked Verifiable Presentation. Verifying it is a free trust resolution: no subscription, no per-check fee, no account.
2. Members SHOULD verify the counterparty institution through this credential before releasing transfers subject to the Travel Rule; in the EU the obligation applies to every transfer regardless of amount.
3. The credential is renewed at membership renewal and **revoked immediately on loss or suspension of the underlying license**. A member whose license changes MUST notify the Association within 2 business days; the Association MAY verify licensing status with the authority at any time.
4. The Association carries no transaction data and replaces no Travel Rule messaging protocol. Members remain responsible for their messaging-layer obligations; the complianceContact claim gives them a direct compliance-to-compliance channel.

## 11. Data protection

- **No central PII.** The Association holds no customer data. The credential and its evidence bundle live in the holder's wallet; verifiers hold what they receive at presentation, as data controllers of their own CDD records.
- **Data minimization.** Outside the account-opening reuse (which transfers the full CDD file by design), presentations use selective disclosure wherever the requesting context allows it.
- **Retention.** Issuers and verifiers retain evidence per their own regulatory obligations. Holders may request re-issuance rather than extension when claims change.
- **Revocation privacy.** Credential status is checked against the registry without notifying the issuer of the checking party.

## 12. Revocation, suspension and slashing

- **Credential revocation.** An issuer that discovers fraud, forgery or error in an issued credential MUST revoke it without delay; status propagates to every member at the next check.
- **Membership suspension.** The Association suspends members for: issuing outside the authorized provider list, issuing without a sealed evidence bundle, faking or tampering with evidence, attempting presentations outside paid sessions, re-binding violations, or licensing misrepresentation.
- **Slashing.** The same causes ground ecosystem slashing of the member's trust deposit per the network's rules: the obligation is recorded at the value originally paid, every permission of the member is non-trustable until repaid, and the slash count is a permanent public record.
- **Exit.** Leaving the Association does not erase obligations attached to credentials issued while a member; trust deposits are non-transferable and remain slashable per the network's rules.

## 13. Liability

This is a demonstration framework: no warranty, no liability, no real obligation is created. A production version of this section would allocate liability between issuer and verifier for reliance on member-issued credentials, define the dispute process, and reference the applicable law.

---

## Annex A: Fee schedule (example values)

All amounts in USDC. These are example values: the split mechanism reads identically for any schedule this Association, or any other framework, chooses to set.

| Fee | Amount | Paid by | Received by |
|---|---|---|---|
| ISSUER membership dues | 5,000 / year | applicant | Association |
| VERIFIER membership dues | 2,000 / year | applicant | Association |
| Issuance of CEXA-Kyc | 0 | - | - |
| Verification of CEXA-Kyc (per reuse) | 0.90 | verifier | issuer of the presented credential |
| Verification of CEXA-Kyc, ecosystem share (per reuse) | 0.10 | verifier | Association |
| CEXA-VerifiedCounterparty check | 0 | - | - |

Deposit-bound amounts (trust units) and agent rewards apply on top per the network's global parameters.

## Annex B: Schema references

Published by the Association's anchor service (host: `association.cexa.playground.testnet.verana.network`):

- CEXA-Kyc VTJSC: `/vt/schemas-cexa-kyc-jsc.json`
- CEXA-VerifiedCounterparty VTJSC: `/vt/schemas-cexa-verified-counterparty-jsc.json`

## Annex C: Authorized IDV providers

| Provider | Scope | Since |
|---|---|---|
| IdentiSure (demo) | document, liveness and face match, AML screening | 1.0 |
| ClearPass (demo) | document, liveness and face match, AML screening | 1.0 |
| VerifID (demo) | document, liveness and face match | 1.0 |

Additions and removals are made by EGF amendment. Credentials issued through a provider later removed remain valid until expiry unless individually revoked.

## Annex D: Contacts

- Governance: `governance@cexa.example` (demo)
- Membership: `join@cexa.example` (demo)
- Security and incident reports: `security@cexa.example` (demo)
