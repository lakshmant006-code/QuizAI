import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "var(--surface-maroon-tint)", padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 44, color: "var(--asu-maroon)" }}>
        <i className="ph ph-brain" />
      </div>
      <h1 style={{ font: "var(--text-h1)", color: "var(--text-heading)", margin: 0 }}>Page not found</h1>
      <p style={{ font: "var(--text-body)", color: "var(--gray-2)", margin: 0, maxWidth: 420 }}>
        That page doesn&apos;t exist. Head back and keep studying.
      </p>
      <Link href="/" style={{ padding: "11px 22px", background: "var(--btn-primary)", color: "#fff", borderRadius: "var(--radius-md)", fontWeight: 700, boxShadow: "var(--shadow-button)" }}>
        Back to QuizAI
      </Link>
    </div>
  );
}
