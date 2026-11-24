import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => vi.unstubAllGlobals());

const call = (serviceId: string, query = "format=anoncreds") =>
  GET(new Request(`https://playground.test/api/demo/${serviceId}?${query}`), {
    params: Promise.resolve({ serviceId }),
  }).then((res) => res.json());

const answering = (body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status: 201 }));

describe("connection invitation of a cast service", () => {
  it("asks the vs-agent admin API for an invitation instead of the dead /invitation link", async () => {
    const shortUrl = "https://demo-untrusted.playground.testnet.verana.network/s?id=1a2b";
    const fetch = answering({ id: "inv-1", invitation: {}, shortUrl });
    vi.stubGlobal("fetch", fetch);

    expect(await call("demo-untrusted")).toEqual({ kind: "invitation", url: shortUrl });
    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://demo-untrusted:3000/v2/didcomm/invitations");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ didcommVersion: "v1" });
  });

  it("does the same for Umbra outside the badge demo", async () => {
    const shortUrl = "https://umbra.playground.testnet.verana.network/s?id=9z";
    vi.stubGlobal("fetch", answering({ shortUrl }));

    expect(await call("umbra")).toEqual({ kind: "invitation", url: shortUrl });
  });

  it("gives no link when the admin API is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 502 })));

    expect(await call("demo-untrusted")).toEqual({ kind: "invitation", url: null, fallback: true });
  });

  it("leaves an anchor a wallet never connects to without a link", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    expect(await call("playground-demo")).toEqual({ kind: "invitation", url: null });
    expect(fetch).not.toHaveBeenCalled();
  });
});
