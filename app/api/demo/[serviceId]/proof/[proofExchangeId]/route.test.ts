import { afterEach, describe, expect, it, vi } from "vitest";

const adminJson = vi.fn();

vi.mock("@/app/lib/demo-services", () => ({
  getDemoService: () => ({ role: "verifier", host: "demo-verifier-accredited.example.network" }),
}));
vi.mock("@/app/lib/demo-admin", () => ({
  CAST_DOMAIN: ".example.network",
  adminBase: () => "http://admin",
  adminJson: (url: string) => adminJson(url),
}));
vi.mock("@/app/lib/network", () => ({ PROTOCOL: "v4" }));

const { GET } = await import("./route");

const status = async (rail?: string) => {
  const res = await GET(new Request(`http://x/api/demo/v/proof/p${rail ? `?rail=${rail}` : ""}`), {
    params: Promise.resolve({ serviceId: "demo-verifier-accredited", proofExchangeId: "p" }),
  });
  return res.json();
};

afterEach(() => adminJson.mockReset());

describe("proof status route", () => {
  it("reports an abandoned DIDComm presentation as declined, with the agent's reason", async () => {
    adminJson.mockResolvedValue({ state: "abandoned", verified: false, claims: [], errorMessage: "request declined" });

    expect(await status()).toMatchObject({ state: "abandoned", declined: true, reason: "request declined" });
  });

  it("does not report a presentation still in flight as declined", async () => {
    adminJson.mockResolvedValue({ state: "request-sent", verified: false, claims: [] });

    expect(await status()).toMatchObject({ state: "request-sent", declined: false });
  });

  it("reports a failed OID4VP session as declined", async () => {
    adminJson.mockResolvedValue({ state: "Error" });

    expect(await status("oid4vc")).toMatchObject({ state: "Error", declined: true });
  });
});
