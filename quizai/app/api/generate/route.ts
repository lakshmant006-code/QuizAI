import { NextResponse, type NextRequest } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { createClient } from "@/lib/supabase/server";
import { generateStudyPack } from "@/lib/generate";
import type { Difficulty, QuestionKind } from "@/lib/types";

export const maxDuration = 120; // allow time for PDF parse + model call (self-hosted models can be slower)

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const documentId: string | undefined = body.documentId;
  const difficulty: Difficulty = body.difficulty ?? "medium";
  const numQuestions: number = Math.min(Math.max(Number(body.numQuestions) || 8, 3), 20);
  const kinds: QuestionKind[] =
    Array.isArray(body.kinds) && body.kinds.length ? body.kinds : ["mcq"];

  if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });

  // Load the document (RLS guarantees it belongs to this user).
  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();
  if (docErr || !doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  await supabase.from("documents").update({ status: "processing", error: null }).eq("id", documentId);

  try {
    // Download the PDF from private storage.
    const { data: file, error: dlErr } = await supabase.storage
      .from("pdfs")
      .download(doc.storage_path);
    if (dlErr || !file) throw new Error("Could not download the uploaded PDF.");

    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const { totalPages, text } = await extractText(pdf, { mergePages: true });

    if (!text || text.trim().length < 40) {
      throw new Error(
        "Couldn't read enough text from this PDF (it may be scanned images without OCR).",
      );
    }

    const pack = await generateStudyPack({
      text,
      title: doc.title,
      difficulty,
      numQuestions,
      kinds,
    });

    // Store the summary.
    const { data: summary, error: sErr } = await supabase
      .from("summaries")
      .insert({
        document_id: documentId,
        user_id: user.id,
        overview: pack.summary.overview,
        key_points: pack.summary.key_points,
        key_terms: pack.summary.key_terms,
      })
      .select()
      .single();
    if (sErr) throw new Error(sErr.message);

    // Store the quiz + questions.
    const { data: quiz, error: qErr } = await supabase
      .from("quizzes")
      .insert({
        document_id: documentId,
        user_id: user.id,
        title: pack.quiz.title,
        difficulty,
      })
      .select()
      .single();
    if (qErr) throw new Error(qErr.message);

    const rows = pack.quiz.questions.map((q, i) => ({
      quiz_id: quiz.id,
      position: i,
      kind: q.kind,
      prompt: q.prompt,
      options: q.options ?? null,
      answer: q.answer,
      explanation: q.explanation ?? null,
    }));
    const { error: quErr } = await supabase.from("questions").insert(rows);
    if (quErr) throw new Error(quErr.message);

    await supabase
      .from("documents")
      .update({ status: "ready", page_count: totalPages, char_count: text.length })
      .eq("id", documentId);

    return NextResponse.json({
      ok: true,
      summaryId: summary.id,
      quizId: quiz.id,
      questionCount: rows.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed.";
    await supabase.from("documents").update({ status: "failed", error: message }).eq("id", documentId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
