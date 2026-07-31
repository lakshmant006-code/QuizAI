import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuizRunner } from "@/components/QuizRunner";
import type { Question } from "@/lib/types";

export default async function QuizPlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, difficulty")
    .eq("id", id)
    .single();

  if (!quiz) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", id)
    .order("position", { ascending: true });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <Link href="/quizzes" style={{ font: "var(--text-small)", color: "var(--gray-3)" }}>
        ← All quizzes
      </Link>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--gray-1)", margin: 0 }}>
        {quiz.title}
      </h1>
      <QuizRunner quizId={quiz.id} questions={(questions ?? []) as Question[]} />
    </div>
  );
}
