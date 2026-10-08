import { describe, expect, it } from "vitest";
import { buildsHint, walletLinks } from "./wallet-links";

const PLAY = "https://play.google.com/store/apps/details?id=org.example";
const IOS = "https://apps.apple.com/app/example/id1";
const APK = "https://example.org/app.apk";
const HOSTED = "https://wallet.example.org";

describe("walletLinks", () => {
  it("reads a plain url as a build with the trust screen", () => {
    expect(walletLinks({ download: APK })).toEqual([
      { kind: "download", url: APK, trust_screen: true },
    ]);
  });

  it("reads the trust screen of each link on its own", () => {
    expect(
      walletLinks({
        download: APK,
        playstore: { url: PLAY, trust_screen: false },
        appstore: { url: IOS },
      }).map((l) => [l.kind, l.trust_screen]),
    ).toEqual([
      ["download", true],
      ["playstore", false],
      ["appstore", true],
    ]);
  });

  it("folds a download that is also a store link into the store build", () => {
    expect(
      walletLinks({ download: PLAY, playstore: PLAY }).map((l) => l.kind),
    ).toEqual(["playstore"]);
  });

  it("lists the hosted build of a browser wallet, not its source download", () => {
    expect(
      walletLinks({ browser: true, hosted: HOSTED, download: "https://github.com/example/wallet" }),
    ).toEqual([{ kind: "hosted", url: HOSTED, trust_screen: true }]);
  });

  it("allows a wallet with store builds only", () => {
    expect(walletLinks({ playstore: PLAY, appstore: IOS }).map((l) => l.kind)).toEqual(["playstore", "appstore"]);
  });
});

describe("buildsHint", () => {
  it("names the Verana builds", () => {
    expect(buildsHint(walletLinks({ download: APK }))).toEqual({ builds: "Verana APK", caveat: null });
    expect(buildsHint(walletLinks({ playstore: PLAY, appstore: IOS })).builds).toBe("Stores");
  });

  it("says when no build has the trust screen", () => {
    const links = walletLinks({ playstore: { url: PLAY, trust_screen: false }, appstore: { url: IOS, trust_screen: false } });
    expect(buildsHint(links)).toEqual({ builds: "Stores", caveat: "No Verana trust screen" });
    expect(buildsHint(links, "es")).toEqual({ builds: "Tiendas", caveat: "Sin pantalla de confianza Verana" });
  });

  it("adds the store builds without the trust screen to a Verana build", () => {
    const links = walletLinks({ download: APK, playstore: { url: PLAY, trust_screen: false } });
    expect(buildsHint(links)).toEqual({ builds: "Verana APK", caveat: "Stores without trust screen" });
  });
});
