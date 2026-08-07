"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Button, Badge } from "@/components/ui";
import type { Question } from "@/lib/types";

const MODEL_LABELS: Record<string, string> = {
  cloze: "Fill in the blank",
  wh_question: "Direct question",
  association: "Related concepts",
  multi_select: "Select all that apply",
  term_to_def: "Term → definition",
  def_to_term: "Definition → term",
  true_false: "Yes / No",
  match: "Match the pairs",
  sequence: "Put in order",
  short_answer: "Short answer",
  flashcards: "Flashcards",
};

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}
function parse<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export function QuizRunner({ quizId, questions }: { quizId: string; questions: Question[] }) {
  const router = useRouter();
  const gradable = useMemo(() => questions.filter((q) => q.kind !== "flashcard"), [questions]);

  // Answers: mcq/tf/short -> string; match -> JSON {term:def}; order -> JSON string[]
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState(0);

  // Stable shuffled definition pools for match questions.
  const matchPools = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const q of questions) {
      if (q.kind === "match") {
        const pairs = parse<{ term: string; definition: string }[]>(q.answer, []);
        m[q.id] = pairs.map((p) => p.definition).sort(() => Math.random() - 0.5);
      }
    }
    return m;
  }, [questions]);

  function orderFor(q: Question): string[] {
    if (orders[q.id]) return orders[q.id];
    return q.options ?? [];
  }
  function move(q: Question, i: number, dir: -1 | 1) {
    const list = [...orderFor(q)];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setOrders((o) => ({ ...o, [q.id]: list }));
  }

  if (questions.length === 0) {
    return <Card><p style={{ font: "var(--text-body)", color: "var(--text-muted)", margin: 0 }}>This quiz has no questions.</p></Card>;
  }

  function isCorrect(q: Question): boolean {
    if (q.kind === "flashcard") return true;
    if (q.kind === "match") {
      const pairs = parse<{ term: string; definition: string }[]>(q.answer, []);
      const picks = parse<Record<string, string>>(answers[q.id] ?? "{}", {});
      return pairs.length > 0 && pairs.every((p) => norm(picks[p.term] ?? "") === norm(p.definition));
    }
    if (q.kind === "order") {
      const correct = parse<string[]>(q.answer, []);
      const given = orders[q.id] ?? q.options ?? [];
      return correct.length > 0 && correct.length === given.length && correct.every((c, i) => norm(c) === norm(given[i]));
    }
    if (q.kind === "multi") {
      const correct = parse<string[]>(q.answer, []).map(norm).sort();
      const sel = parse<string[]>(answers[q.id] ?? "[]", []).map(norm).sort();
      return correct.length > 0 && correct.length === sel.length && correct.every((c, i) => c === sel[i]);
    }
    const given = answers[q.id];
    if (!given) return false;
    if (q.kind === "short") return norm(given) === norm(q.answer) || norm(q.answer).includes(norm(given));
    return norm(given) === norm(q.answer);
  }

  async function submit() {
    const correct = gradable.filter(isCorrect).length;
    setScore(correct);
    setSubmitted(true);
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("quiz_attempts").insert({
        quiz_id: quizId,
        user_id: user.id,
        score: correct,
        total: gradable.length || 1,
        answers,
      });
    }
    setSaving(false);
    router.refresh();
  }

  const pct = gradable.length ? Math.round((score / gradable.length) * 100) : 0;
  const modelsUsed = Array.from(new Set(questions.map((q) => q.model).filter(Boolean))) as string[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {submitted && (
        <Card style={{ padding: 20, textAlign: "center", background: "var(--surface-maroon-tint)", border: "1px solid var(--border-maroon-tint)" }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: "var(--asu-maroon)" }}>{pct}%</div>
          <div style={{ font: "var(--text-body)", color: "var(--gray-2)" }}>
            {score} of {gradable.length} correct. {saving ? "Saving…" : "Attempt saved."}
          </div>
        </Card>
      )}

      {questions.map((q, i) => {
        const correct = submitted && isCorrect(q);
        return (
          <Card key={q.id} style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 10, alignItems: "center" }}>
              <div style={{ font: "var(--text-label)", color: "var(--gray-3)" }}>
                {q.kind === "flashcard" ? "Flashcards" : `Question ${i + 1}`}
                {q.model && <span style={{ marginLeft: 8, color: "var(--gray-4)" }}>· {MODEL_LABELS[q.model] ?? q.model}</span>}
              </div>
              {submitted && q.kind !== "flashcard" && <Badge tone={correct ? "success" : "danger"}>{correct ? "Correct" : "Review"}</Badge>}
            </div>
            {q.kind !== "flashcard" && (
              <div style={{ font: "var(--text-body)", fontWeight: 600, color: "var(--gray-1)", marginBottom: 12, whiteSpace: "pre-wrap" }}>{q.prompt}</div>
            )}

            {/* ---- MCQ / TF ---- */}
            {(q.kind === "mcq" || q.kind === "tf") && (
              <div style={{ display: "grid", gap: 8 }}>
                {(q.options ?? []).map((opt) => {
                  const selected = answers[q.id] === opt;
                  const isAns = submitted && norm(opt) === norm(q.answer);
                  return (
                    <button key={opt} disabled={submitted} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      style={optStyle(selected, isAns)}>{opt}</button>
                  );
                })}
              </div>
            )}

            {/* ---- Multi-select ---- */}
            {q.kind === "multi" && (
              <div style={{ display: "grid", gap: 8 }}>
                {(q.options ?? []).map((opt) => {
                  const sel = parse<string[]>(answers[q.id] ?? "[]", []);
                  const checked = sel.includes(opt);
                  const isAns = submitted && parse<string[]>(q.answer, []).map(norm).includes(norm(opt));
                  return (
                    <button
                      key={opt}
                      disabled={submitted}
                      onClick={() => {
                        const cur = parse<string[]>(answers[q.id] ?? "[]", []);
                        const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
                        setAnswers((a) => ({ ...a, [q.id]: JSON.stringify(next) }));
                      }}
                      style={{ ...optStyle(checked, isAns), display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span style={{ width: 18, height: 18, borderRadius: 5, border: "1.5px solid", borderColor: isAns ? "var(--success)" : checked ? "var(--asu-maroon)" : "var(--gray-4)", background: checked ? "var(--asu-maroon)" : "transparent", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>
                        {checked && <i className="ph ph-check" />}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ---- Short answer ---- */}
            {q.kind === "short" && (
              <input disabled={submitted} value={answers[q.id] ?? ""} placeholder="Type your answer"
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--gray-5)", borderRadius: "var(--radius-md)", font: "var(--text-body)" }} />
            )}

            {/* ---- Match ---- */}
            {q.kind === "match" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {parse<{ term: string; definition: string }[]>(q.answer, []).map((p) => {
                  const picks = parse<Record<string, string>>(answers[q.id] ?? "{}", {});
                  const right = submitted && norm(picks[p.term] ?? "") === norm(p.definition);
                  return (
                    <div key={p.term} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ font: "var(--text-label)", color: "var(--asu-maroon)", minWidth: 120 }}>{p.term}</span>
                      <select disabled={submitted} value={picks[p.term] ?? ""}
                        onChange={(e) => {
                          const next = { ...picks, [p.term]: e.target.value };
                          setAnswers((a) => ({ ...a, [q.id]: JSON.stringify(next) }));
                        }}
                        style={{ flex: 1, minWidth: 180, padding: "8px 10px", borderRadius: "var(--radius-sm)", border: `1px solid ${submitted ? (right ? "var(--success)" : "var(--danger)") : "var(--gray-5)"}`, font: "var(--text-small)" }}>
                        <option value="">Choose…</option>
                        {(matchPools[q.id] ?? []).map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ---- Order ---- */}
            {q.kind === "order" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {orderFor(q).map((item, idx) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "1px solid var(--hairline)", borderRadius: "var(--radius-sm)" }}>
                    <span style={{ font: "var(--text-label)", color: "var(--gray-3)", width: 18 }}>{idx + 1}</span>
                    <span style={{ flex: 1, font: "var(--text-small)", color: "var(--gray-1)" }}>{item}</span>
                    {!submitted && (
                      <span style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => move(q, idx, -1)} style={arrowBtn}>↑</button>
                        <button onClick={() => move(q, idx, 1)} style={arrowBtn}>↓</button>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ---- Flashcards ---- */}
            {q.kind === "flashcard" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                {parse<{ front: string; back: string }[]>(q.answer, []).map((c, idx) => <Flashcard key={idx} front={c.front} back={c.back} />)}
              </div>
            )}

            {submitted && q.kind !== "flashcard" && (
              <div style={{ marginTop: 12, padding: 12, background: "var(--surface-panel)", borderRadius: "var(--radius-md)" }}>
                {!correct && <div style={{ font: "var(--text-small)", color: "var(--gray-2)", marginBottom: 4 }}>Answer: <strong>{shortAnswer(q)}</strong></div>}
                {q.explanation && <div style={{ font: "var(--text-small)", color: "var(--gray-2)" }}>{q.explanation}</div>}
              </div>
            )}
          </Card>
        );
      })}

      {!submitted ? (
        <div style={{ maxWidth: 200 }}>
          <Button onClick={submit} disabled={Object.keys(answers).length === 0 && Object.keys(orders).length === 0}>Submit quiz</Button>
        </div>
      ) : (
        <>
          {modelsUsed.length > 0 && <ModelRatings models={modelsUsed} />}
          <div style={{ maxWidth: 200 }}>
            <Button variant="secondary" onClick={() => { setAnswers({}); setOrders({}); setSubmitted(false); setScore(0); }}>Try again</Button>
          </div>
        </>
      )}
    </div>
  );
}

function shortAnswer(q: Question): string {
  if (q.kind === "match") return parse<{ term: string; definition: string }[]>(q.answer, []).map((p) => `${p.term} → ${p.definition}`).join("; ");
  if (q.kind === "order") return parse<string[]>(q.answer, []).map((s, i) => `${i + 1}. ${s}`).join("  ");
  if (q.kind === "multi") return parse<string[]>(q.answer, []).join("; ");
  return q.answer;
}

function Flashcard({ front, back }: { front: string; back: string }) {
  const [flip, setFlip] = useState(false);
  return (
    <button onClick={() => setFlip((f) => !f)}
      style={{ minHeight: 90, padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--hairline)", background: flip ? "var(--surface-maroon-tint)" : "#fff", cursor: "pointer", textAlign: "center", font: "var(--text-small)", color: "var(--gray-1)" }}>
      {flip ? back : <strong>{front}</strong>}
      <div style={{ marginTop: 6, font: "var(--text-small)", color: "var(--text-muted)", fontSize: 11 }}>{flip ? "definition" : "tap to flip"}</div>
    </button>
  );
}

function ModelRatings({ models }: { models: string[] }) {
  const [rated, setRated] = useState<Record<string, number>>({});
  async function rate(model: string, rating: 1 | -1) {
    setRated((r) => ({ ...r, [model]: rating }));
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("model_ratings").upsert({ user_id: user.id, model, rating });
  }
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ font: "var(--text-h3)", color: "var(--gray-1)", marginBottom: 4 }}>Rate these quiz styles</div>
      <div style={{ font: "var(--text-small)", color: "var(--text-muted)", marginBottom: 12 }}>Your favorites will be used more often.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {models.map((m) => (
          <div key={m} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ font: "var(--text-body)", color: "var(--gray-1)" }}>{MODEL_LABELS[m] ?? m}</span>
            <span style={{ display: "flex", gap: 6 }}>
              <button onClick={() => rate(m, 1)} style={thumb(rated[m] === 1, "up")}><i className="ph ph-thumbs-up" /></button>
              <button onClick={() => rate(m, -1)} style={thumb(rated[m] === -1, "down")}><i className="ph ph-thumbs-down" /></button>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function optStyle(selected: boolean, isAns: boolean): React.CSSProperties {
  return {
    textAlign: "left", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid",
    borderColor: isAns ? "var(--success)" : selected ? "var(--asu-maroon)" : "var(--gray-5)",
    background: isAns ? "var(--success-bg)" : selected ? "var(--surface-maroon-tint)" : "#fff",
    color: "var(--gray-1)", font: "var(--text-body)", cursor: "pointer",
  };
}
const arrowBtn: React.CSSProperties = { width: 26, height: 26, borderRadius: 6, border: "1px solid var(--gray-5)", background: "#fff", cursor: "pointer", color: "var(--gray-2)" };
function thumb(active: boolean, dir: "up" | "down"): React.CSSProperties {
  return {
    width: 34, height: 30, borderRadius: 8, border: "1px solid", cursor: "pointer",
    borderColor: active ? (dir === "up" ? "var(--success)" : "var(--danger)") : "var(--gray-5)",
    background: active ? (dir === "up" ? "var(--success-bg)" : "var(--danger-bg)") : "#fff",
    color: active ? (dir === "up" ? "var(--success)" : "var(--danger)") : "var(--gray-3)",
  };
}
