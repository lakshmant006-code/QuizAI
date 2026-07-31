"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Button, Input } from "@/components/ui";
import type { Task } from "@/lib/types";

export function TasksBoard({ userId, initial }: { userId: string; initial: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [title, setTitle] = useState("");
  const supabase = createClient();

  // Keep the board live across devices/tabs.
  useEffect(() => {
    const channel = supabase
      .channel(`tasks-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
        async () => {
          const { data } = await supabase
            .from("tasks")
            .select("*")
            .order("created_at", { ascending: false });
          if (data) setTasks(data as Task[]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setTitle("");
    const { data } = await supabase
      .from("tasks")
      .insert({ user_id: userId, title: t })
      .select()
      .single();
    if (data) setTasks((cur) => [data as Task, ...cur]);
  }

  async function toggle(task: Task) {
    setTasks((cur) => cur.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x)));
    await supabase.from("tasks").update({ done: !task.done }).eq("id", task.id);
  }

  async function star(task: Task) {
    setTasks((cur) => cur.map((x) => (x.id === task.id ? { ...x, starred: !x.starred } : x)));
    await supabase.from("tasks").update({ starred: !task.starred }).eq("id", task.id);
  }

  async function remove(task: Task) {
    setTasks((cur) => cur.filter((x) => x.id !== task.id));
    await supabase.from("tasks").delete().eq("id", task.id);
  }

  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ font: "var(--text-label)", color: "var(--gray-2)" }}>
            {done} of {tasks.length} complete
          </span>
          <span style={{ font: "var(--text-label)", color: "var(--asu-maroon)" }}>{pct}%</span>
        </div>
        <div style={{ height: 8, background: "var(--gray-6)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--asu-maroon)", transition: "width .3s" }} />
        </div>
      </Card>

      <form onSubmit={add} style={{ display: "flex", gap: 8 }}>
        <Input
          placeholder="Add a study task — e.g. Review Chapter 4 flashcards"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div style={{ width: 120 }}>
          <Button type="submit">Add</Button>
        </div>
      </form>

      {tasks.length === 0 ? (
        <Card>
          <p style={{ font: "var(--text-body)", color: "var(--text-muted)", margin: 0 }}>
            No tasks yet. Add one to start tracking your study accountability.
          </p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tasks.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                background: "#fff",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <input type="checkbox" checked={t.done} onChange={() => toggle(t)} style={{ width: 18, height: 18 }} />
              <span
                style={{
                  flex: 1,
                  font: "var(--text-body)",
                  color: t.done ? "var(--gray-4)" : "var(--gray-1)",
                  textDecoration: t.done ? "line-through" : "none",
                }}
              >
                {t.title}
              </span>
              <button onClick={() => star(t)} title="Star" style={{ background: "none", border: "none", fontSize: 15, color: t.starred ? "var(--asu-gold)" : "var(--gray-4)" }}>
                <i className={t.starred ? "fa-solid fa-star" : "fa-regular fa-star"} />
              </button>
              <button
                onClick={() => remove(t)}
                title="Delete"
                style={{ background: "none", border: "none", color: "var(--gray-4)", fontSize: 15 }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
