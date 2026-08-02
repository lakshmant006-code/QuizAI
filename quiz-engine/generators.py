"""
QuizAI offline quiz + summary engine (no LLM).

Rule-based question generation using spaCy (POS, dependency parse, NER):
  - Strict well-formed-sentence filtering (kills garbled/fragmentary text)
  - Single-blank cloze targeting the key answer term
  - Wh-question transformation ("What absorbs sunlight?" -> Chlorophyll)
  - Dependency-based definitions -> term/definition MCQs
  - Yes/No factual questions with controlled alterations
  - Match, short-answer, flashcards, and clean step-ordering
Falls back to regex heuristics if spaCy isn't available.
"""
from __future__ import annotations

import json
import math
import random
import re
from collections import Counter
from typing import Callable, Optional

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
    "the a an and or but of to in on for with as by at is are was were be been being this that these those it its from which who whom can will would should could may might also than then such into about over under when while there their they them his her our your my we you i he she not no do does did has have had each other more most some any all one two".split()
)
_BAD_TERM = re.compile(r"^(figure|table|chapter|section|example|page|fig|eq|equation|copyright|chapter)\b", re.I)


def _clean_term(t: str) -> str:
    t = re.sub(r"^(the|a|an|this|that|these|those|its|their|his|her|our|your|my|each|some|any)\s+", "", t.strip(), flags=re.I)
    t = t.strip(" .,:;\"'()[]{}“”’-")
    if not t or len(t) < 3 or len(t) > 42:
        return ""
    if _BAD_TERM.match(t) or re.search(r"\d", t):
        return ""
    words = t.split()
    if len(words) > 4 or all(w.lower() in _STOP for w in words):
        return ""
    return t


# ---------------------------------------------------------------------------
# Sentence validity — the key to non-garbled questions
# ---------------------------------------------------------------------------
def _valid_span(sent) -> bool:
    toks = [t for t in sent if not t.is_space]
    words = [t for t in toks if t.is_alpha]
    if not (6 <= len(toks) <= 34):
        return False
    if len(words) < 5:
        return False
    # Alphabetic ratio (reject symbol/number-heavy or OCR noise).
    if len(words) / max(1, len(toks)) < 0.65:
        return False
    # Too many one-letter words == garbled.
    if sum(1 for t in words if len(t) == 1) > 1:
        return False
    txt = sent.text.strip()
    if txt.endswith("?") or txt.endswith(":") or not txt.endswith((".", "!")):
        return False
    if not re.search(r"[a-z]", txt):  # ALL-CAPS heading
        return False
    # Needs a real predicate + a subject.
    has_verb = any(t.pos_ in ("VERB", "AUX") for t in sent)
    has_noun = any(t.pos_ in ("NOUN", "PROPN") for t in sent)
    has_subj = any(t.dep_ in ("nsubj", "nsubjpass") for t in sent)
    return has_verb and has_noun and has_subj


def _valid_text(s: str) -> bool:
    words = re.findall(r"[A-Za-z]+", s)
    toks = s.split()
    if not (6 <= len(toks) <= 34) or len(words) < 5:
        return False
    if sum(1 for w in words if len(w) == 1) > 1:
        return False
    if not s.strip().endswith((".", "!")):
        return False
    return bool(re.search(r"[a-z]", s))


def _chunk_of(token):
    for nc in token.doc.noun_chunks:
        if nc.start <= token.i < nc.end:
            return nc
    return None


# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------
def analyze(text: str) -> dict:
    text = re.sub(r"[ \t]+", " ", (text or "").strip())
    nlp = _nlp()
    doc = None
    if nlp is not None:
        try:
            doc = nlp(text[:200_000])
        except Exception:
            doc = None

    freq: Counter = Counter()
    terms_score: dict[str, float] = {}
    term_label: dict[str, str] = {}
    defs: dict[str, str] = {}
    facts: list[dict] = []          # structured clean sentences
    sentences: list[dict] = []      # {text, score, start, terms}

    if doc is not None and doc.has_annotation("DEP"):
        for tok in doc:
            if tok.is_alpha and not tok.is_stop and len(tok) > 2:
                freq[(tok.lemma_ or tok.text).lower()] += 1
        try:
            for nc in doc.noun_chunks:
                t = _clean_term(nc.text)
                if t:
                    terms_score[t] = terms_score.get(t, 0) + 1.3 * (1 + 0.3 * (len(t.split()) - 1))
        except Exception:
            pass
        for ent in getattr(doc, "ents", []):
            t = _clean_term(ent.text)
            if t:
                terms_score[t] = terms_score.get(t, 0) + 2.0
                term_label[t.lower()] = ent.label_
        low = text.lower()
        for t in list(terms_score):
            terms_score[t] *= 1 + math.log1p(low.count(t.lower()))

        for sent in doc.sents:
            if not _valid_span(sent):
                continue
            s = re.sub(r"\s+", " ", sent.text).strip()
            content = [t.lemma_.lower() for t in sent if t.is_alpha and not t.is_stop and len(t) > 2]
            score = sum(freq.get(w, 0) for w in content) / math.sqrt(len(content) + 1)
            sentences.append({"text": s, "score": score, "start": sent.start_char})
            _extract_def(sent, defs)
            f = _fact(sent)
            if f:
                facts.append(f)
    else:
        for w in re.findall(r"\b[a-zA-Z]{4,}\b", text.lower()):
            if w not in _STOP:
                freq[w] += 1
        for m in re.findall(r"\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})\b", text):
            t = _clean_term(m)
            if t:
                terms_score[t] = terms_score.get(t, 0) + 2
        for s in re.split(r"(?<=[.!?])\s+", text):
            s = re.sub(r"\s+", " ", s).strip()
            if _valid_text(s):
                content = [w for w in re.findall(r"\b[a-zA-Z]{4,}\b", s.lower()) if w not in _STOP]
                sentences.append({"text": s, "score": sum(freq.get(w, 0) for w in content) / math.sqrt(len(content) + 1), "start": text.find(s)})

    _defs_regex([s["text"] for s in sentences], defs)

    ranked = sorted(terms_score.items(), key=lambda kv: -kv[1])
    terms, seen = [], set()
    for t, _ in ranked:
        if t.lower() in seen:
            continue
        seen.add(t.lower())
        terms.append(t)
        if len(terms) >= 50:
            break

    for s in sentences:
        s["terms"] = [t for t in terms if re.search(rf"\b{re.escape(t)}\b", s["text"], re.I)]

    return {
        "text": text,
        "sentences": sorted(sentences, key=lambda s: s["start"]),
        "top_sentences": sorted(sentences, key=lambda s: -s["score"]),
        "facts": facts,
        "terms": terms,
        "term_label": term_label,
        "defs": defs,
        "freq": freq,
        "paragraphs": [p.strip() for p in re.split(r"\n\s*\n", text) if len(p.strip()) > 60] or [text],
    }


def _fact(sent) -> Optional[dict]:
    """Extract subject / predicate / key answer term from a clean sentence."""
    try:
        root = sent.root
        subj_tok = next((c for c in root.children if c.dep_ in ("nsubj", "nsubjpass")), None)
        if subj_tok is None or subj_tok.pos_ == "PRON":
            return None
        subj_chunk = _chunk_of(subj_tok) or subj_tok
        subject = _clean_term(subj_chunk.text)
        if not subject:
            return None
        # Answer object: dobj / attr / pobj noun chunk, else last noun chunk after root.
        answer, ans_label = None, None
        cands = [c for c in root.children if c.dep_ in ("dobj", "attr", "oprd")]
        for c in cands:
            ch = _chunk_of(c) or c
            a = _clean_term(ch.text)
            if a and a.lower() != subject.lower():
                answer, ans_label = a, term_label_of(ch)
                break
        if not answer:
            after = [nc for nc in sent.doc.noun_chunks if nc.start > root.i and nc.start >= sent.start and nc.end <= sent.end]
            for nc in reversed(after):
                a = _clean_term(nc.text)
                if a and a.lower() != subject.lower():
                    answer, ans_label = a, term_label_of(nc)
                    break
        return {
            "text": re.sub(r"\s+", " ", sent.text).strip(),
            "subject": subject,
            "subject_span": (subj_chunk.start_char, subj_chunk.end_char),
            "subject_label": term_label_of(subj_chunk),
            "answer": answer,
            "answer_label": ans_label,
            "root": root.text,
        }
    except Exception:
        return None


def term_label_of(span) -> Optional[str]:
    try:
        return span.root.ent_type_ or None
    except Exception:
        return None


def _extract_def(sent, defs: dict[str, str]) -> None:
    try:
        root = sent.root
        if root.lemma_.lower() not in {"be", "mean", "refer", "define", "describe", "call"}:
            return
        subj = next((c for c in root.children if c.dep_ in ("nsubj", "nsubjpass")), None)
        if subj is None:
            return
        term = _clean_term((_chunk_of(subj) or subj).text)
        if not term or term.lower() in defs:
            return
        idx = sent.text.lower().find(root.text.lower())
        tail = sent.text[idx + len(root.text):].strip(" .,")
        tail = re.sub(r"^(a|an|the)\s+", "", tail, flags=re.I).strip()
        if 12 < len(tail) < 200 and len(tail.split()) >= 3:
            defs[term] = tail
    except Exception:
        return


