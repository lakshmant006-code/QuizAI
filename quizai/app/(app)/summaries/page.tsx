import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import type { Summary } from "@/lib/types";

export default async function SummariesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("summaries")
    .select("*, documents(title)")
    .order("created_at", { ascending: false });

  const summaries = (data ?? []) as (Summary & { documents: { title: string } | null })[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <RealtimeRefresh userId={user!.id} />
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--gray-1)", margin: 0 }}>
        Summaries
      </h1>

      {summaries.length === 0 ? (
        <Card>
          <p style={{ font: "var(--text-body)", color: "var(--text-muted)", margin: 0 }}>
            No summaries yet. Upload a PDF from the dashboard to generate one.
          </p>
        </Card>
      ) : (
        summaries.map((s) => (
          <Card key={s.id} style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
              <h2 style={{ font: "var(--text-h3)", color: "var(--asu-maroon)", margin: 0 }}>
                {s.documents?.title ?? "Untitled"}
              </h2>
              <Badge tone="gold">{new Date(s.created_at).toLocaleDateString()}</Badge>
            </div>
            <p style={{ font: "var(--text-body)", color: "var(--gray-1)", margin: "0 0 16px", lineHeight: 1.6 }}>
              {s.overview}
            </p>

            {s.key_points?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ font: "var(--text-label)", color: "var(--gray-2)", marginBottom: 6 }}>Key points</div>
                <ul style={{ margin: 0, paddingLeft: 20, color: "var(--gray-1)", lineHeight: 1.7 }}>
                  {s.key_points.map((p, i) => (
                    <li key={i} style={{ font: "var(--text-body)" }}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {s.key_terms?.length > 0 && (
              <div>
                <div style={{ font: "var(--text-label)", color: "var(--gray-2)", marginBottom: 8 }}>Key terms</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                  {s.key_terms.map((t, i) => (
                    <div key={i} style={{ padding: 12, background: "var(--surface-panel)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-md)" }}>
                      <div style={{ font: "var(--text-label)", color: "var(--asu-maroon)" }}>{t.term}</div>
                      <div style={{ font: "var(--text-small)", color: "var(--gray-2)", marginTop: 2 }}>{t.definition}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
