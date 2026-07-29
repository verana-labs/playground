import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Verana Playground — try the open trust layer, live";

async function interFonts() {
  try {
    const dir = join(process.cwd(), "app", "fonts");
    const [regular, bold] = await Promise.all([
      readFile(join(dir, "inter-latin-400-normal.woff")),
      readFile(join(dir, "inter-latin-700-normal.woff")),
    ]);
    return [
      { name: "Inter", data: regular, style: "normal" as const, weight: 400 as const },
      { name: "Inter", data: bold, style: "normal" as const, weight: 700 as const },
    ];
  } catch {
    return undefined;
  }
}

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #764ba2, #667eea)",
          color: "#ffffff",
          fontFamily: "Inter",
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>
          Verana Playground
        </div>
        <div style={{ marginTop: 24, fontSize: 40, fontWeight: 400, opacity: 0.92 }}>
          Try the open trust layer. Live.
        </div>
      </div>
    ),
    { ...size, fonts: await interFonts() },
  );
}
