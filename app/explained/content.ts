// The full "Verana Explained" story content — one page per chapter, one
// diagram stage per sub-step.
// Source of truth: verana-spec → playground/verana-explained/spec.md (0.4).
// Business-first: Chapters 1–3 are context anyone can read; Chapters 4–5
// are action (watch / hands-on); Chapter 6 is the outlook.
// Protocol facts target v3; reproduce recipes follow the current
// verana-frontend UX: ecosystem → credential schema → Participants tree →
// Join from the branch you want to join under.

import { ENDPOINTS, LINKS } from "../lib/site";
import type { Stage } from "./scenes";

export type SubStep = {
  id: string;
  stage: Stage;
  title: string;
  /** story = context, just read · watch = Vesta does it (source links) ·
   *  hands-on = you do it, with your own wallet. */
  kind: "story" | "watch" | "hands-on";
  story: string;
  /** Optional bullet list rendered after the story (visual-first). */
  points?: string[];
  underHood?: string[];
  reproduce?: string[];
  links?: { label: string; href: string }[];
  /** Render the live trust card for this demo service after the recipe. */
  liveService?: string;
  liveNote?: string;
};

export type ChapterPage = {
  n: number;
  slug: string;
  title: string;
  intro: string;
  /** "What Vesta now has" — closing state line. */
  outro?: string;
  pending?: boolean;
  substeps: SubStep[];
};

const app = ENDPOINTS.frontend;
const resolver = ENDPOINTS.resolver;

const CAST_NOTE =
  "The dedicated Vesta demo cast (separate vs-agent instances per participant) is being deployed; until then, the verana-demos anchor stands in on this live card.";

