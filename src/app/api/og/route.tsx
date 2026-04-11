import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
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
          backgroundColor: "#4E2D82",
          position: "relative",
        }}
      >
        {/* Background pattern — subtle diagonal lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.08,
            display: "flex",
            background:
              "repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 20px)",
          }}
        />

        {/* Signal wave icon */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 32 32"
          fill="none"
          style={{ marginBottom: 24 }}
        >
          <circle cx="16" cy="16" r="16" fill="rgba(255,255,255,0.15)" />
          <path
            d="M6 16h3l2-3 2 4 2-8 2 10 2-6 2 3h5"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          The Signal
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(255, 255, 255, 0.75)",
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Curated articles, videos, and prompts worth your time
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "rgba(255,255,255,0.2)",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
