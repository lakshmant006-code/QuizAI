import Link from "next/link";
import { LandingCanvasTabs } from "./LandingCanvasTabs";

/* JSON-LD for search engines (kept from the previous landing). */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "QuizAI",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  description:
    "QuizAI turns any PDF into quizzes, flashcards, and summaries — instantly, privately, and free. Study smarter and remember more.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const SERIF = "var(--font-serif), Georgia, serif";

// Light maroon for the primary CTA buttons.
const BTN_MAROON = "#A83D5B";

const FEATURES = [
  { icon: "ph-file-arrow-up", title: "Upload anything", body: "PDFs, slide decks, lecture notes, or pasted text. QuizAI reads the material and finds what is testable." },
  { icon: "ph-quotes", title: "Questions that cite the source", body: "Each question points back to the page it came from, so you can check an answer against your own notes." },
  { icon: "ph-cards-three", title: "Flashcards without the busywork", body: "Terms and definitions are pulled out automatically and spaced across the days before your exam." },
  { icon: "ph-chart-bar", title: "Progress you can act on", body: "Scores break down by topic, so you can see which sections still need another pass." },
];

const MOBILE_POINTS = [
  { icon: "ph-lightning", text: "A quiz from your last upload in seconds" },
  { icon: "ph-cards-three", text: "Flashcards pulled straight from your notes" },
  { icon: "ph-check-circle", text: "Every answer cites the source page" },
  { icon: "ph-chart-bar", text: "Scores broken down by topic" },
];

