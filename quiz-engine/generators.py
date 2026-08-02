"""
QuizAI offline quiz generators.

Ten deterministic, LLM-free quiz "models" that build questions from plain
source text. Uses spaCy for noun-phrase / entity extraction when available,
and falls back to lightweight regex heuristics so the service always works.

Every generator returns a list of question dicts with a common shape:
  {
    "model":       <one of MODELS>,
    "kind":        "mcq" | "tf" | "short" | "match" | "order" | "flashcard",
    "prompt":      str,
    "options":     list[str] | None,
    "answer":      str,            # for match/order: JSON-encoded structure
    "explanation": str,
  }
"""
from __future__ import annotations

import random
import re
from typing import Callable

# ---------------------------------------------------------------------------
# Text analysis (spaCy with graceful fallback)
# ---------------------------------------------------------------------------
_NLP = None
_SPACY_TRIED = False


def _load_nlp():
    global _NLP, _SPACY_TRIED
    if _SPACY_TRIED:
        return _NLP
    _SPACY_TRIED = True
    try:
        import spacy  # type: ignore

        try:
            _NLP = spacy.load("en_core_web_sm", disable=["lemmatizer"])
        except Exception:
            # Model not downloaded — use a blank pipeline with a sentencizer.
            _NLP = spacy.blank("en")
            _NLP.add_pipe("sentencizer")
    except Exception:
        _NLP = None
    return _NLP


_STOP = {
    "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
    "as", "by", "at", "is", "are", "was", "were", "be", "been", "being", "this",
    "that", "these", "those", "it", "its", "from", "which", "who", "whom", "can",
    "will", "would", "should", "could", "may", "might", "also", "than", "then",
    "such", "into", "about", "over", "when", "while", "there", "their", "they",
}


def split_sentences(text: str) -> list[str]:
    nlp = _load_nlp()
    text = re.sub(r"\s+", " ", text).strip()
    if nlp is not None:
        try:
            doc = nlp(text[:100_000])
            sents = [s.text.strip() for s in doc.sents]
            if sents:
                return [s for s in sents if len(s) > 20]
        except Exception:
            pass
    # Fallback: split on sentence-ending punctuation.
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p.strip() for p in parts if len(p.strip()) > 20]


def extract_terms(text: str, limit: int = 60) -> list[str]:
    """Important multi/single-word terms, ranked by a simple salience score."""
    nlp = _load_nlp()
    cands: dict[str, int] = {}
    if nlp is not None and nlp.has_pipe("tok2vec") or (nlp and "ner" in nlp.pipe_names):
        pass
    if nlp is not None:
        try:
            doc = nlp(text[:100_000])
            # Noun chunks (if parser available) + named entities.
            try:
                for nc in doc.noun_chunks:
                    t = _clean_term(nc.text)
                    if t:
                        cands[t] = cands.get(t, 0) + 2
            except Exception:
                pass
            for ent in getattr(doc, "ents", []):
                t = _clean_term(ent.text)
                if t:
                    cands[t] = cands.get(t, 0) + 3
        except Exception:
            pass
    # Heuristic: capitalized words/phrases + frequent content words.
    for m in re.findall(r"\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b", text):
        t = _clean_term(m)
        if t:
            cands[t] = cands.get(t, 0) + 2
    for w in re.findall(r"\b[a-zA-Z]{5,}\b", text.lower()):
        if w not in _STOP:
            cands[w] = cands.get(w, 0) + 1

    ranked = sorted(cands.items(), key=lambda kv: (-kv[1], len(kv[0])))
    out: list[str] = []
    seen: set[str] = set()
    for term, _score in ranked:
        low = term.lower()
        if low in seen or len(term) < 3:
            continue
        seen.add(low)
        out.append(term)
        if len(out) >= limit:
            break
    return out


def _clean_term(t: str) -> str:
    t = re.sub(r"^(the|a|an)\s+", "", t.strip(), flags=re.I)
    t = t.strip(" .,:;\"'()[]")
    if not t or len(t) > 40 or t.lower() in _STOP:
        return ""
    if re.search(r"\d", t):
        return ""
    return t


_DEF_PATTERNS = [
    re.compile(r"^(?P<term>[A-Z][\w\s\-]{2,40}?)\s+(?:is|are|refers to|means|is defined as|describes)\s+(?P<def>.{15,240}?)[.]", re.I),
    re.compile(r"^(?P<term>[\w\s\-]{2,40}?)\s*[:\-–]\s*(?P<def>.{15,240})$"),
]


