"""
HireMind AI — Resume Parser  v3 (Resilient)

Design principle: NEVER throw exceptions for content failures.
Any valid file produces a ParsedResume (possibly with empty sections).
422 is only raised by the caller if the file is truly unreadable binary.

Extraction chain:
  PDF  → pdfplumber (x_tol 3/5/8) → PyPDF2 → zipfile XML fallback
  DOCX → python-docx → zipfile XML fallback → empty string

Section detection:
  Fuzzy heading match against all known aliases.
  No exact string required — partial and normalised matching.
"""
from __future__ import annotations

import re
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

try:
    import pdfplumber
    _HAS_PDFPLUMBER = True
except ImportError:
    _HAS_PDFPLUMBER = False

try:
    from docx import Document as DocxDocument
    _HAS_DOCX = True
except ImportError:
    _HAS_DOCX = False

try:
    from PyPDF2 import PdfReader
    _HAS_PYPDF2 = True
except ImportError:
    _HAS_PYPDF2 = False


# ── Output schema ─────────────────────────────────────────────────────────────

@dataclass
class ParsedResume:
    text: str = ""
    # Personal information
    name: str = ""
    title: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    # Content sections
    summary: str = ""
    skills: list[str] = field(default_factory=list)
    skills_categorized: dict[str, list[str]] = field(default_factory=dict)
    experience: list[dict] = field(default_factory=list)
    education: list[dict] = field(default_factory=list)
    projects: list[dict] = field(default_factory=list)
    certifications: list[str] = field(default_factory=list)
    achievements: list[str] = field(default_factory=list)
    awards: list[str] = field(default_factory=list)
    publications: list[str] = field(default_factory=list)
    volunteer: list[dict] = field(default_factory=list)
    # Extraction diagnostics
    diagnostics: dict = field(default_factory=dict)


# ── Section heading aliases — generic, format-agnostic ───────────────────────

_SECTION_MAP: dict[str, list[str]] = {
    "summary": [
        "summary", "professional summary", "profile", "professional profile",
        "career summary", "about", "objective", "career objective",
        "executive summary", "about me", "overview", "personal statement",
        "career profile", "bio", "introduction",
    ],
    "experience": [
        "experience", "work experience", "professional experience",
        "employment", "employment history", "work history", "career history",
        "relevant experience", "internship experience", "professional background",
        "industry experience", "job history", "positions held",
        "professional roles", "work", "employment record",
    ],
    "education": [
        "education", "academic background", "academic history",
        "educational background", "qualifications", "academic qualifications",
        "degrees", "schooling", "academic", "university", "college",
        "academics", "educational qualifications",
    ],
    "skills": [
        "skills", "technical skills", "core competencies", "core skills",
        "technologies", "tech stack", "competencies", "tools and technologies",
        "technical expertise", "programming languages", "tools",
        "technical proficiencies", "technologies and skills", "key skills",
        "skill set", "areas of expertise", "expertise",
        "capabilities", "proficiencies", "technical knowledge",
    ],
    "projects": [
        "projects", "technical projects", "personal projects",
        "academic projects", "project experience", "key projects",
        "selected projects", "side projects", "notable projects",
        "portfolio", "project work", "project history",
    ],
    "certifications": [
        "certifications", "certificates", "licenses", "credentials",
        "training", "courses", "professional development",
        "certifications and awards", "training and certifications",
        "continuing education", "professional certifications",
    ],
    "achievements": [
        "leadership impact", "key achievements", "achievements",
        "key accomplishments", "accomplishments", "impact",
        "career highlights", "highlights", "notable achievements",
        "professional achievements",
    ],
    "awards": [
        "awards", "honors", "honors and awards", "recognition",
        "accolades", "awards and recognition", "distinctions",
    ],
    "publications": [
        "publications", "research", "papers", "research publications",
        "journal articles", "conference papers", "research work",
    ],
    "volunteer": [
        "volunteer", "volunteer experience", "community service",
        "social work", "extracurricular", "activities",
        "community involvement", "leadership activities",
    ],
}

_ALL_HEADINGS: set[str] = {h for hlist in _SECTION_MAP.values() for h in hlist}


# ── PDF text extraction (multi-strategy, never throws) ────────────────────────

def parse_resume_file(path: Path) -> ParsedResume:
    """
    Parse any resume file. NEVER throws for content/parsing failures.
    Returns a ParsedResume with diagnostics showing what was extracted.
    """
    suffix = path.suffix.lower()
    diag: dict = {"file_suffix": suffix, "strategies_tried": []}

    # ── Step 1: Extract raw text with multiple fallbacks ────────────────────
    raw = ""
    links: dict = {}

    if suffix == ".pdf":
        raw, tried = _extract_pdf_resilient(path)
        diag["strategies_tried"] = tried
        links = _extract_pdf_hyperlinks_safe(path)
    elif suffix == ".docx":
        raw, tried = _extract_docx_resilient(path)
        diag["strategies_tried"] = tried
    else:
        # Return empty resume with diagnostic — caller can decide what to do
        return ParsedResume(diagnostics={"error": f"Unsupported file type: {suffix}"})

    diag["text_length"] = len(raw)
    diag["text_extracted"] = len(raw) > 50

    # ── Step 2: Clean text ───────────────────────────────────────────────────
    text = _clean(raw) if raw.strip() else ""
    diag["cleaned_length"] = len(text)

    # ── Step 3: Parse into structured sections ───────────────────────────────
    result = _parse_safe(text, diag)

    # ── Step 4: Merge PDF hyperlinks (often missing from text) ───────────────
    if links.get("linkedin") and not result.linkedin:
        result.linkedin = links["linkedin"]
    if links.get("github") and not result.github:
        result.github = links["github"]

    return result


def _extract_pdf_resilient(path: Path) -> tuple[str, list[str]]:
    """Try multiple PDF extraction strategies. Returns (text, strategies_tried)."""
    tried: list[str] = []
    candidates: list[tuple[float, str]] = []

    if _HAS_PDFPLUMBER:
        # Strategy 0: column-aware word-position extraction (best for two-column PDFs)
        # This properly separates Education (left column) from Skills (right column)
        tried.append("pdfplumber_column_aware")
        try:
            text = _extract_pdf_column_aware(path)
            if text.strip():
                score = _score_extraction(text)
                # Bonus score if it doesn't have obvious column-merge artifacts
                if "LANGUAGES" not in text or "\nLANGUAGES" in text:
                    score = min(1.0, score + 0.15)
                candidates.append((score, text))
        except Exception as e:
            tried[-1] = f"pdfplumber_column_aware failed: {type(e).__name__}"

        # Strategy 1: pdfplumber with multiple tolerances (fallback)
        for x_tol in (3, 5, 8):
            strategy = f"pdfplumber(x_tol={x_tol})"
            tried.append(strategy)
            try:
                with pdfplumber.open(path) as pdf:
                    pages = []
                    for page in pdf.pages:
                        t = page.extract_text(x_tolerance=x_tol, y_tolerance=3) or ""
                        pages.append(t.strip())
                    text = "\n".join(pages)
                    if text.strip():
                        score = _score_extraction(text)
                        candidates.append((score, text))
                        if score > 0.85:
                            break
            except Exception as e:
                tried[-1] = f"{strategy} failed: {type(e).__name__}"
                continue

    # Strategy 2: PyPDF2 fallback
    if _HAS_PYPDF2 and (not candidates or max(c[0] for c in candidates) < 0.5):
        tried.append("PyPDF2")
        try:
            reader = PdfReader(str(path))
            pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n".join(pages)
            if text.strip():
                candidates.append((_score_extraction(text), text))
        except Exception as e:
            tried[-1] = f"PyPDF2 failed: {type(e).__name__}"

    # Strategy 3: zipfile XML (some PDFs are actually malformed ZIPs)
    if not candidates:
        tried.append("zipfile_xml_fallback")
        text = _extract_via_zipfile(path)
        if text.strip():
            candidates.append((0.3, text))

    if not candidates:
        return "", tried

    # Pick the best extraction
    candidates.sort(key=lambda c: c[0], reverse=True)
    return candidates[0][1], tried


