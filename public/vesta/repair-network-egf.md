# Ecosystem Governance Framework of the Vesta Repair Network (demo)

**Document:** VESTA-RN-EGF · **Version:** 1.0-example · **Status:** example document
**Controller:** Vesta Repair Network (demo), a service of Vesta Appliances (demo)
**Ecosystem:** Vesta Repair Network (demo), a trust ecosystem on the Verana Verifiable Public Registry (testnet)
**Date:** 2026-08-17 · **Locale:** en

> **This is a demonstration document.** Vesta Appliances (demo), its subsidiaries, its repair partners and their people are fictional, created for the Verana Playground. Nothing here is legal advice, and no real company is bound by it. It exists so the playground demos can anchor a realistic, digest-verifiable governance framework - the way a real manufacturer's partner network would.

---

## 1. Purpose

The Vesta Repair Network (demo), "the Network", is the trust ecosystem through which Vesta Appliances (demo), "Vesta", governs who may present themselves as an authorized repairer of its products. The problem it removes is the doorstep: when a technician rings, the household has no way to check that the person, or the company behind them, is genuinely authorized by the manufacturer.

The Network governs one credential, **Authorized Repairer**, that closes the chain end to end:

1. **Accreditation.** Vesta's regional subsidiaries accredit repair companies in their territory by issuing the Authorized Repairer credential to the company's DID.
2. **Publication.** The accredited company publishes the credential on its DID as a Linked Verifiable Presentation.
3. **Verification at the door.** The technician presents an employee badge (ECS-Badge) issued by their company; the household's wallet trust-resolves the badge issuer, finds the company's Authorized Repairer credential, and confirms the whole chain: person, company, region, manufacturer. Free, offline-initiated, no call center.

A company without the credential can still be a perfectly verifiable business - it is simply not an authorized Vesta repairer, and the chain stops there.

## 2. Definitions

- **Network**: the Vesta Repair Network (demo), controller of this framework and of the ecosystem trust registry on the Verana VPR. Operated as a delegated service of Vesta.
- **Regional issuer**: a Vesta subsidiary holding an active ISSUER participant entry (e.g. Vesta Iberia (demo), Vesta Nordics (demo)).
- **Authorized repairer**: the repair company to which an Authorized Repairer credential is issued; the credential subject.
- **Badge**: the ECS-Badge credential a repairer issues to its own technicians under the Verana ECS Ecosystem rules.
- **Trust resolution**: the Verifiable Trust resolution of a DID against the Verana VPR, returning the credentials it presents and their permission chains.
- **VPR**: the Verana Verifiable Public Registry. **EGF**: this document, anchored by digest from the ecosystem trust registry.

## 3. Governance of this framework

- The Network controls the ecosystem trust registry and this EGF. Each version of this document is published at a stable URL and anchored on the VPR by digest; the active version is the one referenced by the registry's current governance framework version.
- Amendments follow Vesta's internal decision process and take effect when the new version is anchored.
- Contact: `governance@vesta.example` (demo).

## 4. Identity prerequisite: partners bring their own

The Network accredits repair authorization, not identity.

- Every applicant repair company MUST already be a **Verifiable Service**: an ECS-Organization credential issued by an accredited issuer of the **Verana ECS Ecosystem**, and a self-issued ECS-Service credential, both published on its DID.
- Neither Vesta nor the Network issues organizational identity. Identity is verified at accreditation and relied on thereafter.

## 5. Accreditation of repairers

- **Who may apply:** repair companies operating in a territory covered by a regional issuer, satisfying section 4.
- **Regional issuance.** Accreditation is granted by the subsidiary covering the applicant's region, through the on-chain onboarding process on the Authorized Repairer schema. The region claim binds the accreditation to that territory.
- **Application evidence.** Applicants supply: proof of DID control, trade registration, technician training records for Vesta product lines, and service-quality undertakings.
- **Badges are the company's duty.** An accredited repairer issues ECS-Badge credentials to its own technicians and revokes them the day a technician leaves. The doorstep chain is only as good as the repairer's badge hygiene; failures are an accreditation-revocation cause.

## 6. Credential schema

The ecosystem trust registry defines one schema at this version; its JSON Schema credential (VTJSC) is published by the Network's anchor service:

| Schema | Purpose | Issuance | Verification | JSC |
|---|---|---|---|---|
| **Authorized Repairer** | manufacturer accreditation of a repair company | governed: regional issuers only | open and free (public Linked VP) | `/vt/schemas-authorized-repairer-jsc.json` |

**Claims:** name (legal name of the accredited company), region (territory the accreditation covers), since (year the company joined the network).

The credential is a W3C Verifiable Credential published as a Linked VP on the repairer's DID Document. Technician badges are NOT defined here: they are ECS-Badge credentials governed by the Verana ECS Ecosystem; this framework only makes their issuers meaningful.

## 7. Verification

1. Relying parties (households, the Vesta portal, insurers) verify a repairer by trust-resolving its DID: the Authorized Repairer credential, its VTJSC, the issuing subsidiary's ISSUER permission, and the Network's anchor are checked in one resolution.
2. Verification is free and unrestricted by design.
3. A badge whose issuer presents no Authorized Repairer credential identifies the technician's employer - and nothing more. Relying parties MUST NOT treat such a badge as manufacturer authorization.

## 8. Revocation and slashing

- **Accreditation revocation.** The issuing subsidiary or the Network revokes an Authorized Repairer credential for: termination of the partner agreement, sustained quality failures, misrepresentation of region or training, or badge-hygiene failures (badges kept alive for departed staff).
- **Immediate effect.** Revocation propagates through trust resolution; from that moment the company's badges no longer chain to an authorized repairer.
- **Slashing.** The same causes ground ecosystem slashing of the repairer's trust deposit per the network's rules; the slash count is a permanent public record.

## 9. Liability

This is a demonstration framework: no warranty, no liability, no real obligation is created. A production version of this section would allocate liability between manufacturer, subsidiary and repairer for reliance on the accreditation, define the dispute process, and reference the partner agreement.

---

## Annex A: Fee schedule (example values)

All fees are zero at this version. Deposit-bound amounts (trust units) and agent rewards apply per the network's global parameters.

| Fee | Amount | Paid by | Received by |
|---|---|---|---|
| Repairer accreditation | 0 | - | - |
| Issuance of Authorized Repairer | 0 | - | - |
| Verification of Authorized Repairer | 0 | - | - |

## Annex B: Schema references

Published by the Network's anchor service (host: `repair-network.vesta.playground.testnet.verana.network`):

- Authorized Repairer VTJSC: `/vt/schemas-authorized-repairer-jsc.json`
- On-chain schema: `vpr:verana:vna-testnet-1:cs:252` · rendered at `https://idx.testnet.verana.network/verana/cs/v1/js/252`

## Annex C: Regional issuers

| Issuer | Territory | Host | Since |
|---|---|---|---|
| Vesta Iberia (demo) | Iberia | `vesta-iberia.playground.testnet.verana.network` | 1.0 |
| Vesta Nordics (demo) | Nordics | `vesta-nordics.playground.testnet.verana.network` | 1.0 |

Additions and removals are made by on-chain permission and recorded here at the next EGF amendment.

## Annex D: Contacts

- Governance: `governance@vesta.example` (demo)
- Partner accreditation: `partners@vesta.example` (demo)
- Security and incident reports: `security@vesta.example` (demo)
