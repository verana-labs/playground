import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inScope, issuerMetadataUrls, listCastServices, scopedCasts } from "./cast-services";
import { listNetworks } from "./network";

const testnet = listNetworks().find((n) => n.id === "testnet-v3")!;

function fixture(dir: string): void {
  const cast = path.join(dir, "demo");
  for (const org of ["a", "b", "c", "d"]) fs.mkdirSync(path.join(cast, "orgs", org), { recursive: true });
  fs.mkdirSync(path.join(cast, "oid4vc"), { recursive: true });
  fs.writeFileSync(path.join(cast, "deployment.template.yaml"), "chartVersion: v1.0\nimage:\n  repository: veranalabs/vs-agent\n  tag: v1.0\n");
  fs.writeFileSync(path.join(cast, "orgs", "a", "config.env"), 'RELEASE_NAME="a"\nINGRESS_HOST="a.playground.__NETWORK__.verana.network"\nOID4VC_ROLE="issuer"\nDEMO_PERM="issuer"\nVS_AGENT_IMAGE_TAG="v0.9"\n');
  fs.writeFileSync(path.join(cast, "orgs", "b", "config.env"), 'RELEASE_NAME="b"\nINGRESS_HOST="b.playground.__NETWORK__.verana.network"\nOID4VC_ROLE="verifier"\n');
  fs.writeFileSync(path.join(cast, "orgs", "c", "config.env"), 'RELEASE_NAME="c"\nINGRESS_HOST="c.playground.__NETWORK__.verana.network"\nOID4VC_ROLE="issuer-c"\n');
  fs.writeFileSync(path.join(cast, "orgs", "d", "config.env"), 'RELEASE_NAME="d"\nINGRESS_HOST="d.playground.__NETWORK__.verana.network"\nOID4VC_ROLE="verifier-overasking"\n');
  fs.writeFileSync(path.join(cast, "oid4vc", "issuer.json.tpl"), '{\n  "issuer": {\n    "id": "demo-did",\n    "displayName": "__SERVICE_NAME__"\n  }\n}\n');
  fs.writeFileSync(path.join(cast, "oid4vc", "issuer-c.json.tpl"), '{\n  "issuer": {\n    "id": "c-did"\n  }\n}\n');
  fs.mkdirSync(path.join(dir, "wwwallet"), { recursive: true });
  fs.writeFileSync(path.join(dir, "wwwallet", "manifests.yaml"), "kind: Deployment\n");
}

describe("listCastServices", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "workflows-"));
    fixture(dir);
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    delete process.env.CONFORMANCE_CASTS;
  });

  it("derives one service per org with the network token substituted", () => {
    const services = listCastServices(testnet, dir);
    expect(services.map((s) => s.id)).toEqual(["a", "b", "c", "d"]);
    expect(services[0]?.host).toBe("a.playground.testnet.verana.network");
    expect(services[0]?.cast).toBe("demo");
  });

  it("lets a per-org tag override the template tag", () => {
    const [a, b] = listCastServices(testnet, dir);
    expect(a?.pinnedTag).toBe("v0.9");
    expect(b?.pinnedTag).toBe("v1.0");
  });

  it("reads roles, permissions and the issuer id of the org's own template", () => {
    const [a, b, c, d] = listCastServices(testnet, dir);
    expect(a?.oid4vcRole).toBe("issuer");
    expect(a?.demoPerm).toBe("issuer");
    expect(a?.issuerId).toBe("demo-did");
    expect(b?.oid4vcRole).toBe("verifier");
    expect(b?.demoPerm).toBeNull();
    expect(b?.issuerId).toBeNull();
    expect(c?.oid4vcRole).toBe("issuer");
    expect(c?.issuerId).toBe("c-did");
    expect(d?.oid4vcRole).toBe("verifier");
  });

  it("ignores directories without orgs", () => {
    expect(listCastServices(testnet, dir).every((s) => s.cast === "demo")).toBe(true);
  });

  it("builds the metadata urls, bare alias first", () => {
    const [a] = listCastServices(testnet, dir);
    expect(issuerMetadataUrls(a!)).toEqual([
      "https://a.playground.testnet.verana.network/.well-known/openid-credential-issuer",
      "https://a.playground.testnet.verana.network/oid4vci/demo-did/.well-known/openid-credential-issuer",
    ]);
  });

  it("scopes casts from the environment", () => {
    expect(scopedCasts()).toEqual(["demo", "eventos"]);
    process.env.CONFORMANCE_CASTS = "vesta, bhi";
    expect(scopedCasts()).toEqual(["vesta", "bhi"]);
    const [a] = listCastServices(testnet, dir);
    expect(inScope(a!)).toBe(false);
  });

  it("reads the real repository and finds the demo and eventos casts", () => {
    const services = listCastServices(testnet);
    const ids = services.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(["demo-issuer-accredited", "demo-verifier-accredited", "taquilla", "evento-costa-rica"]));
    expect(ids.length).toBeGreaterThanOrEqual(40);
    expect(services.find((s) => s.id === "taquilla")?.issuerId).not.toBeNull();
    expect(services.filter((s) => s.oid4vcRole === "verifier").length).toBeGreaterThanOrEqual(12);
  });
});
