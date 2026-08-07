import { createClient } from "@/lib/supabase/server";
import { TasksBoard } from "@/components/TasksBoard";
import type { Task } from "@/lib/types";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--gray-1)", margin: 0 }}>
        <i className="ph ph-check-circle" style={{ marginRight: 10, color: "var(--asu-maroon)" }} />Tasks &amp; accountability
      </h1>
      <TasksBoard userId={user!.id} initial={(data ?? []) as Task[]} />
    </div>
  );
}
