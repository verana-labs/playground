// The full CEXA story content - five chapters. §1 is the exchange-world
// problem (no protocol vocabulary); §2 the solution (Association + governed
// credential + membership); §3 the technical build with the progressive
// scene graph; §4 the money flows and the trust score; §5 the demos.
// Fee numbers come from app/lib/cexa-cast.ts (the EGF fee schedule) and are
// calibrated against public IDV list pricing (~1.85 USD per full check with
// AML screening). Payment mechanics follow VPR v4; the trust deposit story
// follows tokenomics Model C. On the v3 testnet everything money-related is
// a written, simulated preview - panels switch to live chain data with the
// next network upgrade.

import { LINKS } from "../../lib/site";
import {
  CEXA_CAST,
  CEXA_FEES,
  CEXA_RATES,
  CEXA_REUSE_FEE_USDC,
} from "../../lib/cexa-cast";
import type { Stage } from "./scenes";
import type {
  JourneyNeed as GenericJourneyNeed,
  SubStep as GenericSubStep,
} from "../story-blocks";

export type SubStep = GenericSubStep<Stage>;
export type JourneyNeed = GenericJourneyNeed<Stage>;

/** Generated portraits of the narrative cast: web-optimized WebP in
 *  public/images/cexa/ (PNG sources kept alongside, Verandia convention).
 *  Set a path to null to fall back to the initials placeholder. */
export const CEXA_ASSETS = {
  lena: "/images/cexa/lena.webp" as string | null,
  priya: "/images/cexa/priya.webp" as string | null,
  elias: "/images/cexa/elias.webp" as string | null,
  alice: "/images/cexa/alice.webp" as string | null,
};

const fee = CEXA_FEES;
const rates = CEXA_RATES;

/** Reuse fee split, precomputed for copy and panels. */
const REUSE = {
  total: CEXA_REUSE_FEE_USDC, // 1.00
  issuerLiquid: fee.verificationIssuerUsdc * (1 - rates.trustDepositRate), // 0.855
  issuerTu: fee.verificationIssuerUsdc * rates.trustDepositRate, // 0.045
  ecoLiquid: fee.verificationEcosystemUsdc * (1 - rates.trustDepositRate), // 0.095
  ecoTu: fee.verificationEcosystemUsdc * rates.trustDepositRate, // 0.005
  payerUsdcOut: CEXA_REUSE_FEE_USDC * (1 - rates.trustDepositRate), // 0.95
  payerTu: CEXA_REUSE_FEE_USDC * rates.trustDepositRate, // 0.05
  walletReward: CEXA_REUSE_FEE_USDC * rates.walletAgentRewardRate, // 0.05
  agentReward: CEXA_REUSE_FEE_USDC * rates.userAgentRewardRate, // 0.05
  allIn: CEXA_REUSE_FEE_USDC * 1.15, // 1.15
};

// ------------------------------- §1 · Pay twice, wait twice (the problem)

export const WORLD = {
  name: "The Crypto Exchange Association (demo)",
  tagline: "Reusable KYC, governed by the institutions that rely on it",
  meta: [
    "Exchanges and banks run the same checks",
    "All-in onboarding cost per funded customer: vendor + ops + review",
    "Over 60% of sign-ups abandon during onboarding",
    "Travel Rule: every VASP re-verifies every other VASP",
  ],
  intro:
    "Exchanges compete on markets, liquidity and product. Banks compete on rates, service and trust. Neither competes on document checks - yet every one of them pays an IDV provider to re-run the same passport scan, the same liveness check, the same AML screening on the same customer the market already checked last month. The check is a commodity, regulated identically for both sectors. The friction is not: it costs real money, it costs sign-ups, and between banks and exchanges it costs entire business relationships. And the retail queue is only half of it - the Travel Rule makes the institutions re-verify each other, transfer after transfer.",
  actors: [
    {
      icon: "building",
      name: "Aurum Exchange (demo)",
      desc: "A large exchange. Pays for a full KYC on every new customer - then watches those customers get re-checked everywhere else.",
    },
    {
      icon: "building",
      name: "Borealis Markets (demo)",
      desc: "A growing exchange. Loses a share of its sign-ups at the KYC wall - people abandon rather than upload a passport again.",
    },
    {
      icon: "bank",
      name: "Novara Bank (demo)",
      desc: "A retail bank. Holds the best-audited KYC files in the market - and re-runs the checks anyway, on customers the exchanges just verified.",
    },
    {
      icon: "stamp",
      name: "IdentiSure (demo)",
      desc: "An IDV provider. Good at its job, paid per check - by everyone, for the same person, again and again.",
    },
  ],
  travelRule: {
    icon: "transfers",
    title: "Every VASP re-verifies every other VASP",
    desc: "The Travel Rule requires exchanges and banks to verify counterparty institutions on transfers over 1,000 USD/EUR. Each travel rule network - Sumsub, TRP, Notabene, VerifyVASP, Sygna - keeps its own directory, so each institution joins several or all of them to reach enough counterparties, resubmits its license and controls to each, and pays each a subscription plus per-message fees.",
    costs: [
      "Subscription and per-transfer fees to every network joined",
      "Compliance headcount for every counterparty reviewed",
      "Rejected or delayed transfers when a counterparty cannot be found or verified",
    ],
    punchline:
      "Because none of the networks can see the others' verifications, the same institution is due-diligenced multiple times per year, by multiple institutions, on the same license.",
  },
  problems: [
    {
      icon: "wallet",
      title: "The same check, paid for again and again",
      desc: "The vendor fee (about 1.85 USD per check with AML screening, list price) is only the floor: all-in, with ops time and manual review, onboarding a funded customer costs a multiple of that. Multiply by every exchange and every bank the same customer joins, and the industry pays many times for one fact: this person is who they say they are.",
    },
    {
      icon: "hourglass",
      title: "The KYC wall eats sign-ups",
      desc: "Industry onboarding studies put abandonment during KYC above half. Every re-check is a funded account lost to whichever competitor has one step less.",
    },
    {
      icon: "repeat",
      title: "The corridor tax",
      desc: "Every customer moving between a bank and an exchange is re-checked in both directions. And because a bank cannot see how an exchange verified its customers, the safe answer is too often not to serve them at all.",
    },
    {
      icon: "ghost",
      title: "Fake exchanges collect passports",
      desc: "A phishing site that looks like an exchange - or a bank - asks for exactly what a real one asks for: documents and a selfie. Nothing lets a customer tell them apart before uploading.",
    },
  ],
  consequence:
    "KYC is a compliance tax every institution pays separately - and the people paying the highest price are the users, in queues, re-uploads, stolen documents and closed accounts.",
  ceoQuote: {
    text: "We spend a fortune verifying people the whole market has already verified. Our KYC file is an asset we can never use twice - and every re-check we force on a customer is a gift to whoever onboards them faster.",
    name: "Lena Okafor",
    role: "CEO, Aurum Exchange (demo)",
  },
  bankQuote: {
    text: "We do not de-bank crypto customers because they are crypto customers. We de-bank them because we cannot see how they were verified. Give me the provenance of the check - who ran it, on what evidence, with what at stake if it was faked - and the risk conversation changes completely.",
    name: "Elias Brandt",
    role: "Chief Compliance Officer, Novara Bank (demo)",
  },
};

