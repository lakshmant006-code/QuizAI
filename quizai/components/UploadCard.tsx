"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card } from "@/components/ui";
import type { Difficulty, QuestionKind } from "@/lib/types";
import {
  loadConn,
  saveConn,
  testConn,
  generateWithLocalAI,
  type LocalAIConn,
} from "@/lib/localAI";
import { extractPdfTextBrowser } from "@/lib/pdfClient";

const KINDS: { key: QuestionKind; label: string }[] = [
  { key: "mcq", label: "Multiple choice" },
  { key: "tf", label: "True / false" },
  { key: "short", label: "Short answer" },
];

// Offline question types the user can choose, each mapped to engine models.
const OFFLINE_TYPES: { key: string; label: string; models: string[] }[] = [
  { key: "mcq", label: "Multiple choice", models: ["cloze", "wh_question", "term_to_def", "def_to_term"] },
  { key: "multi", label: "Select all", models: ["multi_select"] },
  { key: "related", label: "Related concepts", models: ["association"] },
  { key: "direct", label: "Direct questions", models: ["wh_question"] },
  { key: "tf", label: "Yes / No", models: ["true_false"] },
  { key: "short", label: "Short answer", models: ["short_answer"] },
  { key: "match", label: "Match", models: ["match"] },
  { key: "order", label: "Put in order", models: ["sequence"] },
  { key: "flash", label: "Flashcards", models: ["flashcards"] },
];

