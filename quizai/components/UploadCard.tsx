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

type Phase = "idle" | "uploading" | "generating" | "done" | "error";
type Method = "offline" | "ai";

export function UploadCard({ userId }: { userId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [method, setMethod] = useState<Method>("offline");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [numQuestions, setNumQuestions] = useState(8);
  const [perModel, setPerModel] = useState(2);
  const [kinds, setKinds] = useState<QuestionKind[]>(["mcq"]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");

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

  async function run() {
    if (!file) return;
    setPhase("uploading");
    setMessage("Uploading your PDF…");
    const supabase = createClient();
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

    setPhase("generating");
    setMessage(
      method === "offline"
        ? "Building your quiz offline (no credits)…"
        : "Reading the document and writing your quiz…",
    );

    const endpoint = method === "offline" ? "/api/generate-offline" : "/api/generate";
    const payload =
      method === "offline"
        ? { documentId: docId, perModel }
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
    router.refresh();
  }

  function fail(msg: string) {
    setPhase("error");
    setMessage(msg);
  }

  const busy = phase === "uploading" || phase === "generating";

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
      <div style={{ display: "flex", background: "var(--surface-panel)", border: "1px solid var(--hairline)", borderRadius: 10, padding: 4, marginBottom: 8 }}>
        <button onClick={() => setMethod("offline")} style={seg(method === "offline")}>⚡ Offline · free</button>
        <button onClick={() => setMethod("ai")} style={seg(method === "ai")}>✨ AI · Claude</button>
      </div>
      <p style={{ font: "var(--text-small)", color: "var(--text-muted)", margin: "0 0 14px" }}>
        {method === "offline"
          ? "10 question styles generated on-device. No credits used."
          : "Claude writes a summary + quiz. Uses your API credits."}
      </p>

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
        {method === "ai" ? (
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
          <div>
            <div style={{ font: "var(--text-label)", color: "var(--gray-2)", marginBottom: 6 }}>Questions per style</div>
            <input type="number" min={1} max={5} value={perModel} onChange={(e) => setPerModel(Number(e.target.value))} style={numInput} />
            <div style={{ font: "var(--text-small)", color: "var(--text-muted)", marginTop: 4 }}>Up to {perModel * 10} questions across 10 styles.</div>
          </div>
        )}
      </div>

      {message && (
        <p style={{ font: "var(--text-small)", color: phase === "error" ? "var(--danger)" : "var(--gray-2)", margin: "0 0 12px" }}>
          {phase === "generating" && <span className="qa-spin" style={{ marginRight: 6 }}>◠</span>}
          {message}
        </p>
      )}

      <div style={{ maxWidth: 260 }}>
        <Button onClick={run} disabled={!file || busy} loading={busy}>
          {busy ? "Working…" : method === "offline" ? "Generate quiz (free)" : "Generate summary + quiz"}
        </Button>
      </div>
    </Card>
  );
}

const numInput: React.CSSProperties = {
  width: 84, padding: "6px 10px", border: "1px solid var(--gray-5)", borderRadius: "var(--radius-sm)", font: "var(--text-body)",
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