def extract_definitions(sentences: list[str]) -> dict[str, str]:
    """term -> definition, from 'X is Y', 'X: Y', 'X refers to Y' patterns."""
    defs: dict[str, str] = {}
    for s in sentences:
        for pat in _DEF_PATTERNS:
            m = pat.search(s.strip())
            if m:
                term = _clean_term(m.group("term"))
                definition = m.group("def").strip().rstrip(".")
                if term and 10 < len(definition) < 240 and term.lower() not in defs:
                    defs[term] = definition
                break
    return defs


def _sample_distractors(pool: list[str], correct: str, n: int = 3) -> list[str]:
    opts = [x for x in pool if x.lower() != correct.lower()]
    random.shuffle(opts)
    return opts[:n]


# ---------------------------------------------------------------------------
# The 10 generators
# ---------------------------------------------------------------------------
def gen_cloze(ctx, k):
    out = []
    for s in ctx["sentences"]:
        term = next((t for t in ctx["terms"] if re.search(rf"\b{re.escape(t)}\b", s)), None)
        if not term:
            continue
        blanked = re.sub(rf"\b{re.escape(term)}\b", "______", s, count=1)
        distractors = _sample_distractors(ctx["terms"], term, 3)
        if len(distractors) < 3:
            continue
        opts = distractors + [term]
        random.shuffle(opts)
        out.append(_q("cloze", "mcq", f"Fill in the blank: {blanked}", opts, term,
                      f"The missing term is “{term}”."))
        if len(out) >= k:
            break
    return out


def gen_term_to_def(ctx, k):
    out = []
    defs = ctx["defs"]
    def_values = list(defs.values())
    for term, definition in defs.items():
        distractors = _sample_distractors(def_values, definition, 3)
        if len(distractors) < 3:
            continue
        opts = distractors + [definition]
        random.shuffle(opts)
        out.append(_q("term_to_def", "mcq", f"Which best defines “{term}”?", opts, definition,
                      f"“{term}” — {definition}."))
        if len(out) >= k:
            break
    return out


def gen_def_to_term(ctx, k):
    out = []
    defs = ctx["defs"]
    terms = list(defs.keys())
    for term, definition in defs.items():
        distractors = _sample_distractors(terms, term, 3)
        if len(distractors) < 3:
            continue
        opts = distractors + [term]
        random.shuffle(opts)
        out.append(_q("def_to_term", "mcq", f"Which term matches this definition?\n\n“{definition}”", opts, term,
                      f"“{term}” — {definition}."))
        if len(out) >= k:
            break
    return out


def gen_true_false(ctx, k):
    out = []
    terms = ctx["terms"]
    for s in ctx["sentences"]:
        term = next((t for t in terms if re.search(rf"\b{re.escape(t)}\b", s)), None)
        if not term:
            continue
        make_false = random.random() < 0.5
        if make_false:
            swap = next((t for t in terms if t.lower() != term.lower()), None)
            if not swap:
                continue
            stmt = re.sub(rf"\b{re.escape(term)}\b", swap, s, count=1)
            out.append(_q("true_false", "tf", f"True or False: {stmt}", ["True", "False"], "False",
                          f"False — the original text refers to “{term}”, not “{swap}”."))
        else:
            out.append(_q("true_false", "tf", f"True or False: {s}", ["True", "False"], "True",
                          "True — this statement matches the source."))
        if len(out) >= k:
            break
    return out


def gen_match(ctx, k):
    import json
    defs = list(ctx["defs"].items())
    random.shuffle(defs)
    pairs = defs[: max(3, min(6, k + 3))]
    if len(pairs) < 3:
        return []
    payload = [{"term": t, "definition": d} for t, d in pairs]
    return [_q("match", "match", "Match each term to its definition.", None,
               json.dumps(payload), "Pair each term with the definition from the source.")]


def gen_odd_one_out(ctx, k):
    out = []
    para_terms = ctx["para_terms"]  # list[list[term]] grouped by paragraph
    all_terms = ctx["terms"]
    for group in para_terms:
        group = list(dict.fromkeys(group))
        if len(group) < 3:
            continue
        picks = group[:3]
        odd = next((t for t in all_terms if t not in group), None)
        if not odd:
            continue
        opts = picks + [odd]
        random.shuffle(opts)
        out.append(_q("odd_one_out", "mcq", "Which term does NOT belong with the others?", opts, odd,
                      f"“{odd}” comes from a different part of the material."))
        if len(out) >= k:
            break
    return out


