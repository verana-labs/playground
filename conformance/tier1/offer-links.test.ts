import { describe, it } from "vitest";
import { effectiveDemoParams, effectivePresentation, listWalletProfiles, type WalletBuild, type WalletProfile } from "../../app/lib/wallet-profiles";
import { inScope, listCastServices, type CastService } from "../lib/cast-services";
import { incompatibilityFor } from "../lib/incompatibility";
import { clientIdMatches, fetchAuthorizationRequest, fetchCredentialOffer, fetchOobInvitation, parseWalletLink } from "../lib/links";
import { mintsEnabled } from "../lib/mints";
import { mintIssuance, mintPresentation, type Mint, type Rail } from "../lib/playground-client";
import { profilesDir } from "../lib/profiles-dir";
import { check, type Verdict } from "../lib/report";
import { listScenarios, serviceFor, type Scenario } from "../lib/scenarios";
import { describeNetworks } from "../lib/suite";

const profiles = listWalletProfiles(profilesDir());
const scenarios = listScenarios();

type Target = { profile: WalletProfile; build: WalletBuild; rail: Rail; scenario: Scenario; service: CastService };

function targets(services: CastService[]): Target[] {
  const out: Target[] = [];
  for (const profile of profiles)
    for (const rail of profile.rails)
      for (const scenario of scenarios) {
        const service = services.find((s) => s.id === serviceFor(scenario, rail));
        if (!service || !inScope(service)) continue;
        for (const build of profile.builds) out.push({ profile, build, rail, scenario, service });
      }
  return out;
}

const hostOf = (u: string): string => new URL(u).host;

async function checkOffer(t: Target, mint: Mint): Promise<string[]> {
  const problems: string[] = [];
  const link = parseWalletLink(mint.url);
  if (!t.profile.openid4vc?.offerSchemes.includes(link.scheme)) problems.push(`scheme ${link.scheme} not registered by ${t.profile.id}`);
  const uri = link.params.get("credential_offer_uri");
  if (!uri) return [...problems, "no credential_offer_uri"];
  if (!/credential_offer_uri=https%3A%2F%2F/.test(mint.url)) problems.push("credential_offer_uri is not percent-encoded");
  if (hostOf(uri) !== t.service.host) problems.push(`offer uri host ${hostOf(uri)} is not ${t.service.host}`);
  const offer = await fetchCredentialOffer(uri);
  if (hostOf(offer.credential_issuer) !== t.service.host) problems.push(`credential_issuer ${offer.credential_issuer} is off-host`);
  if (!("urn:ietf:params:oauth:grant-type:pre-authorized_code" in offer.grants)) problems.push("no pre-authorized_code grant");
  return problems;
}

async function checkRequest(t: Target, mint: Mint): Promise<string[]> {
  const problems: string[] = [];
  const presentation = effectivePresentation(t.profile, t.build);
  if (!presentation) return ["profile has no presentation rail"];
  const link = parseWalletLink(mint.url);
  if (!t.profile.openid4vc?.requestSchemes.includes(link.scheme)) problems.push(`scheme ${link.scheme} not registered by ${t.profile.id}`);
  const clientId = link.params.get("client_id") ?? "";
  if (!clientIdMatches(clientId, presentation.clientId)) problems.push(`client_id ${clientId} is not a ${presentation.clientId} client id`);
  const uri = link.params.get("request_uri");
  if (!uri) return [...problems, "no request_uri"];
  if (!/request_uri=https%3A%2F%2F/.test(mint.url)) problems.push("request_uri is not percent-encoded");
  if (hostOf(uri) !== t.service.host) problems.push(`request uri host ${hostOf(uri)} is not ${t.service.host}`);
  const { header, payload } = await fetchAuthorizationRequest(uri);
  if (header.typ !== "oauth-authz-req+jwt") problems.push(`typ ${String(header.typ)}`);
  if (presentation.clientId === "x509_hash" && !(Array.isArray(header.x5c) && header.x5c.length > 0)) problems.push("x509_hash request without x5c header");
  if (presentation.clientId === "did" && typeof header.kid !== "string") problems.push("did request without kid header");
  if (payload.client_id !== clientId) problems.push("payload client_id differs from the link");
  if (payload.response_mode !== presentation.responseMode) problems.push(`response_mode ${String(payload.response_mode)} is not ${presentation.responseMode}`);
  if (typeof payload.response_uri !== "string" || hostOf(payload.response_uri) !== t.service.host) problems.push("response_uri is missing or off-host");
  if (typeof payload.nonce !== "string" || typeof payload.state !== "string") problems.push("nonce or state missing");
  const hasDcql = typeof payload.dcql_query === "object" && payload.dcql_query !== null;
  const hasPe = typeof payload.presentation_definition === "object" && payload.presentation_definition !== null;
  if (presentation.query === "dcql" && !hasDcql) problems.push("dcql rail without dcql_query");
  if (presentation.query === "presentation_exchange" && !hasPe) problems.push("presentation_exchange rail without presentation_definition");
  return problems;
}