def _extract_docx_resilient(path: Path) -> tuple[str, list[str]]:
    """Try multiple DOCX extraction strategies. Never throws."""
    tried: list[str] = []

    # Strategy 1: python-docx
    if _HAS_DOCX:
        tried.append("python-docx")
        try:
            doc = DocxDocument(str(path))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            tables = []
            for table in doc.tables:
                for row in table.rows:
                    cells = [c.text.strip() for c in row.cells if c.text.strip()]
                    if cells:
                        tables.append(" | ".join(cells))
            text = "\n".join(paragraphs + tables)
            if text.strip():
                return text, tried
        except Exception as e:
            tried[-1] = f"python-docx failed: {type(e).__name__}"

    # Strategy 2: zipfile XML (DOCX is a ZIP containing word/document.xml)
    tried.append("zipfile_xml")
    try:
        with zipfile.ZipFile(str(path)) as z:
            if "word/document.xml" in z.namelist():
                with z.open("word/document.xml") as doc_xml:
                    tree = ET.parse(doc_xml)
                    texts: list[str] = []
                    for elem in tree.iter():
                        tag = elem.tag
                        # w:t = text run, w:p = paragraph
                        if tag.endswith("}t") and elem.text:
                            texts.append(elem.text)
                        elif tag.endswith("}p") and texts:
                            texts.append("\n")
                    text = "".join(texts).strip()
                    if text:
                        return text, tried
    except Exception as e:
        tried[-1] = f"zipfile_xml failed: {type(e).__name__}"

    return "", tried


def _extract_pdf_column_aware(path: Path) -> str:
    """
    Extract text from PDF by grouping words by their y-position and x-column.
    This properly separates two-column layouts (e.g. Education | Skills side-by-side)
    that naive left-to-right extraction merges into one line.
    """
    if not _HAS_PDFPLUMBER:
        return ""

    with pdfplumber.open(path) as pdf:
        all_lines: list[str] = []
        for page in pdf.pages:
            words = page.extract_words(x_tolerance=3, y_tolerance=3, keep_blank_chars=False)
            if not words:
                t = page.extract_text() or ""
                if t.strip():
                    all_lines.append(t.strip())
                continue

            page_width = float(page.width)
            # Group words by approximate line (round y to nearest 4 points)
            line_groups: dict[int, list[dict]] = defaultdict(list)
            for w in words:
                key = round(float(w.get("top", 0)) / 4) * 4
                line_groups[key].append(w)

            for key in sorted(line_groups.keys()):
                line_words = sorted(line_groups[key], key=lambda w: float(w.get("x0", 0)))
                if not line_words:
                    continue

                # Detect two-column layout: words span both left and right halves
                xs = [float(w.get("x0", 0)) for w in line_words]
                has_left  = any(x < page_width * 0.55 for x in xs)
                has_right = any(x > page_width * 0.45 for x in xs)
                is_two_col = has_left and has_right and (max(xs) - min(xs)) > page_width * 0.3

                if is_two_col:
                    # Split at ~55% of page width to separate columns
                    split_x   = page_width * 0.52
                    left_txt  = " ".join(w["text"] for w in line_words if float(w.get("x0", 0)) < split_x)
                    right_txt = " ".join(w["text"] for w in line_words if float(w.get("x0", 0)) >= split_x)
                    if left_txt.strip():
                        all_lines.append(left_txt.strip())
                    if right_txt.strip():
                        all_lines.append(right_txt.strip())
                else:
                    all_lines.append(" ".join(w["text"] for w in line_words))

    return "\n".join(all_lines)


# ── Section contamination cleaner ─────────────────────────────────────────────

# Skill-category headings that prove a line belongs to Skills, not Education
_SKILL_CAT_RE = re.compile(
    r"^\s*(LANGUAGES?|FRAMEWORKS?|CLOUD\s*(?:&|AND)\s*DEVOPS?|AI\s*[/&]?\s*ML|"
    r"TOOLS?|DATABASES?|TECHNOLOGIES|TECHNICAL\s*SKILLS?|SKILLS?)\s*$",
    re.IGNORECASE,
)
# Tech keywords — if a line has 3+ of these it's a skills line, not education
_TECH_KW_RE = re.compile(
    r"\b(python|java|sql|bash|docker|kubernetes|aws|azure|gcp|react|fastapi|"
    r"django|flask|git|linux|terraform|jenkins|openai|scikit|pytorch|tensorflow|"
    r"nodejs|node\.js|typescript|javascript|golang|go|rust|c\+\+|mysql|postgresql|"
    r"mongodb|redis|kafka|spark|hadoop|ci/cd|devops|mlops)\b",
    re.IGNORECASE,
)


def _fix_section_contamination(sections: dict[str, str]) -> dict[str, str]:
    """
    Detect and fix Education ↔ Skills contamination caused by two-column PDF layouts.

    When pdfplumber reads Education (left) and Skills (right) on the same y-level,
    it produces: "MS in Information Systems LANGUAGES Python · Java · SQL..."

    This function splits such contamination back into clean sections.
    """
    edu_text = sections.get("education", "")
    if not edu_text:
        return sections

    edu_lines: list[str] = []
    spill_lines: list[str] = []
    contamination_started = False

    for line in edu_text.splitlines():
        stripped = line.strip()
        if not stripped:
            if not contamination_started:
                edu_lines.append(line)
            continue

        # A skill-category heading definitely marks the start of Skills content
        if _SKILL_CAT_RE.match(stripped):
            contamination_started = True

        # A line with 3+ tech keywords is a skills line, not an education line
        tech_hits = len(_TECH_KW_RE.findall(stripped))
        if tech_hits >= 3:
            contamination_started = True

        # Inline detection: "MS in Information Systems LANGUAGES Python ..."
        # The heading-keyword appears MID-line (not as a standalone heading)
        if not contamination_started:
            cat_match = re.search(
                r"\b(LANGUAGES?|FRAMEWORKS?|CLOUD\s*(?:&|AND)\s*DEVOPS?|AI\s*[/&]?\s*ML|TOOLS?)\b",
                stripped, re.IGNORECASE,
            )
            if cat_match and tech_hits >= 1:
                contamination_started = True
                # Split the line at the skill-category keyword
                split_pos = cat_match.start()
                left_part  = stripped[:split_pos].strip()
                right_part = stripped[split_pos:].strip()
                if left_part:
                    edu_lines.append(left_part)
                if right_part:
                    spill_lines.append(right_part)
                continue

        if contamination_started:
            spill_lines.append(line)
        else:
            edu_lines.append(line)

    if not contamination_started:
        return sections  # Nothing to fix

    # Rebuild sections with clean education
    fixed = dict(sections)
    fixed["education"] = "\n".join(edu_lines).strip()

    # Merge spill lines into the skills section (prepend so headings are first)
    existing_skills = sections.get("skills", "")
    spill_text = "\n".join(spill_lines).strip()
    if spill_text:
        fixed["skills"] = (spill_text + "\n" + existing_skills).strip() if existing_skills else spill_text

    return fixed