// ------------------------------- §2 · The solution: a KYC that travels

export const SOLUTION = {
  title: "The solution: a KYC that travels",
  quote: {
    text: "None of us competes on passport scans. So we stopped pretending it is a moat: we founded an association, wrote the rules once, and made the check itself portable - with the original issuer paid every time it is reused.",
    name: "Priya Nandakumar",
    role: "Head of Compliance, Borealis Markets (demo)",
  },
  needsTitle: "What the Association needs",
  needsIntro:
    "A group of exchanges founds the Crypto Exchange Association (demo) - and keeps membership open to the banks that serve them. One membership, one fee schedule, one set of duties. The checklist is short:",
  needs: [
    {
      need: 1,
      tag: "ECS-Organization",
      title: "Members you can verify",
      desc: "The Association and every member exchange must be provable online, so a customer can tell a real exchange from a fake one before uploading anything.",
    },
    {
      need: 2,
      tag: "CEXA-Kyc",
      title: "One governed credential",
      desc: "A single KYC credential schema, governed on both sides: only accredited members issue it, only accredited members can ask for it.",
    },
    {
      need: 3,
      tag: "Onboarding + dues",
      title: "Membership with teeth",
      desc: "Joining is a vetted, renewable, paid process - and every fee a member pays or earns builds a public, slashable trust score.",
    },
    {
      need: 4,
      tag: "Pay-per-reuse",
      title: "Reuse that pays the issuer",
      desc: "When a member accepts another member's KYC credential, the protocol itself routes a fee to the exchange that paid for the original check.",
    },
    {
      need: 5,
      tag: "CEXA-VerifiedCounterparty",
      title: "Counterparty proof, once - not per network",
      desc: "One verifiable answer to who the counterparty is, published on each member's DID and free to check - instead of a license resubmitted to every travel rule directory.",
    },
  ],
  needsBridge:
    "All of this needs wallets to hold and check the proofs (they exist, open source) and one neutral, public place where membership, permissions and payments anchor - owned by no single exchange. That place is Verana.",
  pillarsTitle: "Let's build on Verana",
  pillarsIntro:
    "Verana is a public infrastructure that generalizes the use of verifiable credentials, and provides out of the box:",
  egfTitle: "The rulebook: one EGF instead of fifty bilateral contracts",
  egf: {
    intro:
      "The Association's Ecosystem Governance Framework is a public document, digest-anchored from the trust registry. It defines:",
    rules: [
      "Who may join: licensed exchanges and credit institutions - crypto-native or not - that are already Verifiable Services (ECS-Organization from the Verana ECS Ecosystem, self-issued ECS-Service). One membership class, one fee schedule, one set of duties.",
      "The authorized IDV providers members may use for the original check: IdentiSure (demo), ClearPass (demo), VerifID (demo).",
      "How to be onboarded as an ISSUER member and as a VERIFIER member: licensing evidence, provider contracts, evidence-retention duties, yearly renewal.",
      "The re-binding rule: on every reuse, the accepting exchange verifies the holder is the subject - passport NFC proof of possession plus face match - and runs its own sanctions ping.",
      "The fee schedule: what a reuse costs, who receives it, and that issuing is free.",
      "Evidence duties: the issuer seals the full provider evidence into the holder's wallet alongside the credential, digest-bound. The verifier obtains and maintains the sealed evidence file automatically at presentation - its own complete CDD record from second zero. Contacting the issuer about a reuse is prohibited by design: no phone home.",
      "Slashing causes: issuing outside the provider list, faking evidence, issuing without the sealed evidence bundle.",
      "Travel Rule counterparty proof: every member publishes a CEXA-VerifiedCounterparty credential on its DID carrying legal name, LEI where held, licensing authority and license identifier, VASP category, and a compliance contact endpoint. Renewed at membership renewal, revoked on license loss.",
    ],
    positioning:
      "Vendor reusable KYC already exists - which proves the demand. But it is single-vendor and vendor-owned. The Association's credential is cross-provider, member-owned and user-held: the rules belong to the members, the credential belongs to the customer, and no vendor sits in the middle. And because the EGF makes issuers vetted, bonded and auditable, a bank relying on a member-issued check stays inside the classic third-party reliance framework its regulator already accepts.",
  },
  travelRulePositioning:
    "On the Travel Rule, the Association is deliberately narrow: it carries no transaction data and replaces no messaging protocol. It supplies the one thing every travel rule network rebuilds on its own - a neutral, verifiable answer to who the counterparty is.",
  ecosystemTitle: "The ecosystem the Association builds",
  ecosystem: {
    icon: "network",
    tone: "violet",
    role: "ECOSYSTEM",
    operator: "Crypto Exchange Association (demo)",
    name: "Crypto Exchange Association",
    label: "one KYC credential, governed on both sides",
    about:
      "Two schemas at founding. CEXA-Kyc: the reusable retail check (KYC level, screening date, provider, expiry, a hashed document number for chip-matching re-binding - and the sealed evidence bundle riding in the holder's wallet, digest-bound). Issuance governed, verification governed, every request a paid, receipted session. CEXA-VerifiedCounterparty: the Travel Rule identity of each member, published on its DID and free to check - issued by the Association, revoked on license loss.",
    why: "governed verification is what makes the business model enforceable: a wallet only answers requests from members in good standing, with the reuse fee paid.",
    did: CEXA_CAST.association.did,
  },
  kybNote:
    "A CEXA-Kyb credential for corporate customers follows the same pattern (higher stakes, higher fees) and ships as the story's second act - and it is where the bank members care most: corporate onboarding is the slowest, costliest check either sector runs.",
};

