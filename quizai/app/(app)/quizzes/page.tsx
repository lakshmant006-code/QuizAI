import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Tile } from "@/components/bento";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { DeleteButton } from "@/components/DeleteButton";

export default async function QuizzesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, title, difficulty, created_at, questions(count), quiz_attempts(score,total)")
    .order("created_at", { ascending: false });

  const list = quizzes ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <RealtimeRefresh userId={user!.id} />
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--gray-1)", margin: 0 }}>
        <i className="ph ph-question" style={{ marginRight: 10, color: "var(--asu-maroon)" }} />Quizzes
      </h1>

      {list.length === 0 ? (
        <Tile><span style={{ font: "var(--text-body)", color: "var(--text-muted)" }}>No quizzes yet. Upload a PDF from the dashboard to generate one.</span></Tile>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {list.map((q) => {
            const count = Array.isArray(q.questions) ? (q.questions[0]?.count ?? 0) : 0;
            const attempts = Array.isArray(q.quiz_attempts) ? q.quiz_attempts : [];
            const best = attempts.length ? Math.max(...attempts.map((a) => (a.total ? Math.round((a.score / a.total) * 100) : 0))) : null;
            return (
              <Tile key={q.id} hover style={{ gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
                  <h2 style={{ display: "flex", alignItems: "center", gap: 10, font: "var(--text-h3)", color: "var(--gray-1)", margin: 0 }}>
                    <span style={{ width: 34, height: 34, borderRadius: 11, background: "var(--surface-maroon-tint)", color: "var(--asu-maroon)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className="ph ph-question" style={{ fontSize: 14 }} />
                    </span>
                    {q.title}
                  </h2>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ font: "var(--text-label)", fontSize: 11, padding: "3px 9px", borderRadius: 999, background: "var(--surface-chip)", color: "var(--gray-2)" }}>{q.difficulty}</span>
                    <DeleteButton kind="quiz" id={q.id} />
                  </span>
                </div>
                <div style={{ font: "var(--text-small)", color: "var(--text-muted)" }}>
                  {count} questions{best !== null && <> · best {best}%</>}
                </div>
                <Link href={`/quizzes/${q.id}`} style={{ marginTop: "auto", display: "inline-block", textAlign: "center", padding: "9px 14px", background: "var(--btn-primary)", color: "#fff", borderRadius: "var(--radius-md)", font: "var(--text-label)", boxShadow: "var(--shadow-button)" }}>
                  {attempts.length ? "Retake quiz" : "Start quiz"}
                </Link>
              </Tile>
            );
          })}
        </div>
      )}
    </div>
  );
}