def _extract_via_zipfile(path: Path) -> str:
    """Last-resort: treat any file as a ZIP and extract text from XML."""
    try:
        with zipfile.ZipFile(str(path)) as z:
            texts: list[str] = []
            for name in z.namelist():
                if name.endswith(".xml"):
                    try:
                        with z.open(name) as f:
                            tree = ET.parse(f)
                            for elem in tree.iter():
                                if elem.text and elem.text.strip():
                                    texts.append(elem.text.strip())
                    except Exception:
                        continue
            return " ".join(texts)
    except Exception:
        return ""


def _extract_pdf_hyperlinks_safe(path: Path) -> dict[str, str]:
    """Extract hyperlinks from PDF. Never throws."""
    links: dict[str, str] = {}
    if not _HAS_PDFPLUMBER:
        return links
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                for link in (page.hyperlinks or []):
                    uri = (link.get("uri") or "").strip()
                    if not uri:
                        continue
                    if "linkedin.com" in uri.lower() and "linkedin" not in links:
                        links["linkedin"] = uri.rstrip("/")
                    elif "github.com" in uri.lower() and "github" not in links:
                        links["github"] = uri.rstrip("/")
    except Exception:
        pass
    return links


def _score_extraction(text: str) -> float:
    """Score extraction quality. 1.0 = excellent, 0.0 = all single-char artifacts."""
    lines = [l for l in text.splitlines() if l.strip()]
    if not lines:
        return 0.0
    bad = sum(1 for l in lines if _is_spaced_char_line(l))
    return 1.0 - bad / len(lines)


def _is_spaced_char_line(line: str) -> bool:
    tokens = line.split()
    if len(tokens) < 3:
        return False
    singles = sum(1 for t in tokens if len(t) == 1 and t.isalpha())
    return singles / len(tokens) > 0.35


# ── Text cleaning pipeline ─────────────────────────────────────────────────────

def _clean(text: str) -> str:
    text = _normalize_whitespace(text)
    text = _fix_spaced_characters(text)
    text = _join_continuation_lines(text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _normalize_whitespace(text: str) -> str:
    lines = []
    for line in text.splitlines():
        cleaned = re.sub(r"[^\S\n]+", " ", line).strip()
        lines.append(cleaned)
    return "\n".join(lines)


def _fix_spaced_characters(text: str) -> str:
    result = []
    for line in text.splitlines():
        result.append(_fix_line(line))
    return "\n".join(result)


def _fix_line(line: str) -> str:
    """
    Fix spaced-character extraction artifacts ONLY in heading-like lines.
    e.g. "P R O F E S S I O N A L  S U M M A R Y" → "PROFESSIONAL SUMMARY"

    NEVER modifies body text like "AWS cloud practitioner" — that would
    produce "AWSCLOUDPRACTITIONER" which is wrong.

    A heading-like line is: all-uppercase, ≤ 50 chars, no body punctuation.
    """
    tokens = line.split()
    if len(tokens) < 3:
        return line

    singles_ratio = sum(1 for t in tokens if len(t) == 1 and t.isalpha()) / len(tokens)
    if singles_ratio <= 0.35:
        return line  # Not a spaced-character artifact

    # Only fix heading-like lines (ALL CAPS, short, no body punctuation)
    is_heading_candidate = (
        line.strip() == line.strip().upper()
        and len(line.strip()) <= 55
        and not re.search(r"[.!?,;:@/\\()\[\]{}\d]", line)
    )
    if not is_heading_candidate:
        # Body text — return unchanged rather than risk destroying content
        return line

    # Merge single-char pairs with following multi-char tokens
    merged: list[str] = []
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if len(tok) == 1 and tok.isalpha() and i + 1 < len(tokens) and len(tokens[i + 1]) > 1:
            merged.append(tok + tokens[i + 1])
            i += 2
        else:
            merged.append(tok)
            i += 1

    rebuilt_singles = sum(1 for t in merged if len(t) == 1 and t.isalpha())
    if rebuilt_singles / max(1, len(merged)) > 0.25:
        collapsed = "".join(tokens)
        result = _split_collapsed(collapsed)
        # If split produced only 1 token (couldn't find word boundaries),
        # return the original line rather than a merged mess
        if len(result.split()) <= 1:
            return line
        return result

    return " ".join(merged)


_KNOWN_WORDS = sorted([
    # Resume section headings
    "PROFESSIONAL", "SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS",
    "PROJECTS", "CERTIFICATIONS", "ACHIEVEMENTS", "IMPACT", "HIGHLIGHTS",
    "TECHNICAL", "WORK", "CAREER", "EMPLOYMENT", "HISTORY", "ACADEMIC",
    "BACKGROUND", "PROFILE", "OBJECTIVE", "OVERVIEW", "CREDENTIALS",
    "AWARDS", "HONORS", "TRAINING", "COURSES",
    # Common certifications (so AWSCLOUDPRACTITIONER → AWS CLOUD PRACTITIONER)
    "PRACTITIONER", "SOLUTIONS", "ARCHITECT", "ASSOCIATE", "PROFESSIONAL",
    "CERTIFIED", "DEVELOPER", "ENGINEER", "ADMINISTRATOR", "SPECIALIST",
    "FOUNDATION", "ADVANCED", "GOOGLE", "AZURE", "CLOUD", "DATA",
    "MACHINE", "LEARNING", "ARTIFICIAL", "INTELLIGENCE", "SECURITY",
    "NETWORK", "DATABASE", "AWS", "GCP",
], key=len, reverse=True)


def _split_collapsed(text: str) -> str:
    upper = text.upper()
    parts = []
    remaining = upper
    while remaining:
        matched = False
        for word in _KNOWN_WORDS:
            if remaining.startswith(word):
                parts.append(word)
                remaining = remaining[len(word):]
                matched = True
                break
        if not matched:
            parts.append(remaining)
            break
    return " ".join(parts) if len(parts) > 1 else text


# Expanded bullet detection — covers all common bullet characters in PDFs
_BULLET_START = re.compile(r"^[•\-*▸►▪–◦○●▶‣◆◇▷]\s+")
_SENTENCE_END  = re.compile(r"[.!?%)\]\"']\s*$")
_DATE_RANGE    = re.compile(
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}/)\s*\d{4}",
    re.IGNORECASE,
)


def _join_continuation_lines(text: str) -> str:
    lines = text.splitlines()
    if not lines:
        return text
    out: list[str] = [lines[0]]
    for line in lines[1:]:
        stripped = line.strip()
        if not stripped:
            out.append(line)
            continue
        prev = out[-1].rstrip()
        is_bullet  = bool(_BULLET_START.match(stripped))
        is_heading = _classify_heading(stripped) is not None
        has_date   = bool(_DATE_RANGE.search(stripped))
        prev_done  = bool(_SENTENCE_END.search(prev))
        is_short   = bool(re.match(r'^[\d$£€%., ]+$', stripped)) and len(stripped) < 12
        can_join   = (
            not is_bullet and not prev.strip() == "" and
            not is_heading and not has_date and not prev_done and
            (is_short or not (stripped and stripped[0].isupper()) or len(stripped) < 20)
            and prev.strip()
        )
        if can_join:
            out[-1] = prev + " " + stripped
        else:
            out.append(line)
    return "\n".join(out)


# ── Section detection (fuzzy, format-agnostic) ────────────────────────────────

