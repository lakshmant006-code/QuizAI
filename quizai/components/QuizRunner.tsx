"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Button, Badge } from "@/components/ui";
import type { Question } from "@/lib/types";

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function QuizRunner({ quizId, questions }: { quizId: string; questions: Question[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState(0);

  if (questions.length === 0) {
    return (
      <Card>
        <p style={{ font: "var(--text-body)", color: "var(--text-muted)", margin: 0 }}>
          This quiz has no questions.
        </p>
      </Card>
    );
  }

  function isCorrect(q: Question) {
    const given = answers[q.id];
    if (!given) return false;
    if (q.kind === "short") {
      // Lenient match: exact normalized or strong overlap with the model answer.
      return normalize(given) === normalize(q.answer) || normalize(q.answer).includes(normalize(given));
    }
    return normalize(given) === normalize(q.answer);
  }

  async function submit() {
    const correct = questions.filter(isCorrect).length;
    setScore(correct);
    setSubmitted(true);
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("quiz_attempts").insert({
        quiz_id: quizId,
        user_id: user.id,
        score: correct,
        total: questions.length,
        answers,
      });
    }
    setSaving(false);
    router.refresh();
  }

  const pct = Math.round((score / questions.length) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {submitted && (
        <Card style={{ padding: 20, textAlign: "center", background: "var(--surface-maroon-tint)", border: "1px solid var(--border-maroon-tint)" }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: "var(--asu-maroon)" }}>{pct}%</div>
          <div style={{ font: "var(--text-body)", color: "var(--gray-2)" }}>
            You got {score} of {questions.length} correct. {saving ? "Saving…" : "Attempt saved."}
          </div>
        </Card>
      )}

      {questions.map((q, i) => {
        const given = answers[q.id];
        const correct = submitted && isCorrect(q);
        const wrong = submitted && !correct;
        return (
          <Card key={q.id} style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
              <div style={{ font: "var(--text-label)", color: "var(--gray-3)" }}>Question {i + 1}</div>
              {submitted && <Badge tone={correct ? "success" : "danger"}>{correct ? "Correct" : "Review"}</Badge>}
            </div>
            <div style={{ font: "var(--text-body)", fontWeight: 600, color: "var(--gray-1)", marginBottom: 12 }}>
              {q.prompt}
            </div>

            {q.kind === "short" ? (
              <input
                disabled={submitted}
                value={given ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder="Type your answer"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--gray-5)",
                  borderRadius: "var(--radius-md)",
                  font: "var(--text-body)",
                }}
              />
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {(q.options ?? []).map((opt) => {
                  const selected = given === opt;
                  const isAnswer = submitted && normalize(opt) === normalize(q.answer);
                  return (
                    <button
                      key={opt}
                      disabled={submitted}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      style={{
                        textAlign: "left",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid",
                        borderColor: isAnswer
                          ? "var(--success)"
                          : selected
                          ? "var(--asu-maroon)"
                          : "var(--gray-5)",
                        background: isAnswer
                          ? "var(--success-bg)"
                          : selected
                          ? "var(--surface-maroon-tint)"
                          : "#fff",
                        color: "var(--gray-1)",
                        font: "var(--text-body)",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {submitted && (
              <div style={{ marginTop: 12, padding: 12, background: "var(--surface-panel)", borderRadius: "var(--radius-md)" }}>
                {wrong && (
                  <div style={{ font: "var(--text-small)", color: "var(--gray-2)", marginBottom: 4 }}>
                    Answer: <strong>{q.answer}</strong>
                  </div>
                )}
                {q.explanation && (
                  <div style={{ font: "var(--text-small)", color: "var(--gray-2)" }}>{q.explanation}</div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {!submitted && (
        <div style={{ maxWidth: 200 }}>
          <Button onClick={submit} disabled={Object.keys(answers).length === 0}>
            Submit quiz
          </Button>
        </div>
      )}
      {submitted && (
        <div style={{ maxWidth: 200 }}>
          <Button
            variant="secondary"
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
              setScore(0);
            }}
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