export const PILLARS = [
  {
    name: "Trust Ecosystems",
    label: "Sovereign ecosystems",
    tone: "violet",
    body: "Build ecosystems that issue and verify any credential, with your own schemas, governance framework, participants, and business model, or join an existing one.",
    href: "https://verana.io/ecosystems",
  },
  {
    name: "Verifiable Trust",
    label: "Verifiable identity",
    tone: "blue",
    body: "Identify any service and the organization or person that controls it, and verify it before you connect. Verify first. Then connect.",
    href: "https://verana.io/identity",
  },
  {
    name: "The Trust Graph",
    label: "Discovery",
    tone: "emerald",
    body: "Discover services and ecosystems by the credentials they hold, ranked by trust, for people, search engines, and AI agents.",
    href: "https://verana.io/discovery",
  },
] as const;

export const FACTS =
  "Verana is public, decentralized infrastructure. Any ecosystem can self-create. The Association uses the same open infrastructure as everyone else - no gatekeeper, and no member hosting the others' data.";

// ------------------- §3 · The Association's journey (scene graph sections)

export const JOURNEY: {
  n: number;
  anchor: string;
  title: string;
  intro: string;
  outro: string;
  needs: JourneyNeed[];
} = {
  n: 3,
  anchor: "section-3",
  title: "The Association's journey",
  intro:
    "One checklist, four builds. The picture below opens on the financial world you met in chapter 1 - two gray exchanges and a gray bank paying for the same checks, Alice in the queue, DarkPool phishing at the edge - and each step transforms it.",
  outro:
    "Every box checked: verifiable members · one governed credential · membership with teeth · reuse that pays the issuer, across the bank-exchange corridor · counterparty proof for the Travel Rule - and the impostor and the revoked credential both fail closed.",
  needs: [
    {
      id: "need-1",
      n: 1,
      title: "An Association you can verify",
      tag: "ECS-Organization",
      intro:
        "Before it can vouch for anyone, the Association itself must be provable - and its trust registry must exist.",
      steps: [
        {
          id: "3.1",
          stage: "3.1",
          title: "Founding the Association on Verana",
          kind: "watch",
          story:
            "The Association deploys a vs-agent, an open source Business Wallet natively integrated with the public Verana infrastructure. Helvetia Trust Services (demo), an accredited ECS-Organization issuer, verifies the legal entity and issues its Organization credential; the Association self-issues its Service credential - the first green check. Then it creates its trust registry: the CEXA-Kyc schema, governed on BOTH sides (only accredited members issue, only accredited members verify), the CEXA-VerifiedCounterparty schema for Travel Rule identities, the EGF document anchored by digest, and the fee schedule.",
          code: {
            label: "The DID of the Crypto Exchange Association (demo)",
            value: CEXA_CAST.association.did,
            note: "Placeholder until the CEXA cast deploys on the Verana testnet - then resolvable like every other cast DID.",
          },
          points: [
            "Governed verification is the unusual choice, and the point: asking a wallet for a KYC credential is a privileged, paid act - so the relying side is permissioned too.",
            "The Association issues exactly what it governs: CEXA-VerifiedCounterparty identities and CEXA-Kyc accreditations. ECS-Organization credentials stay where they belong - with the accredited issuers of the Verana ECS Ecosystem, like Helvetia.",
          ],
          underHood: [
            "Create New Trust Registry (+ EGF document, digest-anchored) → Create New Credential Schema (issuer mode ECOSYSTEM, verifier mode ECOSYSTEM) → root permission.",
            "The schema prices its fees in a USD stablecoin (pricing_asset_type COIN): fees settle on-chain in USDC, deposit-bound amounts always settle in the native denom.",
          ],
          links: [
            { label: "Verifiable Trust spec", href: LINKS.vtSpec },
            { label: "VPR spec", href: LINKS.vprSpec },
          ],
        },
      ],
    },
    {
      id: "need-2",
      n: 2,
      title: "Members, onboarded with teeth",
      tag: "Onboarding + dues",
      intro:
        "Joining the Association is an on-chain onboarding process: vetted off-chain, paid and receipted on-chain, renewable yearly.",
      steps: [
        {
          id: "3.2",
          stage: "3.2",
          title: "Aurum joins as an ISSUER member",
          kind: "watch",
          story:
            "Aurum Exchange (demo) starts the onboarding process for an ISSUER permission on the CEXA-Kyc schema. Its dues - 5,000 USDC for the year - go to escrow. Over DIDComm, the Association's service collects what the EGF demands: licenses, the IdentiSure contract, evidence-retention undertakings. Satisfied, the Association validates: the dues release, Aurum receives its CEXA-VerifiedCounterparty credential (published on its DID for anyone to check), and both parties' trust deposits grow - trust units worth 250 minted to each side, 5% of the dues. One thing the Association does NOT issue: Aurum's ECS-Organization credential. Being a Verifiable Service already - Organization credential from an accredited issuer of the Verana ECS Ecosystem, self-issued Service credential - is an entry requirement of the EGF, not a membership perk.",
          points: [
            "No upfront stake anywhere: the trust deposit is built by usage - every fee paid or earned mints trust units worth 5% of it to the payer and to the payee.",
            "While the process is pending, everything sits in escrow: cancel and it refunds as-is. Validated, it never comes back out.",
          ],
          underHood: [
            "Start Participant OP (fees + deposit-bound amount to escrow) → off-chain validation over DIDComm → Set Participant OP to Validated (payout, permission active for 365 days).",
            "The member's verification fee (0.90 per reuse) is agreed at validation and frozen across renewals - the fee schedule is a contract, not a dial.",
          ],
          reproduce: [
            "Once the cast is live: open the Association's ecosystem in the Verana app and read the participant tree - membership is a public record.",
          ],
        },
        {
          id: "3.3",
          stage: "3.3",
          title: "Borealis joins as a VERIFIER member",
          kind: "watch",
          story:
            "Borealis Markets (demo) - already a Verifiable Service, like every applicant - runs the same process for a VERIFIER permission: 2,000 USDC yearly dues, the EGF's re-binding undertaking (passport NFC plus face match on every reuse), and its CEXA-VerifiedCounterparty credential on validation. From this moment Borealis may ask wallets for the CEXA-Kyc credential - and only from this moment: an exchange outside the Association can be perfectly legitimate and still get refused, because verification of this schema is governed.",
          points: [
            "Both sides of the market are memberships: issuers pay to be trusted with issuance, verifiers pay to be trusted with data.",
            "Renewal is yearly, at frozen prices - dues fund the Association's audits, provider vetting and EGF upkeep.",
          ],
          underHood: [
            "Same onboarding messages, role VERIFIER. The wallet-side rule that makes it bite is the VT spec's verifier check: before presenting, the wallet verifies the requester holds a VERIFIER permission in the schema's ecosystem.",
          ],
        },
      ],
    },
    {
      id: "need-3",
      n: 3,
      title: "KYC once, reuse everywhere",
      tag: "CEXA-Kyc",
      intro:
        "The credential at work: one full check at the first exchange, sixty seconds at every exchange after that.",
      steps: [
        {
          id: "3.4",
          stage: "3.4",
          title: "Alice's first and last full KYC",
          kind: "watch",
          story:
            "Alice Moreau opens an account at Aurum. No credential yet, so Aurum runs the full check through IdentiSure (demo): documents, liveness, AML screening - about 1.85, invoiced off-chain. Then Aurum does what makes the spend recoverable: it seals every piece of evidence into a bundle, computes its digest, and issues Alice her CEXA-Kyc credential with the sealed bundle riding alongside it - straight into the wallet she chose. The digest inside the signed credential binds the bundle; the evidence travels with Alice from now on. Issuing is free by design: the Association puts no toll on the on-ramp.",
          image: {
            src: "/images/cexa/alice.webp",
            alt: "Alice Moreau, a customer of the Association's members",
            caption:
              "Alice Moreau - one full KYC at Aurum, then never again.",
          },
          points: [
            "The claims carry the KYC level, screening date, provider, expiry, the evidence digest - and a hashed document number, so a later re-binding can match her passport chip without disclosing the number itself.",
            "The issuance session anchors the credential's digest on-chain: a timestamped receipt that this exact credential was issued by this member.",
            "Alice's wallet checks the session exists before accepting - the protocol's fee enforcement, even when the fee is zero.",
          ],
          underHood: [
            "Create Participant Session (issuance leg, zero fees) + on-chain digest storage; the sealed bundle lives in Alice's wallet, digest-bound to the credential - no copy waits at Aurum for anyone to request.",
            "Dual rail like every playground credential: AnonCreds/DIDComm and OpenID4VC SD-JWT.",
          ],
          reproduce: [
            "Get the demo credential in Run the demos once the cast is live: the Aurum offer mints Alice's claims.",
          ],
        },
        {
          id: "3.5",
          stage: "3.5",
          title: "Sixty seconds at Borealis",
          kind: "watch",
          story:
            "Alice signs up at Borealis. Her wallet trust-resolves Borealis (a verified member, authorized to ask - Q1 and Q3 pass) and presents the credential. Borealis re-binds her to it - passport NFC proof of possession, face match, its own sanctions ping - and receives, in the same presentation, the sealed evidence bundle - Borealis stores it and owns its complete CDD file from second zero, no call to Aurum, ever. Then it pays the reuse fee: 1.00 USDC (example values), split by the protocol - 0.90 to Aurum, the exchange that paid for the original check, 0.10 to the Association. All-in, about 1.15 - against the full cost of a fresh onboarding, and with a funded account in minutes instead of days. Account opened.",
          points: [
            "The issuer is a beneficiary of every verification session: reuse revenue is protocol behavior, not an invoice between competitors.",
            "No phone home: Aurum is paid through the session but never learns where Alice signed up - competitive neutrality between rivals, by construction.",
            "Aurum breaks even on Alice's vendor fee after 2 to 3 reuses - then her credential is margin.",
            "Alice's wallet provider earns a reward on the paid session too: wallets are paid to carry Association credentials.",
          ],
          underHood: [
            "Find Beneficiaries walks the permission tree from the verifier AND from the issuer of the presented credential - that is where the 0.90 comes from.",
            "The wallet refuses any presentation request without a valid paid session: a member cannot dodge the fee and still get the data.",
          ],
          reproduce: [
            "Run the Borealis sign-in demo below once the cast is live - the whole flow, on your own phone.",
          ],
        },
        {
          id: "3.6",
          stage: "3.6",
          title: "Novara Bank joins - and the corridor opens",
          kind: "watch",
          story:
            "Novara Bank (demo) runs the same onboarding as the exchanges - the EGF admits licensed exchanges and credit institutions alike - and takes both roles: ISSUER and VERIFIER. Two things happen at once. Alice walks into Novara with her Aurum-issued credential and opens a bank account in the same sixty seconds she opened Borealis - with Novara paying Aurum the same 0.90, and receiving the same sealed evidence bundle for its own records. And Novara starts issuing: every one of its existing, fully-KYC'd customers can be credentialed at zero on-chain cost, because issuance is free - turning the bank's compliance archive into the largest issuer-side asset in the Association.",
          points: [
            "The corridor runs both ways: exchange-verified customers open bank accounts, bank-verified customers open exchange accounts - and the original checker earns either way.",
            "For Novara, reliance stays defensible: the issuer is vetted at onboarding, bonded by its trust score, named in the credential - and the complete evidence file lands in Novara's own records at presentation, automatically.",
            "De-risking becomes a risk decision instead of a blanket policy: the bank can finally see how a customer was verified, by whom, with what at stake.",
          ],
          underHood: [
            "Two onboarding processes, one per role - same messages, same dues mechanics as the exchanges. Find Beneficiaries is sector-blind: a bank verifying an exchange-issued credential pays the same split.",
            "Credentialing the existing base is issuance sessions at zero fees: digest anchored, receipt for the wallet, nothing else moves.",
          ],
        },
      ],
    },
    {
      id: "need-4",
      n: 4,
      title: "Counterparty proof for the Travel Rule",
      tag: "CEXA-VerifiedCounterparty",
      intro:
        "The institutions verify each other too - and that obligation recurs on every transfer, by regulation.",
      steps: [
        {
          id: "3.7",
          stage: "3.7",
          title: "Before the transfer: verify the counterparty",
          kind: "watch",
          story:
            "Alice withdraws 1,200 USDC from Aurum to her Novara account - over the Travel Rule threshold, so Aurum must verify the receiving institution before releasing. No directory subscription, no form, no queue: Aurum's system trust-resolves Novara's DID and reads its CEXA-VerifiedCounterparty credential - legal name, LEI, licensing authority and license identifier, category, compliance contact - issued by the Association, valid, free. The transfer clears. The same check runs in the other direction when funds flow back.",
          points: [
            "The Association carries no transaction data and replaces no travel rule messaging protocol - it supplies the one thing every network rebuilds: a neutral, verifiable answer to who the counterparty is.",
            "One membership replaces N directory subscriptions and N re-submissions of the same license - and the proof is checkable by anyone, not just fellow subscribers.",
            "Counterparty checks are free by design: the credential is published on the member's DID as a Linked VP, and reading it costs nothing. Dues fund the registry.",
          ],
          underHood: [
            "CEXA-VerifiedCounterparty is an org-level credential published as a Linked VP - the standard Verifiable Service pattern, so the check is ordinary trust resolution.",
            "Renewal rides the yearly membership renewal; license loss means revocation, and the credential dies in every member's transfer flow the same day.",
          ],
        },
      ],
    },
    {
      id: "need-5",
      n: 5,
      title: "Fail-closed defenses",
      tag: "Q1 + revocation",
      intro:
        "What makes the whole thing safe to rely on: the failures fail closed.",
      steps: [
        {
          id: "3.8",
          stage: "3.8",
          title: "DarkPool asks - and is never even shown",
          kind: "watch",
          story:
            "DarkPool Exchange (demo) looks like an exchange and asks for what exchanges and banks ask for: your documents. But it can present no Organization credential, no Service credential, no membership - trust resolution returns UNTRUSTED, and Alice's wallet never surfaces the request at all. The fake-exchange phishing pattern from chapter 1 dies at Q1, before any data is at risk.",
          points: [
            "A trusted-but-unaccredited service fails just as cleanly: a member without the VERIFIER permission gets its request refused at Q3, with the wallet explaining why.",
          ],
          underHood: [
            "The umbra pattern of the playground casts: DarkPool is deployed but deliberately unprovisioned. It resolving as anything but UNTRUSTED would be an incident.",
          ],
        },
        {
          id: "3.9",
          stage: "3.9",
          title: "Fraud discovered: one revocation, network-wide",
          kind: "watch",
          story:
            "Months later, Aurum discovers one of its KYC files was built on a forged document. It revokes that credential. The next time the holder tries to present it - at any member, exchange or bank - the check shows it dead. And because the Association can slash a misbehaving member's trust deposit, an issuer that faked evidence or skipped the provider list does not just lose face: it loses its bonded trust score, its permissions freeze, and the slash is a permanent public record. The same blade cuts on the institutional side: a member that loses its license has its CEXA-VerifiedCounterparty credential revoked - and disappears from every other member's transfer flow the same day.",
          points: [
            "Revocation is the shared fraud signal without a shared database: no pooled PII, and still every member benefits from every discovery.",
            "Slash obligations are recorded at what was originally paid, in fiat terms - a score that decayed does not discount the liability.",
          ],
          underHood: [
            "Credential status rides the standard credential-state-change flow; the holder's participant entry carries it.",
            "Ecosystem slash burns the trust units and freezes every permission of the member until the obligation is repaid - repayment restores the score only at its decayed value.",
          ],
        },
      ],
    },
  ],
};