def _normalize_heading(line: str) -> str:
    return re.sub(r"[^a-z\s/&\-]", "", line.lower()).strip()


def _classify_heading(line: str) -> str | None:
    """
    Fuzzy heading classifier.
    Returns canonical section key if line matches a known heading, else None.
    Works for exact matches and prefix/partial matches.
    """
    norm = _normalize_heading(line)
    norm = re.sub(r"\s+", " ", norm).strip()
    if not norm or len(norm) > 55:
        return None

    # Exact match
    for key, aliases in _SECTION_MAP.items():
        for alias in aliases:
            if norm == alias or norm == alias + "s":
                return key

    # Prefix match (e.g. "Work History (2018-Present)" → "experience")
    for key, aliases in _SECTION_MAP.items():
        for alias in aliases:
            if norm.startswith(alias) and len(alias) >= 4:
                return key

    return None


def _split_sections(text: str) -> dict[str, str]:
    """Split resume text into {section_key: body_text}. Robust against missing sections."""
    lines = text.splitlines()
    sections: dict[str, list[str]] = {}
    current_key = "header"
    body: list[str] = []

    for line in lines:
        key = _classify_heading(line)
        if key:
            sections[current_key] = "\n".join(body).strip()
            current_key = key
            body = []
        else:
            body.append(line)

    sections[current_key] = "\n".join(body).strip()
    return sections


# ── Safe parse orchestrator ───────────────────────────────────────────────────

def _parse_safe(text: str, diag: dict) -> ParsedResume:
    """Parse text → ParsedResume. Never throws."""
    try:
        return _parse(text, diag)
    except Exception as exc:
        diag["parse_error"] = str(exc)
        # Fallback: return what we can with raw text at least
        return ParsedResume(text=text, diagnostics=diag)


def _validate_extraction(result: "ParsedResume") -> list[str]:
    """Return a list of validation warnings found in the parsed result."""
    warnings: list[str] = []
    for i, exp in enumerate(result.experience):
        if not exp.get("job_title") and not exp.get("company"):
            warnings.append(f"Experience[{i}]: missing title and company")
        if exp.get("job_title", "").startswith(("•", "-", "*")):
            warnings.append(f"Experience[{i}]: title is a bullet symbol: {exp['job_title']!r}")
        if exp.get("company") and len(exp.get("company", "")) > 80:
            warnings.append(f"Experience[{i}]: company too long (may contain location): {exp['company']!r}")
    for i, proj in enumerate(result.projects):
        name = (proj.get("name") or "").strip()
        if not name or re.match(r"^[•\-*▸►▪–◦○●▶‣◆◇▷\s]+$", name):
            warnings.append(f"Project[{i}]: invalid name: {name!r}")
        if len(name) > 100:
            warnings.append(f"Project[{i}]: name too long (may contain tech stack): {name[:50]!r}...")
    edu_tech_re = re.compile(r"\b(python|java|docker|kubernetes|aws|react|fastapi)\b", re.I)
    for i, edu in enumerate(result.education):
        deg = edu.get("degree", "") or ""
        sch = edu.get("school", "") or ""
        combined = deg + " " + sch
        if edu_tech_re.search(combined):
            warnings.append(f"Education[{i}]: contains tech keywords (possible contamination): {combined!r}")
    return warnings


def _parse(text: str, diag: dict) -> ParsedResume:
    sections = _split_sections(text)

    # Fix contamination from two-column PDFs (Education ↔ Skills merge)
    sections = _fix_section_contamination(sections)

    detected = [k for k in sections if k != "header" and sections[k].strip()]
    missing  = [k for k in ["summary", "experience", "education", "skills", "projects"]
                if k not in detected]

    diag["sections_detected"] = detected
    diag["sections_missing"]  = missing

    personal = _extract_personal(sections.get("header", ""), text)
    diag["has_name"]  = bool(personal["name"])
    diag["has_email"] = bool(personal["email"])

    skills, skills_cat = _extract_skills_safe(sections.get("skills", ""), text)
    diag["skills_count"] = len(skills)
    diag["experience_count"] = len(_extract_experience(sections.get("experience", "")))

    result = ParsedResume(
        text=text,
        name=personal["name"],
        title=personal["title"],
        email=personal["email"],
        phone=personal["phone"],
        location=personal["location"],
        linkedin=personal["linkedin"],
        github=personal["github"],
        summary=_extract_summary_safe(sections.get("summary", "")),
        skills=skills,
        skills_categorized=skills_cat,
        experience=_safe_list(_extract_experience, sections.get("experience", "")),
        education=_safe_list(_extract_education, sections.get("education", "")),
        projects=_safe_list(_extract_projects, sections.get("projects", "")),
        certifications=_safe_strings(_extract_certifications, sections.get("certifications", "")),
        achievements=_safe_strings(_extract_certifications, sections.get("achievements", "")),
        awards=_safe_strings(_extract_certifications, sections.get("awards", "")),
        publications=_safe_strings(_extract_certifications, sections.get("publications", "")),
        volunteer=_safe_list(_extract_experience, sections.get("volunteer", "")),
        diagnostics=diag,
    )

    # Validation pass — adds warnings to diagnostics
    warnings = _validate_extraction(result)
    if warnings:
        result.diagnostics["validation_warnings"] = warnings

    result.diagnostics["extraction_report"] = {
        "name":                result.name or "NOT DETECTED",
        "email":               result.email or "NOT DETECTED",
        "experience_count":    len(result.experience),
        "project_count":       len(result.projects),
        "skill_count":         len(result.skills),
        "certification_count": len(result.certifications),
        "education_count":     len(result.education),
        "validation_warnings": warnings,
    }
    return result


def _safe_list(fn, *args) -> list:
    try:
        return fn(*args)
    except Exception:
        return []


def _safe_strings(fn, *args) -> list[str]:
    try:
        return fn(*args)
    except Exception:
        return []


def _extract_summary_safe(text: str) -> str:
    try:
        return _extract_summary(text)
    except Exception:
        return text.strip()[:800] if text.strip() else ""


def _extract_skills_safe(skills_text: str, full_text: str) -> tuple[list[str], dict]:
    try:
        return _extract_skills(skills_text, full_text)
    except Exception:
        return [], {}


# ── Personal info extraction ──────────────────────────────────────────────────

def _extract_personal(header_text: str, full_text: str) -> dict[str, str]:
    info = {k: "" for k in ("name", "title", "email", "phone", "location", "linkedin", "github")}

    # Email
    m = re.search(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}", full_text)
    if m:
        info["email"] = m.group(0)

    # Phone
    m = re.search(r"(?:\+?1[\s.\-]?)?(?:\(?\d{3}\)?[\s.\-]?)\d{3}[\s.\-]?\d{4}", full_text)
    if m:
        info["phone"] = m.group(0).strip()

    # LinkedIn
    m = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[A-Za-z0-9_.\-/]+", full_text, re.I)
    if m:
        info["linkedin"] = m.group(0).rstrip("/")

    # GitHub
    m = re.search(r"(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9_.\-]+", full_text, re.I)
    if m:
        info["github"] = m.group(0).rstrip("/")

    # Location
    m = re.search(r"\b[A-Z][a-zA-Z .'\-]+,\s*[A-Z]{2}\b", full_text)
    if m:
        info["location"] = m.group(0)

    # Name and title from header
    _CONTACT_RE = re.compile(r"@|linkedin|github|http|www\.|\.com|\d{3}[\s.\-]\d{4}", re.I)
    header_lines = [l.strip() for l in header_text.splitlines() if l.strip()]

    for line in header_lines[:12]:
        if _CONTACT_RE.search(line):
            continue
        if _classify_heading(line):
            continue
        if not info["name"] and _looks_like_name(line):
            info["name"] = line
            continue
        if info["name"] and not info["title"] and _looks_like_title(line):
            info["title"] = line
            continue

    return info


