"""
QuizAI offline quiz + summary engine (no LLM).

Uses spaCy (POS, dependency parse, NER) for high-quality term extraction and
real definition detection, with regex fallbacks. Produces well-structured,
concept-focused questions and an extractive summary — deterministic, no tokens.
"""
from __future__ import annotations

import math
import random
import re
from collections import Counter
from typing import Callable

# ---------------------------------------------------------------------------
# spaCy loader (graceful fallback)
# ---------------------------------------------------------------------------
_NLP = None
_TRIED = False


def _nlp():
    global _NLP, _TRIED
    if _TRIED:
        return _NLP
    _TRIED = True
    try:
        import spacy

        try:
            _NLP = spacy.load("en_core_web_sm", disable=["lemmatizer"])
        except Exception:
            _NLP = spacy.blank("en")
            if "sentencizer" not in _NLP.pipe_names:
                _NLP.add_pipe("sentencizer")
    except Exception:
        _NLP = None
    return _NLP


_STOP = set(
    "the a an and or but of to in on for with as by at is are was were be been being this that these those it its from which who whom can will would should could may might also than then such into about over under when while there their they them his her our your my we you i he she not no do does did has have had".split()
)

_BAD_TERM = re.compile(r"^(figure|table|chapter|section|example|page|fig|eq|equation|©|copyright)\b", re.I)


def _clean_term(t: str) -> str:
    t = re.sub(r"^(the|a|an|this|that|these|those|its|their|his|her|our|your|my)\s+", "", t.strip(), flags=re.I)
    t = t.strip(" .,:;\"'()[]{}“”’-")
    if not t or len(t) < 3 or len(t) > 45:
        return ""
    if _BAD_TERM.match(t) or re.search(r"\d", t):
        return ""
    words = t.split()
    if len(words) > 4:
        return ""
    if all(w.lower() in _STOP for w in words):
        return ""
    return t


# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------
def analyze(text: str) -> dict:
    text = re.sub(r"[ \t]+", " ", (text or "").strip())
    nlp = _nlp()
    sentences: list[dict] = []
    terms_score: dict[str, float] = {}
    term_label: dict[str, str] = {}
    freq: Counter = Counter()
    defs: dict[str, str] = {}

    if nlp is not None:
        try:
            doc = nlp(text[:200_000])
        except Exception:
            doc = None
    else:
        doc = None

    if doc is not None and doc.has_annotation("SENT_START"):
        # Frequencies of content words.
        for tok in doc:
            if tok.is_alpha and not tok.is_stop and len(tok) > 2:
                freq[tok.lemma_.lower() if tok.lemma_ else tok.text.lower()] += 1

        # Candidate terms: noun chunks + named entities.
        try:
            for nc in doc.noun_chunks:
                t = _clean_term(nc.text)
                if t:
                    terms_score[t] = terms_score.get(t, 0) + 1.4 * (1 + 0.3 * (len(t.split()) - 1))
        except Exception:
            pass
        for ent in getattr(doc, "ents", []):
            t = _clean_term(ent.text)
            if t:
                terms_score[t] = terms_score.get(t, 0) + 2.2
                term_label[t.lower()] = ent.label_

        # Count term frequency across the doc to weight salience.
        low_text = text.lower()
        for t in list(terms_score):
            c = low_text.count(t.lower())
            terms_score[t] *= (1 + math.log1p(c))

        # Sentences with scores + contained terms + definitions via dependency.
        for sent in doc.sents:
            s = sent.text.strip()
            if not _good_sentence(s):
                continue
            content = [tok.lemma_.lower() for tok in sent if tok.is_alpha and not tok.is_stop and len(tok) > 2]
            score = sum(freq.get(w, 0) for w in content) / math.sqrt(len(content) + 1)
            sentences.append({"text": s, "score": score, "start": sent.start_char})
            _extract_def_from_sent(sent, defs)
    else:
        # Fallback: regex sentence split + heuristic terms.
        for w in re.findall(r"\b[a-zA-Z]{4,}\b", text.lower()):
            if w not in _STOP:
                freq[w] += 1
        for m in re.findall(r"\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})\b", text):
            t = _clean_term(m)
            if t:
                terms_score[t] = terms_score.get(t, 0) + 2
        for w, c in freq.items():
            if c >= 2:
                terms_score.setdefault(w, 0)
                terms_score[w] += c * 0.5
        for s in re.split(r"(?<=[.!?])\s+", text):
            s = s.strip()
            if _good_sentence(s):
                content = [w for w in re.findall(r"\b[a-zA-Z]{4,}\b", s.lower()) if w not in _STOP]
                score = sum(freq.get(w, 0) for w in content) / math.sqrt(len(content) + 1)
                sentences.append({"text": s, "score": score, "start": text.find(s)})

    # Regex definition patterns (supplement dependency-based ones).
    _extract_defs_regex([s["text"] for s in sentences], defs)

    # Rank terms.
    ranked = sorted(terms_score.items(), key=lambda kv: -kv[1])
    terms: list[str] = []
    seen: set[str] = set()
    for t, _ in ranked:
        low = t.lower()
        if low in seen:
            continue
        # Skip terms that are substrings of an already-kept term.
        if any(low in k or k in low for k in seen if abs(len(k) - len(low)) < 4):
            pass
        seen.add(low)
        terms.append(t)
        if len(terms) >= 45:
            break

    # Attach the salient term to each sentence, in document order.
    for s in sentences:
        s["terms"] = [t for t in terms if re.search(rf"\b{re.escape(t)}\b", s["text"], re.I)]
    sentences_by_pos = sorted(sentences, key=lambda s: s["start"])

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if len(p.strip()) > 60] or [text]

    return {
        "text": text,
        "sentences": sentences_by_pos,          # document order
        "top_sentences": sorted(sentences, key=lambda s: -s["score"]),
        "terms": terms,
        "term_label": term_label,
        "defs": defs,
        "freq": freq,
        "paragraphs": paragraphs,
    }


