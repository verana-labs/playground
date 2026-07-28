import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Verana Playground — try the open trust layer, live";

export default function OpengraphImage() {
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
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>
          Verana Playground
        </div>
        <div style={{ marginTop: 24, fontSize: 40, opacity: 0.92 }}>
          Try the open trust layer. Live.
        </div>
      </div>
    ),
    size,
  );
}
