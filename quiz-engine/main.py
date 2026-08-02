"""QuizAI offline quiz + summary engine — FastAPI. No LLM, no tokens."""
from __future__ import annotations

import os

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from generators import MODELS, MODEL_LABELS, generate, summarize
from pdf import extract_pdf

app = FastAPI(title="QuizAI Offline Quiz Engine", version="2.0")

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
    total: int | None = None
    weights: dict[str, float] | None = None
    summary: bool = False


@app.get("/health")
def health():
    return {"ok": True, "model_count": len(MODELS)}


@app.get("/models")
def list_models():
    return {"models": [{"id": k, "label": MODEL_LABELS[k]} for k in MODELS]}


@app.post("/generate")
def generate_from_text(req: GenerateRequest):
    per = max(1, min(req.per_model, 10))
    result = generate(req.text, req.models, per, total=req.total, weights=req.weights)
    if req.summary:
        result["summary"] = summarize(req.text)
    return result


@app.post("/summarize")
def summarize_text(req: GenerateRequest):
    return summarize(req.text)


@app.post("/generate-pdf")
async def generate_from_pdf(
    file: UploadFile = File(...),
    models: str | None = Form(None),
    per_model: int = Form(3),
    total: int | None = Form(None),
    weights: str | None = Form(None),
    summary: bool = Form(True),
):
    """Python reads the PDF directly (PyMuPDF), then builds quiz + summary."""
    import json

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file.")
    try:
        text, pages = extract_pdf(data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read PDF: {e}")
    if len(text.strip()) < 80:
        raise HTTPException(status_code=422, detail="Not enough readable text (scanned/image PDF?).")

    model_list = [m.strip() for m in models.split(",")] if models else None
    per = max(1, min(int(per_model), 10))
    w = None
    if weights:
        try:
            w = json.loads(weights)
        except Exception:
            w = None
    result = generate(text, model_list, per, total=total, weights=w)
    result["pages"] = pages
    result["char_count"] = len(text)
    if summary:
        result["summary"] = summarize(text)
    return result