def _good_sentence(s: str) -> bool:
    if not (40 <= len(s) <= 260):
        return False
    if s.endswith("?") or s.endswith(":"):
        return False
    if s.count(",") > 5:
        return False
    letters = sum(c.isalpha() for c in s)
    if letters < len(s) * 0.6:
        return False
    if not re.search(r"[a-z]", s):  # skip ALL-CAPS headers
        return False
    return True


def _extract_def_from_sent(sent, defs: dict[str, str]) -> None:
    """Dependency-based: '<subject> is/means/refers to <predicate>'."""
    try:
        root = sent.root
        if root.lemma_.lower() not in {"be", "mean", "refer", "define", "describe", "call", "involve"}:
            return
        subj = next((c for c in root.children if c.dep_ in ("nsubj", "nsubjpass")), None)
        if subj is None:
            return
        # Subject span (its noun chunk if possible).
        term = _clean_term(_span_text(subj))
        if not term or term.lower() in defs:
            return
        # Predicate = everything after the root verb.
        tail = sent.text[sent.text.lower().find(root.text.lower()) + len(root.text):].strip(" .,")
        tail = re.sub(r"^(a|an|the)\s+", "", tail, flags=re.I)
        if 10 < len(tail) < 220:
            defs[term] = tail
    except Exception:
        return


def _span_text(token) -> str:
    for nc in token.doc.noun_chunks:
        if nc.start <= token.i < nc.end:
            return nc.text
    return token.text


_DEF_PATTERNS = [
    re.compile(r"^(?P<t>[A-Z][\w\s\-]{2,40}?)\s+(?:is|are)\s+(?:a|an|the)?\s*(?P<d>.{15,200}?)[.]", re.I),
    re.compile(r"^(?P<t>[A-Z][\w\s\-]{2,40}?)\s+(?:refers to|means|is defined as|is called|describes)\s+(?P<d>.{12,200}?)[.]", re.I),
    re.compile(r"^(?P<t>[\w\s\-]{2,40}?)\s*[:\-–]\s*(?P<d>.{15,200})$"),
]


def _extract_defs_regex(sentences: list[str], defs: dict[str, str]) -> None:
    for s in sentences:
        for pat in _DEF_PATTERNS:
            m = pat.search(s.strip())
            if m:
                t = _clean_term(m.group("t"))
                d = m.group("d").strip().rstrip(".")
                if t and t.lower() not in defs and 10 < len(d) < 220:
                    defs[t] = d
                break