// --------------------------------- §4 · The money: who pays whom

export type MoneyLeg = {
  to: string;
  detail: string;
  /** Liquid USDC received. */
  usdc?: number;
  /** Liquid native-denom reward received (agents), as fiat-worth. */
  vna?: number;
  /** Trust units minted to the recipient, as fiat-worth at mint. */
  tuWorth?: number;
  offchain?: boolean;
};

export type MoneyFlowData = {
  id: string;
  title: string;
  when: string;
  payer: string;
  payerOut: string;
  payerTuWorth?: number;
  legs: MoneyLeg[];
  footnote?: string;
};

export const MONEY = {
  n: 4,
  anchor: "section-4",
  title: "The money: who pays whom",
  intro:
    "Three flows carry the whole business model: yearly dues, free issuance, and the paid reuse - plus one deliberate non-flow, the free counterparty check. Every amount below is an agreed, framework-governed value (who sets what is the first table on this page), and the fee amounts are examples: the split mechanism reads the same for any framework's schedule. On the current testnet these panels are a simulated preview: they switch to live chain data - real sessions, real beneficiary queries, real deposits - with the next network upgrade.",
  simulatedChip: "simulated preview · goes live with the next network upgrade",
  flows: [
    {
      id: "flow-dues",
      title: "Membership dues",
      when: "Once a year, per member, on onboarding and renewal",
      payer: "Aurum Exchange (demo), joining as ISSUER",
      payerOut: "5,000 USDC + the deposit-bound amounts in VNA",
      payerTuWorth: 250,
      legs: [
        {
          to: "Crypto Exchange Association (demo)",
          detail: "dues released from escrow on validation",
          usdc: 5000,
          tuWorth: 250,
        },
      ],
      footnote:
        "While the onboarding is pending, dues and deposit-bound amounts sit in escrow: cancelling refunds as-is, and nothing is minted. Verifier dues follow the same flow at 2,000.",
    },
    {
      id: "flow-issuance",
      title: "First onboarding: full KYC + free issuance",
      when: "Once per new customer without a credential",
      payer: "Aurum Exchange (demo), issuing to Alice",
      payerOut: "~1.85 USDC off-chain · zero trust fees on-chain",
      legs: [
        {
          to: "IdentiSure (demo)",
          detail: "the full check: documents, liveness, AML screening",
          usdc: 1.85,
          offchain: true,
        },
        {
          to: "Verana network",
          detail: "issuance session: credential digest anchored, receipt for the wallet",
        },
      ],
      footnote:
        "Issuing is free by design - the Association puts no toll on the on-ramp. The 1.85 becomes recoverable the moment the credential starts circulating.",
    },
    {
      id: "flow-reuse",
      title: "The reuse: one paid verification, evidence included",
      when: "Every time a member accepts the credential",
      payer: "Borealis Markets (demo), verifying Alice's credential",
      payerOut: "0.95 USDC + 0.20 VNA-eq ≈ 1.15 all-in (example values)",
      payerTuWorth: REUSE.payerTu,
      legs: [
        {
          to: "Aurum Exchange (demo)",
          detail: "the original issuer, paid on every reuse (example fee 0.90)",
          usdc: REUSE.issuerLiquid,
          tuWorth: REUSE.issuerTu,
        },
        {
          to: "Crypto Exchange Association (demo)",
          detail: "the ecosystem share (example fee 0.10)",
          usdc: REUSE.ecoLiquid,
          tuWorth: REUSE.ecoTu,
        },
        {
          to: "Alice's wallet provider",
          detail: "wallet user agent reward, 5% of the fees",
          vna: REUSE.walletReward * (1 - rates.trustDepositRate),
          tuWorth: REUSE.walletReward * rates.trustDepositRate,
        },
        {
          to: "User agent provider",
          detail: "user agent reward, when a registered agent brokered the session",
          vna: REUSE.agentReward * (1 - rates.trustDepositRate),
          tuWorth: REUSE.agentReward * rates.trustDepositRate,
        },
      ],
      footnote:
        "What 1.15 all-in buys, in the order that matters: a funded account in minutes instead of days, the abandonment recovered that a fresh onboarding would have lost, the identity decision, and the complete sealed evidence file in the verifier's own records - against an all-in onboarding cost that is a multiple of the 1.85 vendor floor. 0.90 of it goes to a fellow member, not a vendor; Aurum breaks even on its vendor fee after 2 to 3 reuses. The identical split runs in every direction of the corridor: exchange to exchange, exchange to bank, bank to exchange.",
    },
  ] as MoneyFlowData[],
  counterparty: {
    title: "The counterparty check: free by design",
    desc: "The fourth flow is deliberately not a flow. A member verifying a counterparty before a Travel Rule transfer trust-resolves the counterparty's DID and reads its CEXA-VerifiedCounterparty credential - published as a Linked VP, checkable by anyone, at no per-check cost. Compare: a subscription plus per-message fees to every travel rule network joined, times the number of networks it takes to reach your counterparties. Membership dues fund the registry; the checks themselves never meter.",
    chip: "0 per check · dues-funded",
  },
  unitEconomics: {
    title: "Unit economics, at scale",
    rows: [
      {
        who: "Borealis (demo), 100,000 reuses a year",
        line: "~115,000 USDC all-in for 100,000 funded accounts with complete CDD files - against an all-in onboarding cost that is a multiple of the vendor fee alone, before counting the sign-ups a re-KYC wall loses.",
      },
      {
        who: "Aurum (demo), credentials reused 200,000 times a year",
        line: "~171,000 USDC of reuse revenue against its original KYC spend: the compliance cost center becomes an asset, breaking even per credential after 2 to 3 reuses.",
      },
      {
        who: "Novara Bank (demo), issuer-side goldmine",
        line: "Credentials its entire existing KYC'd base at zero on-chain cost - issuance is free - then earns 0.855 every time one of those customers signs up anywhere in the Association.",
      },
      {
        who: "Any member, Travel Rule desk",
        line: "One membership replaces N travel rule directory subscriptions and N re-submissions of the same license - and every counterparty identity check against the registry is free.",
      },
      {
        who: "The Association",
        line: "0.10 on every reuse network-wide plus dues: audits, provider vetting, EGF upkeep and the counterparty registry, funded by usage.",
      },
    ],
  },
  trustScore: {
    title: "The trust score every payment builds",
    intro:
      "There is no upfront stake anywhere in this story. Instead, every fee mints trust units - worth 5% of the amount - to the payer AND to the payee. The result is a public trust score with unusual properties:",
    points: [
      "Not money: trust units are non-transferable and non-convertible. The tokens spent to mint them went to the network's distribution pool - there is no pot to raid and no run risk.",
      "Built by usage, on both sides: the more the market relies on an issuer's credentials, the faster its score grows - collateral that scales with exposure, with no committee setting levels.",
      "A subscription, not a trophy: the score decays (half-life about 23 months). Trust reflects recent proven usage - earned, never bought, gone if not maintained.",
      "Scores decay, liabilities do not: a slash is recorded at what was originally paid, in fiat terms. Misbehavior costs the same whether the deposit was funded yesterday or a year ago.",
      "A slash freezes everything: every permission of the member goes non-trustable until the obligation is repaid - and the slash count is public, forever.",
    ],
    trajectories: [
      {
        who: "Aurum (demo)",
        activity: "200,000 reuses of its credentials + dues",
        perYear: "≈ 9,250",
      },
      {
        who: "Borealis (demo)",
        activity: "100,000 reuses accepted + dues",
        perYear: "≈ 5,100",
      },
      {
        who: "Novara Bank (demo)",
        activity: "300,000 reuses of its bank-issued credentials + dues",
        perYear: "≈ 13,750",
      },
      {
        who: "The Association",
        activity: "earns on every flow, both sides of the dues",
        perYear: "grows with total volume",
      },
    ],
    trajectoriesNote:
      "Trust units minted per year, as fiat-worth at mint. Under decay, a steady activity level converges to a standing score of roughly 3x the annual mint.",
  },
  governs: {
    title: "Who governs which number",
    intro:
      "First, so every number below reads correctly: nothing on this page is a protocol constant. The fees are agreed inside the framework and frozen across renewals; the rates are network governance parameters. The 0.90 + 0.10 split is an example schedule - ANY framework sets its own numbers, and every panel reads the same.",
    rows: [
      {
        param: "Dues, issuance and verification fees",
        who: "The Association and each member, agreed at onboarding, frozen across renewals (example schedule: 0.90 issuer + 0.10 ecosystem per reuse, issuance 0)",
      },
      {
        param: "Pricing asset (USDC)",
        who: "The Association, per schema",
      },
      {
        param: "Authorized providers, re-binding rule, evidence SLAs, slashing causes",
        who: "The Association, in the EGF",
      },
      {
        param: "Deposit-bound rate, agent reward rates, decay",
        who: "Verana network governance - not the Association",
      },
    ],
  },
};

