# Ecosystem Governance Framework of the Verandia Legal Representation ecosystem (demo)

**Document:** VD-LR-EGF · **Version:** 1.0-example · **Status:** example document
**Controller:** National Business Registry of the Republic of Verandia (demo)
**Ecosystem:** Verandia Legal Representation (demo), a trust ecosystem on the Verana Verifiable Public Registry (testnet)
**Date:** 2026-08-17 · **Locale:** en

> **This is a demonstration document.** The Republic of Verandia, its Business Registry, its companies and their representatives are fictional, created for the Verana Playground. Nothing here is legal or regulatory advice, and no real state or institution is bound by it. It exists so the playground demos can anchor a realistic, digest-verifiable governance framework - the way a real company register would.

---

## 1. Purpose

The Verandia Legal Representation (demo) ecosystem is the trust framework through which the National Business Registry of the Republic of Verandia, "the Register", governs verifiable proof of who may act on behalf of a registered company. Today that proof is an extract PDF that anyone can edit and few can check; here it is one credential:

1. **Sovereign issuance.** Only the Register issues the Legal Representative credential, from its own register data, to the representative's wallet.
2. **Open verification.** Any Verifiable Service may verify it, free of charge and without registration. A bank, a lender, a counterparty or a notary checks the representative's powers in one trust resolution.

Issuance is governed because the register is the single source of truth; verification is open because proof of representation only works if the whole economy can rely on it. This asymmetry is deliberate and is the design center of this framework.

The Register is separately accredited by the Verana ECS Ecosystem as an issuer of ECS-Organization credentials (Business IDs). That accreditation is governed by the ECS Ecosystem's own framework, not by this document.

## 2. Definitions

- **Register**: the National Business Registry of Verandia (demo), controller of this framework, of the ecosystem trust registry on the Verana VPR, and sole issuer of the credential.
- **Credential**: the Legal Representative credential defined in section 5.
- **Holder**: the natural person recorded in the register as a representative of a company.
- **Verifier**: any Verifiable Service that requests presentation of the credential. No membership in this ecosystem is required.
- **Trust resolution**: the Verifiable Trust resolution of a DID against the Verana VPR, returning the credentials it presents and their permission chains.
- **VPR**: the Verana Verifiable Public Registry. **EGF**: this document, anchored by digest from the ecosystem trust registry.

## 3. Governance of this framework

- The Register controls the ecosystem trust registry and this EGF. Each version of this document is published at a stable URL and anchored on the VPR by digest; the active version is the one referenced by the registry's current governance framework version.
- Amendments follow the Register's statutory process and take effect when the new version is anchored.
- Contact: `governance@business-registry.vd.example` (demo).

## 4. Issuance (sole issuer)

- **Sole issuer.** The Register holds the only ISSUER permission on the Legal Representative schema. It does not delegate issuance at this version.
- **Register-bound claims.** Every claim in an issued credential MUST reflect the current state of the company register at issuance time. The credential is a projection of the register, never a substitute record.
- **Entitlement.** The credential is issued to natural persons whose representation mandate is recorded in the register, after the Register has authenticated the person per its statutory procedures.
- **Validity.** validUntil MUST NOT exceed the recorded mandate. Mandate changes in the register trigger revocation and, where applicable, re-issuance.
- **Rails.** Both retail rails are supported: AnonCreds over DIDComm and OpenID4VC SD-JWT.
- **Free of charge.** Issuance is free at this version (Annex A).

## 5. Credential schema

The ecosystem trust registry defines one schema at this version; its JSON Schema credential (VTJSC) is published by the Register's anchor service:

| Schema | Purpose | Issuance | Verification | JSC |
|---|---|---|---|---|
| **Legal Representative** | proof of authority to act for a registered company | governed: the Register only | open and free | `/vt/schemas-legal-representative-jsc.json` |

**Claims:** companyName, companyRegistryId, representativeName, role (the recorded function, e.g. director), powers (the recorded scope of authority), validUntil.

## 6. Verification rules

1. **Open by design.** Any Verifiable Service may request presentation; verifiers need no permission from the Register. Wallets still trust-resolve the requesting service and surface its identity to the holder before presenting.
2. **Powers, not vibes.** A verifier relying on the credential relies on the recorded role and powers claims as of issuance. For transactions where currency matters more than convenience, verifiers SHOULD check that the credential is unrevoked at presentation time; revocation reflects register changes (section 7).
3. **Selective disclosure.** Requests use selective disclosure where the purpose allows it; the full credential is presented only where the transaction requires the complete mandate.
4. **Reliance stays yours.** Relying on the credential does not transfer the verifier's own duties of care. This framework makes reliance defensible: a sovereign register as issuer, digest-anchored issuance, and revocation bound to the register.

## 7. Revocation and slashing

- **Register-driven revocation.** The Register revokes a credential without delay when the underlying mandate ends, is restricted, or is corrected in the register, and on fraud or wallet compromise. Status propagates through trust resolution without notifying the Register of the checking party.
- **Holder duty.** A holder whose mandate has changed MUST NOT continue presenting the credential; doing so is fraud against the verifier, not against this ecosystem alone.
- **Slashing.** The ecosystem's slashing powers per the network's rules apply to participant entries in this ecosystem; the slash count is a permanent public record.

## 8. Data protection

- **No phone home.** The Register learns nothing about where holders present their credential.
- **Minimal claims.** The credential carries the mandate facts the register already publishes, plus the representative's name; it carries no portrait and no private identifiers.
- **Retention.** Verifiers retain presented attributes per their own obligations as controllers of their records.

## 9. Liability

This is a demonstration framework: no warranty, no liability, no real obligation is created. A production version of this section would sit inside the Republic's company and commerce legislation, define the evidentiary value of the credential relative to register extracts, and allocate liability accordingly.

---

## Annex A: Fee schedule (example values)

All fees are zero at this version. Deposit-bound amounts (trust units) and agent rewards apply per the network's global parameters.

| Fee | Amount | Paid by | Received by |
|---|---|---|---|
| Legal Representative issuance | 0 | - | - |
| Verification of Legal Representative | 0 | - | - |

## Annex B: Schema references

Published by the Register's anchor service (host: `business-registry.verandia.playground.testnet.verana.network`):

- Legal Representative VTJSC: `/vt/schemas-legal-representative-jsc.json`
- On-chain schema: `vpr:verana:vna-testnet-1:cs:257` · rendered at `https://idx.testnet.verana.network/verana/cs/v1/js/257`

## Annex C: Contacts

- Governance: `governance@business-registry.vd.example` (demo)
- Register services: `register@business-registry.vd.example` (demo)
- Data protection: `privacy@business-registry.vd.example` (demo)
