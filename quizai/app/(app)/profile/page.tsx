import { createClient } from "@/lib/supabase/server";
import { Card, StatTile, Avatar } from "@/components/ui";
import type { QuizAttempt } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: attempts }, docCount, quizCount] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("quiz_attempts").select("score,total"),
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("quizzes").select("id", { count: "exact", head: true }),
  ]);

  const all = (attempts ?? []) as Pick<QuizAttempt, "score" | "total">[];
  const avg =
    all.length > 0
      ? Math.round((all.reduce((s, a) => s + (a.total ? a.score / a.total : 0), 0) / all.length) * 100)
      : null;

  const email = profile?.email || user!.email || "";
  const name = profile?.full_name || email.split("@")[0];
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--gray-1)", margin: 0 }}>
        Profile
      </h1>

      <Card style={{ padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <Avatar initials={initials} size={56} />
        <div>
          <div style={{ font: "var(--text-h3)", color: "var(--gray-1)" }}>{name}</div>
          <div style={{ font: "var(--text-body)", color: "var(--text-muted)" }}>{email}</div>
          <div style={{ font: "var(--text-small)", color: "var(--text-muted)", marginTop: 4 }}>
            Member since {profile ? new Date(profile.created_at).toLocaleDateString() : "—"}
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 14 }}>
        <StatTile label="Documents" value={docCount.count ?? 0} />
        <StatTile label="Quizzes" value={quizCount.count ?? 0} accent="var(--asu-maroon)" />
        <StatTile label="Avg. score" value={avg === null ? "—" : `${avg}%`} hint={`${all.length} attempts`} />
      </div>
    </div>
  );
}
