import { createClient } from "@/lib/supabase/server";
import { Tile, TileLabel, BigNum } from "@/components/bento";
import { Avatar } from "@/components/ui";
import { ProfileForm } from "@/components/ProfileForm";
import type { QuizAttempt } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: attempts }, docCount, quizCount] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("quiz_attempts").select("score,total"),
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("quizzes").select("id", { count: "exact", head: true }),
  ]);

  const all = (attempts ?? []) as Pick<QuizAttempt, "score" | "total">[];
  const avg = all.length ? Math.round((all.reduce((s, a) => s + (a.total ? a.score / a.total : 0), 0) / all.length) * 100) : null;
  const email = profile?.email || user!.email || "";
  const name = profile?.full_name || email.split("@")[0];
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 760 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--gray-1)", margin: 0 }}>Profile</h1>

      <Tile style={{ flexDirection: "row", alignItems: "center", gap: 18, padding: 24 }}>
        <Avatar initials={initials} size={64} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--gray-1)" }}>{name}</div>
          <div style={{ font: "var(--text-body)", color: "var(--text-muted)" }}>{email}</div>
          <div style={{ font: "var(--text-small)", color: "var(--text-muted)", marginTop: 4 }}>
            <i className="fa-regular fa-calendar" style={{ marginRight: 6 }} />
            Member since {profile ? new Date(profile.created_at).toLocaleDateString() : "—"}
          </div>
        </div>
      </Tile>

      <Tile style={{ gap: 16, padding: 24 }}>
        <h2 style={{ font: "var(--text-h3)", color: "var(--gray-1)", margin: 0 }}>
          <i className="fa-solid fa-pen" style={{ marginRight: 10, color: "var(--asu-maroon)" }} />Edit profile
        </h2>
        <ProfileForm userId={user!.id} initialName={name} email={email} />
      </Tile>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <Tile style={{ gap: 6 }}>
          <TileLabel><i className="fa-solid fa-file-pdf" style={{ marginRight: 6, color: "var(--asu-maroon)" }} />Documents</TileLabel>
          <BigNum>{docCount.count ?? 0}</BigNum>
        </Tile>
        <Tile fill="maroon" style={{ gap: 6 }}>
          <TileLabel on="dark"><i className="fa-solid fa-circle-question" style={{ marginRight: 6 }} />Quizzes</TileLabel>
          <BigNum on="dark">{quizCount.count ?? 0}</BigNum>
        </Tile>
        <Tile style={{ gap: 6 }}>
          <TileLabel><i className="fa-solid fa-chart-simple" style={{ marginRight: 6, color: "var(--asu-maroon)" }} />Avg. score</TileLabel>
          <BigNum>{avg === null ? "—" : `${avg}%`}</BigNum>
          <div style={{ font: "var(--text-small)", color: "var(--text-muted)" }}>{all.length} attempts</div>
        </Tile>
      </div>
    </div>
  );
}
