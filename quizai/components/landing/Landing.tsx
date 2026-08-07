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
        <i className="ph ph-brain" />
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

/* Value-prop strip — the four objections we kill on sight. */
const BENEFITS = [
  { icon: "ph ph-lightning", title: "Free, forever", body: "No paywall, no credits, no trial clock. Upload as much as you want." },
  { icon: "ph ph-wifi-high", title: "Works offline", body: "Quizzes are built on-device — no tokens, no waiting on an API." },
  { icon: "ph ph-lock", title: "Your files stay yours", body: "Your PDFs aren’t sold, shared, or used to train anything." },
  { icon: "ph ph-magic-wand", title: "Learns what you miss", body: "Rate the styles you like and every future quiz adapts to you." },
];

const STEPS = [
  { n: "01", title: "Drop in your PDF", body: "Notes, slides, a textbook chapter — anything. QuizAI reads it in seconds and pulls out the concepts that actually get tested." },
  { n: "02", title: "Get a full study set", body: "Multiple-choice, select-all, yes/no, fill-in-the-blank, matching, and flashcards — plus a clean summary with key terms. One click, balanced mix." },
  { n: "03", title: "Practice until it sticks", body: "Take the quiz, see your score and streak, and thumbs-up what works. QuizAI keeps sharpening the questions around your weak spots." },
];

const FEATURES = [
  { icon: "ph ph-question", title: "Ten ways to be tested", body: "Real variety — fill-in-the-blank, direct questions, select-all, yes/no, matching, ordering, related-concept, and flashcards. Re-run it and get fresh questions every time." },
  { icon: "ph ph-file-text", title: "Summaries without the fluff", body: "Every upload becomes a tight TL;DR with the key points and defined terms — grounded only in your source, never made up." },
  { icon: "ph ph-chart-bar", title: "Progress you can feel", body: "Accuracy, streaks, and per-style ratings shape what comes next. The more you study, the better it fits how you learn." },
];