_DEF_PATTERNS = [
    re.compile(r"^(?P<t>[A-Z][\w\s\-]{2,38}?)\s+(?:is|are)\s+(?:a|an|the)?\s*(?P<d>.{18,180}?)[.]", re.I),
    re.compile(r"^(?P<t>[A-Z][\w\s\-]{2,38}?)\s+(?:refers to|means|is defined as|is called)\s+(?P<d>.{14,180}?)[.]", re.I),
]


def _defs_regex(sentences: list[str], defs: dict[str, str]) -> None:
    for s in sentences:
        for pat in _DEF_PATTERNS:
            m = pat.search(s.strip())
            if m:
                t = _clean_term(m.group("t"))
                d = m.group("d").strip().rstrip(".")
                if t and t.lower() not in defs and len(d.split()) >= 3:
                    defs[t] = d
                break


def _distractors(pool: list[str], correct: str, ctx: dict, avoid: str = "", n: int = 3) -> list[str]:
    label = ctx["term_label"].get(correct.lower())
    cl = len(correct)
    cand = []
    for x in pool:
        xl = x.lower()
        if xl == correct.lower() or correct.lower() in xl or xl in correct.lower():
            continue
        if avoid and re.search(rf"\b{re.escape(x)}\b", avoid, re.I):
            continue
        cand.append(x)
    same = [x for x in cand if label and ctx["term_label"].get(x.lower()) == label]
    same.sort(key=lambda x: abs(len(x) - cl))
    rest = sorted([x for x in cand if x not in same], key=lambda x: abs(len(x) - cl))
    return (same + rest)[:n]


def _q(model, kind, prompt, options, answer, explanation):
    return {"model": model, "kind": kind, "prompt": prompt, "options": options, "answer": answer, "explanation": explanation}


# ---------------------------------------------------------------------------
# Generators
# ---------------------------------------------------------------------------
def gen_cloze(ctx, k):
    """Single-blank gap-fill on the key answer term of a clean sentence."""
    out, used = [], set()
    for f in ctx["facts"]:
        target = f["answer"] or f["subject"]
        if not target or target.lower() in used:
            continue
        if not re.search(rf"\b{re.escape(target)}\b", f["text"], re.I):
            continue
        blank = re.sub(rf"\b{re.escape(target)}\b", "______", f["text"], count=1, flags=re.I)
        if blank.count("______") != 1:
            continue
        d = _distractors(ctx["terms"], target, ctx, avoid=blank, n=3)
        if len(d) < 3:
            continue
        opts = d + [target]
        random.shuffle(opts)
        used.add(target.lower())
        out.append(_q("cloze", "mcq", f"Fill in the blank: {blank}", opts, target, f"The correct term is “{target}”."))
        if len(out) >= k:
            break
    return out


def gen_wh(ctx, k):
    """Wh-question transformation: drop the leading subject, ask What/Who.
    Only fires when the sentence starts with the subject, so the predicate
    reads grammatically (e.g. 'Chlorophyll absorbs sunlight' -> 'What
    absorbs sunlight?')."""
    out, used = [], set()
    for f in ctx["facts"]:
        subj = f["subject"]
        if not subj or subj.lower() in used or len(subj.split()) > 4:
            continue
        m = re.match(rf"\s*(?:the\s+|a\s+|an\s+)?{re.escape(subj)}\b(.*)$", f["text"].strip(), re.I | re.S)
        if not m:
            continue
        predicate = m.group(1).strip().rstrip(".!").strip()
        # Must start with a verb-like predicate and be substantial.
        if len(predicate.split()) < 3 or not re.match(r"[a-z]", predicate):
            continue
        wh = "Who" if f["subject_label"] == "PERSON" else "What"
        prompt = f"{wh} {predicate}?"
        d = _distractors(ctx["terms"], subj, ctx, avoid=prompt, n=3)
        if len(d) < 3:
            continue
        opts = d + [subj]
        random.shuffle(opts)
        used.add(subj.lower())
        out.append(_q("wh_question", "mcq", prompt, opts, subj, f"Answer: {subj}."))
        if len(out) >= k:
            break
    return out


def gen_term_to_def(ctx, k):
    out = []
    defs = ctx["defs"]
    values = list(defs.values())
    for term, d in defs.items():
        others = [v for v in values if v != d]
        random.shuffle(others)
        others = others[:3]
        if len(others) < 3:
            continue
        opts = others + [d]
        random.shuffle(opts)
        out.append(_q("term_to_def", "mcq", f"Which best defines “{term}”?", opts, d, f"“{term}” — {d}."))
        if len(out) >= k:
            break
    return out


def gen_def_to_term(ctx, k):
    out = []
    defs = ctx["defs"]
    terms = list(defs.keys())
    for term, d in defs.items():
        dis = _distractors(terms, term, ctx, n=3)
        if len(dis) < 3:
            continue
        opts = dis + [term]
        random.shuffle(opts)
        out.append(_q("def_to_term", "mcq", f"Which term matches: “{d}”?", opts, term, f"“{term}” — {d}."))
        if len(out) >= k:
            break
    return out


