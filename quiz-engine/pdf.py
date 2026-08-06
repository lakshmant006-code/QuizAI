"""High-quality PDF text extraction with cleanup + optional OCR fallback.

Text-layer extraction (PyMuPDF) handles normal digital PDFs. Pages that have
little or no extractable text (scanned documents, image-only slides) fall back
to OCR when an OCR backend is installed — RapidOCR (pip, no system deps) or
Tesseract (via pytesseract). OCR is lazy: the model only loads the first time a
page actually needs it, so idle memory is unaffected. Disable with ENABLE_OCR=0.
"""
from __future__ import annotations

import os
import re

# Below this many alphanumeric characters, a page is treated as "no text layer"
# and sent to OCR (if available).
_OCR_MIN_CHARS = 24
_BULLETS = "•▪◦‣●·∙"


def extract_pdf(data: bytes) -> tuple[str, int]:
    """Return (clean_text, page_count) from PDF bytes."""
    import fitz  # PyMuPDF

    doc = fitz.open(stream=data, filetype="pdf")
    ocr_on = os.getenv("ENABLE_OCR", "1") != "0"
    raw_pages: list[str] = []
    for page in doc:
        text = _page_text(page)
        if ocr_on and _alnum(text) < _OCR_MIN_CHARS:
            ocr = _ocr_page(page)
            if _alnum(ocr) > _alnum(text):
                text = ocr
        raw_pages.append(text)
    page_count = doc.page_count
    doc.close()

    pages = _strip_running_headers(raw_pages)
    return clean_text("\n\n".join(pages)), page_count


def _alnum(s: str) -> int:
    return sum(c.isalnum() for c in s)


def _page_text(page) -> str:
    """Text-layer extraction in reading order (top-to-bottom, left-to-right)."""
    try:
        blocks = page.get_text("blocks")
    except Exception:
        return ""
    blocks = [b for b in blocks if len(b) >= 5 and b[4] and b[4].strip()]
    blocks.sort(key=lambda b: (round(b[1] / 6), round(b[0] / 6)))
    return "\n".join(b[4].strip() for b in blocks)


# ---------------------------------------------------------------------------
# Running headers / footers — repeated lines across pages add noise and break
# sentence flow. Drop lines that appear at the top or bottom of many pages.
# ---------------------------------------------------------------------------
def _strip_running_headers(pages: list[str]) -> list[str]:
    if len(pages) < 4:
        return pages
    from collections import Counter

    edge: Counter = Counter()
    for p in pages:
        lines = [l.strip() for l in p.split("\n") if l.strip()]
        for l in lines[:2] + lines[-2:]:
            key = re.sub(r"\d+", "#", l.lower())
            if 3 <= len(key) <= 80:
                edge[key] += 1
    threshold = max(3, int(len(pages) * 0.5))
    repeated = {k for k, c in edge.items() if c >= threshold}
    if not repeated:
        return pages

    out = []
    for p in pages:
        kept = []
        for l in p.split("\n"):
            key = re.sub(r"\d+", "#", l.strip().lower())
            if key in repeated:
                continue
            kept.append(l)
        out.append("\n".join(kept))
    return out


# ---------------------------------------------------------------------------
# OCR fallback — tries RapidOCR, then Tesseract. Whichever is installed wins;
# if neither is present, returns "" and text-layer extraction stands.
# ---------------------------------------------------------------------------
_RAPID = None
_RAPID_TRIED = False


def _ocr_page(page) -> str:
    try:
        pix = page.get_pixmap(dpi=200)
    except Exception:
        return ""
    return _ocr_rapid(pix) or _ocr_tesseract(pix)


def _ocr_rapid(pix) -> str:
    global _RAPID, _RAPID_TRIED
    try:
        import numpy as np
        from rapidocr_onnxruntime import RapidOCR
    except Exception:
        return ""
    try:
        if _RAPID is None and not _RAPID_TRIED:
            _RAPID_TRIED = True
            _RAPID = RapidOCR()
        if _RAPID is None:
            return ""
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
        if pix.n >= 4:
            img = img[:, :, :3]
        result, _ = _RAPID(img)
        if not result:
            return ""
        # result rows: [box, text, score]; order top-to-bottom, then left-to-right.
        rows = sorted(result, key=lambda r: (round(r[0][0][1] / 12), r[0][0][0]))
        return "\n".join(r[1] for r in rows)
    except Exception:
        return ""


def _ocr_tesseract(pix) -> str:
    try:
        import io

        import pytesseract
        from PIL import Image
    except Exception:
        return ""
    try:
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        return pytesseract.image_to_string(img) or ""
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
def clean_text(text: str) -> str:
    # Split bullet glyphs onto their own lines so slide titles and their bullet
    # points don't merge into one garbled "sentence".
    text = re.sub(rf"\s*[{_BULLETS}]\s*", "\n", text)
    # De-hyphenate words split across line breaks: "photo-\nsynthesis" -> "photosynthesis"
    text = re.sub(r"(\w+)-\n(\w+)", r"\1\2", text)
    # Join lines that are part of the same sentence (break not after . ! ? : ;)
    text = re.sub(r"(?<![.!?:；;])\n(?=[a-z(])", " ", text)
    lines = []
    for raw in text.split("\n"):
        line = raw.strip()
        if not line:
            lines.append("")
            continue
        # Drop page numbers and very short boilerplate lines.
        if re.fullmatch(r"(page\s*)?\d+(\s*/\s*\d+)?", line, flags=re.I):
            continue
        if len(line) <= 2:
            continue
        lines.append(line)
    text = "\n".join(lines)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
