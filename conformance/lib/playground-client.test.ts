import { afterEach, describe, expect, it, vi } from "vitest";
import { listNetworks } from "./network";
import { issuanceState, mintIssuance, mintPresentation, presentationState } from "./playground-client";
import type { CastService } from "./cast-services";

const testnet = listNetworks().find((n) => n.id === "testnet-v3")!;
const issuer: CastService = { cast: "demo", org: "x", id: "demo-issuer-accredited", host: "h", pinnedTag: "t", oid4vcRole: "issuer", demoPerm: "issuer", issuerId: "demo-did", configPath: "p" };
const verifier: CastService = { ...issuer, id: "evento-costa-rica", oid4vcRole: "verifier", issuerId: null };
const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status });

describe("playground client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("mints an oid4vc offer with the wallet parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ kind: "oid4vc-credential-offer", url: "openid-credential-offer://?credential_offer_uri=x", issuanceSessionId: "s1" }));
    vi.stubGlobal("fetch", fetchMock);
    const mint = await mintIssuance(testnet, issuer, { format: "openid4vc-sdjwt", demoParams: "signer=x5c", credential: "eventos-asistente", params: { evento: "costa-rica", nombre: "Conformance" } });
    expect(mint).toEqual({ rail: "oid4vc", kind: "oid4vc-credential-offer", url: "openid-credential-offer://?credential_offer_uri=x", id: "s1" });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://playground.testnet.verana.network/api/demo/demo-issuer-accredited?format=openid4vc-sdjwt&credential=eventos-asistente&evento=costa-rica&nombre=Conformance&signer=x5c",
    );
  });

  it("keeps a plain invitation as a didcomm mint without id", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ kind: "invitation", url: "https://h/invitation" })));
    const mint = await mintIssuance(testnet, issuer, { format: "anoncreds", demoParams: "" });
    expect(mint).toEqual({ rail: "didcomm", kind: "invitation", url: "https://h/invitation", id: null });
  });

  it("refuses a degraded mint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ kind: "invitation", url: "https://h/invitation", fallback: true })));
    await expect(mintIssuance(testnet, issuer, { format: "anoncreds", demoParams: "" })).rejects.toThrow(/degraded/);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ kind: "unsupported", format: "oid4vc" })));
    await expect(mintIssuance(testnet, issuer, { format: "openid4vc-sdjwt", demoParams: "" })).rejects.toThrow(/degraded/);
  });

  it("mints a direct presentation request for the named credential", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ kind: "oid4vc-presentation-request", url: "openid4vp://?request_uri=x", verificationSessionId: "v2" }));
    vi.stubGlobal("fetch", fetchMock);
    const mint = await mintPresentation(testnet, verifier, { format: "openid4vc-sdjwt", demoParams: "", credential: "bhi-right-to-work" });
    expect(mint).toEqual({ rail: "oid4vc", kind: "oid4vc-presentation-request", url: "openid4vp://?request_uri=x", id: "v2" });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://playground.testnet.verana.network/api/demo/evento-costa-rica?format=openid4vc-sdjwt&credential=bhi-right-to-work",
    );
  });

  it("mints an event login through eventos-login", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ rail: "oid4vc", url: "openid4vp://?x", id: "v1" }));
    vi.stubGlobal("fetch", fetchMock);
    const mint = await mintPresentation(testnet, verifier, { format: "openid4vc-sdjwt", demoParams: "signer=x5c", login: { evento: "costa-rica", rol: "asistente" } });
    expect(mint).toEqual({ rail: "oid4vc", kind: "eventos-login", url: "openid4vp://?x", id: "v1" });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://playground.testnet.verana.network/api/eventos-login?evento=costa-rica&rol=asistente&format=openid4vc-sdjwt&signer=x5c");
  });

  it("reads exchange state on the mint's own rail", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ state: "OfferCreated", done: false, declined: false }))
      .mockResolvedValueOnce(json({ state: "done", verified: true, claims: {} }))
      .mockResolvedValueOnce(json({ done: true, verified: true, claims: {}, decision: "acceso" }));
    vi.stubGlobal("fetch", fetchMock);
    const issuance = await issuanceState(testnet, issuer, { rail: "oid4vc", kind: "k", url: "u", id: "s1" });
    expect(issuance).toEqual({ state: "OfferCreated", done: false, declined: false });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://playground.testnet.verana.network/api/demo/demo-issuer-accredited/credential/s1?rail=oid4vc");
    const proof = await presentationState(testnet, verifier, { rail: "oid4vc", kind: "k", url: "u", id: "p1" });
    expect(proof.done).toBe(true);
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe("https://playground.testnet.verana.network/api/demo/evento-costa-rica/proof/p1?rail=oid4vc");
    const login = await presentationState(testnet, verifier, { rail: "oid4vc", kind: "eventos-login", url: "u", id: "p1" }, { evento: "costa-rica", rol: "asistente" });
    expect(login.decision).toBe("acceso");
    expect(String(fetchMock.mock.calls[2]?.[0])).toBe("https://playground.testnet.verana.network/api/eventos-login/p1?rail=oid4vc&evento=costa-rica&rol=asistente");
  });
});
