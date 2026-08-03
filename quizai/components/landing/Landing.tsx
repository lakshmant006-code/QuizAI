import Link from "next/link";

/* Brand-colored gradient mesh — replaces the reference's stock artwork. */
function Mesh({ height = 460 }: { height?: number }) {
  return (
    <div
      className="ql-mesh"
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: 24,
        overflow: "hidden",
        background: "#2A1017",
      }}
    >
      <span className="ql-blob ql-b1" />
      <span className="ql-blob ql-b2" />
      <span className="ql-blob ql-b3" />
      <span className="ql-blob ql-b4" />
      <span style={{ position: "absolute", inset: 0, backdropFilter: "blur(28px)" }} />
    </div>
  );
}

function Brand({ size = 22 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: size, letterSpacing: "-0.02em", color: "var(--asu-maroon)" }}>
      <span aria-hidden style={{ width: size * 1.45, height: size * 1.45, borderRadius: 9, background: "var(--asu-maroon)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.8 }}>
        <i className="fa-solid fa-brain" />
      </span>
      QuizAI
    </span>
  );
}

const btn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16,
  padding: "13px 26px", borderRadius: 14, background: "var(--asu-maroon)", color: "#fff",
  boxShadow: "0 8px 22px rgba(140,29,64,0.28)",
};
const btnGhost: React.CSSProperties = {
  ...btn, background: "#fff", color: "var(--gray-1)", border: "1px solid var(--gray-5)", boxShadow: "none",
};

const STEPS = [
  { n: "01", title: "Upload your material", body: "Drop in a PDF of your notes, readings, or slides. QuizAI reads it carefully — offline, no credits — and pulls out the concepts that matter." },
  { n: "02", title: "Generate quizzes & summaries", body: "Get multiple-choice, select-all, yes/no, fill-in-the-blank, and flashcards in one balanced set, plus a concise summary with key terms." },
  { n: "03", title: "Track & improve", body: "Take quizzes, watch your scores and streaks in the dashboard, and thumbs-up the styles you like so future quizzes adapt to you." },
];

const FEATURES = [
  { icon: "fa-solid fa-circle-question", title: "Ten quiz styles", body: "Fill-in-the-blank, direct questions, select-all, yes/no, match, ordering, flashcards, and more — a real mix every time." },
  { icon: "fa-regular fa-file-lines", title: "Smart summaries", body: "Every document becomes a tight TL;DR with key points and defined terms — grounded only in your source." },
  { icon: "fa-solid fa-chart-simple", title: "Progress that adapts", body: "Accuracy, streaks, and per-style ratings tune what you get next. The more you use it, the better it fits." },
];

