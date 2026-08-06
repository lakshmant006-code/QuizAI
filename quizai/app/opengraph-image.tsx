import { ImageResponse } from "next/og";

export const alt =
  "QuizAI — turn any PDF into quizzes, flashcards & summaries. Free, offline, in seconds.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Load Poppins from Google Fonts at generation time. Wrapped so a network
// hiccup at build never breaks the deploy — it just falls back to the default.
async function loadFont(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Poppins:wght@${weight}`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\((.+?)\)\s*format/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image() {
  const [regular, semibold, bold] = await Promise.all([
    loadFont(400),
    loadFont(600),
    loadFont(700),
  ]);

  const fonts = [
    regular && { name: "Poppins", data: regular, weight: 400 as const, style: "normal" as const },
    semibold && { name: "Poppins", data: semibold, weight: 600 as const, style: "normal" as const },
    bold && { name: "Poppins", data: bold, weight: 700 as const, style: "normal" as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: "normal" }[];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          fontFamily: "Poppins, sans-serif",
          background: "linear-gradient(135deg, #8C1D40 0%, #2A1017 62%)",
          position: "relative",
        }}
      >
        {/* Soft brand accent orbs */}
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: 9999,
            background: "#FFC627",
            opacity: 0.22,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: -100,
            width: 460,
            height: 460,
            borderRadius: 9999,
            background: "#E74973",
            opacity: 0.28,
            display: "flex",
          }}
        />

        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 20,
              background: "#ffffff",
              color: "#8C1D40",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 46,
              fontWeight: 700,
            }}
          >
            Q
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
            QuizAI
          </div>
        </div>

        {/* Headline + subhead */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 82,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              maxWidth: 1000,
            }}
          >
            Turn any PDF into a quiz that makes it stick.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 34,
              fontWeight: 400,
              color: "rgba(255,255,255,0.85)",
              maxWidth: 940,
            }}
          >
            Quizzes, flashcards &amp; summaries from your own notes — free, offline, in seconds.
          </div>
        </div>

        {/* Footer row: proof pills + URL */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {["Free", "Offline", "Private"].map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  padding: "10px 22px",
                  borderRadius: 9999,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#ffffff",
                  fontSize: 26,
                  fontWeight: 600,
                }}
              >
                {t}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 600, color: "#FFC627" }}>
            quizai.help
          </div>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) },
  );
}
