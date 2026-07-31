import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatTile, Card, Badge } from "@/components/ui";
import { UploadCard } from "@/components/UploadCard";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import type { Document, QuizAttempt } from "@/lib/types";

function statusTone(status: string) {
  if (status === "ready") return "success" as const;
  if (status === "failed") return "danger" as const;
  return "gold" as const;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [{ data: docs }, { data: attempts }, quizzesCount, tasksAll] = await Promise.all([
    supabase.from("documents").select("*").order("created_at", { ascending: false }).limit(6),
    supabase.from("quiz_attempts").select("score,total,created_at").order("created_at", { ascending: false }),
    supabase.from("quizzes").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("done"),
  ]);

  const documents = (docs ?? []) as Document[];
  const allAttempts = (attempts ?? []) as Pick<QuizAttempt, "score" | "total" | "created_at">[];
  const totalQuizzes = quizzesCount.count ?? 0;
  const tasks = tasksAll.data ?? [];
  const tasksDone = tasks.filter((t) => t.done).length;

  const avgScore =
    allAttempts.length > 0
      ? Math.round(
          (allAttempts.reduce((s, a) => s + (a.total ? a.score / a.total : 0), 0) /
            allAttempts.length) *
            100,
        )
      : null;

  const name = (user!.email || "there").split("@")[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <RealtimeRefresh userId={userId} />

      <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--gray-1)", margin: 0 }}>
        Welcome back, {name}
      </h1>

      {/* Stats */}
      <div className="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14 }}>
        <StatTile label="Documents" value={documents.length} hint="uploaded" />
        <StatTile label="Quizzes" value={totalQuizzes} hint="generated" accent="var(--asu-maroon)" />
        <StatTile label="Avg. score" value={avgScore === null ? "—" : `${avgScore}%`} hint={`${allAttempts.length} attempts`} />
        <StatTile label="Tasks done" value={`${tasksDone}/${tasks.length}`} hint="accountability" />
      </div>

      {/* Upload + recent */}
      <div className="dash-split" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 24, alignItems: "start" }}>
        <UploadCard userId={userId} />

        <Card style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ font: "var(--text-h3)", color: "var(--gray-1)", margin: 0 }}>Recent uploads</h2>
            <Link href="/summaries" style={{ font: "var(--text-small)", color: "var(--asu-maroon)" }}>
              View all
            </Link>
          </div>
          {documents.length === 0 ? (
            <p style={{ font: "var(--text-body)", color: "var(--text-muted)", margin: 0 }}>
              No documents yet. Upload a PDF to get started.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {documents.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "10px 12px",
                    border: "1px solid var(--hairline)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        font: "var(--text-body)",
                        color: "var(--gray-1)",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {d.title}
                    </div>
                    <div style={{ font: "var(--text-small)", color: "var(--text-muted)" }}>
                      {d.page_count ? `${d.page_count} pages · ` : ""}
                      {new Date(d.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <style>{`
        @media (max-width: 900px){
          .dash-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}
          .dash-split{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
}