const FAQS = [
  { q: "Is QuizAI actually free?", a: "Yes. The offline quiz engine is completely free — no credit card, no credits, no trial timer. Upload as many PDFs as you like and generate unlimited quizzes and summaries." },
  { q: "Do I need internet or API credits?", a: "No. QuizAI’s offline mode builds your quizzes on-device without using any AI credits. If you ever want the AI-written mode, it’s there too — but you never have to touch it to get great quizzes." },
  { q: "What can I upload?", a: "Any PDF — lecture slides, class notes, readings, textbook chapters, or study guides. QuizAI reads the text, cleans it up, and focuses on the concepts worth testing." },
  { q: "Are my documents private?", a: "Completely. Your files belong to you. We don’t sell them, share them, or use them to train models." },
  { q: "What kinds of questions does it make?", a: "Fill-in-the-blank, multiple choice, select-all, yes/no, matching, ordering, related-concept, short answer, and flashcards — delivered as one balanced set so you’re tested from every angle." },
  { q: "Will it help me before an exam?", a: "That’s exactly what it’s built for. Turn a chapter into a practice test in seconds, drill your weak spots, and track your recall as the exam gets closer." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "QuizAI",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description:
        "QuizAI turns any PDF into quizzes, flashcards, and summaries — instantly, privately, and free. Study smarter and remember more.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function Landing() {
  return (
    <div className="ql" style={{ background: "var(--white)", minHeight: "100vh", fontFamily: "var(--font-display), var(--font-sans)", color: "var(--gray-1)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="ql-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", position: "sticky", top: 0, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--gray-6)", zIndex: 20 }}>
        <Brand />
        <div className="ql-nav-links" style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <a href="#how" style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 15, color: "var(--gray-2)" }}>How it works</a>
          <a href="#features" style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 15, color: "var(--gray-2)" }}>Features</a>
          <a href="#faq" style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 15, color: "var(--gray-2)" }}>FAQ</a>
          <Link href="/login" style={{ ...btn, padding: "9px 18px", fontSize: 14 }}>Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="ql-hero" style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 40px 40px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 54, lineHeight: 1.08, letterSpacing: "-0.03em", margin: "0 0 18px", color: "var(--gray-1)" }}>
            Turn any PDF into a quiz that makes it stick.
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.6, color: "var(--gray-2)", margin: "0 0 26px", maxWidth: 520 }}>
            Stop re-reading and hoping. Upload your notes, slides, or readings and get quizzes, flashcards, and a summary in seconds — built from your own material and tuned to what you keep getting wrong.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/login" style={btn}>Start studying free</Link>
            <a href="#how" style={btnGhost}>See how it works</a>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "16px 0 0", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ph ph-check" style={{ color: "var(--asu-maroon)" }} />
            No credit card. No credits. Just upload and go.
          </p>
        </div>
        <Mesh height={420} />
      </header>

      {/* Value-prop strip */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "12px 40px 24px" }}>
        <div className="ql-benefits" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          {BENEFITS.map((b) => (
            <div key={b.title} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: "var(--surface-maroon-tint)", color: "var(--asu-maroon)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
                <i className={b.icon} />
              </span>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16.5, letterSpacing: "-0.01em", margin: "4px 0 0" }}>{b.title}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--gray-2)", margin: 0 }}>{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — reference layout: mesh left, numbered steps right */}
      <section id="how" style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 40px" }}>
        <div className="ql-how" style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 56, alignItems: "center" }}>
          <Mesh height={520} />
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, letterSpacing: "-0.02em", margin: "0 0 8px" }}>From PDF to practice test in 10 seconds</h2>
            <p style={{ fontSize: 17, color: "var(--gray-2)", margin: "0 0 34px" }}>Three steps. No credits. No setup. No waiting.</p>
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
              <Link href="/login" style={btn}>Start studying free</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 40px 80px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 8px" }}>Built around how memory actually works</h2>
        <p style={{ fontSize: 17, color: "var(--gray-2)", textAlign: "center", margin: "0 0 44px" }}>Encode it, test it, reinforce it — the one loop that beats re-reading.</p>
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

      {/* FAQ — objection handling + SEO rich results */}
      <section id="faq" style={{ maxWidth: 820, margin: "0 auto", padding: "8px 40px 80px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 8px" }}>Questions, answered</h2>
        <p style={{ fontSize: 17, color: "var(--gray-2)", textAlign: "center", margin: "0 0 40px" }}>Everything you might be wondering before you start.</p>
        <div className="ql-faq" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQS.map((f) => (
            <details key={f.q} style={{ background: "var(--surface-panel)", border: "1px solid var(--gray-6)", borderRadius: 14, padding: "18px 22px" }}>
              <summary style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, color: "var(--gray-1)", cursor: "pointer", listStyle: "none" }}>
                {f.q}
              </summary>
              <p style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--gray-2)", margin: "12px 0 0" }}>{f.a}</p>
            </details>
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
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 38, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 12px" }}>Your next exam starts here</h2>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.82)", margin: "0 0 28px" }}>Turn today’s reading into tomorrow’s recall — free, in seconds.</p>
            <Link href="/login" style={{ ...btn, background: "#fff", color: "var(--asu-maroon)", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>Start studying free</Link>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.65)", margin: "14px 0 0" }}>No credit card required · Works offline · Private by default</p>
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

        .ql-faq summary::-webkit-details-marker{ display:none; }
        .ql-faq summary{ position:relative; padding-right:28px; }
        .ql-faq summary::after{ content:"+"; position:absolute; right:0; top:-2px; font-size:22px; font-weight:400; color:var(--asu-maroon); line-height:1; }
        .ql-faq details[open] summary::after{ content:"–"; }

        @media (max-width: 900px){
          .ql-nav{ padding:14px 20px !important; }
          .ql-nav-links a[href="#how"], .ql-nav-links a[href="#features"], .ql-nav-links a[href="#faq"]{ display:none; }
          .ql-hero, .ql-how{ grid-template-columns:1fr !important; gap:32px !important; }
          .ql-hero{ padding:48px 20px 24px !important; }
          .ql-hero h1{ font-size:40px !important; }
          .ql-how img, .ql-how .ql-mesh{ order:-1; }
          .ql-feat{ grid-template-columns:1fr !important; }
          .ql-benefits{ grid-template-columns:repeat(2, 1fr) !important; gap:24px 18px !important; }
          section{ padding-left:20px !important; padding-right:20px !important; }
        }
        @media (max-width: 480px){
          .ql-hero h1{ font-size:33px !important; }
          .ql-benefits{ grid-template-columns:1fr !important; }
        }
      `}</style>
    </div>
  );
}