export const CHAPTERS: ChapterPage[] = [
  {
    n: 1,
    slug: "chapter-1",
    title: "Meet Vesta Appliances",
    intro:
      "Before any technology: a normal company, with normal services — and a problem everyone will recognize. Impostors trade on its name, and there is no way to prove anything.",
    outro:
      "What Vesta has: a real business, real services — and no way to prove any of it.",
    substeps: [
      {
        id: "1.1",
        stage: "1.1",
        title: "The company",
        kind: "story",
        story:
          "Vesta Appliances has made washing machines and ovens for forty years. It sells worldwide through resellers, employs about two hundred people, and relies on a network of independent repair companies to service machines in customers' homes.",
      },
      {
        id: "1.2",
        stage: "1.2",
        title: "What Vesta runs online",
        kind: "story",
        story:
          "Like any company, Vesta runs online services: a customer support chat, an employee badge system, and a staff & partner portal. They work — but nothing about them can be proven. To a customer, they are names on a screen.",
      },
      {
        id: "1.3",
        stage: "1.3",
        title: "The problems",
        kind: "story",
        story: "Four problems, one root cause:",
        points: [
          "Customers googling “Vesta support” land on fake support lines; impostor accounts on social media “help” with refunds — and harvest card numbers.",
          "Vans labeled “Vesta-authorized repair” that Vesta has never heard of ring doorbells. Customers get scammed; Vesta gets blamed.",
          "Portal passwords are phished and reset endlessly; the support team drowns.",
          "Every marketplace, bank, and certifier asks Vesta for the same company documents, again and again.",
          "The root cause: online, Vesta's word looks exactly like the scammers' word. There is no way to prove anything.",
        ],
      },
    ],
  },
  {
    n: 2,
    slug: "chapter-2",
    title: "Why Verana",
    intro:
      "The idea, still with no technology: what if every real service could prove who operates it — and your wallet checked, before you connect?",
    substeps: [
      {
        id: "2.1",
        stage: "2.1",
        title: "What if services could prove who runs them?",
        kind: "story",
        story:
          "What if, before you connect to anything — a support chat, a repair company, a login page — your wallet could check who really operates it, and show a green check only when there is proof? Not a claim, not a logo: a verification scammers cannot fake. That is what Verana makes possible: trust before contact.",
      },
      {
        id: "2.2",
        stage: "2.2",
        title: "Verana in one picture",
        kind: "story",
        story:
          "Three concepts carry the whole system — open source, public, no gatekeeper. No single company decides who is trustworthy:",
        points: [
          "Ecosystems — communities that set the rules: who may issue which proofs, and how. Governed on a public registry.",
          "Credentials — the proofs themselves: “this is organization X”, “this service belongs to X”, “X is ISO 9001-certified”. Issued once, verifiable everywhere.",
          "Wallets — where verification happens: every integrated wallet checks the same public registry and shows the same verdict, the same way.",
        ],
      },
      {
        id: "2.3",
        stage: "2.3",
        title: "Vesta's decision",
        kind: "story",
        story:
          "Vesta decides to join, with a three-part plan: prove — become verifiable, so customers can tell real from fake. Certify — attach its ISO 9001 certification, so it travels everywhere Vesta acts. Govern — later, control who counts as an authorized repairer.",
      },
    ],
  },
  {
    n: 3,
    slug: "chapter-3",
    title: "Choosing ecosystems",
    intro:
      "Verana is made of ecosystems — communities that govern proofs. Vesta picks the two it needs, and discovers a gap only it can fill.",
    substeps: [
      {
        id: "3.1",
        stage: "3.1",
        title: "The ECS Ecosystem — the identity card",
        kind: "story",
        story:
          "Every verifiable organization starts here. The ECS Ecosystem governs the essential credentials: ECS-Organization (who you are — legal name, country, registry id, verified once by an accredited issuer) and ECS-Service (what this service is). Together they are what turns the check green. Without this, nothing else can be proven.",
        reproduce: [
          `See it live: open ${app} → Discover & Join → the ECS Ecosystem, its credential schemas, and its participant tree.`,
        ],
        links: [{ label: "Verana app", href: app }],
      },
      {
        id: "3.2",
        stage: "3.2",
        title: "The ISO Certification Ecosystem (demo)",
        kind: "story",
        story:
          "Vesta is ISO 9001-certified — today that is a PDF nobody can verify. In the ISO Certification Ecosystem (a demo, not the real ISO), accredited certification bodies issue ISO 9001 credentials to organizations' verified identities. The certificate becomes a proof customers and partners see on every Vesta service.",
      },
      {
        id: "3.3",
        stage: "3.3",
        title: "The gap — and the foreshadowing",
        kind: "story",
        story:
          "No ecosystem anywhere governs “who is an authorized Vesta repairer” — only Vesta can know that. The repair-fraud problem from Chapter 1 has no existing ecosystem to join. Vesta will have to create its own. That is Chapter 5.",
      },
    ],
  },
  {
    n: 4,
    slug: "chapter-4",
    title: "Joining, in practice",
    intro:
      "The plan in action: an identity is born, proven once, described — the check turns green. Then the services roll out (that part is yours to try), and the certification lands on top.",
    outro:
      "What Vesta now has: a proven identity · three verifiable services with badge login · a certification that travels everywhere it acts. Two of the four Chapter 1 problems are dead, one is dying — one villain remains.",
    substeps: [
      {
        id: "4.1",
        stage: "4.1",
        title: "Vesta gets its digital identity",
        kind: "watch",
        story:
          "Vesta deploys a vs-agent — a small cloud-wallet service — as its Organization anchor. A DID is born: the identifier everything else attaches to. At this point it proves nothing; it is the empty identity card.",
        underHood: [
          "The vs-agent generates the DID (did:webvh recommended) and publishes its DID Document with a DIDComm endpoint at https://<host>/.well-known/did.json.",
          "The anchor will hold and present Vesta's credentials as Linked Verifiable Presentations.",
        ],
        reproduce: [
          "Deploy a vs-agent on a public domain (Docker image + compose examples in the vs-agent repo).",
          "Open https://<your-host>/.well-known/did.json — that document is your anchor's DID.",
          `Resolve it: ${resolver}/v1/trust/resolve?did=<your-did> → UNTRUSTED. That's the starting line.`,
        ],
        links: [
          { label: "vs-agent", href: "https://github.com/verana-labs/vs-agent" },
          { label: "verana-demos examples", href: LINKS.veranaDemos },
        ],
      },
      {
        id: "4.2",
        stage: "4.2",
        title: "Proving who they are — once",
        kind: "watch",
        story:
          "Vesta joins the ECS Ecosystem on the Organization schema and passes Know-Your-Business once, over DIDComm, with an accredited issuer. The issuer verifies the company and issues the ECS-Organization credential to Vesta's DID. The anchor finally has a name that is proven, not claimed.",
        underHood: [
          "Joining creates a HOLDER permission on the Organization schema via Start Permission VP — the validator is the issuer you joined under.",
          "After KYB, the issuer confirms with Set Permission VP to Validated; the permission becomes ACTIVE in the public tree.",
          "The credential is issued over DIDComm and published by the vs-agent as a Linked VP (#vpr-schemas-org-vtc-vp).",
        ],
        reproduce: [
          `Create a testnet account, get VNA from the faucet, and open the Verana app: ${app}.`,
          "Discover & Join → ECS Ecosystem → Organization credential schema → Participants.",
          "In the permission tree, pick an active Issuer branch and click Join: you apply as Holder under that issuer, and it becomes your validator. Enter your anchor DID and submit.",
          "Complete the KYB exchange with the issuer's service over DIDComm; on validation, the ECS-Organization credential lands on your anchor.",
        ],
        links: [
          { label: "Verana app", href: app },
          { label: "Faucet", href: ENDPOINTS.faucet },
        ],
      },
      {
        id: "4.3",
        stage: "4.3",
        title: "Describing the service — the check turns green",
        kind: "watch",
        story:
          "Vesta registers as an issuer of the ECS-Service schema and self-issues the Service credential on its anchor — valid because the same DID already presents the proven ECS-Organization. Resolve the DID now: TRUSTED. The trust card below is the exact card every integrated wallet shows.",
        underHood: [
          "ISSUER permission on ECS-Service per the schema's permission-management mode (tree join, or self-created if OPEN via Create Permission).",
          "Self-issue through the vs-agent Admin API and publish #vpr-schemas-service-vtc-vp. Self-issuance is valid because the same DID presents ECS-Org — every service traces to an accountable organization.",
        ],
        reproduce: [
          "In the app: ECS Ecosystem → Service credential schema → Participants → join the tree on the issuer side for your DID.",
          "Issue the ECS-Service credential to yourself via the vs-agent Admin API and link it (the verana-demos scripts wrap this).",
          `Re-resolve: ${resolver}/v1/trust/resolve?did=<your-did>&detail=full → TRUSTED, with both credentials and their permission chains.`,
        ],
        liveService: "organization-vs",
        liveNote: CAST_NOTE,
      },
      {
        id: "4.4",
        stage: "4.4",
        title: "Rolling it out: support, badges, login",
        kind: "hands-on",
        story:
          "Each real service becomes its own Verifiable Service — its own vs-agent and DID, with an ECS-Service credential issued by the anchor. This is where you join the story, with your own wallet:",
        points: [
          "Support chat — install the Hologram App, scan the QR, review the Proof-of-Trust (green check · Service · Operated by Vesta), then chat. The fake support line from Chapter 1 can't produce that card: it shows red.",
          "Employee badge — pick an integrated open-source wallet and receive an ECS-Badge (AnonCreds/DIDComm for now; Hologram first). Your wallet first verifies the issuer is trusted and authorized to issue ECS-Badge.",
          "Passwordless login — the portal requests your badge. Your wallet verifies the verifier is trusted and authorized to request it, then presents. No password ever existed.",
        ],
        underHood: [
          "Delegated pattern: each service DID presents an ECS-Service credential issued by the anchor; trust chains resolve through the anchor's ECS-Org.",
          "Vesta holds ISSUER and VERIFIER permissions on the ECS-Badge schema — visible in the public tree.",
          "Wallet rules from the user-wallet guideline: verify issuer authorization on offers (Q2) and verifier authorization on presentation requests (Q3); unauthorized → red verdict, phishing for credentials fails structurally.",
        ],
        reproduce: [
          "Install the Hologram App and connect to the support chatbot from this playground; review the Proof-of-Trust, then chat.",
          "Open the badge issuer invitation with your wallet and accept the badge after the wallet's issuer check.",
          "Open the login demo, review the request (who asks, what for), present the badge — you're in.",
        ],
        links: [
          { label: "Hologram wallet page", href: "/user-wallets/hologram" },
          { label: "User-wallet guideline", href: LINKS.guidelineUserWallet },
        ],
      },
      {
        id: "4.5",
        stage: "4.5",
        title: "The certification credential",
        kind: "watch",
        story:
          "Vesta executes its Chapter 3 choice — and here is the shortcut that shows the model's power: the certification body never asks Vesta to prove who it is again. Vesta presents the ECS-Organization credential on its DID (the KYB from 4.2, reused), the body runs its certification checks, and issues ISO 9001 directly to Vesta's Organization DID. Instantly, it surfaces on every Vesta service's trust card.",
        underHood: [
          "HOLDER permission on the ISO 9001 schema, certification body as validator — same tree-join flow, different registry.",
          "Identification by ECS-Org presentation over DIDComm: reusable organizational identity — the ECS layer is the KYB other ecosystems build on.",
          "Org-level credentials surface on all of the organization's services' Proof-of-Trust cards.",
        ],
        reproduce: [
          `In ${app}: Discover & Join → ISO Certification Ecosystem (demo) → ISO 9001 schema → Participants → Join under the certification body.`,
          "Present ECS-Org over the DIDComm session when asked to identify; receive ISO 9001 on the anchor DID.",
          "Reconnect to the support chatbot with your wallet: the ISO 9001 credential is now on its card too.",
        ],
        liveService: "organization-vs",
        liveNote: CAST_NOTE,
      },
    ],
  },
  {
    n: 5,
    slug: "chapter-5",
    title: "Vesta's own ecosystem",
    intro:
      "The roles reverse. Umbra Repairs is still ringing doorbells — and no existing ecosystem can say who a genuine Vesta repairer is. Only Vesta can. So Vesta becomes a governance authority.",
    outro:
      "What Vesta now has — the full circle: proven identity · verifiable services · portable certification · its own governed trust ecosystem. What Vesta consumed, Vesta now provides.",
    substeps: [
      {
        id: "5.1",
        stage: "5.1",
        title: "Why: the last problem standing",
        kind: "story",
        story:
          "Fake support died with the green check. Password phishing died with the badge. Paperwork is dying with reusable KYB. But Umbra Repairs is still out there, because “who is an authorized Vesta repairer” is a question only Vesta can answer. In Verana, an organization that consumed trust can also produce it.",
      },
      {
        id: "5.2",
        stage: "5.2",
        title: "The Vesta Repair Network",
        kind: "watch",
        story:
          "Vesta publishes a one-page governance framework and creates its ecosystem with a single credential schema: Authorized Repairer. The design choice that matters: issuance is governed — only Vesta issues. Verification is open — anyone checks, no permission needed. Then Vesta onboards Zenith Repairs, itself a verifiable organization (it went through its own Chapter 4 — the pattern replicates; that is the point): Vesta identifies Zenith by the ECS-Org credential on its DID and issues Authorized Repairer to Zenith's organization DID.",
        underHood: [
          "Create New Trust Registry (+ EGF document) → Create New Credential Schema (issuer mode ECOSYSTEM, verifier mode OPEN) → Create Root Permission. Three transactions, and Vesta is an ecosystem.",
          "Zenith joins the tree as HOLDER under Vesta's root; Vesta validates by verifying Zenith's ECS-Org presentation — reusable KYB, now from the issuer's seat.",
          "Extension: Zenith can in turn issue technician badges to its employees, so the technician at your door can prove they're from an authorized repairer.",
        ],
        reproduce: [
          `In ${app}: My Ecosystems → create a trust registry (name + governance-framework document).`,
          "Add the “Authorized Repairer” credential schema: issuance mode ECOSYSTEM, verification mode OPEN. Create the root permission.",
          "From Zenith's account: open the new ecosystem → Authorized Repairer schema → Participants → Join under Vesta's root.",
          "From Vesta's side: the application appears in Pending Tasks — verify Zenith's ECS-Org presentation, validate, issue.",
        ],
        links: [{ label: "Verana app", href: app }],
      },
      {
        id: "5.3",
        stage: "5.3",
        title: "Full circle — anyone can tell",
        kind: "hands-on",
        story:
          "The Chapter 1 picture returns, with verdicts. Resolve Zenith's service with your wallet: green — ECS-Org, ECS-Service, Authorized Repairer, chain verified to the Vesta Repair Network. Then Umbra Repairs, which still claims to be authorized: red — no credential Vesta ever issued exists for its DID, and the claim cannot be forged. Brand impersonation fails structurally. And if a partner goes rogue, Vesta revokes — re-resolution drops the credential from every card.",
        underHood: [
          "Verification mode OPEN: any wallet checks a repairer claim without asking anyone's permission — only issuance is gated.",
          "Revocation: Revoke Permission + re-resolution removes the credential from Zenith-style cards and from future discovery results.",
        ],
        reproduce: [
          "Resolve Zenith's demo service with your wallet: Authorized Repairer appears with its chain to the Vesta Repair Network.",
          "Resolve Umbra's demo service: red verdict — the claim has no chain.",
        ],
      },
    ],
  },
  {
    n: 6,
    slug: "chapter-6",
    title: "Being found",
    intro:
      "Everything Vesta published — the ECS credentials, the ISO 9001 certification, the Authorized Repairer credentials — is public, resolvable, and indexable. The Trust Graph turns that into discovery: crawlers iterate the registry, the resolver verifies, and only verified trust results are indexed. People, search engines, and AI agents then find services by what they prove, not what they claim: “ISO 9001-certified manufacturers”, “authorized Vesta repairers” — every result carrying verifiable provenance. This chapter ships later; the summary is the preview.",
    pending: true,
    substeps: [],
  },
];

export function getChapter(slug: string): ChapterPage | undefined {
  return CHAPTERS.find((s) => s.slug === slug);
}
