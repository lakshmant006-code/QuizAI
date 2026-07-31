"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NeuralCanvas } from "@/components/effects";

function Brand() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 26, letterSpacing: "-0.02em", color: "var(--asu-maroon)" }}>
      <span aria-hidden style={{ width: 40, height: 40, borderRadius: 11, background: "var(--surface-maroon-tint)", color: "var(--asu-maroon)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
        <i className="fa-solid fa-brain" />
      </span>
      QuizAI
    </span>
  );
}

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-maroon-tint)", position: "relative", overflow: "hidden", padding: 20 }}>
      <NeuralCanvas />
      <div
        style={{ position: "relative", width: "100%", maxWidth: 400, background: "var(--white)", border: "1px solid var(--border-maroon-tint)", borderRadius: 28, padding: "36px 32px", boxShadow: "var(--shadow-elevated)" }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <Brand />
          <div style={{ font: "var(--text-h2)", color: "var(--text-heading)", marginTop: 4 }}>Welcome to QuizAI</div>
          <div style={{ font: "var(--text-small)", color: "var(--text-muted)" }}>Sign in with a magic link — no password.</div>
        </div>

        {status === "sent" ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>
              <i className="fa-solid fa-paper-plane" style={{ color: "var(--asu-maroon)" }} />
            </div>
            <div style={{ font: "var(--text-h3)", color: "var(--gray-1)", marginBottom: 6 }}>Check your inbox</div>
            <p style={{ font: "var(--text-body)", color: "var(--gray-2)", margin: 0 }}>
              We sent a sign-in link to <strong>{email}</strong>. Open it on this device to continue.
            </p>
          </div>
        ) : (
          <form onSubmit={sendLink} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email"
              required
              autoFocus
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", fontSize: 15, fontFamily: "var(--font-sans)", color: "var(--gray-1)", background: "#fff", border: "1px solid var(--gray-5)", borderRadius: "var(--radius-md)", outline: "none" }}
            />
            {status === "error" && <p style={{ font: "var(--text-small)", color: "var(--danger)", margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={status === "sending"}
              style={{ width: "100%", padding: "12px 20px", background: "var(--asu-maroon)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: 15, cursor: status === "sending" ? "not-allowed" : "pointer", opacity: status === "sending" ? 0.7 : 1, boxShadow: "var(--shadow-button)" }}
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Link href="/" style={{ font: "var(--text-small)", color: "var(--gray-3)" }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
