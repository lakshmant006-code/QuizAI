"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/safeNext";
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

type Mode = "signin" | "signup";

function LoginInner() {
  const params = useSearchParams();
  const router = useRouter();
  const next = safeNextPath(params.get("next"));

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const supabase = createClient();
  const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else { router.push(next); router.refresh(); return; }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name.trim() || email.split("@")[0] },
          emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) setError(error.message);
      else if (data.session) { router.push(next); router.refresh(); return; }
      else setNotice("Account created! Check your inbox to confirm your email, then sign in.");
    }
    setBusy(false);
  }

  async function magicLink() {
    if (!email) { setError("Enter your email first."); return; }
    setBusy(true);
    setError("");
    setNotice("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setError(error.message);
    else setNotice(`Magic link sent to ${email}. Open it on this device to sign in.`);
    setBusy(false);
  }

  async function forgotPassword() {
    if (!email) { setError("Enter your email first, then tap “Forgot password”."); return; }
    setBusy(true);
    setError("");
    setNotice("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
    });
    if (error) setError(error.message);
    else setNotice(`Password reset link sent to ${email}. Open it to choose a new password.`);
    setBusy(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-maroon-tint)", position: "relative", overflow: "hidden", padding: 20 }}>
      <NeuralCanvas />
      <div style={{ position: "relative", width: "100%", maxWidth: 400, background: "var(--white)", border: "1px solid var(--border-maroon-tint)", borderRadius: 28, padding: "34px 30px", boxShadow: "var(--shadow-elevated)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <Brand />
          <div style={{ font: "var(--text-h2)", color: "var(--text-heading)", marginTop: 4 }}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", background: "var(--surface-panel)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-md)", padding: 4, marginBottom: 18 }}>
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setNotice(""); }}
              style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 7, cursor: "pointer", font: "var(--text-label)", background: mode === m ? "var(--asu-maroon)" : "transparent", color: mode === m ? "#fff" : "var(--gray-2)" }}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        {notice ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 34, color: "var(--asu-maroon)", marginBottom: 8 }}><i className="ph ph-paper-plane-tilt" /></div>
            <p style={{ font: "var(--text-body)", color: "var(--gray-2)", margin: 0 }}>{notice}</p>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && (
              <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            )}
            <input type="email" required placeholder="you@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            <input type="password" required minLength={6} placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            {mode === "signin" && (
              <button type="button" onClick={forgotPassword} disabled={busy} style={{ alignSelf: "flex-end", background: "none", border: "none", padding: 0, font: "var(--text-small)", color: "var(--asu-maroon)", cursor: "pointer" }}>
                Forgot password?
              </button>
            )}
            {error && <p style={{ font: "var(--text-small)", color: "var(--danger)", margin: 0 }}>{error}</p>}
            <button type="submit" disabled={busy} style={{ width: "100%", padding: "12px 20px", background: "var(--asu-maroon)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: 15, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, boxShadow: "var(--shadow-button)" }}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
              <span style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
              <span style={{ font: "var(--text-small)", color: "var(--text-muted)" }}>or</span>
              <span style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
            </div>

            <button type="button" onClick={magicLink} disabled={busy} style={{ width: "100%", padding: "11px 20px", background: "#fff", color: "var(--gray-1)", border: "1px solid var(--gray-5)", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: 14, cursor: busy ? "not-allowed" : "pointer" }}>
              <i className="ph ph-envelope" style={{ marginRight: 8 }} />Email me a magic link
            </button>
          </form>
        )}

        <div style={{ marginTop: 18, textAlign: "center" }}>
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
