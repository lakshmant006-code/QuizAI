// "Bring your own model" — call a user's OpenAI-compatible local/self-hosted AI
// server directly from the BROWSER (the cloud can't reach their localhost).
// Produces the same StudyPack shape the hosted Claude path returns.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Difficulty, QuestionKind } from "./types";

export interface LocalAIConn {
  base_url: string; // e.g. http://localhost:1234/v1
  model: string; // e.g. llama-3.1-8b-instruct
  api_key?: string | null;
}

export interface StudyPack {
  summary: {
    overview: string;
    key_points: string[];
    key_terms: { term: string; definition: string }[];
  };
  quiz: {
    title: string;
    questions: {
      kind: QuestionKind;
      prompt: string;
      options?: string[];
      answer: string;
      explanation?: string;
    }[];
  };
}

const MAX_CHARS = 60_000;

function normBase(base: string): string {
  return base.trim().replace(/\/+$/, "");
}

function authHeaders(conn: LocalAIConn): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (conn.api_key) h["Authorization"] = `Bearer ${conn.api_key}`;
  return h;
}

// ---------------------------------------------------------------------------
// Persistence (per account, RLS-protected)
// ---------------------------------------------------------------------------
export async function loadConn(supabase: SupabaseClient, userId: string): Promise<LocalAIConn | null> {
  const { data } = await supabase
    .from("ai_connections")
    .select("base_url, model, api_key")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as LocalAIConn | null) ?? null;
}

export async function saveConn(supabase: SupabaseClient, userId: string, conn: LocalAIConn): Promise<void> {
  const { error } = await supabase.from("ai_connections").upsert({
    user_id: userId,
    base_url: normBase(conn.base_url),
    model: conn.model.trim(),
    api_key: conn.api_key?.trim() || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Connection test — hits /models on the endpoint
// ---------------------------------------------------------------------------
export async function testConn(conn: LocalAIConn): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(`${normBase(conn.base_url)}/models`, { headers: authHeaders(conn) });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      const ids: string[] = Array.isArray(data?.data) ? data.data.map((m: { id: string }) => m.id) : [];
      const found = ids.length ? (ids.includes(conn.model) ? ` Model "${conn.model}" found.` : ` (available: ${ids.slice(0, 3).join(", ")}…)`) : "";
      return { ok: true, detail: `Connected.${found}` };
    }
    return { ok: false, detail: `Server responded ${res.status}. Check the URL.` };
  } catch (e) {
    return { ok: false, detail: reachError(e) };
  }
}

function reachError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  // A CORS/network failure surfaces as a generic TypeError in the browser.
  return `Couldn't reach the server. Make sure it's running and CORS is enabled for this site. (${msg})`;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------
export interface LocalGenerateOptions {
  conn: LocalAIConn;
  text: string;
  title: string;
  difficulty: Difficulty;
  numQuestions: number;
  kinds: QuestionKind[];
  // Optional abort signal — used by the server-side path to bound how long a
  // slow self-hosted model may run. The browser path leaves it unset.
  signal?: AbortSignal;
}

export async function generateWithLocalAI(opts: LocalGenerateOptions): Promise<StudyPack> {
  const { conn, text, title, difficulty, numQuestions, kinds, signal } = opts;
  const source = text.slice(0, MAX_CHARS);
  const kindLabel = kinds
    .map((k) => (k === "mcq" ? "multiple-choice" : k === "tf" ? "true/false" : "short-answer"))
    .join(", ");

  const system = "You are an expert study assistant. You output ONLY a single valid JSON object and nothing else.";
  const shape =
    '{"summary":{"overview":string,"key_points":string[],"key_terms":[{"term":string,"definition":string}]},' +
    '"quiz":{"title":string,"questions":[{"kind":"mcq"|"tf"|"short","prompt":string,"options":string[],"answer":string,"explanation":string}]}}';
  const user = `From the source material below, produce a summary and a ${numQuestions}-question quiz at ${difficulty} difficulty using these question types: ${kindLabel}.

Rules:
- Base everything strictly on the source; do not invent facts.
- For "mcq": exactly 4 plausible options, and "answer" must be the exact text of the correct option.
- For "tf": options must be ["True","False"] and "answer" is "True" or "False".
- For "short": omit options; "answer" is a concise model answer.
- Every question needs a one-sentence "explanation".
- The quiz "title" should reference the material "${title}".

Return ONLY a JSON object with exactly this shape (no markdown, no commentary):
${shape}

Source material:
"""
${source}
"""`;

  const body: Record<string, unknown> = {
    model: conn.model,
    temperature: 0.3,
    max_tokens: 4096,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  };

  let res = await fetch(`${normBase(conn.base_url)}/chat/completions`, {
    method: "POST",
    headers: authHeaders(conn),
    body: JSON.stringify(body),
    signal,
  }).catch((e) => {
    throw new Error(reachError(e));
  });

  // Some servers reject response_format — retry once without it.
  if (!res.ok && (res.status === 400 || res.status === 422)) {
    delete body.response_format;
    res = await fetch(`${normBase(conn.base_url)}/chat/completions`, {
      method: "POST",
      headers: authHeaders(conn),
      body: JSON.stringify(body),
      signal,
    });
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Local model error (HTTP ${res.status}). ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("The local model returned an empty response.");
  return parsePack(content);
}

function parsePack(content: string): StudyPack {
  let s = content.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first >= 0 && last > first) s = s.slice(first, last + 1);

  let obj: unknown;
  try {
    obj = JSON.parse(s);
  } catch {
    throw new Error("The local model did not return valid JSON. Try a stronger/instruct model.");
  }
  const pack = obj as StudyPack;
  if (!pack?.summary || !pack?.quiz || !Array.isArray(pack.quiz.questions) || pack.quiz.questions.length === 0) {
    throw new Error("The model's JSON was missing a summary or quiz questions.");
  }
  // Normalize/guard each question so downstream storage stays consistent.
  pack.quiz.questions = pack.quiz.questions
    .filter((q) => q && q.prompt && q.answer)
    .map((q) => ({
      kind: (["mcq", "tf", "short"].includes(q.kind) ? q.kind : "mcq") as QuestionKind,
      prompt: String(q.prompt),
      options: Array.isArray(q.options) && q.options.length ? q.options.map(String) : undefined,
      answer: String(q.answer),
      explanation: q.explanation ? String(q.explanation) : undefined,
    }));
  if (pack.quiz.questions.length === 0) throw new Error("No usable questions were produced.");
  return pack;
}