async function checkInvitation(t: Target, mint: Mint): Promise<string[]> {
  const problems: string[] = [];
  const link = parseWalletLink(mint.url);
  if (!t.profile.didcomm?.invitationSchemes.includes(link.scheme)) problems.push(`scheme ${link.scheme} not registered by ${t.profile.id}`);
  if (hostOf(mint.url) !== t.service.host) problems.push(`link host ${hostOf(mint.url)} is not ${t.service.host}`);
  const invitation = await fetchOobInvitation(mint.url);
  const endpoints = invitation.services.map((s) => (typeof s === "string" ? s : s.serviceEndpoint));
  if (!endpoints.some((e) => e.startsWith("wss://") || e.startsWith("https://"))) problems.push(`no secure service endpoint in ${endpoints.join(", ")}`);
  if (!invitation["requests~attach"]?.length) problems.push("no attached request");
  return problems;
}

describeNetworks("offer and request links [CONF-T1-4]", (network) => {
  describe.skipIf(!mintsEnabled())("live mints (CONFORMANCE_MINTS=1)", () => {
    for (const t of targets(listCastServices(network))) {
      const base = { tier: "t1" as const, check: `link:${t.scenario.kind}`, clause: "CONF-T1-4", network: network.id, cast: t.service.cast, service: t.service.id, wallet: t.profile.id, build: t.build.kind, scenario: t.scenario.id };
      it.concurrent(`${t.profile.id}/${t.build.kind} ${t.scenario.id} on ${t.service.id}`, () =>
        check(base, async (): Promise<Verdict> => {
          const incompatible = incompatibilityFor(t.build, t.scenario.id, t.service.id);
          if (incompatible) return { outcome: "incompatible-by-design", cause: incompatible.cause, reference: incompatible.reference };
          const demoParams = effectiveDemoParams(t.profile, t.build, t.rail);
          const mint = t.scenario.kind === "issue"
            ? await mintIssuance(network, t.service, { format: t.rail, demoParams, credential: t.scenario.credential, params: t.scenario.params })
            : await mintPresentation(network, t.service, { format: t.rail, demoParams, login: t.scenario.login });
          const evidence = { url: mint.url, kind: mint.kind, rail: mint.rail, demoParams };
          if (mint.kind === "invitation")
            return { outcome: "unknown", cause: "the service answers with its plain invitation page; connection-level scenarios are proven by Tier 2", evidence };
          const problems = t.rail === "anoncreds" ? await checkInvitation(t, mint) : t.scenario.kind === "issue" ? await checkOffer(t, mint) : await checkRequest(t, mint);
          return { outcome: problems.length ? "broken" : "works", cause: problems.join(" | ") || undefined, evidence };
        }),
      );
    }
  });
});
