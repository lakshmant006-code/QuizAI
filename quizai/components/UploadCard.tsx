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

export function UploadCard({ userId }: { userId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [numQuestions, setNumQuestions] = useState(8);
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
    if (upErr) {
      setPhase("error");
      setMessage(upErr.message);
      return;
    }

    const { error: insErr } = await supabase.from("documents").insert({
      id: docId,
      user_id: userId,
      title,
      storage_path: path,
      status: "uploaded",
    });
    if (insErr) {
      setPhase("error");
      setMessage(insErr.message);
      return;
    }

    setPhase("generating");
    setMessage("Reading the document and writing your quiz…");
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: docId,
        difficulty,
        numQuestions,
        kinds: kinds.length ? kinds : ["mcq"],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPhase("error");
      setMessage(data.error || "Generation failed.");
      router.refresh();
      return;
    }

    setPhase("done");
    setMessage(`Done — ${data.questionCount} questions and a summary are ready.`);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  const busy = phase === "uploading" || phase === "generating";

  return (
    <Card style={{ padding: 22 }}>
      <h2 style={{ font: "var(--text-h3)", color: "var(--gray-1)", margin: "0 0 4px" }}>New study material</h2>
      <p style={{ font: "var(--text-small)", color: "var(--text-muted)", margin: "0 0 16px" }}>
        Upload a PDF — Claude will generate a summary and a quiz.
      </p>

      {/* Drop / pick zone */}
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          padding: "22px 16px",
          border: "1.5px dashed var(--hairline-strong)",
          borderRadius: "var(--radius-lg)",
          background: file ? "var(--surface-maroon-tint)" : "var(--surface-panel)",
          cursor: "pointer",
          textAlign: "center",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
        <span style={{ fontSize: 24 }}>📄</span>
        <span style={{ font: "var(--text-body)", color: "var(--gray-1)" }}>
          {file ? file.name : "Click to choose a PDF or drop it here"}
        </span>
        {file && (
          <span style={{ font: "var(--text-small)", color: "var(--text-muted)" }}>
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
        )}
      </label>

      {/* Options */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, margin: "16px 0" }}>
        <div>
          <div style={{ font: "var(--text-label)", color: "var(--gray-2)", marginBottom: 6 }}>Difficulty</div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid",
                  borderColor: difficulty === d ? "var(--asu-maroon)" : "var(--gray-5)",
                  background: difficulty === d ? "var(--surface-maroon-tint)" : "#fff",
                  color: difficulty === d ? "var(--asu-maroon)" : "var(--gray-2)",
                  font: "var(--text-label)",
                  textTransform: "capitalize",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ font: "var(--text-label)", color: "var(--gray-2)", marginBottom: 6 }}>Questions</div>
          <input
            type="number"
            min={3}
            max={20}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            style={{
              width: 72,
              padding: "6px 10px",
              border: "1px solid var(--gray-5)",
              borderRadius: "var(--radius-sm)",
              font: "var(--text-body)",
            }}
          />
        </div>

        <div>
          <div style={{ font: "var(--text-label)", color: "var(--gray-2)", marginBottom: 6 }}>Question types</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {KINDS.map((k) => (
              <button
                key={k.key}
                onClick={() => toggleKind(k.key)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid",
                  borderColor: kinds.includes(k.key) ? "var(--asu-maroon)" : "var(--gray-5)",
                  background: kinds.includes(k.key) ? "var(--surface-maroon-tint)" : "#fff",
                  color: kinds.includes(k.key) ? "var(--asu-maroon)" : "var(--gray-2)",
                  font: "var(--text-label)",
                }}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <p
          style={{
            font: "var(--text-small)",
            color: phase === "error" ? "var(--danger)" : "var(--gray-2)",
            margin: "0 0 12px",
          }}
        >
          {phase === "generating" && <span className="qa-spin" style={{ marginRight: 6 }}>◠</span>}
          {message}
        </p>
      )}

      <div style={{ maxWidth: 240 }}>
        <Button onClick={run} disabled={!file || busy} loading={busy}>
          {busy ? "Working…" : "Generate summary + quiz"}
        </Button>
      </div>
    </Card>
  );
}
