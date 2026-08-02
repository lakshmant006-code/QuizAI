import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFromPdf } from "@/lib/quizEngine";

export const maxDuration = 120; // engine parses the PDF + can cold-start

// Offline generation: the Python engine reads the PDF and builds a quiz +
// summary. No LLM, no tokens.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const documentId: string | undefined = body.documentId;
  const models: string[] | undefined = Array.isArray(body.models) && body.models.length ? body.models : undefined;
  const perModel: number = Math.min(Math.max(Number(body.perModel) || 3, 1), 10);
  if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });

  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();
  if (docErr || !doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  await supabase.from("documents").update({ status: "processing", error: null }).eq("id", documentId);

  try {
    const { data: file, error: dlErr } = await supabase.storage.from("pdfs").download(doc.storage_path);
    if (dlErr || !file) throw new Error("Could not download the uploaded PDF.");

    const result = await generateFromPdf(file, `${doc.title}.pdf`, { models, perModel, summary: true });
    if (!result.questions.length) {
      throw new Error("The engine couldn't build questions from this document. Try a text-richer PDF.");
    }

    // Store the summary (if produced).
    let summaryId: string | null = null;
    if (result.summary && result.summary.overview) {
      const { data: sum } = await supabase
        .from("summaries")
        .insert({
          document_id: documentId,
          user_id: user.id,
          overview: result.summary.overview,
          key_points: result.summary.key_points ?? [],
          key_terms: result.summary.key_terms ?? [],
        })
        .select("id")
        .single();
      summaryId = sum?.id ?? null;
    }

    // Store the quiz + questions.
    const { data: quiz, error: qErr } = await supabase
      .from("quizzes")
      .insert({ document_id: documentId, user_id: user.id, title: doc.title, difficulty: "medium", source: "offline" })
      .select()
      .single();
    if (qErr) throw new Error(qErr.message);

    const rows = result.questions.map((q, i) => ({
      quiz_id: quiz.id,
      position: i,
      kind: q.kind,
      model: q.model,
      prompt: q.prompt,
      options: q.options ?? null,
      answer: q.answer,
      explanation: q.explanation ?? null,
    }));
    const { error: quErr } = await supabase.from("questions").insert(rows);
    if (quErr) throw new Error(quErr.message);

    await supabase
      .from("documents")
      .update({ status: "ready", page_count: result.pages ?? null, char_count: result.char_count ?? null })
      .eq("id", documentId);

    return NextResponse.json({ ok: true, quizId: quiz.id, questionCount: rows.length, summaryId, perModel: result.per_model });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Offline generation failed.";
    await supabase.from("documents").update({ status: "failed", error: message }).eq("id", documentId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
