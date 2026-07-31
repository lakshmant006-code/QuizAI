import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";

export default async function QuizzesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, title, difficulty, created_at, questions(count), quiz_attempts(score,total)")
    .order("created_at", { ascending: false });

  const list = quizzes ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <RealtimeRefresh userId={user!.id} />
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--gray-1)", margin: 0 }}>
        Quizzes
      </h1>

      {list.length === 0 ? (
        <Card>
          <p style={{ font: "var(--text-body)", color: "var(--text-muted)", margin: 0 }}>
            No quizzes yet. Upload a PDF from the dashboard to generate one.
          </p>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {list.map((q) => {
            // Supabase returns aggregate as array of {count}
            const count = Array.isArray(q.questions) ? (q.questions[0]?.count ?? 0) : 0;
            const attempts = Array.isArray(q.quiz_attempts) ? q.quiz_attempts : [];
            const best =
              attempts.length > 0
                ? Math.max(...attempts.map((a) => (a.total ? Math.round((a.score / a.total) * 100) : 0)))
                : null;
            return (
              <Card key={q.id} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
                  <h2 style={{ font: "var(--text-h3)", color: "var(--gray-1)", margin: 0 }}>{q.title}</h2>
                  <Badge tone="neutral">{q.difficulty}</Badge>
                </div>
                <div style={{ font: "var(--text-small)", color: "var(--text-muted)" }}>
                  {count} questions
                  {best !== null && <> · best {best}%</>}
                </div>
                <Link
                  href={`/quizzes/${q.id}`}
                  style={{
                    marginTop: "auto",
                    display: "inline-block",
                    textAlign: "center",
                    padding: "9px 14px",
                    background: "var(--asu-maroon)",
                    color: "#fff",
                    borderRadius: "var(--radius-md)",
                    font: "var(--text-label)",
                  }}
                >
                  {attempts.length ? "Retake quiz" : "Start quiz"}
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
