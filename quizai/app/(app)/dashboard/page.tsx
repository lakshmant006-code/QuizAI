import { createClient } from "@/lib/supabase/server";
import { UploadCard } from "@/components/UploadCard";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { Tile, TileLabel, BigNum, TrendPill, MiniBars, ListRow, BandHead } from "@/components/bento";
import { Mascot } from "@/components/Mascot";
import { DeleteButton } from "@/components/DeleteButton";
import type { Document, QuizAttempt, Summary, Task } from "@/lib/types";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "numeric" });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id;

  const [{ data: docs }, { data: attempts }, quizzesCount, { data: summaries }, { data: tasks }] = await Promise.all([
    supabase.from("documents").select("*").order("created_at", { ascending: false }),
    supabase.from("quiz_attempts").select("score,total,created_at,quiz_id").order("created_at", { ascending: false }),
    supabase.from("quizzes").select("id", { count: "exact", head: true }),
    supabase.from("summaries").select("id, overview, created_at, documents(title)").order("created_at", { ascending: false }).limit(4),
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
  ]);

  const documents = (docs ?? []) as Document[];
  const allAttempts = (attempts ?? []) as (Pick<QuizAttempt, "score" | "total" | "created_at"> & { quiz_id: string })[];
  const summaryList = (summaries ?? []) as unknown as (Pick<Summary, "id" | "overview" | "created_at"> & { documents: { title: string } | null })[];
  const taskList = (tasks ?? []) as Task[];

  const totalQuizzes = quizzesCount.count ?? 0;
  const totalPages = documents.reduce((s, d) => s + (d.page_count ?? 0), 0);
  const avgScore = allAttempts.length
    ? Math.round((allAttempts.reduce((s, a) => s + (a.total ? a.score / a.total : 0), 0) / allAttempts.length) * 100)
    : null;

  // Weekly attempt counts (last 7 days, oldest -> newest).
  const today = new Date();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toDateString();
    return allAttempts.filter((a) => new Date(a.created_at).toDateString() === key).length;
  });

  const done = taskList.filter((t) => t.done).length;
  const pct = taskList.length ? Math.round((done / taskList.length) * 100) : 0;
  const name = (user!.email || "there").split("@")[0];

  return (
    <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "repeat(12,minmax(0,1fr))", gap: 14, alignContent: "start" }}>
      <RealtimeRefresh userId={userId} />
      <Mascot
        href="/quizzes"
        messages={[
          "Time for a quiz? 🐙",
          "Upload a PDF — I'll make a summary!",
          "Retake a quiz to boost your score!",
          "Check off a study task today!",
        ]}
      />

      <h1 style={{ gridColumn: "1 / -1", fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--gray-1)", margin: 0 }}>
        Welcome back, {name}
      </h1>

      {/* ---------- Band 1 · Quizzes ---------- */}
      <BandHead action="New quiz →" href="/quizzes">Quizzes</BandHead>

      <div className="dash-upload" style={{ gridColumn: "span 5" }}><UploadCard userId={userId} /></div>

      <div className="dash-stats-col" style={{ gridColumn: "span 7", display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="dash-stats" style={{ display: "grid", gridTemplateColumns: "4fr 3fr", gap: 14 }}>
          <Tile style={{ gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <TileLabel>This week</TileLabel>
              {allAttempts.length > 0 && <TrendPill>{allAttempts.length} attempts</TrendPill>}
            </div>
            <MiniBars data={week} />
            <div style={{ display: "flex", gap: 28 }}>
              <div><TileLabel>Attempted</TileLabel><BigNum size={26}>{allAttempts.length}</BigNum></div>
              <div><TileLabel>Avg. score</TileLabel><BigNum size={26}>{avgScore === null ? "—" : `${avgScore}%`}</BigNum></div>
            </div>
          </Tile>

          <Tile fill="maroon" hover style={{ gap: 8, justifyContent: "space-between" }}>
            <TileLabel on="dark">Quizzes generated</TileLabel>
            <div>
              <BigNum on="dark" size={40}>{totalQuizzes}</BigNum>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,0.72)", marginTop: 4 }}>ready to take</div>
            </div>
            <TrendPill on="dark">{documents.length} docs</TrendPill>
          </Tile>
        </div>

        {/* New plain card — blank for now */}
        <Tile style={{ flex: 1, minHeight: 96 }}>{null}</Tile>
      </div>

      {/* Documents */}
      <div style={{ gridColumn: "1 / -1", marginTop: 8 }}><TileLabel>Your documents</TileLabel></div>
      {documents.length === 0 ? (
        <Tile span={12}><span style={{ font: "var(--text-body)", color: "var(--text-muted)" }}>No documents yet — upload a PDF above to generate your first quiz and summary.</span></Tile>
      ) : (
        <div className="dash-decks" style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 }}>
          {documents.slice(0, 6).map((d) => (
            <Tile key={d.id} hover style={{ gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--surface-maroon-tint)", color: "var(--asu-maroon)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="fa-solid fa-file-pdf" />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--gray-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                  <div style={{ font: "var(--text-small)", color: "var(--gray-3)" }}>{fmtDate(d.created_at)}{d.page_count ? ` · ${d.page_count} pp` : ""}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ font: "var(--text-label)", fontSize: 11, padding: "3px 9px", borderRadius: 999, background: d.status === "ready" ? "var(--success-bg)" : d.status === "failed" ? "var(--danger-bg)" : "var(--surface-gold-tint)", color: d.status === "ready" ? "var(--success)" : d.status === "failed" ? "var(--danger)" : "var(--asu-maroon)" }}>{d.status}</span>
                <DeleteButton kind="document" id={d.id} storagePath={d.storage_path} />
              </div>
            </Tile>
          ))}
        </div>
      )}

      {/* ---------- Band 2 · Summaries ---------- */}
      <BandHead action="All summaries →" href="/summaries">Summaries</BandHead>

      <Tile span={3} fill="ink" hover style={{ gap: 10, justifyContent: "space-between" }}>
        <TileLabel on="dark">Documents studied</TileLabel>
        <div>
          <BigNum on="dark" size={44}>{documents.length}</BigNum>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,0.72)", marginTop: 4 }}>{totalPages} pages total</div>
        </div>
      </Tile>

      <Tile span={9} style={{ padding: "6px 20px 8px" }}>
        {summaryList.length === 0 ? (
          <div style={{ padding: "18px 0", font: "var(--text-body)", color: "var(--text-muted)" }}>Summaries will appear here after you upload a document.</div>
        ) : (
          summaryList.map((s, i) => (
            <ListRow key={s.id} icon="fa-regular fa-file-lines" title={s.documents?.title ?? "Summary"} meta={fmtDate(s.created_at)} href="/summaries" last={i === summaryList.length - 1} />
          ))
        )}
      </Tile>

      {/* ---------- Band 3 · Tasks ---------- */}
      <BandHead action="Open board →" href="/tasks">Tasks</BandHead>

      <Tile span={8} style={{ padding: "6px 20px 10px" }}>
        {taskList.length === 0 ? (
          <div style={{ padding: "18px 0", font: "var(--text-body)", color: "var(--text-muted)" }}>No tasks yet — add study tasks on the board to stay accountable.</div>
        ) : (
          taskList.slice(0, 5).map((t, i, arr) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i === arr.length - 1 ? "none" : "1px solid rgba(0,0,0,0.06)" }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, border: "1.5px solid", borderColor: t.done ? "var(--asu-maroon)" : "var(--gray-4)", background: t.done ? "var(--asu-maroon)" : "transparent", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>
                {t.done && <i className="fa-solid fa-check" />}
              </span>
              <span style={{ flex: 1, fontSize: 14, color: t.done ? "var(--gray-4)" : "var(--gray-1)", textDecoration: t.done ? "line-through" : "none" }}>{t.title}</span>
              {t.starred && <i className="fa-solid fa-star" style={{ color: "var(--asu-gold)", fontSize: 12 }} />}
            </div>
          ))
        )}
      </Tile>

      <Tile span={4} style={{ gap: 16, justifyContent: "space-between" }}>
        <div>
          <TileLabel>Completed</TileLabel>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 2 }}>
            <BigNum size={34}>{done}</BigNum>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 700, color: "var(--gray-4)" }}>/ {taskList.length}</span>
          </div>
        </div>
        <div>
          <div style={{ height: 8, background: "rgba(0,0,0,0.06)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "var(--asu-maroon)", borderRadius: 999, transition: "width .3s" }} />
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--gray-3)", marginTop: 8 }}>{pct}% done</div>
        </div>
      </Tile>

      <style>{`
        /* Tablet: collapse the 12-col spans to a simple 6-col rhythm */
        @media (max-width: 1024px){
          .dash-grid > *{ grid-column:1 / -1 !important; }
          .dash-upload{ grid-column:1 / -1 !important; }
        }
        @media (max-width: 560px){
          .dash-stats{ grid-template-columns:1fr !important; }
        }
      `}</style>
    </div>
  );
}