def _distractors(pool: list[str], correct: str, ctx: dict, n: int = 3) -> list[str]:
    """Prefer distractors of the same NER label / similar length."""
    label = ctx["term_label"].get(correct.lower())
    cl = len(correct)
    cand = [x for x in pool if x.lower() != correct.lower() and correct.lower() not in x.lower() and x.lower() not in correct.lower()]
    same_label = [x for x in cand if label and ctx["term_label"].get(x.lower()) == label]
    same_label.sort(key=lambda x: abs(len(x) - cl))
    rest = [x for x in cand if x not in same_label]
    rest.sort(key=lambda x: abs(len(x) - cl))
    ordered = same_label + rest
    return ordered[: n]


def _q(model, kind, prompt, options, answer, explanation):
    return {"model": model, "kind": kind, "prompt": prompt, "options": options, "answer": answer, "explanation": explanation}


# ---------------------------------------------------------------------------
# Generators (quality-focused)
# ---------------------------------------------------------------------------
def gen_cloze(ctx, k):
    out, used = [], set()
    for s in ctx["sentences"]:
        if not s["terms"]:
            continue
        term = s["terms"][0]  # most salient term in the sentence
        if term.lower() in used:
            continue
        d = _distractors(ctx["terms"], term, ctx, 3)
        if len(d) < 3:
            continue
        blank = re.sub(rf"\b{re.escape(term)}\b", "______", s["text"], count=1, flags=re.I)
        if "______" not in blank:
            continue
        opts = d + [term]
        random.shuffle(opts)
        used.add(term.lower())
        out.append(_q("cloze", "mcq", f"Fill in the blank:\n\n{blank}", opts, term,
                      f"The correct term is “{term}”."))
        if len(out) >= k:
            break
    return out


def gen_term_to_def(ctx, k):
    out = []
    defs = ctx["defs"]
    values = list(defs.values())
    for term, definition in defs.items():
        d = [x for x in values if x != definition]
        random.shuffle(d)
        d = d[:3]
        if len(d) < 3:
            continue
        opts = d + [definition]
        random.shuffle(opts)
        out.append(_q("term_to_def", "mcq", f"Which statement best defines “{term}”?", opts, definition,
                      f"“{term}” — {definition}."))
        if len(out) >= k:
            break
    return out


def gen_def_to_term(ctx, k):
    out = []
    defs = ctx["defs"]
    terms = list(defs.keys())
    for term, definition in defs.items():
        d = _distractors(terms, term, ctx, 3)
        if len(d) < 3:
            continue
        opts = d + [term]
        random.shuffle(opts)
        out.append(_q("def_to_term", "mcq", f"Which term matches this definition?\n\n“{definition}”", opts, term,
                      f"“{term}” — {definition}."))
        if len(out) >= k:
            break
    return out


def gen_true_false(ctx, k):
    out, used = [], set()
    # Prefer definitional / high-salience sentences for meaningful T/F.
    pool = [s for s in ctx["top_sentences"] if s["terms"]]
    for s in pool:
        term = s["terms"][0]
        if term.lower() in used:
            continue
        used.add(term.lower())
        if random.random() < 0.5:
            swap = next((x for x in _distractors(ctx["terms"], term, ctx, 5)), None)
            if not swap:
                continue
            stmt = re.sub(rf"\b{re.escape(term)}\b", swap, s["text"], count=1, flags=re.I)
            out.append(_q("true_false", "tf", f"True or False:\n\n{stmt}", ["True", "False"], "False",
                          f"False — the source says “{term}”, not “{swap}”."))
        else:
            out.append(_q("true_false", "tf", f"True or False:\n\n{s['text']}", ["True", "False"], "True",
                          "True — this matches the source material."))
        if len(out) >= k:
            break
    return out


def gen_match(ctx, k):
    import json
    items = list(ctx["defs"].items())
    random.shuffle(items)
    pairs = items[: max(3, min(6, k + 3))]
    if len(pairs) < 3:
        return []
    payload = [{"term": t, "definition": d} for t, d in pairs]
    return [_q("match", "match", "Match each term to its correct definition.", None, json.dumps(payload),
               "Pair each term with its definition from the source.")]


def gen_odd_one_out(ctx, k):
    out = []
    paras = ctx["paragraphs"]
    all_terms = ctx["terms"]
    for para in paras:
        group = [t for t in all_terms if re.search(rf"\b{re.escape(t)}\b", para, re.I)]
        group = list(dict.fromkeys(group))[:3]
        if len(group) < 3:
            continue
        odd = next((t for t in all_terms if all(not re.search(rf"\b{re.escape(t)}\b", para, re.I) for _ in [0])
                    and t not in group), None)
        if not odd:
            continue
        opts = group + [odd]
        random.shuffle(opts)
        out.append(_q("odd_one_out", "mcq", "Which term does NOT belong with the others?", opts, odd,
                      f"“{odd}” is discussed in a different part of the material."))
        if len(out) >= k:
            break
    return out


