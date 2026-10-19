import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username") || "developer";
    const score = searchParams.get("score") || "72";
    const grade = searchParams.get("grade") || "C";
    const archetype = searchParams.get("archetype") || "Legacy Tech Survivor";
    const headline = searchParams.get("headline") || "Still shipping ancient dependencies in 2026.";

    const truncatedHeadline = headline.length > 110 ? headline.slice(0, 107) + "..." : headline;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#050505",
            padding: "48px 56px",
            fontFamily: "monospace",
            border: "8px solid #ffffff",
          }}
        >
          {/* Top Bar */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "4px solid #222222",
              paddingBottom: "24px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  backgroundColor: "#00ff66",
                  color: "#000000",
                  fontWeight: 900,
                  fontSize: 24,
                  padding: "6px 14px",
                  marginRight: 16,
                }}
              >
                TECH FOMO
              </div>
              <div style={{ display: "flex", color: "#888888", fontSize: 22 }}>
                // DEV TECH AUDIT
              </div>
            </div>

            <div
              style={{
                display: "flex",
                backgroundColor: "#ff007f",
                color: "#ffffff",
                padding: "6px 16px",
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              GRADE: {grade}
            </div>
          </div>

          {/* Center Body */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                paddingRight: 40,
              }}
            >
              <div
                style={{
                  display: "flex",
                  color: "#ffffff",
                  fontSize: 36,
                  fontWeight: 900,
                  marginBottom: 8,
                }}
              >
                @{username}
              </div>
              <div
                style={{
                  display: "flex",
                  color: "#00ff66",
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 20,
                }}
              >
                [{archetype}]
              </div>
              <div
                style={{
                  display: "flex",
                  color: "#cccccc",
                  fontSize: 24,
                  lineHeight: 1.4,
                }}
              >
                {`"${truncatedHeadline}"`}
              </div>
            </div>

            {/* Score Box */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#111111",
                border: "4px solid #00ff66",
                padding: "24px 36px",
                minWidth: 220,
              }}
            >
              <div
                style={{
                  display: "flex",
                  color: "#888888",
                  fontSize: 16,
                  marginBottom: 4,
                }}
              >
                FOMO SCORE
              </div>
              <div
                style={{
                  display: "flex",
                  color: "#ffffff",
                  fontSize: 72,
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {score}
              </div>
              <div
                style={{
                  display: "flex",
                  color: "#ff007f",
                  fontSize: 18,
                  fontWeight: 700,
                  marginTop: 8,
                }}
              >
                / 100
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "4px solid #222222",
              paddingTop: 20,
              color: "#666666",
              fontSize: 18,
            }}
          >
            <div style={{ display: "flex" }}>
              fomotech.dev • Find out how outdated your stack really is
            </div>
            <div style={{ display: "flex", color: "#00ff66" }}>
              2026 BENCHMARK ENGINE
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate OG image: ${e.message}`, { status: 500 });
  }
}