def _looks_like_name(line: str) -> bool:
    line = line.strip()
    if not line or len(line) > 55 or len(line) < 4:
        return False
    if re.search(r"[\d@/:|•,]", line):
        return False
    if _classify_heading(line):
        return False
    if re.search(r"\b(university|college|institute|school|bachelor|master|doctor|"
                 r"b\.s|m\.s|ph\.d|mba|engineer|developer|analyst|manager|"
                 r"designer|consultant|specialist|director)\b", line, re.I):
        return False
    words = line.split()
    return 2 <= len(words) <= 5 and all(re.match(r"^[A-Z][a-zA-Z'\-]*$", w) for w in words)


def _looks_like_title(line: str) -> bool:
    return bool(re.search(
        r"\b(engineer|developer|analyst|manager|designer|consultant|specialist|"
        r"coordinator|intern|student|graduate|architect|administrator|scientist|"
        r"researcher|director|lead|associate|senior|junior|systems?|software|"
        r"data|cloud|devops|full.?stack|backend|frontend|ai|ml)\b",
        line, re.I,
    ))


# ── Experience extraction ──────────────────────────────────────────────────────

_DATE_RANGE_RE = re.compile(
    r"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|"
    r"January|February|March|April|June|July|August|September|October|November|December)"
    r"\s+\d{4}|\d{1,2}/\d{4}|\d{4})"
    r"\s*[-–—to]+\s*"
    r"(?:Present|Current|Now|"
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|"
    r"January|February|March|April|June|July|August|September|October|November|December)"
    r"\s+\d{4}|\d{1,2}/\d{4}|\d{4})",
    re.IGNORECASE,
)


def _is_new_job_header(line: str) -> bool:
    """
    Heuristic: does this line look like a new job entry header?
    True for: "Software Engineer Intern · IBM – Remote"
              "Software Engineer, Google | San Francisco"
              "Product Manager – Startup Inc"
    False for: bullet text, section headings, plain sentences.
    """
    if _BULLET_START.match(line):
        return False
    if len(line) > 120:
        return False
    has_role   = bool(_looks_like_title(line))
    has_sep    = bool(re.search(r"[·|]", line))      # · or | separator
    has_dash   = bool(re.search(r"\s+[–—-]\s+", line))  # company–location
    has_comma_company = bool(re.search(r",\s+[A-Z][a-zA-Z]", line) and _looks_like_title(line))
    return (has_role and has_sep) or (has_role and has_dash) or has_comma_company


def _extract_experience(text: str) -> list[dict]:
    """
    State-machine experience extractor.

    Handles:
    A) Date on same line:  "Software Engineer · IBM – Bengaluru, India  Dec 2022 – Dec 2023"
    B) Date on next line:  "Software Engineer · IBM – Remote"
                           "Jun 2022 – Dec 2022"
    C) Company on next line: "Software Engineer"
                              "IBM"
                              "Jan 2020 – Present"

    State: IDLE → HEADER_SEEN → IN_BULLETS
    """
    if not text.strip():
        return []

    lines = [l.strip() for l in text.splitlines() if l.strip()]
    jobs: list[dict] = []
    current: dict | None = None
    pending_header: str = ""   # non-bullet line waiting for a date on the next line
    pending_company: str = ""  # standalone company name seen before job title

    def _save_current() -> None:
        if current and (current.get("job_title") or current.get("company")):
            jobs.append(current)

    for line in lines:
        is_bullet = bool(_BULLET_START.match(line))
        clean     = _BULLET_START.sub("", line).strip()
        if not clean:
            continue

        date_m = _DATE_RANGE_RE.search(line)

        # ── Bullet ────────────────────────────────────────────────────────
        if is_bullet:
            pending_header = ""
            if current:
                current["bullets"].append(clean)
            continue

        # ── Section heading → stop collecting ─────────────────────────────
        if _classify_heading(clean):
            pending_header = ""
            continue

        # ── Line WITH a date range (definite job header) ──────────────────
        if date_m:
            before_date = line[:date_m.start()].strip().rstrip("·|,–— ")
            if before_date:
                # Date on the same line as role+company
                header_line = line
            elif pending_header:
                # Date on next line; attach to pending header
                header_line = pending_header + "  " + date_m.group(0)
            else:
                # Bare date line — patch into current job if dates are missing
                if current and not current.get("start_date"):
                    parts = re.split(r"\s*[-–—to]+\s*", date_m.group(0), 1, flags=re.IGNORECASE)
                    current["start_date"] = parts[0].strip()
                    current["end_date"]   = parts[1].strip() if len(parts) > 1 else ""
                pending_header = ""
                continue

            _save_current()
            current = _parse_job_header(header_line, pending_company)
            pending_header  = ""
            pending_company = ""
            continue

        # ── Line WITHOUT a date range ─────────────────────────────────────

        # KEY FIX: If this line looks like a new job header but has no date yet,
        # save the current job and record this as a pending header.
        # Previously this line was being added as a BULLET of the current job,
        # causing "Software Engineer Intern · IBM – Remote" to merge with IBM SE.
        if _is_new_job_header(clean):
            if pending_header:
                # We had a previous pending header with no date — save it as a job
                _save_current()
                current = _parse_job_header(pending_header, pending_company)
                pending_company = ""
            elif current:
                # Don't append as bullet — this will be a new job once its date arrives
                pass  # fall through to set pending_header below
            pending_header = clean
            continue

        # Not a job header, not a bullet, not a heading
        if current:
            # Is this a continuation of an incomplete last bullet?
            if (current["bullets"] and
                    not _SENTENCE_END.search(current["bullets"][-1]) and
                    not _DATE_RANGE_RE.search(clean) and
                    len(clean) < 80):
                current["bullets"][-1] += " " + clean
            elif not current.get("company") and _looks_like_company(clean):
                current["company"] = clean
            elif len(clean) > 10 and not re.match(r"^\d", clean):
                # Only add as bullet if it's a meaningful sentence (not a date or number)
                current["bullets"].append(clean)
        else:
            # Before any job has been detected
            if _looks_like_company(clean) and not _looks_like_title(clean):
                pending_company = clean
            else:
                pending_header = clean

    # Save last pending header if it never got a date
    if pending_header and not current:
        j = _parse_job_header(pending_header, pending_company)
        if j.get("job_title") or j.get("company"):
            jobs.append(j)

    _save_current()

    # Validation: must have title OR company
    return [j for j in jobs if j.get("job_title") or j.get("company")]


