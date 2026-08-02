"""High-quality PDF text extraction with cleanup, using PyMuPDF."""
from __future__ import annotations

import re


def extract_pdf(data: bytes) -> tuple[str, int]:
    """Return (clean_text, page_count) from PDF bytes."""
    import fitz  # PyMuPDF

    doc = fitz.open(stream=data, filetype="pdf")
    pages = []
    for page in doc:
        # "blocks" preserves reading order better than raw text.
        blocks = page.get_text("blocks")
        blocks.sort(key=lambda b: (round(b[1]), round(b[0])))  # top-to-bottom, left-to-right
        page_text = "\n".join(b[4] for b in blocks if b[4] and b[4].strip())
        pages.append(page_text)
    page_count = doc.page_count
    doc.close()
    return clean_text("\n\n".join(pages)), page_count


def clean_text(text: str) -> str:
    # De-hyphenate words split across line breaks: "photo-\nsynthesis" -> "photosynthesis"
    text = re.sub(r"(\w+)-\n(\w+)", r"\1\2", text)
    # Join lines that are part of the same sentence (line break not after . ! ? :)
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
    # Collapse excess whitespace.
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
