"""High-quality PDF text extraction with cleanup.

Text-layer extraction (PyMuPDF) handles normal digital PDFs. Scanned or
image-only PDFs have no text layer; those return little text and the caller
surfaces a clear "not enough readable text" message rather than running OCR.
OCR was removed to keep the engine light enough for its runtime memory budget.
"""
from __future__ import annotations

import re

_BULLETS = "•▪◦‣●·∙"


def extract_pdf(data: bytes) -> tuple[str, int]:
    """Return (clean_text, page_count) from PDF bytes."""
    import fitz  # PyMuPDF

    doc = fitz.open(stream=data, filetype="pdf")
    raw_pages = [_page_text(page) for page in doc]
    page_count = doc.page_count
    doc.close()

    pages = _strip_running_headers(raw_pages)
    return clean_text("\n\n".join(pages)), page_count


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