def _parse_job_header(line: str, pending_company: str) -> dict:
    """
    Parse a job header line into {job_title, company, location, start_date, end_date}.
    Handles formats:
      "Software Engineer · IBM – Bengaluru, India  Dec 2022 – Dec 2023"
      "Software Engineer, IBM – Remote  Jun 2022 – Dec 2022"
      "Software Engineer · IBM – Remote  Jun 2022 – Dec 2022"
    """
    job = {"job_title": "", "company": "", "location": "", "start_date": "", "end_date": "", "bullets": []}

    # Step 1: Extract date range
    date_m = _DATE_RANGE_RE.search(line)
    if date_m:
        date_str  = date_m.group(0)
        date_parts = re.split(r"\s*[-–—to]+\s*", date_str, maxsplit=1, flags=re.IGNORECASE)
        job["start_date"] = date_parts[0].strip()
        job["end_date"]   = date_parts[1].strip() if len(date_parts) > 1 else ""
        rest = (line[:date_m.start()] + " " + line[date_m.end():]).strip()
    else:
        rest = line

    # Strip trailing separators
    rest = re.sub(r"[|·,\s]+$", "", rest).strip()
    if not rest:
        return job

    # Step 2: Split by · or | (primary separators)
    pipe_parts = re.split(r"\s*[|·]\s*", rest)
    if len(pipe_parts) >= 2:
        job["job_title"] = pipe_parts[0].strip()
        company_loc = pipe_parts[1].strip()
        # Step 3: Split company from location — "IBM – Bengaluru, India" or "IBM – Remote"
        company_loc = _split_company_location(company_loc, job)
        if len(pipe_parts) >= 3:
            job["location"] = pipe_parts[2].strip()
    elif "," in rest:
        # Comma-separated: "Software Engineer, IBM – Remote"
        pieces = rest.split(",", 1)
        job["job_title"] = pieces[0].strip()
        company_loc = pieces[1].strip()
        _split_company_location(company_loc, job)
    else:
        # Only one token — might be "Software Engineer · IBM" without date
        job["job_title"] = rest.strip()

    if pending_company and not job["company"]:
        job["company"] = pending_company

    return job


def _split_company_location(company_loc: str, job: dict) -> str:
    """
    Split "IBM – Bengaluru, India" into company="IBM", location="Bengaluru, India".
    Also handles "IBM – Remote", "Google | San Francisco, CA", etc.
    Modifies job dict in place. Returns remainder after split.
    """
    # Em-dash or en-dash separates company from location: "IBM – Bengaluru, India"
    dash_m = re.search(r"\s+[–—]\s+", company_loc)
    if dash_m:
        job["company"]  = company_loc[:dash_m.start()].strip()
        job["location"] = company_loc[dash_m.end():].strip()
        return ""

    # Hyphen with spaces: "IBM - Remote"
    hyph_m = re.search(r"\s+-\s+", company_loc)
    if hyph_m:
        job["company"]  = company_loc[:hyph_m.start()].strip()
        job["location"] = company_loc[hyph_m.end():].strip()
        return ""

    # Comma: "IBM, Bengaluru"
    comma_m = re.search(r",\s+", company_loc)
    if comma_m:
        job["company"]  = company_loc[:comma_m.start()].strip()
        job["location"] = company_loc[comma_m.end():].strip()
        return ""

    # No separator found — whole string is company
    job["company"] = company_loc.strip()
    return ""


def _looks_like_company(line: str) -> bool:
    if not line or len(line) > 80:
        return False
    if _BULLET_START.match(line):
        return False
    return bool(re.search(
        r"\b(inc|llc|corp|corporation|company|systems|technologies|labs|solutions|group|"
        r"services|consulting|associates|partners|bank|hospital|university|college|"
        r"institute|foundation|international|global|team|software|tech|digital|cloud|"
        r"data|ai|studio|agency|firm|ibm|google|amazon|meta|apple|microsoft|stripe|"
        r"airbnb|netflix|tesla|salesforce|oracle|deloitte|accenture|infosys|wipro)\b",
        line, re.I,
    ))


# ── Education extraction ──────────────────────────────────────────────────────

_DEGREE_RE = re.compile(
    r"\b(?:bachelor(?:'?s)?|master(?:'?s)?|doctor(?:ate)?|ph\.?d|mba|"
    r"m\.s\.?|b\.s\.?|m\.a\.?|b\.a\.?|b\.?e\.?|m\.?e\.?|b\.?tech|m\.?tech|"
    r"associate|diploma|certificate|ms\b|bs\b|"
    r"bachelor of [a-z ]+|master of [a-z ]+|doctor of [a-z ]+)",
    re.IGNORECASE,
)
_SCHOOL_RE = re.compile(
    r"\b(?:university|college|institute(?:\s+of\s+\w+)?|school of|academy|polytechnic)\b",
    re.IGNORECASE,
)
_GPA_RE  = re.compile(r"gpa[:\s]+([0-9.]+)", re.IGNORECASE)
_YEAR_RE = re.compile(r"\b(20\d{2}|19\d{2})\b")


def _extract_education(text: str) -> list[dict]:
    if not text.strip():
        return []
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    entries: list[dict] = []
    current: dict | None = None

    for line in lines:
        if _BULLET_START.match(line):
            if current:
                gpa_m = _GPA_RE.search(line)
                if gpa_m and not current.get("gpa"):
                    current["gpa"] = gpa_m.group(1)
            continue

        has_degree = bool(_DEGREE_RE.search(line))
        has_school = bool(_SCHOOL_RE.search(line))
        gpa_m  = _GPA_RE.search(line)
        date_m = _DATE_RANGE_RE.search(line)
        year_m = _YEAR_RE.search(line)

        if has_degree and has_school:
            if current and (current.get("degree") or current.get("school")):
                entries.append(current)
            degree_pos = _DEGREE_RE.search(line).start()
            school_pos = _SCHOOL_RE.search(line).start()
            date_str = date_m.group(0) if date_m else (year_m.group(0) if year_m else "")
            if school_pos < degree_pos:
                comma_idx = line.rfind(",", 0, degree_pos)
                if comma_idx >= 0:
                    school_part = line[:comma_idx].strip()
                    degree_part = line[comma_idx + 1:].strip()
                else:
                    school_part = line[:degree_pos].strip().rstrip(",–—").strip()
                    degree_part = line[degree_pos:].strip()
            else:
                comma_idx = line.find(",", degree_pos)
                if comma_idx >= 0:
                    degree_part = line[:comma_idx].strip()
                    school_part = line[comma_idx + 1:].strip()
                else:
                    degree_part = line[:school_pos].strip()
                    school_part = line[school_pos:].strip()
            for ds in [date_str]:
                degree_part = degree_part.replace(ds, "").strip().rstrip(",–—").strip() if ds else degree_part
                school_part = school_part.replace(ds, "").strip().rstrip(",–—").strip() if ds else school_part
            current = {"school": school_part, "degree": degree_part,
                       "gpa": gpa_m.group(1) if gpa_m else "", "graduation_date": date_str}
        elif has_degree:
            if current and (current.get("degree") or current.get("school")):
                entries.append(current)
            date_str = date_m.group(0) if date_m else (year_m.group(0) if year_m else "")
            degree_str = line.replace(date_str, "").strip().rstrip(",–—").strip() if date_str else line
            current = {"school": "", "degree": degree_str, "gpa": gpa_m.group(1) if gpa_m else "", "graduation_date": date_str}
        elif has_school:
            if not current:
                current = {"school": "", "degree": "", "gpa": "", "graduation_date": ""}
            date_str = date_m.group(0) if date_m else (year_m.group(0) if year_m else "")
            school_str = line.replace(date_str, "").strip().rstrip(",–—").strip() if date_str else line
            current["school"] = school_str
            if gpa_m and not current.get("gpa"):
                current["gpa"] = gpa_m.group(1)
            if date_str and not current.get("graduation_date"):
                current["graduation_date"] = date_str
        elif current:
            if gpa_m and not current.get("gpa"):
                current["gpa"] = gpa_m.group(1)
            if date_m and not current.get("graduation_date"):
                current["graduation_date"] = date_m.group(0)
            elif year_m and not current.get("graduation_date"):
                current["graduation_date"] = year_m.group(0)
            if not current.get("school") and re.search(r"\b(university|college|institute|school)\b", line, re.I):
                current["school"] = line

    if current and (current.get("degree") or current.get("school")):
        entries.append(current)

    # Post-process: extract coursework from any entry that has it mixed in
    for entry in entries:
        for field in ("degree", "school", "graduation_date"):
            val = entry.get(field, "")
            cw_m = re.search(r"(?:relevant\s+)?(?:course\s*work|courses?)[:\s]+(.+)", val, re.I)
            if cw_m:
                entry["coursework"] = cw_m.group(1).strip()
                entry[field] = val[:cw_m.start()].strip().rstrip(",|•")

    return entries


