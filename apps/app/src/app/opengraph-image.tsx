import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "GetEmployed: Get employed. Skip the legwork.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori needs literal colours; these are the theme's canvas, ink, ink-subtle and selection tokens.
const canvas = "#07090c";
const ink = "#e4e7ea";
const subtle = "#8b9199";
const selection = "rgba(123,155,219,0.35)";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: canvas,
        color: ink,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 96,
        fontSize: 96,
        fontWeight: 600,
        letterSpacing: -4,
      }}
    >
      <div style={{ display: "flex" }}>
        Get&nbsp;<span style={{ background: selection, padding: "0 8px" }}>employed</span>.
      </div>
      <div>Skip the legwork.</div>
      <div
        style={{ marginTop: 40, fontSize: 32, fontWeight: 400, letterSpacing: 0, color: subtle }}
      >
        Search in plain English. A tailored resume and outreach email for every match.
      </div>
    </div>,
    size,
  );
}
