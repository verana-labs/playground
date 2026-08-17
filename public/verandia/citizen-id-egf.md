# Ecosystem Governance Framework of the Verandia Citizen ID ecosystem (demo)

**Document:** VD-CID-EGF · **Version:** 1.0-example · **Status:** example document
**Controller:** National Civil Registry of the Republic of Verandia (demo)
**Ecosystem:** Verandia Citizen ID (demo), a trust ecosystem on the Verana Verifiable Public Registry (testnet)
**Date:** 2026-08-17 · **Locale:** en

> **This is a demonstration document.** The Republic of Verandia, its Civil Registry, its relying parties and its citizens are fictional, created for the Verana Playground. Nothing here is legal or regulatory advice, and no real state or institution is bound by it. It exists so the playground demos can anchor a realistic, digest-verifiable governance framework - the way a real national identity scheme would.

---

## 1. Purpose

The Verandia Citizen ID (demo) ecosystem is the trust framework through which the National Civil Registry of the Republic of Verandia, "the Registry", governs its national identity credential. It answers two questions no paper document can:

1. **Who may issue identity?** Only the Registry. Issuance is governed with a single sovereign issuer; a Citizen ID from any other party is invalid by construction.
2. **Who may ask for it?** Only registered relying parties. Verification is governed too: a service that has not been validated by the Registry holds no VERIFIER permission, and compliant wallets refuse its presentation requests before any attribute - let alone the portrait - leaves the device.

The second rule is the heart of this framework. A national identity credential that anyone can request becomes a tracking instrument; one that only registered, purpose-bound relying parties can request stays what it is: a credential for the citizen's benefit.

## 2. Definitions

- **Registry**: the National Civil Registry of Verandia (demo), controller of this framework, of the ecosystem trust registry on the Verana VPR, and sole issuer of the credential.
- **Citizen ID**: the Verandia Citizen ID credential defined in section 6.
- **Holder**: the natural person to whom a Citizen ID is issued.
- **Relying party**: a corporation holding an active VERIFIER participant entry in the ecosystem (e.g. the Tax Buro (demo), Meridian Bank (demo)).
- **Trust resolution**: the Verifiable Trust resolution of a DID against the Verana VPR, returning the credentials it presents and their permission chains.
- **VPR**: the Verana Verifiable Public Registry. **EGF**: this document, anchored by digest from the ecosystem trust registry.

## 3. Governance of this framework

- The Registry controls the ecosystem trust registry and this EGF. Each version of this document is published at a stable URL and anchored on the VPR by digest; the active version is the one referenced by the registry's current governance framework version.
- Amendments follow the Registry's statutory process and take effect when the new version is anchored.
- Contact: `governance@civil-registry.vd.example` (demo).

## 4. Identity prerequisite: relying parties bring their own

- Every applicant relying party MUST already be a **Verifiable Service**: an ECS-Organization credential issued by an accredited issuer of the **Verana ECS Ecosystem** (in Verandia, the National Business Registry is such an issuer), and a self-issued ECS-Service credential, both published on its DID.
- The Registry issues citizen identity, not organizational identity: it verifies a relying party's organizational identity at registration and relies on it thereafter.

## 5. Issuance (sole issuer)

- **Sole issuer.** The Registry holds the only ISSUER permission on the Citizen ID schema. It does not delegate issuance at this version.
- **Entitlement.** The Citizen ID is issued to natural persons registered in the civil register, after in-person or equivalent-assurance identification per the Registry's statutory procedures.
- **Rails.** Both retail rails are supported: AnonCreds over DIDComm and OpenID4VC SD-JWT. The claims are identical on both.
- **Free of charge.** Issuance is free to the citizen (Annex A).

## 6. Credential schema

The ecosystem trust registry defines one schema at this version; its JSON Schema credential (VTJSC) is published by the Registry's anchor service:

| Schema | Purpose | Issuance | Verification | JSC |
|---|---|---|---|---|
| **Verandia Citizen ID** | national identity of the Republic of Verandia | governed: the Registry only | governed: registered relying parties only | `/vt/schemas-verandia-citizen-id-jsc.json` |

