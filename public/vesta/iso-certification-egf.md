# Ecosystem Governance Framework of the ISO Certification (demo) registry

**Document:** ISOCERT-EGF · **Version:** 1.0-example · **Status:** example document
**Controller:** ISO Certification (demo)
**Ecosystem:** ISO Certification (demo), a trust ecosystem on the Verana Verifiable Public Registry (testnet)
**Date:** 2026-08-17 · **Locale:** en

> **This is a demonstration document.** The ISO Certification (demo) registry, its accredited certification bodies and its certified organizations are fictional, created for the Verana Playground. Nothing here is legal or regulatory advice, and no real institution is bound by it. The ecosystem is not affiliated with ISO. It exists so the playground demos can anchor a realistic, digest-verifiable governance framework - the way a real certification-accreditation registry would.

---

## 1. Purpose

The ISO Certification (demo) registry, "the Registry", is a trust ecosystem for quality-management certification. Today a certificate is a PDF on a website: relying parties cannot check who issued it, whether the issuer was accredited, or whether it is still valid. The Registry replaces that with one verifiable chain:

1. **Accreditation.** The Registry accredits certification bodies as issuers of the ISO 9001 (demo) credential. Accreditation is governed: only bodies validated by the Registry may issue.
2. **Certification.** An accredited body issues the credential to the organization it audits. The certified organization publishes it on its DID as a Linked Verifiable Presentation.
3. **Free verification.** Anyone - a customer, a procurement team, another ecosystem - verifies the certificate through trust resolution, free of charge, without contacting the body or the Registry.

The Registry does not perform audits, does not issue certificates itself, and holds no data about certified organizations beyond the on-chain permission records.

## 2. Definitions

- **Registry**: the ISO Certification (demo) registry, controller of this framework and of the ecosystem trust registry on the Verana VPR.
- **Certification body**: a corporation holding an active ISSUER participant entry in the ecosystem (e.g. NormaCert (demo)).
- **Certified organization**: the organization to which an ISO 9001 (demo) credential is issued; the credential subject.
- **Trust resolution**: the Verifiable Trust resolution of a DID against the Verana VPR, returning the credentials it presents and their permission chains.
- **VPR**: the Verana Verifiable Public Registry. **EGF**: this document, anchored by digest from the ecosystem trust registry.

## 3. Governance of this framework

- The Registry controls the ecosystem trust registry and this EGF. Each version of this document is published at a stable URL and anchored on the VPR by digest; the active version is the one referenced by the registry's current governance framework version.
- Amendments follow the Registry's internal decision process and take effect when the new version is anchored.
- Contact: `governance@iso-certification.example` (demo).

## 4. Identity prerequisite: participants bring their own

The Registry accredits certification competence, not identity.

- Every applicant certification body MUST already be a **Verifiable Service**: an ECS-Organization credential issued by an accredited issuer of the **Verana ECS Ecosystem**, and a self-issued ECS-Service credential, both published on its DID.
- Certified organizations MUST equally be Verifiable Services before a credential is issued to their DID: a certificate published by an unidentifiable organization proves nothing.
- The Registry is NOT an ECS-Organization issuer; it verifies organizational identity at onboarding and relies on it thereafter.

## 5. Accreditation of certification bodies

- **Who may apply:** audit and certification firms that satisfy section 4 and demonstrate quality-management audit competence.
- **Process.** Accreditation is granted through the on-chain onboarding process on the ISO 9001 (demo) schema, validated by the Registry. The permission does not expire at this version; the Registry revokes it on cause (section 9).
- **Application evidence.** Applicants supply: proof of DID control, audit methodology and auditor qualifications, references, and an incident contact endpoint.

## 6. Credential schema

The ecosystem trust registry defines one schema at this version; its JSON Schema credential (VTJSC) is published by the Registry's anchor service:

| Schema | Purpose | Issuance | Verification | JSC |
|---|---|---|---|---|
| **ISO 9001 (demo)** | quality-management certification | governed: accredited bodies only | open and free (public Linked VP) | `/vt/schemas-iso-9001-demo-jsc.json` |

**Claims:** certificateNumber (assigned by the body), standard (the standard certified against), scope (certified activities), validUntil (certificate expiry).

The credential is a W3C Verifiable Credential published as a Linked VP on the certified organization's DID Document.

## 7. Issuance rules (certification bodies)

1. **Audit first.** A credential MUST only be issued after the body has completed its certification audit per its accredited methodology. The credential is the verifiable receipt of that audit, not a replacement for it.
2. **Scope honesty.** The scope claim MUST match the audited scope. Widening scope without audit is a revocation and slashing cause.
3. **Expiry matches the certificate.** validUntil MUST equal the certificate's real expiry; surveillance-audit failures trigger revocation before expiry.
4. **Free issuance.** Issuance and verification fees are zero at this version (Annex A).

## 8. Verification

1. Relying parties verify a certificate by trust-resolving the certified organization's DID: the credential, its VTJSC, the issuing body's ISSUER permission, and the Registry's anchor are all checked in one resolution.
2. Verification is free and unrestricted by design: adoption of the certificate depends on anyone being able to check it.
3. A certificate presented outside the holder's DID Document (screenshot, PDF, copied JSON) has no standing under this framework.

## 9. Revocation and slashing

- **Certificate revocation.** A body MUST revoke a credential without delay when certification is withdrawn, suspended, or was obtained through misrepresentation. Revocation propagates through trust resolution.
- **Accreditation revocation.** The Registry revokes a body's ISSUER permission for: issuing without audit, scope inflation, failing to revoke on withdrawal, or loss of the body's own standing.
- **Slashing.** The same causes ground ecosystem slashing of the body's trust deposit per the network's rules; the slash count is a permanent public record.

## 10. Liability

This is a demonstration framework: no warranty, no liability, no real obligation is created. A production version of this section would allocate liability between the certification body and relying parties, define the dispute and appeal process, and reference the applicable accreditation standards (e.g. ISO/IEC 17021).

---

## Annex A: Fee schedule (example values)

All fees are zero at this version. Deposit-bound amounts (trust units) and agent rewards apply per the network's global parameters.

| Fee | Amount | Paid by | Received by |
|---|---|---|---|
| Certification body accreditation | 0 | - | - |
| Issuance of ISO 9001 (demo) | 0 | - | - |
| Verification of ISO 9001 (demo) | 0 | - | - |

## Annex B: Schema references

Published by the Registry's anchor service (host: `iso-certification.playground.testnet.verana.network`):

- ISO 9001 (demo) VTJSC: `/vt/schemas-iso-9001-demo-jsc.json`
- On-chain schema: `vpr:verana:vna-testnet-1:cs:251` · rendered at `https://idx.testnet.verana.network/verana/cs/v1/js/251`

## Annex C: Accredited certification bodies

| Body | Host | Since |
|---|---|---|
| NormaCert (demo) | `normacert.playground.testnet.verana.network` | 1.0 |

Additions and removals are made by on-chain permission and recorded here at the next EGF amendment.

## Annex D: Contacts

- Governance: `governance@iso-certification.example` (demo)
- Accreditation: `accreditation@iso-certification.example` (demo)
- Security and incident reports: `security@iso-certification.example` (demo)