# ── Skills extraction ──────────────────────────────────────────────────────────

_SKILL_CATEGORIES = {
    "Programming Languages": [
        "python","java","javascript","typescript","go","golang","rust","c++","c#",
        "sql","bash","r","scala","swift","kotlin","matlab","perl","php","ruby",
    ],
    "Software Development": [
        "object-oriented programming","oop","data structures","algorithms",
        "data structures & algorithms","data structures and algorithms",
        "rest apis","rest api","backend development","api development",
        "sdlc","microservices","debugging","unit testing","agile methodologies",
        "agile","scrum","kanban","tdd","bdd","design patterns","solid",
    ],
    "Frameworks & Libraries": [
        "react","angular","vue","node","node.js","django","flask","fastapi","spring",
        "laravel","nextjs","express","pandas","numpy","tensorflow","pytorch","keras",
    ],
    "Cloud & DevOps": [
        "aws","azure","gcp","google cloud","ec2","s3","lambda","ecr","cloudwatch",
        "docker","kubernetes","k8s","terraform","ansible","jenkins","ci/cd",
        "github actions","gitlab","openshift","helm","argo","cloudformation",
    ],
    "Databases": [
        "postgresql","mysql","mongodb","redis","sqlite","dynamodb","cassandra",
        "elasticsearch","oracle","snowflake","bigquery","supabase",
    ],
    "AI & ML": [
        "machine learning","deep learning","openai","langchain","nlp",
        "scikit-learn","prompt engineering","pytorch","tensorflow","hugging face",
        "rag","embedding","llm",
    ],
    "Tools & Platforms": [
        "git","github","linux","unix","vs code","eclipse","splunk","dynatrace",
        "jira","postman","figma","confluence","grafana","prometheus","datadog",
    ],
}
_TECH_KEYWORDS = {kw for items in _SKILL_CATEGORIES.values() for kw in items}


def _extract_skills(text: str, full_text: str) -> tuple[list[str], dict[str, list[str]]]:
    flat: list[str] = []
    seen: set[str] = set()
    categorized: dict[str, list[str]] = {}

    def add(s: str) -> None:
        c = s.strip().strip(".,;:")
        if not c or len(c) < 2 or len(c) > 50:
            return
        k = c.lower()
        if k not in seen:
            seen.add(k)
            flat.append(c)

    if text.strip():
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            cat_m = re.match(r"^([A-Za-z &/()]+):\s*(.+)$", line)
            if cat_m:
                cat_name = cat_m.group(1).strip()
                items = [i.strip() for i in re.split(r"[,|;·]", cat_m.group(2)) if i.strip()]
                if items:
                    categorized[cat_name] = items
                    for it in items:
                        add(it)
                continue
            clean = _BULLET_START.sub("", line).strip()
            for item in re.split(r"[,|;·]", clean):
                add(item.strip())

    if len(flat) < 4:
        lowered = full_text.lower()
        for kw in sorted(_TECH_KEYWORDS):
            pat = rf"(?<![a-z0-9+#]){re.escape(kw)}(?![a-z0-9+#])"
            if re.search(pat, lowered) and kw not in seen:
                seen.add(kw)
                flat.append(kw.upper() if len(kw) <= 3 else kw.title())

    if not categorized and flat:
        auto: dict[str, list[str]] = {}
        for skill in flat:
            for cat, keywords in _SKILL_CATEGORIES.items():
                if skill.lower() in keywords:
                    auto.setdefault(cat, []).append(skill)
                    break
        if auto:
            categorized = auto

    return flat, categorized


# Trailing single-date for project lines: "Mar 2026", "Apr 2025"
_PROJ_DATE_RE = re.compile(
    r"\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$",
    re.IGNORECASE,
)
# Invalid project names — bullet chars, empty, or single punctuation
_INVALID_PROJ_NAME_RE = re.compile(r"^[•\-*▸►▪–◦○●▶‣◆◇▷\s.,;:]+$")

# Sentence-structure words — if the "tech portion" of a split contains these,
# it's a sentence, NOT a tech stack. Do NOT split on it.
_SENTENCE_WORDS: set[str] = {
    "and","or","to","for","the","a","an","with","in","of","on","at","by","as",
    "is","are","was","were","be","been","using","from","into","that","this",
    "which","how","where","when","process","analyze","build","develop","design",
    "implement","create","reduce","improve","increase","manage","support",
    "ensure","provide","enable","allowing","10000","5000","records","entries",
    "platform","application","service","system","api","user","users","data",
}

# Tech-only keywords — words that are DEFINITELY technology names
_PROJ_TECH_WORDS: set[str] = {
    "python","java","sql","bash","javascript","typescript","go","golang","rust",
    "react","angular","vue","node","fastapi","django","flask","spring","express",
    "docker","kubernetes","k8s","aws","azure","gcp","terraform","jenkins",
    "github","git","linux","openai","pytorch","tensorflow","scikit","pandas","numpy",
    "mysql","postgresql","mongodb","redis","kafka","spark","airflow","dbt",
    "actions",
}


def _is_pure_tech_portion(text: str) -> bool:
    """
    Return True if text is a pure tech stack (tech words + commas only).
    Return False if text contains sentence words like 'using', 'and FastAPI to process'.
    """
    words = re.split(r"[\s,]+", text.strip())
    sentence_hits = sum(1 for w in words if w.lower() in _SENTENCE_WORDS and len(w) > 1)
    return sentence_hits <= 1


def _is_tech_continuation_line(text: str) -> bool:
    """
    Return True if this line is a WRAPPED tech stack that belongs to the previous project.
    e.g. "Docker, AWS, OpenAI Mar 2026"  or  "Actions, AWS,"  or  "Python, Terraform Apr 2025"

    Rule: ≥ 75% of non-date tokens are tech keywords or short ALL-CAPS acronyms (AWS, ECR, GCP).
    """
    date_m = _PROJ_DATE_RE.search(text)
    body   = text[:date_m.start()].strip() if date_m else text.strip()
    if not body:
        return True  # Line is only a date → definitely a continuation

    parts = [p.strip(".,;") for p in re.split(r"[\s,]+", body) if p.strip(".,;")]
    if not parts:
        return False

    tech_hits = 0
    for p in parts:
        norm = re.sub(r"[^a-z0-9]", "", p.lower())
        is_tech = (
            norm in _PROJ_TECH_WORDS or
            (p.isupper() and 2 <= len(p) <= 8) or   # Short acronyms: AWS, ECR, GCP, CI/CD
            norm in {"openai", "fastapi", "cicd", "github"}
        )
        if is_tech:
            tech_hits += 1

    return len(parts) > 0 and tech_hits / len(parts) >= 0.70


