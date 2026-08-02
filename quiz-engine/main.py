"""QuizAI offline quiz engine — FastAPI service. No LLM, no tokens."""
from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from generators import MODELS, MODEL_LABELS, generate

app = FastAPI(title="QuizAI Offline Quiz Engine", version="1.0")

# Allow the Next.js app (and local dev) to call this service.
_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins],
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    text: str
    models: list[str] | None = None
    per_model: int = 3


@app.get("/health")
def health():
    return {"ok": True, "model_count": len(MODELS)}


@app.get("/models")
def list_models():
    return {"models": [{"id": k, "label": MODEL_LABELS[k]} for k in MODELS]}


@app.post("/generate")
def generate_quiz(req: GenerateRequest):
    per = max(1, min(req.per_model, 10))
    return generate(req.text, req.models, per)