export default function Landing() {
  return (
    <div className="ql" style={{ background: "var(--white)", minHeight: "100vh", fontFamily: "var(--font-display), var(--font-sans)", color: "var(--gray-1)" }}>
      {/* Nav */}
      <nav className="ql-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", position: "sticky", top: 0, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--gray-6)", zIndex: 20 }}>
        <Brand />
        <div className="ql-nav-links" style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <a href="#how" style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 15, color: "var(--gray-2)" }}>How it works</a>
          <a href="#features" style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 15, color: "var(--gray-2)" }}>Features</a>
          <Link href="/login" style={{ ...btn, padding: "9px 18px", fontSize: 14 }}>Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="ql-hero" style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 40px 40px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
        <div>
          <span style={{ display: "inline-block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--asu-maroon)", background: "var(--surface-gold-tint)", border: "1px solid var(--border-gold-tint)", padding: "6px 14px", borderRadius: 999, marginBottom: 22 }}>
            Study companion
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 54, lineHeight: 1.08, letterSpacing: "-0.03em", margin: "0 0 18px", color: "var(--gray-1)" }}>
            Read it once.<br />Remember it properly.
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.6, color: "var(--gray-2)", margin: "0 0 30px", maxWidth: 520 }}>
            Turn any PDF into quizzes, flashcards, and summaries — instantly and free. QuizAI builds a balanced set of questions from your own material and tracks what actually sticks.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/login" style={btn}>Get started for free</Link>
            <a href="#how" style={btnGhost}>See how it works</a>
          </div>
        </div>
        <Mesh height={420} />
      </header>

      {/* How it works — reference layout: mesh left, numbered steps right */}
      <section id="how" style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 40px" }}>
        <div className="ql-how" style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 56, alignItems: "center" }}>
          <Mesh height={520} />
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, letterSpacing: "-0.02em", margin: "0 0 8px" }}>How it works</h2>
            <p style={{ fontSize: 17, color: "var(--gray-2)", margin: "0 0 34px" }}>From a PDF to a study session in three steps — no credits, no waiting.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
              {STEPS.map((s) => (
                <div key={s.n} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 18 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "var(--gray-4)", marginTop: 6 }}>{s.n}</span>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, letterSpacing: "-0.01em", margin: "0 0 6px", color: "var(--gray-1)" }}>{s.title}</h3>
                    <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--gray-2)", margin: 0 }}>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 34 }}>
              <Link href="/login" style={btn}>Get started for free</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 40px 90px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 8px" }}>Built around how memory works</h2>
        <p style={{ fontSize: 17, color: "var(--gray-2)", textAlign: "center", margin: "0 0 44px" }}>Encode, test, reinforce — one loop.</p>
        <div className="ql-feat" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ background: "var(--surface-panel)", border: "1px solid var(--gray-6)", borderRadius: 18, padding: 28 }}>
              <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--surface-maroon-tint)", color: "var(--asu-maroon)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                <i className={f.icon} />
              </span>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, letterSpacing: "-0.01em", margin: "16px 0 8px" }}>{f.title}</h3>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--gray-2)", margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ maxWidth: 1180, margin: "0 auto 80px", padding: "0 40px" }}>
        <div className="ql-cta" style={{ position: "relative", borderRadius: 28, overflow: "hidden", padding: "64px 48px", textAlign: "center", background: "#2A1017" }}>
          <span className="ql-blob ql-b1" />
          <span className="ql-blob ql-b3" />
          <span style={{ position: "absolute", inset: 0, backdropFilter: "blur(40px)", background: "rgba(20,8,12,0.35)" }} />
          <div style={{ position: "relative" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 38, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 12px" }}>Ready when your brain is</h2>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.82)", margin: "0 0 28px" }}>Turn today&apos;s reading into tomorrow&apos;s recall.</p>
            <Link href="/login" style={{ ...btn, background: "#fff", color: "var(--asu-maroon)", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>Get started for free</Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--gray-6)", padding: "28px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, maxWidth: 1180, margin: "0 auto" }}>
        <Brand size={17} />
        <span style={{ fontSize: 14, color: "var(--text-muted)" }}>QuizAI — study smarter, remember longer.</span>
      </footer>

      <style>{`
        .ql-blob{ position:absolute; border-radius:50%; filter:blur(2px); opacity:0.95; }
        .ql-b1{ width:60%; height:60%; left:-8%; top:-10%; background:radial-gradient(circle at 30% 30%, #8C1D40, transparent 70%); }
        .ql-b2{ width:55%; height:55%; right:-6%; top:8%; background:radial-gradient(circle at 60% 40%, #FFC627, transparent 70%); }
        .ql-b3{ width:70%; height:70%; left:6%; bottom:-18%; background:radial-gradient(circle at 50% 50%, #E74973, transparent 70%); }
        .ql-b4{ width:50%; height:50%; right:-4%; bottom:-6%; background:radial-gradient(circle at 40% 60%, #6E1733, transparent 70%); }
        .ql-mesh .ql-blob, .ql-cta .ql-blob{ animation: ql-drift 14s ease-in-out infinite alternate; }
        .ql-b2{ animation-delay:-4s !important; } .ql-b3{ animation-delay:-7s !important; } .ql-b4{ animation-delay:-2s !important; }
        @keyframes ql-drift{ from{ transform:translate(0,0) scale(1); } to{ transform:translate(6%,4%) scale(1.12); } }
        @media (prefers-reduced-motion: reduce){ .ql-blob{ animation:none !important; } }

        @media (max-width: 900px){
          .ql-nav{ padding:14px 20px !important; }
          .ql-nav-links a[href="#how"], .ql-nav-links a[href="#features"]{ display:none; }
          .ql-hero, .ql-how{ grid-template-columns:1fr !important; gap:32px !important; }
          .ql-hero{ padding:48px 20px 24px !important; }
          .ql-hero h1{ font-size:40px !important; }
          .ql-how img, .ql-how .ql-mesh{ order:-1; }
          .ql-feat{ grid-template-columns:1fr !important; }
          section{ padding-left:20px !important; padding-right:20px !important; }
        }
        @media (max-width: 480px){
          .ql-hero h1{ font-size:33px !important; }
        }
      `}</style>
    </div>
  );
}