def _split_project_name_tech(line: str) -> tuple[str, str, str]:
    """
    Split "ProjectName TechWord1 TechWord2 Date" into (name, tech, date).
    Only splits if the portion after the project name is a PURE tech stack
    (no sentence words like 'using', 'and', 'to process').

    This prevents "Developed a backend platform using Python and FastAPI..."
    from being split into a fake project named "Developed a backend platform".
    """
    date_m   = _PROJ_DATE_RE.search(line)
    date_str = date_m.group(0).strip() if date_m else ""
    body     = line[:date_m.start()].strip() if date_m else line.strip()

    words = body.split()
    tech_start_idx = len(words)

    for i, w in enumerate(words):
        norm = re.sub(r"[^a-z0-9]", "", w.lower())
        if norm in _PROJ_TECH_WORDS and i >= 2:
            tech_start_idx = i
            break

    if tech_start_idx == len(words):
        return body, "", date_str  # no tech detected

    name = " ".join(words[:tech_start_idx]).strip()
    tech = " ".join(words[tech_start_idx:]).strip()

    # KEY GUARD: if the tech portion contains sentence words, it's a bullet sentence
    if not _is_pure_tech_portion(tech):
        return body, "", date_str  # treat whole line as name/sentence

    return name, tech, date_str


# ── Project extraction ─────────────────────────────────────────────────────────

def _extract_projects(text: str) -> list[dict]:
    """
    Strict project parser. Creates a NEW project ONLY when:
    1. Line contains '|' or '·' separator → "Name | Tech | Date"  (explicit)
    2. Line has "ProjName TechWord TechWord..." where tech portion is PURE tech
       (no sentence words like 'using', 'and', 'to process')

    Bullet lines always belong to the CURRENT project — never create a new one.
    Sentence lines become bullets of the current project.
    Tech-only lines attach to the current project's technologies.
    """
    if not text.strip():
        return []

    lines = [l.strip() for l in text.splitlines() if l.strip()]
    entries: list[dict] = []
    current: dict | None = None

    def _save_current() -> None:
        if current and not _INVALID_PROJ_NAME_RE.match(current.get("name","")) and len(current.get("name","")) >= 3:
            # Final dedup check: don't save if same name already in entries
            if not any(e["name"] == current["name"] for e in entries):
                entries.append(dict(current))

    for line in lines:
        is_bullet = bool(_BULLET_START.match(line))
        clean     = _BULLET_START.sub("", line).strip()
        if not clean:
            continue

        # ── 1. Bullet line ─────────────────────────────────────────────────
        if is_bullet:
            if current:
                current["bullets"].append(clean)
            continue

        # Skip section headings
        if _classify_heading(clean):
            continue

        # ── 2. TECH CONTINUATION CHECK — must run BEFORE keyword split ──────
        # "Docker, AWS, OpenAI Mar 2026" must be caught here BEFORE step 3
        # tries to split at "openai" (index 2) and creates a fake project name.
        # Rule: if line starts with a tech keyword AND ≥70% of words are tech
        # → it's a wrapped tech stack belonging to the previous project.
        if current and _is_tech_continuation_line(clean):
            date_m_cont  = _PROJ_DATE_RE.search(clean)
            extra_tech   = clean[:date_m_cont.start()].strip() if date_m_cont else clean.strip()
            extra_tech   = extra_tech.strip(".,;")
            if date_m_cont and not current.get("date"):
                current["date"] = date_m_cont.group(0).strip()
            if extra_tech:
                existing = current.get("technologies", "").rstrip(", ")
                sep = ", " if existing else ""
                current["technologies"] = existing + sep + extra_tech
            continue

        # ── 3. Explicit separator: "Name | Tech" or "Name · Tech" ─────────
        sep_m = re.match(r"^(.+?)\s*[|·]\s*(.+)$", clean)
        if sep_m:
            name_part = sep_m.group(1).strip()
            tech_raw  = sep_m.group(2).strip()

            if not name_part or _INVALID_PROJ_NAME_RE.match(name_part) or len(name_part) < 3:
                if current:
                    current["bullets"].append(clean)
                continue

            inner_sep = re.match(r"^(.+?)\s*[|·]\s*(.+)$", tech_raw)
            if inner_sep:
                tech_raw  = inner_sep.group(1).strip()
                date_part = inner_sep.group(2).strip()
            else:
                date_part = ""

            date_m = _PROJ_DATE_RE.search(tech_raw)
            if date_m:
                date_part = date_m.group(0).strip()
                tech_raw  = tech_raw[:date_m.start()].strip()

            tech_clean = re.sub(r"\s*,\s*", ", ", tech_raw)

            _save_current()
            current = {
                "name":         name_part,
                "technologies": tech_clean,
                "date":         date_part,
                "description":  "",
                "bullets":      [],
            }
            continue

        # ── 4. No separator — keyword-based name/tech split ────────────────
        if not _DATE_RANGE_RE.search(clean):
            name_part, tech_part, date_part = _split_project_name_tech(clean)

            if tech_part and name_part and len(name_part) >= 4 and not _INVALID_PROJ_NAME_RE.match(name_part):
                _save_current()
                current = {
                    "name":         name_part,
                    "technologies": tech_part,
                    "date":         date_part,
                    "description":  "",
                    "bullets":      [],
                }
                continue

        # ── 5. Everything else → bullet of current project ────────────────
        if current:
            current["bullets"].append(clean)

    _save_current()

    # Final validation pass
    seen_names: set[str] = set()
    valid = []
    for p in entries:
        name = (p.get("name") or "").strip()
        if not name or len(name) < 3:
            continue
        if _INVALID_PROJ_NAME_RE.match(name):
            continue
        if name in seen_names:
            continue
        seen_names.add(name)
        valid.append(p)
    return valid


# ── Certifications / list sections ─────────────────────────────────────────────

# Common certification misspellings / collapsed forms → canonical
_CERT_NORMALIZATIONS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"awscloudpractition\w*", re.I), "AWS Cloud Practitioner"),
    (re.compile(r"aws\s+cloud\s+practition\w*", re.I), "AWS Cloud Practitioner"),
    (re.compile(r"aws\s+solutions?\s+architect", re.I), "AWS Solutions Architect"),
    (re.compile(r"aws\s+certified\s+developer", re.I), "AWS Certified Developer"),
    (re.compile(r"google\s+cloud\s+professional", re.I), "Google Cloud Professional"),
    (re.compile(r"azure\s+fundamentals?", re.I), "Azure Fundamentals"),
]


def _normalize_certification(text: str) -> str:
    """Normalise certification text: fix collapsed words, fix capitalisation."""
    t = text.strip().strip(".,;·•")
    if not t:
        return ""
    for pattern, canonical in _CERT_NORMALIZATIONS:
        if pattern.fullmatch(t.strip()):
            return canonical
    # If the text is ALL-CAPS with no spaces (collapsed), try to title-case via split
    if re.match(r"^[A-Z]+$", t.replace(" ", "")):
        # Already handled by _split_collapsed upstream; just title-case it
        return t.title()
    # Otherwise return as-is, but in title case if it's all lower/all upper
    if t == t.upper() or t == t.lower():
        return t.title()
    return t


def _extract_certifications(text: str) -> list[str]:
    results = []
    seen: set[str] = set()
    for line in text.splitlines():
        raw = _BULLET_START.sub("", line).strip().strip(".,;·•")
        if not raw or len(raw) < 3:
            continue
        norm = _normalize_certification(raw)
        if norm and norm.lower() not in seen:
            seen.add(norm.lower())
            results.append(norm)
    return results


# ── Summary extraction ─────────────────────────────────────────────────────────

def _extract_summary(text: str) -> str:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    return " ".join(lines).strip()