export default function Landing() {
  return (
    <div className="qai" style={{ fontFamily: "var(--font-figtree), Arial, Helvetica, sans-serif", color: "var(--gray-1)", background: "#fff" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 32px", background: "rgba(255,255,255,0.82)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--hairline)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: SERIF, fontSize: 27, letterSpacing: "-0.01em" }}>quizai</span>
          <span style={{ fontFamily: SERIF, fontSize: 14, color: "var(--asu-maroon)" }}>beta</span>
        </div>
        <div className="qai-nav-links" style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="#features" className="qai-navlink" style={{ fontSize: 14, color: "var(--gray-2)" }}>Features</a>
          <a href="#mobile" className="qai-navlink" style={{ fontSize: 14, color: "var(--gray-2)" }}>On the go</a>
          <Link href="/login" className="qai-navlink" style={{ fontSize: 14, color: "var(--gray-2)" }}>Sign In</Link>
          <Link href="/login" className="qai-btn" style={{ display: "inline-block", padding: "9px 18px", borderRadius: 8, background: BTN_MAROON, color: "#fff", fontSize: 14, fontWeight: 700 }}>Sign Up</Link>
        </div>
      </nav>

      {/* Hero */}
      <header style={{ position: "relative", overflow: "hidden", padding: "120px 32px 132px", background: "#fff" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(0,0,0,0.14) 1px, transparent 1px)", backgroundSize: "26px 26px", opacity: 0.55 }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 55% at 50% 45%, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.35) 60%, rgba(255,255,255,0) 100%)" }} />

        {/* Scattered cards (wide screens only) */}
        <div className="qai-floats" aria-hidden>
          <div className="qai-float" style={{ right: "calc(50% + 436px)", top: 120, width: 236, transform: "rotate(-2.2deg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <i className="ph ph-file-pdf" style={{ color: "var(--asu-maroon)", fontSize: 15 }} />
              <span style={{ fontSize: 12.5, color: "var(--gray-1)" }}>BIO 181 — Lecture 7.pdf</span>
            </div>
            <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: "var(--gray-6)", overflow: "hidden" }}>
              <div style={{ width: "72%", height: "100%", background: "var(--asu-maroon)" }} />
            </div>
            <div style={{ marginTop: 7, fontSize: 11, color: "var(--gray-3)" }}>Reading 24 pages…</div>
          </div>

          <div className="qai-float" style={{ right: "calc(50% + 452px)", bottom: 96, width: 212, transform: "rotate(1.6deg)" }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--gray-3)" }}>Flashcard 4 of 18</div>
            <div style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.45 }}>What does the mitochondrial inner membrane do?</div>
            <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
              <span style={{ padding: "4px 9px", borderRadius: 999, background: "var(--surface-gold-tint)", border: "1px solid var(--border-gold-tint)", fontSize: 11, color: "var(--asu-maroon)" }}>Again</span>
              <span style={{ padding: "4px 9px", borderRadius: 999, background: "var(--surface-chip)", fontSize: 11, color: "var(--gray-2)" }}>Good</span>
            </div>
          </div>

          <div className="qai-float" style={{ left: "calc(50% + 436px)", top: 104, width: 250, transform: "rotate(2deg)" }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--gray-1)" }}>Which organelle produces most of the cell&apos;s ATP?</div>
            <div style={{ display: "grid", gap: 6, marginTop: 11 }}>
              <div style={{ padding: "7px 10px", border: "1px solid var(--gray-5)", borderRadius: 7, fontSize: 11.5, color: "var(--gray-2)" }}>Ribosome</div>
              <div style={{ padding: "7px 10px", border: "1px solid var(--asu-maroon)", borderRadius: 7, background: "var(--surface-maroon-tint)", fontSize: 11.5, color: "var(--asu-maroon)" }}>Mitochondrion</div>
              <div style={{ padding: "7px 10px", border: "1px solid var(--gray-5)", borderRadius: 7, fontSize: 11.5, color: "var(--gray-2)" }}>Golgi apparatus</div>
            </div>
            <div style={{ marginTop: 9, fontSize: 10.5, color: "var(--gray-3)" }}>Source: p. 12 of your upload</div>
          </div>

          <div className="qai-float" style={{ left: "calc(50% + 452px)", bottom: 112, width: "auto", display: "flex", alignItems: "center", gap: 12, transform: "rotate(-1.4deg)" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "conic-gradient(var(--asu-maroon) 0% 84%, var(--gray-6) 84% 100%)", display: "grid", placeItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700 }}>84%</div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>Cell Biology</div>
              <div style={{ fontSize: 11, color: "var(--gray-3)" }}>Best score, 6 attempts</div>
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div style={{ position: "relative", maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "#fff", border: "1px solid var(--hairline-strong)", fontSize: 12, color: "var(--gray-2)" }}>
            <i className="ph ph-graduation-cap" aria-hidden style={{ color: "var(--asu-maroon)", fontSize: 11 }} /> Built at Arizona State University
          </div>
          <h1 style={{ margin: "26px 0 0", fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(46px,7vw,76px)", lineHeight: 1.04, letterSpacing: "-0.02em", textWrap: "balance" }}>Turn your notes into quizzes.</h1>
          <p style={{ margin: "22px auto 0", maxWidth: 600, fontSize: 18, lineHeight: 1.6, color: "var(--gray-2)" }}>Upload a PDF and QuizAI writes the questions and flashcards from the material you are already studying.</p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 38 }}>
            <Link href="/login" className="qai-btn" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 28px", borderRadius: 10, background: BTN_MAROON, color: "#fff", fontSize: 15, fontWeight: 700 }}>
              Start a quiz <i className="ph ph-arrow-right" aria-hidden style={{ fontSize: 12 }} />
            </Link>
            <a href="#features" className="qai-ghost" style={{ fontSize: 14, color: "var(--gray-2)", textDecoration: "underline", textUnderlineOffset: 3 }}>See how it works</a>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" style={{ padding: "110px 32px 120px", background: "var(--gray-7)", borderTop: "1px solid var(--hairline)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(32px,5vw,50px)", lineHeight: 1.1, letterSpacing: "-0.015em" }}>Studying is faster when the questions come to you</h2>
            <p style={{ margin: "18px auto 0", maxWidth: 600, fontSize: 17, lineHeight: 1.6, color: "var(--gray-2)" }}>Every part of QuizAI starts from material you already have.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 24, marginTop: 58 }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="qai-fcard" style={{ padding: 26, background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: "var(--surface-gold-tint)", display: "grid", placeItems: "center" }}>
                  <i className={`ph ${f.icon}`} aria-hidden style={{ color: "var(--asu-maroon)", fontSize: 15 }} />
                </div>
                <h3 style={{ margin: "20px 0 0", fontSize: 19, lineHeight: 1.3 }}>{f.title}</h3>
                <p style={{ margin: "12px 0 0", fontSize: 14.5, lineHeight: 1.65, color: "var(--gray-2)" }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Maroon study-cycle band */}
      <section style={{ position: "relative", padding: "96px 32px 110px", background: "var(--asu-maroon)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(80,16,37,0.35) 0%, rgba(80,16,37,0.15) 45%, rgba(255,255,255,0.9) 96%, #fff 100%)" }} />
        <div style={{ position: "relative", maxWidth: 980, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(32px,4.6vw,48px)", lineHeight: 1.1, color: "#fff" }}>One canvas for the whole study cycle</h2>
          <p style={{ margin: "16px auto 0", maxWidth: 560, fontSize: 16.5, lineHeight: 1.6, color: "rgba(255,255,255,0.88)" }}>Upload, generate, practice, review. Each step hands off to the next.</p>
          <LandingCanvasTabs />
        </div>
      </section>

      {/* On the go */}
      <section id="mobile" style={{ padding: "110px 32px", background: "var(--gray-7)", borderTop: "1px solid var(--hairline)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 64, alignItems: "center" }}>
          <div>
            <span style={{ display: "inline-block", padding: "5px 13px", borderRadius: 999, border: "1px solid var(--hairline-strong)", background: "#fff", fontSize: 12, color: "var(--gray-2)" }}>Study anywhere</span>
            <h2 style={{ margin: "22px 0 0", fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(34px,4.4vw,46px)", lineHeight: 1.08, letterSpacing: "-0.015em" }}>Study in the gaps in your day</h2>
            <p style={{ margin: "18px 0 0", maxWidth: 520, fontSize: 16.5, lineHeight: 1.65, color: "var(--gray-2)" }}>Ten minutes between classes is enough for a set of flashcards. QuizAI runs in any browser and keeps your last upload one tap away.</p>
            <div style={{ display: "grid", gap: 18, marginTop: 34 }}>
              {MOBILE_POINTS.map((p) => (
                <div key={p.text} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-maroon-tint)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <i className={`ph ${p.icon}`} aria-hidden style={{ color: "var(--asu-maroon)", fontSize: 14 }} />
                  </div>
                  <span style={{ fontSize: 15.5 }}>{p.text}</span>
                </div>
              ))}
            </div>
            <Link href="/login" className="qai-btn" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 34, padding: "14px 24px", borderRadius: 10, background: BTN_MAROON, color: "#fff", fontSize: 14.5, fontWeight: 700 }}>
              <i className="ph ph-lightning" aria-hidden style={{ fontSize: 16 }} /> Start studying free
            </Link>
          </div>

          {/* Phone mockup */}
          <div style={{ justifySelf: "center", width: 320, padding: 12, background: "var(--gray-1)", borderRadius: 40, boxShadow: "0 30px 60px rgba(0,0,0,0.16)" }}>
            <div style={{ background: "#fff", borderRadius: 30, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 10px", fontSize: 11.5, color: "var(--gray-2)" }}>
                <span>9:41</span>
                <span style={{ display: "flex", gap: 6 }}>
                  <i className="ph ph-cell-signal-full" aria-hidden />
                  <i className="ph ph-wifi-high" aria-hidden />
                  <i className="ph ph-battery-full" aria-hidden />
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 20px 14px", borderBottom: "1px solid var(--hairline)" }}>
                <span style={{ fontFamily: SERIF, fontSize: 20 }}>quizai</span>
                <i className="ph ph-user-circle" aria-hidden style={{ color: "var(--gray-3)", fontSize: 17 }} />
              </div>
              <div style={{ padding: "18px 20px 22px" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--gray-3)" }}>Continue</div>
                <div style={{ marginTop: 10, padding: 14, border: "1px solid rgba(0,0,0,0.09)", borderRadius: 11 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Cell Biology quiz</div>
                  <div style={{ marginTop: 5, fontSize: 12, color: "var(--gray-3)" }}>12 of 20 answered</div>
                  <div style={{ marginTop: 10, height: 5, borderRadius: 3, background: "var(--gray-6)", overflow: "hidden" }}>
                    <div style={{ width: "60%", height: "100%", background: "var(--asu-maroon)" }} />
                  </div>
                </div>
                <div style={{ marginTop: 20, borderRadius: 11, overflow: "hidden", background: "var(--surface-maroon-tint)", padding: "22px 16px", display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--asu-maroon)" }}>Flashcard</div>
                  <div style={{ fontSize: 14, lineHeight: 1.4, color: "var(--gray-1)" }}>Define: active transport</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                    <i className="ph ph-cards-three" aria-hidden style={{ color: "var(--asu-maroon)" }} />
                    <span style={{ fontSize: 11.5, color: "var(--gray-2)" }}>18 cards due today</span>
                  </div>
                </div>
                <div style={{ marginTop: 18, padding: 13, borderRadius: 11, background: "var(--asu-gold)", textAlign: "center", fontSize: 13.5, fontWeight: 700, color: "var(--gray-1)" }}>Start today&apos;s flashcards</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing band */}
      <section style={{ position: "relative", minHeight: 460, display: "grid", placeItems: "center", padding: "110px 32px", background: "var(--asu-maroon-darker)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(80,16,37,0.3) 0%, rgba(80,16,37,0.1) 50%, rgba(255,255,255,0.92) 96%, #fff 100%)" }} />
        <div style={{ position: "relative", padding: "44px 48px", borderRadius: 16, background: "rgba(25,25,25,0.42)", backdropFilter: "blur(10px)", textAlign: "center", maxWidth: 560 }}>
          <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(32px,4.4vw,44px)", lineHeight: 1.1, color: "#fff" }}>Start studying smarter</h2>
          <p style={{ margin: "14px 0 0", fontSize: 16, lineHeight: 1.6, color: "rgba(255,255,255,0.9)" }}>Bring one PDF. You will have a quiz before you finish your coffee.</p>
          <Link href="/login" className="qai-btn" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 26, padding: "14px 26px", borderRadius: 10, background: BTN_MAROON, color: "#fff", fontSize: 15, fontWeight: 700 }}>
            Create your first quiz <i className="ph ph-arrow-right" aria-hidden style={{ fontSize: 12 }} />
          </Link>
          <div style={{ marginTop: 16, fontSize: 12.5, color: "rgba(255,255,255,0.78)" }}>Free for students · No credit card required</div>
        </div>
      </section>

      {/* Giant wordmark */}
      <div style={{ padding: "70px 32px 0", background: "#fff", overflow: "hidden" }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(90px,17vw,240px)", lineHeight: 0.86, letterSpacing: "-0.02em", whiteSpace: "nowrap", color: "var(--gray-1)" }}>QUIZAI</div>
      </div>

      {/* Footer */}
      <footer style={{ padding: "40px 32px 56px", background: "#fff" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--hairline)", paddingTop: 26 }}>
          <span style={{ fontSize: 13, color: "var(--gray-3)" }}>© 2026 QuizAI · Arizona State University</span>
          <div style={{ display: "flex", gap: 22 }}>
            <Link href="/login" style={{ fontSize: 13, color: "var(--gray-2)" }}>Sign in</Link>
            <a href="#features" style={{ fontSize: 13, color: "var(--gray-2)" }}>Features</a>
            <a href="#mobile" style={{ fontSize: 13, color: "var(--gray-2)" }}>On the go</a>
          </div>
        </div>
      </footer>

      <style>{`
        .qai-btn{ transition: transform .18s ease, background .18s ease, box-shadow .18s ease; }
        .qai-btn:hover{ background: var(--asu-gold) !important; color: var(--gray-1) !important; box-shadow: 0 8px 26px rgba(255,198,39,0.45); transform: scale(1.05); }
        .qai-navlink{ transition: color .15s ease; }
        .qai-navlink:hover{ color: var(--asu-maroon); }
        .qai-ghost:hover{ color: var(--asu-maroon); }
        .qai-fcard{ transition: border-color .18s ease, transform .18s ease; }
        .qai-fcard:hover{ border-color: var(--hairline-selected) !important; transform: translateY(-2px); }
        .qai-floats{ position:absolute; inset:0; pointer-events:none; }
        .qai-float{
          position:absolute; padding:14px; background:#fff; border:1px solid rgba(0,0,0,0.1);
          border-radius:10px; box-shadow:0 12px 30px rgba(0,0,0,0.06);
        }
        /* Scattered cards need wide gutters — hide when they'd collide with the copy. */
        @media (max-width:1200px){ .qai-floats{ display:none; } }
        @media (max-width:640px){
          .qai-nav-links a:not(.qai-btn){ display:none; }
        }
      `}</style>
    </div>
  );
}
