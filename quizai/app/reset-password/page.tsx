"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NeuralCanvas } from "@/components/effects";

function Brand() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 26, letterSpacing: "-0.02em", color: "var(--asu-maroon)" }}>
      <span aria-hidden style={{ width: 40, height: 40, borderRadius: 11, background: "var(--surface-maroon-tint)", color: "var(--asu-maroon)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
        <i className="ph ph-brain" />
      </span>
      QuizAI
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 15,
  fontFamily: "var(--font-sans)",
  color: "var(--gray-1)",
  background: "#fff",
  border: "1px solid var(--gray-5)",
  borderRadius: "var(--radius-md)",
  outline: "none",
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null); // null = checking
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setBusy(false);
    } else {
      setDone(true);
      setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 1400);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-maroon-tint)", position: "relative", overflow: "hidden", padding: 20 }}>
      <NeuralCanvas />
      <div style={{ position: "relative", width: "100%", maxWidth: 400, background: "var(--white)", border: "1px solid var(--border-maroon-tint)", borderRadius: 28, padding: "34px 30px", boxShadow: "var(--shadow-elevated)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <Brand />
          <div style={{ font: "var(--text-h2)", color: "var(--text-heading)", marginTop: 4 }}>Set a new password</div>
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 34, color: "var(--success)", marginBottom: 8 }}><i className="ph ph-check-circle" /></div>
            <p style={{ font: "var(--text-body)", color: "var(--gray-2)", margin: 0 }}>Password updated. Taking you to your dashboard…</p>
          </div>
        ) : ready === false ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <p style={{ font: "var(--text-body)", color: "var(--gray-2)", margin: "0 0 14px" }}>
              This page opens from the password-reset link in your email. Request one from the sign-in page.
            </p>
            <Link href="/login" style={{ display: "inline-block", padding: "10px 20px", background: "var(--asu-maroon)", color: "#fff", borderRadius: "var(--radius-md)", fontWeight: 700 }}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="password" required minLength={6} placeholder="New password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            <input type="password" required minLength={6} placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} />
            {error && <p style={{ font: "var(--text-small)", color: "var(--danger)", margin: 0 }}>{error}</p>}
            <button type="submit" disabled={busy || ready === null} style={{ width: "100%", padding: "12px 20px", background: "var(--asu-maroon)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: 15, cursor: busy ? "not-allowed" : "pointer", opacity: busy || ready === null ? 0.7 : 1, boxShadow: "var(--shadow-button)" }}>
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
