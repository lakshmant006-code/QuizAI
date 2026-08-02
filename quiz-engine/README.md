# QuizAI Offline Quiz Engine

A Python **FastAPI** microservice that turns plain source text into quizzes
using **10 deterministic, LLM-free generators** — no API keys, no tokens, no
per-request cost. Uses spaCy for term/entity extraction with regex fallbacks.

## The 10 models
`cloze`, `term_to_def`, `def_to_term`, `true_false`, `match`, `odd_one_out`,
`sequence`, `short_answer`, `sentence_completion`, `flashcards`.

## Run locally
```bash
cd quiz-engine
python -m venv .venv && . .venv/Scripts/activate   # Windows
pip install -r requirements.txt
python -m spacy download en_core_web_sm            # optional; falls back if absent
uvicorn main:app --reload --port 8000
```

## Endpoints
- `GET /health` → `{ ok, model_count }`
- `GET /models` → list of model ids + labels
- `POST /generate` → body `{ "text": "...", "models": ["cloze", ...]?, "per_model": 3 }`

## Deploy on Render
Create a **Web Service** from this repo with **Root Directory = `quiz-engine`**:
- Build: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

(Also defined in the repo-root `render.yaml` blueprint as service `quiz-engine`.)
The Next.js app calls this service via `QUIZ_ENGINE_URL`.