def gen_sequence(ctx, k):
    import json
    out = []
    for para in ctx["paragraphs"]:
        steps = re.findall(r"(?:^|\n|\.)\s*(?:\d+[.)]|first|second|third|then|next|finally)[\s:,-]+([^.\n]{8,120})",
                           para, flags=re.I)
        steps = [s.strip() for s in steps if len(s.strip()) > 8]
        if len(steps) >= 3:
            correct = steps[:5]
            shuffled = correct[:]
            random.shuffle(shuffled)
            out.append(_q("sequence", "order", "Put these steps in the correct order.", shuffled,
                          json.dumps(correct), "Order follows the sequence described in the source."))
        if len(out) >= k:
            break
    return out


def gen_short_answer(ctx, k):
    out = []
    for term, definition in list(ctx["defs"].items())[:k]:
        out.append(_q("short_answer", "short", f"In your own words, define “{term}”.", None, definition,
                      f"Model answer: {definition}."))
    return out


def gen_sentence_completion(ctx, k):
    out = []
    endings = []
    for s in ctx["sentences"]:
        if "," in s:
            endings.append(s.rsplit(",", 1)[1].strip().rstrip("."))
    for s in ctx["sentences"]:
        if "," not in s:
            continue
        head, tail = s.rsplit(",", 1)
        tail = tail.strip().rstrip(".")
        if len(tail) < 8:
            continue
        distractors = _sample_distractors(endings, tail, 3)
        if len(distractors) < 3:
            continue
        opts = distractors + [tail]
        random.shuffle(opts)
        out.append(_q("sentence_completion", "mcq", f"Complete the sentence: {head}, ______", opts, tail,
                      f"The source completes it with: “{tail}”."))
        if len(out) >= k:
            break
    return out


def gen_flashcards(ctx, k):
    import json
    defs = list(ctx["defs"].items())[: max(3, k + 2)]
    if not defs:
        return []
    payload = [{"front": t, "back": d} for t, d in defs]
    return [_q("flashcards", "flashcard", "Flashcards — flip and self-rate.", None,
               json.dumps(payload), "Review each card and mark whether you knew it.")]


def _q(model, kind, prompt, options, answer, explanation):
    return {
        "model": model,
        "kind": kind,
        "prompt": prompt,
        "options": options,
        "answer": answer,
        "explanation": explanation,
    }


MODELS: dict[str, Callable] = {
    "cloze": gen_cloze,
    "term_to_def": gen_term_to_def,
    "def_to_term": gen_def_to_term,
    "true_false": gen_true_false,
    "match": gen_match,
    "odd_one_out": gen_odd_one_out,
    "sequence": gen_sequence,
    "short_answer": gen_short_answer,
    "sentence_completion": gen_sentence_completion,
    "flashcards": gen_flashcards,
}

MODEL_LABELS = {
    "cloze": "Fill in the blank",
    "term_to_def": "Term → definition",
    "def_to_term": "Definition → term",
    "true_false": "True / False",
    "match": "Match the pairs",
    "odd_one_out": "Odd one out",
    "sequence": "Put in order",
    "short_answer": "Short answer recall",
    "sentence_completion": "Sentence completion",
    "flashcards": "Flashcards",
}


def analyze(text: str) -> dict:
    text = (text or "").strip()
    sentences = split_sentences(text)
    terms = extract_terms(text)
    defs = extract_definitions(sentences)
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if len(p.strip()) > 40] or [text]
    para_terms = [[t for t in terms if re.search(rf"\b{re.escape(t)}\b", p)] for p in paragraphs]
    return {
        "sentences": sentences,
        "terms": terms,
        "defs": defs,
        "paragraphs": paragraphs,
        "para_terms": para_terms,
    }


def generate(text: str, models: list[str] | None = None, per_model: int = 3) -> dict:
    ctx = analyze(text)
    chosen = models or list(MODELS.keys())
    questions = []
    used = {}
    for name in chosen:
        fn = MODELS.get(name)
        if not fn:
            continue
        try:
            qs = fn(ctx, per_model)
        except Exception:
            qs = []
        used[name] = len(qs)
        questions.extend(qs)
    return {
        "count": len(questions),
        "per_model": used,
        "terms_found": len(ctx["terms"]),
        "definitions_found": len(ctx["defs"]),
        "questions": questions,
    }
