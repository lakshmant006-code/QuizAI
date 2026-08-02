import { NextResponse, type NextRequest } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { createClient } from "@/lib/supabase/server";
import { generateOffline } from "@/lib/quizEngine";

export const maxDuration = 120; // engine can cold-start on the free tier

// Offline quiz generation: extract PDF text, call the Python engine (no LLM),
// store the quiz + questions. No tokens are used.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const documentId: string | undefined = body.documentId;
  const models: string[] | undefined = Array.isArray(body.models) ? body.models : undefined;
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

    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    if (!text || text.trim().length < 60) {
      throw new Error("Couldn't read enough text from this PDF (it may be scanned images).");
    }

    const result = await generateOffline(text, { models, perModel });
    if (!result.questions.length) {
      throw new Error("The engine couldn't build questions from this document. Try a text-richer PDF.");
    }

    const { data: quiz, error: qErr } = await supabase
      .from("quizzes")
      .insert({
        document_id: documentId,
        user_id: user.id,
        title: doc.title,
        difficulty: "medium",
        source: "offline",
      })
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
      .update({ status: "ready", page_count: totalPages, char_count: text.length })
      .eq("id", documentId);

    return NextResponse.json({ ok: true, quizId: quiz.id, questionCount: rows.length, perModel: result.per_model });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Offline generation failed.";
    await supabase.from("documents").update({ status: "failed", error: message }).eq("id", documentId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
