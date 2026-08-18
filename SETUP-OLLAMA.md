# Run QuizAI on a free, self-hosted LLM (Ollama)

QuizAI can generate every summary + quiz with your **own local model instead of
Claude — no API tokens, no per-request cost.** It speaks the standard
OpenAI-compatible chat API, so **Ollama, LM Studio, vLLM, llama.cpp, or any
OpenAI-compatible server** works.

## How the app chooses a model

In `quizai/lib/generate.ts` the server checks one environment variable:

- **`OLLAMA_URL` is set** → the **AI** button generates through *your* model
  (server-to-server). No tokens are used.
- **`OLLAMA_URL` is empty** → it falls back to Claude (needs `ANTHROPIC_API_KEY`).

So enabling free generation is just setting env vars — no code change.

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `OLLAMA_URL` | yes | — | OpenAI-compatible base URL, **must end in `/v1`** (e.g. `https://…/v1`) |
| `OLLAMA_MODEL` | no | `gemma3` | model tag to run (see recommendations below) |
| `OLLAMA_API_KEY` | no | — | sent as `Authorization: Bearer …`; set this if your endpoint is public |

---

## 1. Install Ollama and pull a model

```bash
# https://ollama.com/download  (macOS / Windows / Linux)
ollama pull llama3.1:8b        # good balance of quality + speed
ollama serve                   # serves the API on http://localhost:11434
```

Ollama exposes the OpenAI-compatible API at **`http://localhost:11434/v1`**.

Quick sanity check:

```bash
curl http://localhost:11434/v1/models
```

---

## 2. Make it reachable from your deployment

> **The important part:** QuizAI runs on Render (the cloud). The cloud **cannot
> reach your `localhost`.** `OLLAMA_URL` must be a URL the Render server can
> actually open. Pick one of these:

### Option A — Tunnel your local Ollama (fastest to try)

Expose your local Ollama with a public HTTPS URL:

```bash
# Cloudflare Tunnel (no account needed for a quick tunnel)
cloudflared tunnel --url http://localhost:11434
#  → prints something like https://abc-123.trycloudflare.com

# …or ngrok
ngrok http 11434
```

Then in Render set:

```
OLLAMA_URL     = https://abc-123.trycloudflare.com/v1
OLLAMA_MODEL   = llama3.1:8b
OLLAMA_API_KEY = <pick-a-long-secret>     # recommended — the tunnel is public
```

If you set `OLLAMA_API_KEY`, protect the endpoint so only requests with that key
get through (e.g. run Ollama behind a small proxy that checks the
`Authorization` header, or use a Cloudflare Access policy). A raw public tunnel
with no auth lets anyone use your GPU.

> Note: your machine (and the tunnel) must stay running for generation to work.
> A tunnel is great for testing, not for 24/7 production.

### Option B — Host Ollama on a GPU box (best for real use)

Run Ollama on a small GPU VPS/instance (RunPod, Lambda, a GPU droplet, etc.)
with a stable public URL, then point `OLLAMA_URL` at
`https://your-host:11434/v1`. Put it behind auth and set `OLLAMA_API_KEY`.

### Option C — Run QuizAI itself locally

For development, run the app on your own machine:

```bash
cd quizai
cp .env.local.example .env.local     # then edit it
npm install
npm run dev
```

In `.env.local`:

```
OLLAMA_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3.1:8b
```

Now the local app talks straight to local Ollama — no tunnel needed.

---

## 3. Set the variables and redeploy

**Render dashboard → your `quizai` service → Environment** → add
`OLLAMA_URL` (and optionally `OLLAMA_MODEL`, `OLLAMA_API_KEY`) → **Save**. Render
redeploys automatically. From then on, the **AI** option is fully token-free.

(These keys are already declared as `sync: false` placeholders in `render.yaml`.)

---

## Recommended models

Quality tracks model size — pick the largest your hardware runs comfortably:

| Model tag | Approx. VRAM | Notes |
| --- | --- | --- |
| `llama3.1:8b` | ~6 GB | solid default, fast |
| `qwen2.5:7b-instruct` | ~6 GB | strong at structured/JSON output |
| `gemma3` | ~6 GB | the app's default |
| `qwen2.5:14b-instruct` | ~10–12 GB | noticeably better questions/distractors |
| `mistral-nemo` | ~8 GB | good long-context option |

Tips for accurate quizzes:

- The app already asks for **JSON-only output at `temperature: 0.3`** and tells
  the model to **base everything strictly on the source and not invent facts** —
  so most of the quality comes down to the model you choose.
- Instruction-tuned (`-instruct`) models follow the JSON schema more reliably.
- Very long PDFs are trimmed to ~60k characters before the prompt.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| AI still uses Claude / says credits | `OLLAMA_URL` isn't set on the deployment, or is empty. Re-check Render env and redeploy. |
| `Local model error (HTTP 404)` | URL is missing the `/v1` suffix. |
| `Couldn't reach the server` / timeout | The URL isn't reachable from Render (e.g. it's a `localhost` URL, or your tunnel/box is down). |
| `HTTP 401/403` | `OLLAMA_API_KEY` mismatch between Render and your server. |
| Generation is slow / times out | Use a smaller/faster model, or a machine with more GPU. The server aborts a run after ~110s. |
| Malformed quiz / empty result | Model ignored the JSON format — switch to an `-instruct` model. |
