"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card } from "@/components/ui";
import type { Difficulty, QuestionKind } from "@/lib/types";

const KINDS: { key: QuestionKind; label: string }[] = [
  { key: "mcq", label: "Multiple choice" },
  { key: "tf", label: "True / false" },
  { key: "short", label: "Short answer" },
];

// Offline question types the user can choose, each mapped to engine models.
const OFFLINE_TYPES: { key: string; label: string; models: string[] }[] = [
  { key: "mcq", label: "Multiple choice", models: ["cloze", "wh_question", "term_to_def", "def_to_term"] },
  { key: "multi", label: "Select all", models: ["multi_select"] },
  { key: "tf", label: "Yes / No", models: ["true_false"] },
  { key: "short", label: "Short answer", models: ["short_answer"] },
  { key: "flash", label: "Flashcards", models: ["flashcards"] },
];

type Phase = "idle" | "uploading" | "generating" | "done" | "error";
type Method = "offline" | "ai";

// Tell the dashboard octopus a quiz just finished (celebration cue). Uses a
// live event for same-page listeners + sessionStorage to survive router.refresh.
// Carries the question count so the octopus can announce the real number.
function signalQuizReady(count?: number) {
  try {
    const payload = JSON.stringify({ ts: Date.now(), count: count ?? null });
    sessionStorage.setItem("quizai:justGenerated", payload);
    window.dispatchEvent(new CustomEvent("quizai:quiz-ready", { detail: { count: count ?? null } }));
  } catch {
    /* no-op */
  }
}

