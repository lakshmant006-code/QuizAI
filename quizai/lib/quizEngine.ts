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

// Transient errors from Render's proxy while the free-tier engine is asleep or
// restarting. The upstream is fine — it's just not answering yet.
const GATEWAY_STATUSES = new Set([502, 503, 504]);

// Overall retry budget. Stays under the calling API route's maxDuration (120s)
// so the route returns a clean error instead of being killed mid-flight.
const TOTAL_BUDGET_MS = 115_000;
const BACKOFFS_MS = [2_000, 4_000, 8_000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch the engine, retrying transient gateway errors (502/503/504) and network
 * blips with backoff. The free-tier engine spins down when idle, and Render's
 * proxy answers 502 for the first few seconds while it cold-starts — so a single
 * request often fails even though the service comes up moments later. All retries
 * share one budget that keeps the total under the API route's time limit.
 */
async function fetchEngine(url: string, init: Omit<RequestInit, "signal">): Promise<Response> {
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let attempt = 0;
  let lastErr: unknown;

  for (;;) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;

    const wait = BACKOFFS_MS[Math.min(attempt, BACKOFFS_MS.length - 1)];
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(Math.min(60_000, remaining)),
      });
      // Not a gateway hiccup (2xx, or a real 4xx/5xx from the app) → done.
      if (!GATEWAY_STATUSES.has(res.status)) return res;
      // Cold-start / restart: back off and retry while there's time left.
      if (Date.now() + wait >= deadline) return res; // no time to retry — surface it
      await sleep(wait);
      attempt++;
    } catch (e) {
      // Network error or per-attempt timeout — retry if the budget allows.
      lastErr = e;
      if (Date.now() + wait >= deadline) break;
      await sleep(wait);
      attempt++;
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error("The offline quiz engine is unreachable. Please try again in a minute.");
}

/** Turn a non-OK engine response into a user-friendly error. */
async function engineError(res: Response): Promise<Error> {
  if (GATEWAY_STATUSES.has(res.status)) {
    return new Error(
      "The offline quiz engine is waking up or temporarily unavailable. Please try again in a minute.",
    );
  }
  const detail = (await res.json().catch(() => ({}))) as { detail?: string };
  return new Error(detail.detail || `Quiz engine returned ${res.status}`);
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

  const res = await fetchEngine(`${base()}/generate-pdf`, { method: "POST", body: form });
  if (!res.ok) throw await engineError(res);
  return (await res.json()) as EngineResult;
}

/** Generate from raw text (fallback / non-PDF sources). */
export async function generateOffline(
  text: string,
  opts?: { models?: string[]; perModel?: number; summary?: boolean },
): Promise<EngineResult> {
  const res = await fetchEngine(`${base()}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      models: opts?.models,
      per_model: opts?.perModel ?? 3,
      summary: opts?.summary ?? true,
    }),
  });
  if (!res.ok) throw await engineError(res);
  return (await res.json()) as EngineResult;
}
