"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Logo } from "@/components/ui";

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
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-maroon-tint)",
        padding: 20,
      }}
    >
      <div
        className="qa-fade-up"
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#fff",
          border: "1px solid var(--border-maroon-tint)",
          borderRadius: "var(--radius-xl)",
          padding: "36px 32px",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <Logo size={24} />
          <p style={{ font: "var(--text-small)", color: "var(--gray-3)", textAlign: "center", margin: 0 }}>
            Sign in with a magic link — no password required.
          </p>
        </div>

        {status === "sent" ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✉️</div>
            <h2 style={{ font: "var(--text-h3)", color: "var(--gray-1)", margin: "0 0 6px" }}>Check your inbox</h2>
            <p style={{ font: "var(--text-body)", color: "var(--gray-2)", margin: 0 }}>
              We sent a sign-in link to <strong>{email}</strong>. Open it on this device to continue.
            </p>
          </div>
        ) : (
          <form onSubmit={sendLink} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ font: "var(--text-label)", color: "var(--gray-2)" }}>Email address</label>
            <Input
              type="email"
              required
              autoFocus
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {status === "error" && (
              <p style={{ font: "var(--text-small)", color: "var(--danger)", margin: 0 }}>{error}</p>
            )}
            <Button type="submit" loading={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send magic link"}
            </Button>
          </form>
        )}

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Link href="/" style={{ font: "var(--text-small)", color: "var(--gray-3)" }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
