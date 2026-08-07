"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({ userId, initialName, email }: { userId: string; initialName: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setStatus("saving");
    setError("");
    const supabase = createClient();
    // Upsert so it works even if the profile row was never created (e.g. the
    // account predates the auto-profile trigger).
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, email, full_name: trimmed });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("saved");
      router.refresh();
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    fontSize: "var(--fs-base)",
    fontFamily: "var(--font-sans)",
    color: "var(--gray-1)",
    background: "#fff",
    border: "1px solid var(--gray-5)",
    borderRadius: "var(--radius-md)",
    outline: "none",
  };

  return (
    <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={{ font: "var(--text-label)", color: "var(--gray-2)", display: "block", marginBottom: 6 }}>Display name</label>
        <input value={name} onChange={(e) => { setName(e.target.value); setStatus("idle"); }} placeholder="Your name" style={inputStyle} />
      </div>

      <div>
        <label style={{ font: "var(--text-label)", color: "var(--gray-2)", display: "block", marginBottom: 6 }}>Email</label>
        <input value={email} disabled style={{ ...inputStyle, background: "var(--surface-panel)", color: "var(--gray-3)", cursor: "not-allowed" }} />
        <div style={{ font: "var(--text-small)", color: "var(--text-muted)", marginTop: 4 }}>Email is tied to your login and can&apos;t be changed here.</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="submit"
          disabled={status === "saving" || name.trim() === initialName || !name.trim()}
          style={{ padding: "10px 22px", background: "var(--asu-maroon)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "var(--fs-base)", cursor: status === "saving" ? "not-allowed" : "pointer", opacity: status === "saving" || name.trim() === initialName || !name.trim() ? 0.6 : 1, boxShadow: "var(--shadow-button)" }}
        >
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
        {status === "saved" && <span style={{ font: "var(--text-small)", color: "var(--success)" }}><i className="ph ph-check" style={{ marginRight: 6 }} />Saved</span>}
        {status === "error" && <span style={{ font: "var(--text-small)", color: "var(--danger)" }}>{error}</span>}
      </div>
    </form>
  );
}