export function UploadCard({ userId }: { userId: string }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [method, setMethod] = useState<Method>("ai");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [numQuestions, setNumQuestions] = useState(8);
  const [total, setTotal] = useState(10);
  const [kinds, setKinds] = useState<QuestionKind[]>(["mcq"]);
  const [offlineTypes, setOfflineTypes] = useState<string[]>(["mcq", "tf"]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);

  function toggleKind(k: QuestionKind) {
    setKinds((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  }

  function pick(f: File | null) {
    if (f && f.type !== "application/pdf") {
      setPhase("error");
      setMessage("Please choose a PDF file.");
      return;
    }
    if (!f) return;
    setFile(f);
    setPhase("idle");
    setMessage("");
    setSetupOpen(true); // pop up the question-type picker right after upload
  }

  async function run() {
    if (!file) return;

    setPhase("uploading");
    setMessage("Uploading your PDF…");
    const docId = crypto.randomUUID();
    const path = `${userId}/${docId}.pdf`;
    const title = file.name.replace(/\.pdf$/i, "");

    const { error: upErr } = await supabase.storage.from("pdfs").upload(path, file, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (upErr) return fail(upErr.message);

    const { error: insErr } = await supabase.from("documents").insert({
      id: docId,
      user_id: userId,
      title,
      storage_path: path,
      status: "uploaded",
    });
    if (insErr) return fail(insErr.message);

    // Offline engine / hosted Claude: server routes handle it.
    setPhase("generating");
    setMessage(
      method === "offline"
        ? "Building your quiz offline (no credits)…"
        : "Reading the document and writing your quiz…",
    );

    const endpoint = method === "offline" ? "/api/generate-offline" : "/api/generate";
    const offlineModels = Array.from(
      new Set(OFFLINE_TYPES.filter((t) => offlineTypes.includes(t.key)).flatMap((t) => t.models)),
    );
    const payload =
      method === "offline"
        ? { documentId: docId, total, models: offlineModels.length ? offlineModels : undefined }
        : { documentId: docId, difficulty, numQuestions, kinds: kinds.length ? kinds : ["mcq"] };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setPhase("error");
      setMessage(data.error || "Generation failed.");
      router.refresh();
      return;
    }

    setPhase("done");
    setMessage(`Done — ${data.questionCount} questions ready.`);
    setFile(null);
    setSetupOpen(false);
    if (inputRef.current) inputRef.current.value = "";
    signalQuizReady(typeof data.questionCount === "number" ? data.questionCount : undefined);
    router.refresh();
  }

  function fail(msg: string) {
    setPhase("error");
    setMessage(msg);
  }

  function clearFile() {
    setFile(null);
    setSetupOpen(false);
    setPhase("idle");
    setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const busy = phase === "uploading" || phase === "generating";

  const seg = (active: boolean): React.CSSProperties => ({
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "9px 0",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    font: "var(--text-label)",
    background: active ? "var(--asu-maroon)" : "transparent",
    color: active ? "#fff" : "var(--gray-2)",
    transition: "background .18s ease, color .18s ease",
  });

  return (
    <Card style={{ padding: 22 }}>
      <h2 style={{ font: "var(--text-h3)", color: "var(--gray-1)", margin: "0 0 4px" }}>New study material</h2>
      <p style={{ font: "var(--text-small)", color: "var(--text-muted)", margin: "0 0 14px" }}>
        Upload a PDF — generate a quiz instantly.
      </p>

      {/* Method toggle */}
      <div style={{ display: "flex", background: "var(--surface-panel)", border: "1px solid var(--hairline)", borderRadius: 10, padding: 4, marginBottom: 8, gap: 2 }}>
        <button onClick={() => setMethod("ai")} style={seg(method === "ai")}><i className="ph ph-sparkle" aria-hidden />AI</button>
        <button onClick={() => setMethod("offline")} style={seg(method === "offline")}><i className="ph ph-lightning" aria-hidden />Offline</button>
      </div>
      <p style={{ font: "var(--text-small)", color: "var(--text-muted)", margin: "0 0 14px" }}>
        {method === "offline"
          ? "Generated on your device — no credits used."
          : "Our AI writes a full summary + quiz from your PDF — the recommended way to study."}
      </p>

      {/* Drop / pick zone */}
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0] ?? null); }}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          padding: "26px 16px", border: "1.5px dashed var(--hairline-strong)",
          borderRadius: "var(--radius-lg)", background: file ? "var(--surface-maroon-tint)" : "var(--surface-panel)",
          cursor: "pointer", textAlign: "center", transition: "background .18s ease",
        }}
      >
        <input ref={inputRef} type="file" accept="application/pdf" style={{ display: "none" }}
          onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        <i className="ph ph-file-arrow-up" aria-hidden style={{ fontSize: 26, color: "var(--asu-maroon)" }} />
        <span style={{ font: "var(--text-body)", color: "var(--gray-1)" }}>
          {file ? file.name : "Click to choose a PDF or drop it here"}
        </span>
        {file && <span style={{ font: "var(--text-small)", color: "var(--text-muted)" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
      </label>

      {/* When a file is chosen but the picker is closed, offer to reopen / clear. */}
      {file && !setupOpen && phase !== "done" && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <div style={{ maxWidth: 220, flex: 1 }}>
            <Button onClick={() => setSetupOpen(true)} disabled={busy} loading={busy}>
              {busy ? "Working…" : "Choose questions →"}
            </Button>
          </div>
          <button onClick={clearFile} disabled={busy} style={ghostBtn}>Remove</button>
        </div>
      )}

      {message && (
        <p style={{ font: "var(--text-small)", color: phase === "error" ? "var(--danger)" : "var(--gray-2)", margin: "12px 0 0" }}>
          {phase === "generating" && <span className="qa-spin" style={{ marginRight: 6 }}>◠</span>}
          {message}
        </p>
      )}

      {/* Question-variation picker popup */}
      {setupOpen && file && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !busy && setSetupOpen(false)}
          style={modalOverlay}
        >
          <div className="qa-fade-up" onClick={(e) => e.stopPropagation()} style={modalPanel}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
              <div>
                <h3 style={{ font: "var(--text-h3)", color: "var(--gray-1)", margin: 0 }}>Choose your questions</h3>
                <p style={{ font: "var(--text-small)", color: "var(--text-muted)", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>
                  <i className="ph ph-file-pdf" style={{ color: "var(--asu-maroon)", marginRight: 6 }} />{file.name}
                </p>
              </div>
              <button onClick={() => !busy && setSetupOpen(false)} aria-label="Close" style={closeBtn} disabled={busy}>
                <i className="ph ph-x" aria-hidden />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, margin: "16px 0" }}>
              {method === "ai" ? (
                <>
                  <div>
                    <div style={fieldTitle}>Difficulty</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                        <button key={d} onClick={() => setDifficulty(d)} style={optBtn(difficulty === d)}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={fieldTitle}>Question types</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {KINDS.map((k) => (
                        <button key={k.key} onClick={() => toggleKind(k.key)} style={optBtn(kinds.includes(k.key))}>{k.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={fieldTitle}>Number of questions</div>
                    <input type="number" min={3} max={20} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} style={numInput} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div style={fieldTitle}>Question types</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {OFFLINE_TYPES.map((t) => (
                        <button key={t.key}
                          onClick={() => setOfflineTypes((cur) => cur.includes(t.key) ? cur.filter((x) => x !== t.key) : [...cur, t.key])}
                          style={optBtn(offlineTypes.includes(t.key))}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={fieldTitle}>Number of questions</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[5, 10, 15, 20].map((n) => (
                        <button key={n} onClick={() => setTotal(n)} style={optBtn(total === n)}>{n}</button>
                      ))}
                    </div>
                    <div style={{ font: "var(--text-small)", color: "var(--text-muted)", marginTop: 4 }}>
                      We&apos;ll pick the best mix across your chosen types.
                    </div>
                  </div>
                </>
              )}
            </div>

            {message && phase !== "done" && (
              <p style={{ font: "var(--text-small)", color: phase === "error" ? "var(--danger)" : "var(--gray-2)", margin: "0 0 12px" }}>
                {phase === "generating" && <span className="qa-spin" style={{ marginRight: 6 }}>◠</span>}
                {message}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
              <button onClick={() => setSetupOpen(false)} disabled={busy} style={ghostBtn}>Cancel</button>
              <div style={{ minWidth: 190 }}>
                <Button onClick={run} disabled={busy} loading={busy}>
                  {busy ? "Working…" : method === "offline" ? "Generate quiz (free)" : "Generate summary + quiz"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

const numInput: React.CSSProperties = {
  width: 84, padding: "6px 10px", border: "1px solid var(--gray-5)", borderRadius: "var(--radius-sm)", font: "var(--text-body)",
};
const fieldTitle: React.CSSProperties = {
  font: "var(--text-label)", color: "var(--gray-2)", marginBottom: 6,
};
const ghostBtn: React.CSSProperties = {
  padding: "9px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-5)",
  background: "#fff", color: "var(--gray-1)", font: "var(--text-label)", cursor: "pointer",
};
const closeBtn: React.CSSProperties = {
  border: "none", background: "transparent", color: "var(--gray-3)", cursor: "pointer",
  fontSize: 18, lineHeight: 1, padding: 4, flexShrink: 0,
};
const modalOverlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 100, background: "rgba(20,10,14,0.5)",
  backdropFilter: "blur(3px)", display: "grid", placeItems: "center", padding: 20,
};
const modalPanel: React.CSSProperties = {
  width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto",
  background: "var(--white)", border: "1px solid var(--hairline)", borderRadius: 18,
  padding: 22, boxShadow: "var(--shadow-elevated)",
};
function optBtn(active: boolean): React.CSSProperties {
  return {
    padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid",
    borderColor: active ? "var(--asu-maroon)" : "var(--gray-5)",
    background: active ? "var(--surface-maroon-tint)" : "#fff",
    color: active ? "var(--asu-maroon)" : "var(--gray-2)",
    font: "var(--text-label)", textTransform: "capitalize",
    cursor: "pointer", transition: "all .16s ease",
  };
}