**Claims:** familyName, givenName, birthDate, personalIdentifier, nationality, portrait, issuingAuthority. The claim set is inspired by the eIDAS 2 PID attribute model.

## 7. Relying-party registration (VERIFIER members)

- **Who may register:** public bodies and private services with a lawful purpose for identity verification, satisfying section 4.
- **Process.** Registration is granted through the on-chain onboarding process on the Citizen ID schema, validated by the Registry. The Registry records the relying party's declared purpose and the attributes it is entitled to request.
- **Application evidence.** Applicants supply: proof of DID control, legal basis and purpose of verification, the requested attribute set with its justification, and a data-protection contact.
- **Attribute minimization is a condition of registration.** A relying party is registered for the narrowest attribute set its purpose supports. The portrait is granted only where a face-to-credential binding is genuinely required.

## 8. Verification rules

1. **Trust resolution first.** Before any request is surfaced to the holder, the wallet trust-resolves the requesting service and checks its VERIFIER permission on this schema. No permission, no dialog: the request is refused before any data leaves the wallet.
2. **Ask only what you are registered for.** A relying party MUST request only the attributes covered by its registration. Over-asking - requesting attributes beyond the registered set, or the full credential where a subset suffices - is a revocation and slashing cause.
3. **Selective disclosure.** Requests use selective disclosure; the full credential is never presented where single attributes answer the purpose.
4. **No retention beyond purpose.** Relying parties retain presented attributes only as long as their declared purpose and legal basis require.
5. **Receipted sessions.** Verifications run against sessions on the VPR per the network rules, giving both sides a verifiable record that a request was made and answered.

## 9. Data protection

- **No phone home.** The Registry learns nothing about where holders present their Citizen ID: trust resolution and status checks run against the VPR and the wallet, never against the Registry.
- **No central presentation log.** Sessions on the VPR carry digests and permission references, not attributes.
- **Holder control.** Every presentation requires the holder's action in the wallet; there is no silent verification.
- **Revocation.** The Registry revokes on death, identity correction, or compromise; status propagates through trust resolution without notifying the Registry of the checking party.

## 10. Revocation, suspension and slashing

- **Credential revocation.** The Registry revokes a Citizen ID without delay on death, register correction, fraud, or compromise of the holder's wallet.
- **Relying-party revocation.** The Registry revokes VERIFIER permissions for: over-asking, purpose drift, retention violations, or loss of the relying party's own standing.
- **Slashing.** The same causes ground ecosystem slashing of the relying party's trust deposit per the network's rules; the slash count is a permanent public record.

## 11. Liability

This is a demonstration framework: no warranty, no liability, no real obligation is created. A production version of this section would sit inside the Republic's identity and data-protection legislation and allocate liability between the Registry and relying parties accordingly.

---

## Annex A: Fee schedule (example values)

All fees are zero at this version. Deposit-bound amounts (trust units) and agent rewards apply per the network's global parameters.

| Fee | Amount | Paid by | Received by |
|---|---|---|---|
| Citizen ID issuance | 0 | - | - |
| Relying-party registration | 0 | - | - |
| Verification of Citizen ID | 0 | - | - |

## Annex B: Schema references

Published by the Registry's anchor service (host: `civil-registry.verandia.playground.testnet.verana.network`):

- Verandia Citizen ID VTJSC: `/vt/schemas-verandia-citizen-id-jsc.json`
- On-chain schema: `vpr:verana:vna-testnet-1:cs:258` · rendered at `https://idx.testnet.verana.network/verana/cs/v1/js/258`

## Annex C: Registered relying parties

| Relying party | Purpose | Host | Since |
|---|---|---|---|
| Tax Buro of Verandia (demo) | taxpayer authentication | `tax-buro.verandia.playground.testnet.verana.network` | 1.0 |
| Meridian Bank (demo) | customer onboarding and authentication | `meridian-bank.verandia.playground.testnet.verana.network` | 1.0 |

Additions and removals are made by on-chain permission and recorded here at the next EGF amendment.

## Annex D: Contacts

- Governance: `governance@civil-registry.vd.example` (demo)
- Relying-party registration: `relying-parties@civil-registry.vd.example` (demo)
- Data protection: `privacy@civil-registry.vd.example` (demo)