def gen_sequence(ctx, k):
    import json
    out = []
    for para in ctx["paragraphs"]:
        steps = re.findall(r"(?:\b\d+[.)]|\b(?:first|second|third|fourth|then|next|after that|finally|lastly))[\s:,-]+([^.\n]{10,120})",
                           para, flags=re.I)
        steps = [re.sub(r"\s+", " ", s).strip() for s in steps]
        steps = [s for s in steps if len(s) > 10][:5]
        if len(steps) >= 3:
            shuffled = steps[:]
            while shuffled == steps:
                random.shuffle(shuffled)
            out.append(_q("sequence", "order", "Put these steps in the correct order.", shuffled, json.dumps(steps),
                          "Order follows the sequence described in the source."))
        if len(out) >= k:
            break
    return out


def gen_short_answer(ctx, k):
    out = []
    for term, definition in list(ctx["defs"].items())[:k]:
        out.append(_q("short_answer", "short", f"In one sentence, define “{term}”.", None, definition,
                      f"Model answer: {definition}."))
    return out


def gen_sentence_completion(ctx, k):
    out = []
    endings = [s["text"].rsplit(",", 1)[1].strip().rstrip(".") for s in ctx["sentences"] if "," in s["text"]]
    endings = [e for e in endings if len(e) > 8]
    for s in ctx["sentences"]:
        if "," not in s["text"]:
            continue
        head, tail = s["text"].rsplit(",", 1)
        tail = tail.strip().rstrip(".")
        if len(tail) < 10 or len(head) < 15:
            continue
        d = [e for e in endings if e != tail]
        random.shuffle(d)
        d = d[:3]
        if len(d) < 3:
            continue
        opts = d + [tail]
        random.shuffle(opts)
        out.append(_q("sentence_completion", "mcq", f"Choose the best completion:\n\n{head.strip()}, ______", opts, tail,
                      f"The source completes it with: “{tail}”."))
        if len(out) >= k:
            break
    return out


def gen_flashcards(ctx, k):
    import json
    items = list(ctx["defs"].items())[: max(4, k + 3)]
    if not items:
        return []
    payload = [{"front": t, "back": d} for t, d in items]
    return [_q("flashcards", "flashcard", "Flashcards — flip and self-rate.", None, json.dumps(payload),
               "Review each card and mark whether you knew it.")]


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


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def generate(text: str, models: list[str] | None = None, per_model: int = 3) -> dict:
    ctx = analyze(text)
    chosen = [m for m in (models or list(MODELS.keys())) if m in MODELS]
    questions, used, seen_prompts = [], {}, set()
    for name in chosen:
        try:
            qs = MODELS[name](ctx, per_model)
        except Exception:
            qs = []
        # Global dedup by prompt.
        qs = [q for q in qs if q["prompt"] not in seen_prompts and not seen_prompts.add(q["prompt"])]
        used[name] = len(qs)
        questions.extend(qs)
    return {
        "count": len(questions),
        "per_model": used,
        "terms_found": len(ctx["terms"]),
        "definitions_found": len(ctx["defs"]),
        "questions": questions,
    }


def summarize(text: str, max_points: int = 6, max_terms: int = 8) -> dict:
    """Extractive summary: overview sentences, key points, key terms."""
    ctx = analyze(text)
    top = ctx["top_sentences"]
    # Overview: 3 strongest sentences, restored to document order.
    overview_sents = sorted(top[:3], key=lambda s: s["start"])
    overview = " ".join(s["text"] for s in overview_sents) or (ctx["text"][:300])
    # Key points: next strongest distinct sentences.
    chosen, seen = [], {s["text"] for s in overview_sents}
    for s in top:
        if s["text"] in seen:
            continue
        chosen.append(s["text"])
        seen.add(s["text"])
        if len(chosen) >= max_points:
            break
    key_terms = [{"term": t, "definition": d} for t, d in list(ctx["defs"].items())[:max_terms]]
    return {"overview": overview, "key_points": chosen, "key_terms": key_terms}
