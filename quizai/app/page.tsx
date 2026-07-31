import Link from "next/link";
import { Logo } from "@/components/ui";

const features = [
  { icon: "①", title: "AI Quiz Generator", body: "Upload a PDF and get multiple-choice, true/false, or short-answer questions at the difficulty you choose." },
  { icon: "②", title: "Smart Summaries", body: "Long readings become concise overviews with key points and auto-extracted key terms." },
  { icon: "③", title: "Progress Insights", body: "Accuracy, retention, and weak topics at a glance — plus streaks that keep you accountable." },
];

const steps = [
  ["1. Upload", "Notes, PDFs, or readings — any study material works."],
  ["2. Quiz instantly", "Claude writes the questions; you pick the format and difficulty."],
  ["3. Reinforce", "Retake quizzes, track accuracy, watch your score climb."],
];

export default function Landing() {
  return (
    <div style={{ background: "var(--white)", minHeight: "100vh" }}>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid var(--gray-6)",
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}
      >
        <Logo />
        <Link
          href="/login"
          style={{
            padding: "8px 18px",
            background: "var(--asu-maroon)",
            color: "#fff",
            borderRadius: "var(--radius-md)",
            font: "var(--text-label)",
            boxShadow: "var(--shadow-button)",
          }}
        >
          Sign in
        </Link>
      </nav>

      <header style={{ textAlign: "center", padding: "88px 20px 96px", maxWidth: 760, margin: "0 auto" }}>
        <span
          style={{
            display: "inline-block",
            font: "var(--text-label)",
            color: "var(--asu-maroon)",
            background: "var(--surface-gold-tint)",
            border: "1px solid var(--border-gold-tint)",
            padding: "6px 16px",
            borderRadius: "var(--radius-pill)",
            marginBottom: 20,
          }}
        >
          AI-powered studying
        </span>
        <h1 style={{ font: "var(--text-display)", color: "var(--text-heading)", margin: 0, letterSpacing: "-1px" }}>
          Every document becomes a study session
        </h1>
        <p style={{ font: "var(--text-body)", fontSize: 18, color: "var(--gray-2)", maxWidth: 560, margin: "18px auto 0" }}>
          Upload notes, PDFs, or links — QuizAI generates quizzes and summaries, then tracks what your brain
          actually retains.
        </p>
        <div style={{ marginTop: 28 }}>
          <Link
            href="/login"
            style={{
              display: "inline-block",
              padding: "13px 28px",
              background: "var(--asu-maroon)",
              color: "#fff",
              borderRadius: "var(--radius-md)",
              fontWeight: 700,
              boxShadow: "var(--shadow-button)",
            }}
          >
            Get started free
          </Link>
        </div>
      </header>

      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px 90px" }}>
        <h2 style={{ font: "var(--text-h2)", color: "var(--text-heading)", textAlign: "center", margin: "0 0 8px" }}>
          Built around how memory works
        </h2>
        <p style={{ font: "var(--text-body)", color: "var(--gray-2)", textAlign: "center", margin: "0 0 40px" }}>
          Three tools, one loop: encode, test, reinforce.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: "var(--white)",
                border: "1px solid var(--gray-6)",
                borderRadius: "var(--radius-lg)",
                padding: 28,
              }}
            >
              <div style={{ fontSize: 26, color: "var(--asu-maroon)" }}>{f.icon}</div>
              <h3 style={{ font: "var(--text-h3)", color: "var(--text-heading)", margin: "14px 0 8px" }}>{f.title}</h3>
              <p style={{ font: "var(--text-body)", color: "var(--gray-2)", margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "var(--asu-maroon)", padding: "70px 24px" }}>
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
            textAlign: "center",
          }}
        >
          {steps.map(([title, body]) => (
            <div key={title}>
              <h3 style={{ font: "var(--text-h3)", color: "#fff", margin: "0 0 8px" }}>{title}</h3>
              <p style={{ font: "var(--text-body)", color: "rgba(255,255,255,0.85)", margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ textAlign: "center", padding: "90px 24px" }}>
        <h2 style={{ font: "var(--text-h2)", color: "var(--text-heading)", margin: "0 0 12px" }}>
          Ready when your brain is
        </h2>
        <p style={{ font: "var(--text-body)", color: "var(--gray-2)", margin: "0 0 28px" }}>
          Sign in and turn today&apos;s reading into tomorrow&apos;s recall.
        </p>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            padding: "13px 28px",
            background: "var(--asu-maroon)",
            color: "#fff",
            borderRadius: "var(--radius-md)",
            fontWeight: 700,
            boxShadow: "var(--shadow-button)",
          }}
        >
          Sign in to QuizAI
        </Link>
      </section>

      <footer
        style={{
          borderTop: "1px solid var(--gray-6)",
          padding: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          maxWidth: 1120,
          margin: "0 auto",
        }}
      >
        <Logo size={16} />
        <span style={{ font: "var(--text-small)", color: "var(--text-muted)" }}>
          QuizAI — study smarter, remember longer.
        </span>
      </footer>
    </div>
  );
}
