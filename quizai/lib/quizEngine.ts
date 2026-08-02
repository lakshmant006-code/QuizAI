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

export interface EngineResult {
  count: number;
  per_model: Record<string, number>;
  terms_found: number;
  definitions_found: number;
  questions: EngineQuestion[];
}

export function engineConfigured() {
  return !!process.env.QUIZ_ENGINE_URL;
}

export async function generateOffline(
  text: string,
  opts?: { models?: string[]; perModel?: number },
): Promise<EngineResult> {
  const base = process.env.QUIZ_ENGINE_URL;
  if (!base) throw new Error("Offline quiz engine is not configured (set QUIZ_ENGINE_URL).");
  const res = await fetch(`${base.replace(/\/$/, "")}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, models: opts?.models, per_model: opts?.perModel ?? 3 }),
    // The free engine instance can cold-start; allow generous time.
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`Quiz engine returned ${res.status}`);
  return (await res.json()) as EngineResult;
}
