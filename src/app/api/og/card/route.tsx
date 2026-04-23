import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

const TYPE_ACCENT: Record<string, string> = {
  VIDEO: "#e85d04",
  PODCAST: "#7c3aed",
  PROMPT: "#059669",
  PROMPT_FOLDER: "#7c3aed",
  ARTICLE: "#4E2D82",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") ?? "Untitled";
  const source = searchParams.get("source") ?? "";
  const category = searchParams.get("category") ?? "";
  const type = searchParams.get("type") ?? "ARTICLE";

  const accent = TYPE_ACCENT[type] ?? TYPE_ACCENT.ARTICLE;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#0d0520",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle diagonal stripe pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            background:
              "repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 28px)",
            display: "flex",
          }}
        />

        {/* Left accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 8,
            backgroundColor: accent,
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 72px 56px 88px",
            width: "100%",
          }}
        >
          {/* Top: category pill */}
          {category ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  backgroundColor: `${accent}22`,
                  border: `1px solid ${accent}55`,
                  borderRadius: 999,
                  padding: "8px 20px",
                  fontSize: 22,
                  color: accent,
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                }}
              >
                {category}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}

          {/* Middle: title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            <div
              style={{
                fontSize: title.length > 60 ? 52 : title.length > 40 ? 60 : 68,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                maxWidth: 960,
              }}
            >
              {title}
            </div>
          </div>

          {/* Bottom: source + wordmark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {source ? (
              <div
                style={{
                  fontSize: 26,
                  color: "rgba(255,255,255,0.45)",
                  letterSpacing: "0.01em",
                }}
              >
                {source}
              </div>
            ) : (
              <div style={{ display: "flex" }} />
            )}

            {/* The Signal wordmark */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
              >
                <path
                  d="M6 16h3l2-3 2 4 2-8 2 10 2-6 2 3h5"
                  stroke="rgba(255,255,255,0.35)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "-0.01em",
                }}
              >
                The Signal
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