def gen_true_false(ctx, k):
    """Yes/No factual questions from clean sentences (controlled alteration)."""
    out, used = [], set()
    for f in ctx["facts"]:
        key = f["answer"] or f["subject"]
        if not key or key.lower() in used:
            continue
        used.add(key.lower())
        if random.random() < 0.5 and f["answer"]:
            swap = next(iter(_distractors(ctx["terms"], f["answer"], ctx, avoid=f["subject"], n=1)), None)
            if not swap:
                continue
            stmt = re.sub(rf"\b{re.escape(f['answer'])}\b", swap, f["text"], count=1, flags=re.I)
            out.append(_q("true_false", "tf", f"Is this statement correct? {stmt}", ["Yes", "No"], "No",
                          f"No — the source says “{f['answer']}”, not “{swap}”."))
        else:
            out.append(_q("true_false", "tf", f"Is this statement correct? {f['text']}", ["Yes", "No"], "Yes",
                          "Yes — this matches the source."))
        if len(out) >= k:
            break
    return out


def gen_match(ctx, k):
    items = list(ctx["defs"].items())
    random.shuffle(items)
    pairs = items[: max(3, min(6, k + 3))]
    if len(pairs) < 3:
        return []
    return [_q("match", "match", "Match each term to its definition.", None,
               json.dumps([{"term": t, "definition": d} for t, d in pairs]), "Pair each term with its definition.")]


def gen_short_answer(ctx, k):
    return [_q("short_answer", "short", f"In one sentence, define “{t}”.", None, d, f"Model answer: {d}.")
            for t, d in list(ctx["defs"].items())[:k]]


def gen_sequence(ctx, k):
    out = []
    for para in ctx["paragraphs"]:
        steps = re.findall(r"(?:\b\d+[.)]|\b(?:first|second|third|then|next|after that|finally|lastly))[\s:,-]+([^.\n]{12,110})", para, flags=re.I)
        steps = [re.sub(r"\s+", " ", s).strip() for s in steps]
        steps = [s for s in steps if len(s.split()) >= 3][:5]
        if len(steps) >= 3:
            shuffled = steps[:]
            while shuffled == steps:
                random.shuffle(shuffled)
            out.append(_q("sequence", "order", "Put these steps in the correct order.", shuffled, json.dumps(steps),
                          "Order follows the source."))
        if len(out) >= k:
            break
    return out


def gen_flashcards(ctx, k):
    items = list(ctx["defs"].items())[: max(4, k + 3)]
    if not items:
        return []
    return [_q("flashcards", "flashcard", "Flashcards — flip and self-rate.", None,
               json.dumps([{"front": t, "back": d} for t, d in items]), "Review and self-rate each card.")]


MODELS: dict[str, Callable] = {
    "cloze": gen_cloze,
    "wh_question": gen_wh,
    "term_to_def": gen_term_to_def,
    "def_to_term": gen_def_to_term,
    "true_false": gen_true_false,
    "match": gen_match,
    "short_answer": gen_short_answer,
    "sequence": gen_sequence,
    "flashcards": gen_flashcards,
}

MODEL_LABELS = {
    "cloze": "Fill in the blank",
    "wh_question": "Direct question",
    "term_to_def": "Term → definition",
    "def_to_term": "Definition → term",
    "true_false": "Yes / No",
    "match": "Match the pairs",
    "short_answer": "Short answer recall",
    "sequence": "Put in order",
    "flashcards": "Flashcards",
}


def generate(text: str, models: list[str] | None = None, per_model: int = 3) -> dict:
    ctx = analyze(text)
    chosen = [m for m in (models or list(MODELS.keys())) if m in MODELS]
    questions, used, seen = [], {}, set()
    for name in chosen:
        try:
            qs = MODELS[name](ctx, per_model)
        except Exception:
            qs = []
        qs = [q for q in qs if q["prompt"] not in seen and not seen.add(q["prompt"])]
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
    ctx = analyze(text)
    top = ctx["top_sentences"]
    overview_sents = sorted(top[:3], key=lambda s: s["start"])
    overview = " ".join(s["text"] for s in overview_sents) or ctx["text"][:300]
    chosen, seen = [], {s["text"] for s in overview_sents}
    for s in top:
        if s["text"] in seen:
            continue
        chosen.append(s["text"]); seen.add(s["text"])
        if len(chosen) >= max_points:
            break
    return {
        "overview": overview,
        "key_points": chosen,
        "key_terms": [{"term": t, "definition": d} for t, d in list(ctx["defs"].items())[:max_terms]],
    }