type Phase = "idle" | "uploading" | "generating" | "done" | "error";
type Method = "offline" | "ai" | "local";

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

  // "My AI" (local model) connection.
  const [conn, setConn] = useState<LocalAIConn | null>(null);
  const [editingConn, setEditingConn] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [modelName, setModelName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [savingConn, setSavingConn] = useState(false);
  const [connMsg, setConnMsg] = useState("");
  const [connOk, setConnOk] = useState(false);

  useEffect(() => {
    loadConn(supabase, userId)
      .then((c) => setConn(c))
      .catch(() => {});
  }, [supabase, userId]);

  function toggleKind(k: QuestionKind) {
    setKinds((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  }

  function pick(f: File | null) {
    if (f && f.type !== "application/pdf") {
      setPhase("error");
      setMessage("Please choose a PDF file.");
      return;
    }
    setFile(f);
    setPhase("idle");
    setMessage("");
  }

  async function handleTestConn() {
    setTesting(true);
    setConnMsg("");
    const r = await testConn({ base_url: baseUrl, model: modelName, api_key: apiKey });
    setConnOk(r.ok);
    setConnMsg(r.detail);
    setTesting(false);
  }

  async function handleSaveConn() {
    if (!baseUrl.trim() || !modelName.trim()) return;
    setSavingConn(true);
    setConnMsg("");
    try {
      const next: LocalAIConn = { base_url: baseUrl, model: modelName, api_key: apiKey || null };
      await saveConn(supabase, userId, next);
      setConn({ base_url: baseUrl.trim().replace(/\/+$/, ""), model: modelName.trim(), api_key: apiKey || null });
      setEditingConn(false);
      setConnOk(true);
      setConnMsg("Saved to your account.");
    } catch (e) {
      setConnOk(false);
      setConnMsg(e instanceof Error ? e.message : "Could not save connection.");
    } finally {
      setSavingConn(false);
    }
  }

  function startEdit() {
    setBaseUrl(conn?.base_url ?? "");
    setModelName(conn?.model ?? "");
    setApiKey(conn?.api_key ?? "");
    setConnMsg("");
    setEditingConn(true);
  }

  async function run() {
    if (!file) return;
    if (method === "local" && !conn) return fail("Connect your local AI first.");

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

    // --- "My AI": generate entirely in the browser against the user's server ---
    if (method === "local") {
      setPhase("generating");
      setMessage("Reading the PDF and generating with your local model…");
      try {
        const { text, pages } = await extractPdfTextBrowser(file);
        if (!text || text.trim().length < 40) {
          throw new Error("Couldn't read enough text from this PDF (it may be a scanned image).");
        }
        const pack = await generateWithLocalAI({
          conn: conn!,
          text,
          title,
          difficulty,
          numQuestions,
          kinds: kinds.length ? kinds : ["mcq"],
        });

        const { data: summary, error: sErr } = await supabase
          .from("summaries")
          .insert({
            document_id: docId,
            user_id: userId,
            overview: pack.summary.overview,
            key_points: pack.summary.key_points ?? [],
            key_terms: pack.summary.key_terms ?? [],
          })
          .select()
          .single();
        if (sErr) throw new Error(sErr.message);

        const { data: quiz, error: qErr } = await supabase
          .from("quizzes")
          .insert({ document_id: docId, user_id: userId, title: pack.quiz.title, difficulty })
          .select()
          .single();
        if (qErr) throw new Error(qErr.message);

        const rows = pack.quiz.questions.map((q, i) => ({
          quiz_id: quiz.id,
          position: i,
          kind: q.kind,
          prompt: q.prompt,
          options: q.options ?? null,
          answer: q.answer,
          explanation: q.explanation ?? null,
        }));
        const { error: quErr } = await supabase.from("questions").insert(rows);
        if (quErr) throw new Error(quErr.message);

        await supabase
          .from("documents")
          .update({ status: "ready", page_count: pages, char_count: text.length })
          .eq("id", docId);

        void summary;
        setPhase("done");
        setMessage(`Done — ${rows.length} questions ready.`);
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        signalQuizReady(rows.length);
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Local generation failed.";
        await supabase.from("documents").update({ status: "failed", error: msg }).eq("id", docId);
        setPhase("error");
        setMessage(msg);
        router.refresh();
      }
      return;
    }

    // --- Offline engine / hosted Claude: server routes handle it ---
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
    if (inputRef.current) inputRef.current.value = "";
    signalQuizReady(typeof data.questionCount === "number" ? data.questionCount : undefined);
    router.refresh();
  }

  function fail(msg: string) {
    setPhase("error");
    setMessage(msg);
  }

  const busy = phase === "uploading" || phase === "generating";
  const showAiControls = method === "ai" || method === "local";

  const seg = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "9px 0",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    font: "var(--text-label)",
    background: active ? "var(--asu-maroon)" : "transparent",
    color: active ? "#fff" : "var(--gray-2)",
  });

  return (
    <Card style={{ padding: 22 }}>
      <h2 style={{ font: "var(--text-h3)", color: "var(--gray-1)", margin: "0 0 4px" }}>New study material</h2>
      <p style={{ font: "var(--text-small)", color: "var(--text-muted)", margin: "0 0 14px" }}>
        Upload a PDF — generate a quiz instantly.
      </p>

      {/* Method toggle */}
      <div style={{ display: "flex", background: "var(--surface-panel)", border: "1px solid var(--hairline)", borderRadius: 10, padding: 4, marginBottom: 8, gap: 2 }}>
        <button onClick={() => setMethod("ai")} style={seg(method === "ai")}>✨ AI</button>
        <button onClick={() => setMethod("offline")} style={seg(method === "offline")}>⚡ Offline</button>
        <button onClick={() => setMethod("local")} style={seg(method === "local")}>🖥️ My AI</button>
      </div>
      <p style={{ font: "var(--text-small)", color: "var(--text-muted)", margin: "0 0 14px" }}>
        {method === "offline"
          ? "10 question styles generated on-device. No credits used."
          : method === "ai"
          ? "Our AI writes a full summary + quiz from your PDF — the recommended way to study."
          : "Use your own local AI (Ollama, LM Studio, vLLM…). Runs in your browser — nothing goes through our servers."}
      </p>

      {/* My AI — connection */}
      {method === "local" && (
        <div style={{ border: "1px solid var(--hairline)", borderRadius: 12, padding: 14, marginBottom: 14, background: "var(--surface-panel)" }}>
          {conn && !editingConn ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: "var(--text-label)", color: "var(--gray-1)" }}>
                  <i className="ph ph-check-circle" style={{ color: "var(--success)", marginRight: 6 }} />
                  Using <b>{conn.model}</b>
                </div>
                <div style={{ font: "var(--text-small)", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conn.base_url}</div>
              </div>
              <button onClick={startEdit} style={linkBtn}>Edit</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={fieldLabel}>
                Server URL (OpenAI-compatible)
                <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="http://localhost:1234/v1" style={fieldInput} />
              </label>
              <label style={fieldLabel}>
                Model name
                <input value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="llama-3.1-8b-instruct" style={fieldInput} />
              </label>
              <label style={fieldLabel}>
                API key (optional)
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="usually blank for local servers" style={fieldInput} />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleTestConn} disabled={!baseUrl || !modelName || testing} style={{ ...smallBtn, opacity: !baseUrl || !modelName || testing ? 0.5 : 1 }}>
                  {testing ? "Testing…" : "Test"}
                </button>
                <button onClick={handleSaveConn} disabled={!baseUrl || !modelName || savingConn} style={{ ...smallBtnPrimary, opacity: !baseUrl || !modelName || savingConn ? 0.5 : 1 }}>
                  {savingConn ? "Saving…" : "Save"}
                </button>
                {conn && (
                  <button onClick={() => { setEditingConn(false); setConnMsg(""); }} style={smallBtn}>Cancel</button>
                )}
              </div>
              {connMsg && (
                <p style={{ font: "var(--text-small)", color: connOk ? "var(--success)" : "var(--danger)", margin: 0 }}>{connMsg}</p>
              )}
              <p style={{ font: "var(--text-small)", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                Your PDF and prompts go straight from your browser to this server — never through QuizAI. Enable CORS on the server so this site can reach it.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Drop / pick zone */}
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0] ?? null); }}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          padding: "22px 16px", border: "1.5px dashed var(--hairline-strong)",
          borderRadius: "var(--radius-lg)", background: file ? "var(--surface-maroon-tint)" : "var(--surface-panel)",
          cursor: "pointer", textAlign: "center",
        }}
      >
        <input ref={inputRef} type="file" accept="application/pdf" style={{ display: "none" }}
          onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        <span style={{ fontSize: 24 }}>📄</span>
        <span style={{ font: "var(--text-body)", color: "var(--gray-1)" }}>
          {file ? file.name : "Click to choose a PDF or drop it here"}
        </span>
        {file && <span style={{ font: "var(--text-small)", color: "var(--text-muted)" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
      </label>

      {/* Options */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, margin: "16px 0" }}>
        {showAiControls ? (
          <>
            <div>
              <div style={{ font: "var(--text-label)", color: "var(--gray-2)", marginBottom: 6 }}>Difficulty</div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    style={optBtn(difficulty === d)} >{d}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ font: "var(--text-label)", color: "var(--gray-2)", marginBottom: 6 }}>Questions</div>
              <input type="number" min={3} max={20} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}
                style={numInput} />
            </div>
            <div>
              <div style={{ font: "var(--text-label)", color: "var(--gray-2)", marginBottom: 6 }}>Question types</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {KINDS.map((k) => (
                  <button key={k.key} onClick={() => toggleKind(k.key)} style={optBtn(kinds.includes(k.key))}>{k.label}</button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <div style={{ font: "var(--text-label)", color: "var(--gray-2)", marginBottom: 6 }}>Question types</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {OFFLINE_TYPES.map((t) => (
                  <button key={t.key}
                    onClick={() => setOfflineTypes((cur) => cur.includes(t.key) ? cur.filter((x) => x !== t.key) : [...cur, t.key])}
                    style={optBtn(offlineTypes.includes(t.key))}>{t.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ font: "var(--text-label)", color: "var(--gray-2)", marginBottom: 6 }}>Number of questions</div>
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

      {message && (
        <p style={{ font: "var(--text-small)", color: phase === "error" ? "var(--danger)" : "var(--gray-2)", margin: "0 0 12px" }}>
          {phase === "generating" && <span className="qa-spin" style={{ marginRight: 6 }}>◠</span>}
          {message}
        </p>
      )}

      <div style={{ maxWidth: 260 }}>
        <Button onClick={run} disabled={!file || busy || (method === "local" && !conn)} loading={busy}>
          {busy ? "Working…" : method === "offline" ? "Generate quiz (free)" : method === "local" ? "Generate with my model" : "Generate summary + quiz"}
        </Button>
      </div>
    </Card>
  );
}

const numInput: React.CSSProperties = {
  width: 84, padding: "6px 10px", border: "1px solid var(--gray-5)", borderRadius: "var(--radius-sm)", font: "var(--text-body)",
};
const fieldLabel: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 4, font: "var(--text-small)", color: "var(--gray-2)",
};
const fieldInput: React.CSSProperties = {
  padding: "8px 10px", border: "1px solid var(--gray-5)", borderRadius: "var(--radius-sm)", font: "var(--text-body)", width: "100%",
};
const smallBtn: React.CSSProperties = {
  padding: "7px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--gray-5)", background: "#fff", color: "var(--gray-1)", font: "var(--text-label)", cursor: "pointer",
};
const smallBtnPrimary: React.CSSProperties = {
  ...smallBtn, border: "1px solid var(--asu-maroon)", background: "var(--asu-maroon)", color: "#fff",
};
const linkBtn: React.CSSProperties = {
  border: "none", background: "transparent", color: "var(--asu-maroon)", font: "var(--text-label)", cursor: "pointer", flexShrink: 0,
};
function optBtn(active: boolean): React.CSSProperties {
  return {
    padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid",
    borderColor: active ? "var(--asu-maroon)" : "var(--gray-5)",
    background: active ? "var(--surface-maroon-tint)" : "#fff",
    color: active ? "var(--asu-maroon)" : "var(--gray-2)",
    font: "var(--text-label)", textTransform: "capitalize",
  };
}