// --------------------------------- §5 · Run the demos

export const DEMOS = {
  n: 5,
  anchor: "section-5",
  title: "Run the demos",
  intro:
    "Download one of the integrated personal wallets to run the demos - every wallet shows the same verdicts, the same way. The CEXA cast is being prepared for the Verana testnet; each demo below activates as its services deploy.",
  verifyRule:
    "Always verify the certified Organization name and data shown in the Proof-of-Trust card in your wallet before proceeding.",
  chooseWallet: {
    title: "Choose a wallet",
    intro:
      "Pick one of the integrated personal wallets and install it - the demo QR codes are minted for your wallet, on the rail it speaks.",
  },
  kyc: {
    title: "Get your CEXA-Kyc credential",
    intro:
      "Request Alice's (demo) credential from Aurum Exchange (demo) and watch your wallet check the issuer first. In the real flow this happens after the full IdentiSure check; the demo mints directly:",
    offer: {
      org: "From Aurum Exchange (demo)",
      serviceId: "aurum",
      credential: "cexa-kyc",
      expect:
        "Green Proof-of-Trust: an accredited ISSUER member of the Crypto Exchange Association (demo). Accept it - you'll use it to sign in below.",
      tone: "emerald" as const,
    },
  },
  borealis: {
    title: "Open an account at Borealis Markets (demo)",
    intro:
      "The reuse, on your own phone: Borealis asks for your CEXA-Kyc credential, your wallet checks the verifier is an accredited member, and the account opens. The re-binding step (passport NFC + face match) is simulated on screen; the fee panel shows what flows on a real reuse:",
    outcomes: [
      {
        rule: "Your CEXA-Kyc was issued by an accredited member",
        result: "Account opened - no document uploads, no queue.",
        tone: "emerald" as const,
      },
      {
        rule: "Anything else",
        result: "Access denied.",
        tone: "red" as const,
      },
    ],
  },
  novara: {
    title: "Open a bank account at Novara Bank (demo)",
    intro:
      "The corridor, on your own phone: the same exchange-issued credential opens a bank account. Novara verifies you exactly like Borealis did - same trust checks, same re-binding, same fee split, with 0.90 flowing back to the exchange that ran your original KYC:",
    outcomes: [
      {
        rule: "Your CEXA-Kyc was issued by an accredited member - exchange or bank",
        result: "Bank account opened - the sector line does not exist in the protocol.",
        tone: "emerald" as const,
      },
      {
        rule: "Anything else",
        result: "Access denied.",
        tone: "red" as const,
      },
    ],
  },
  counterparty: {
    title: "Verify a counterparty",
    intro:
      "The Travel Rule check, live: resolve a member's DID and read its CEXA-VerifiedCounterparty credential - licensing authority, license identifier, category, compliance contact - straight from the public registry. No account, no subscription, no fee:",
    expect:
      "The trust card shows the member's CEXA-VerifiedCounterparty credential issued by the Association - the neutral answer to who the counterparty is, checkable by anyone.",
  },
  darkpool: {
    title: "The exchange that cannot prove anything",
    intro:
      "DarkPool Exchange (demo) makes a very real request for your documents - from a DID that can present nothing. Your wallet must refuse at Q1, before any data is at risk:",
    serviceId: "darkpool",
    credential: "cexa-kyc",
    expect:
      "Trust resolution returns UNTRUSTED: no Organization credential, no Service credential, no membership. The request is never even surfaced.",
  },
};

// ----------------------------------- Closing teaser

export const CLOSING = {
  title: "What ships next",
  pendingLabel: "in preparation",
  body: "The CEXA cast deploys on the Verana testnet next: live DIDs behind every trust card, live QR demos on both rails, the Borealis and Novara sign-ins with the simulated re-binding step, and the live counterparty lookup against member DIDs. When the next network upgrade lands, the money panels stop simulating: real sessions, real beneficiary splits, real trust scores - the same numbers you read in chapter 4, on chain. The corporate act - CEXA-Kyb for business accounts, where the bank members care most - follows.",
};
