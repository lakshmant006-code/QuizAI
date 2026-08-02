// Client for the offline Python quiz engine (no LLM / no tokens).
import type { QuestionKind } from "./types";

export interface EngineQuestion {
  model: string;
  kind: QuestionKind;
  prompt: string;
  options: string[] | null;
  answer: string;
  explanation: string;
}

export interface EngineSummary {
  overview: string;
  key_points: string[];
  key_terms: { term: string; definition: string }[];
}

export interface EngineResult {
  count: number;
  per_model: Record<string, number>;
  terms_found: number;
  definitions_found: number;
  questions: EngineQuestion[];
  summary?: EngineSummary;
  pages?: number;
  char_count?: number;
}

function base() {
  const b = process.env.QUIZ_ENGINE_URL;
  if (!b) throw new Error("Offline quiz engine is not configured (set QUIZ_ENGINE_URL).");
  return b.replace(/\/$/, "");
}

/** Python reads the PDF itself (PyMuPDF) and returns quiz + summary. */
export async function generateFromPdf(
  file: Blob,
  filename: string,
  opts?: { models?: string[]; perModel?: number; total?: number; weights?: Record<string, number>; summary?: boolean },
): Promise<EngineResult> {
  const form = new FormData();
  form.append("file", file, filename || "document.pdf");
  if (opts?.models?.length) form.append("models", opts.models.join(","));
  form.append("per_model", String(opts?.perModel ?? 3));
  if (opts?.total) form.append("total", String(opts.total));
  if (opts?.weights) form.append("weights", JSON.stringify(opts.weights));
  form.append("summary", String(opts?.summary ?? true));

  const res = await fetch(`${base()}/generate-pdf`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(120_000), // allow free-tier cold start
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Quiz engine returned ${res.status}`);
  }
  return (await res.json()) as EngineResult;
}

/** Generate from raw text (fallback / non-PDF sources). */
export async function generateOffline(
  text: string,
  opts?: { models?: string[]; perModel?: number; summary?: boolean },
): Promise<EngineResult> {
  const res = await fetch(`${base()}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      models: opts?.models,
      per_model: opts?.perModel ?? 3,
      summary: opts?.summary ?? true,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Quiz engine returned ${res.status}`);
  return (await res.json()) as EngineResult;
}
