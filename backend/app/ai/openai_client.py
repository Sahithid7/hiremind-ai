import json
from typing import Any

from fastapi import HTTPException, status
from openai import OpenAI, OpenAIError

from app.core.config import get_settings

settings = get_settings()

# ── Resume extraction prompt (new unified schema) ─────────────────────────────
_RESUME_EXTRACTION_PROMPT = """You are a resume parser. Extract ALL information from this resume PDF and return ONLY valid JSON.

RULES:
- Extract every job role as a SEPARATE experience entry with its own title, dates, and bullets
- One company with 2 roles = 2 separate entries in the experience array
- Split the full name into firstName and lastName
- Split the location into city and state
- Extract ALL bullet points for every job and project
- Return empty string "" for any missing text fields
- Return empty array [] for any missing array fields
- NEVER return null

Return ONLY this exact JSON structure, no markdown, no explanation:
{
  "personalInfo": {
    "firstName": "",
    "lastName": "",
    "email": "",
    "phone": "",
    "city": "",
    "state": "",
    "linkedin": "",
    "github": ""
  },
  "summary": "",
  "experience": [
    {
      "jobTitle": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "bullets": []
    }
  ],
  "education": [
    {
      "school": "",
      "degree": "",
      "fieldOfStudy": "",
      "startDate": "",
      "endDate": "",
      "gpa": "",
      "coursework": ""
    }
  ],
  "skills": {
    "programmingLanguages": [],
    "softwareDevelopment": [],
    "cloudDevops": [],
    "databases": [],
    "aiMl": [],
    "tools": []
  },
  "projects": [
    {
      "name": "",
      "date": "",
      "bullets": []
    }
  ],
  "certifications": []
}"""


class CareerAIClient:
    def __init__(self) -> None:
        self.model = settings.openai_model
        self._client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    # ── Generic JSON generation (used by interview, job-match, etc.) ──────────
    def generate_json(self, *, system_prompt: str, user_prompt: str) -> dict[str, Any]:
        if self._client is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OpenAI API key is not configured. Add OPENAI_API_KEY to backend/.env.",
            )

        try:
            response = self._client.chat.completions.create(
                model=self.model,
                temperature=0.2,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
            )
        except OpenAIError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="OpenAI request failed. Check your API key and network connection.",
            ) from exc

        content = response.choices[0].message.content if response.choices else None
        if not content:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="OpenAI returned an empty response.")

        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="OpenAI returned invalid JSON.") from exc

    # ── PDF resume extraction — Gemini primary, Groq fallback ────────────────
    def extract_resume_from_pdf(self, pdf_bytes: bytes) -> dict:
        import io, re as _re, json as _json, base64
        from app.core.config import get_settings as _get_settings
        _settings = _get_settings()

        _JSON_SCHEMA = """{
  "contact": {"firstName":"","lastName":"","email":"","phone":"","city":"","state":"","linkedin":"","github":""},
  "summary": "",
  "experience": [{"jobTitle":"","company":"","location":"","startDate":"","endDate":"","bullets":[]}],
  "education": [{"school":"","degree":"","fieldOfStudy":"","startDate":"","endDate":"","gpa":"","coursework":""}],
  "skills": {"programmingLanguages":[],"softwareDevelopment":[],"cloudDevops":[],"databases":[],"aiMl":[],"tools":[]},
  "projects": [{"name":"","date":"","bullets":[]}],
  "certifications": []
}"""
        _PROMPT = (
            "Extract ALL resume information and return ONLY valid JSON matching this schema:\n"
            + _JSON_SCHEMA
            + "\nRULES: Extract EVERY job as a separate entry. Extract ALL bullet points. "
            "Split name into firstName/lastName. Return empty string for missing text, "
            "empty array for missing lists. NEVER return null."
        )

        def _clean_json(raw: str) -> dict:
            s = raw.strip()
            if s.startswith("```"):
                s = "\n".join(s.split("\n")[1:])
                s = s[:s.rfind("```")] if "```" in s else s
            return _json.loads(s.strip())

        result   = None
        raw_text = ""

        # ════════════════════════════════════════════════════════════════════
        # PATH 1 — Gemini 1.5 Flash (sends the PDF directly — no text needed)
        # Works for ALL layouts: single-column, two-column, sidebar, tables,
        # image-based, scanned. This is the definitive fix.
        # ════════════════════════════════════════════════════════════════════
        if _settings.gemini_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=_settings.gemini_api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content([
                    {"mime_type": "application/pdf", "data": base64.b64encode(pdf_bytes).decode()},
                    _PROMPT,
                ])
                result = _clean_json(response.text)
            except Exception as e:
                print(f"EXTRACTION FAILED (Gemini): {type(e).__name__}: {e}", flush=True)
                result = None

        # ════════════════════════════════════════════════════════════════════
        # PATH 2 — pdfplumber + Groq (fallback when Gemini unavailable)
        # ════════════════════════════════════════════════════════════════════
        if result is None:
            import pdfplumber
            from groq import Groq as _Groq

            def _page_text(page) -> str:
                # Try standard, char-sort, and column-split; return longest
                best = page.extract_text() or ""
                try:
                    chars = page.chars
                    grouped: dict = {}
                    for c in chars:
                        row = round(c.get("top", 0) / 4) * 4
                        grouped.setdefault(row, []).append(c)
                    lines = []
                    for row in sorted(grouped):
                        rc = sorted(grouped[row], key=lambda c: c.get("x0", 0))
                        ln = "".join(c.get("text", "") for c in rc).strip()
                        if ln: lines.append(ln)
                    char_t = "\n".join(lines)
                    if len(char_t) > len(best): best = char_t
                except Exception: pass
                for ratio in (0.35, 0.45):
                    try:
                        w, h = page.width, page.height
                        lt = page.crop((0, 0, w*ratio, h)).extract_text() or ""
                        rt = page.crop((w*ratio, 0, w, h)).extract_text() or ""
                        t = f"{rt}\n{lt}".strip()
                        if len(t) > len(best): best = t
                    except Exception: pass
                return best

            parts = []
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page in pdf.pages:
                    t = _page_text(page)
                    if t.strip(): parts.append(t)

            raw_text = "\n\n".join(parts)
            if not raw_text.strip():
                raise ValueError("No text could be extracted from this PDF.")

            groq_client = _Groq(api_key=_settings.groq_api_key)
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a resume parser. " + _PROMPT},
                    {"role": "user", "content": f"Resume text:\n\n{raw_text[:15000]}"},
                ],
            )
            result = _json.loads(completion.choices[0].message.content)

        # ── Regex fallbacks for any still-missing contact fields ─────────────
        contact     = result.get("contact") or {}
        search_text = raw_text or str(result)

        if not contact.get("email"):
            m = _re.search(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}', search_text)
            if m: contact["email"] = m.group(0)

        if not contact.get("phone"):
            m = _re.search(r'[\+]?1?[\s.\-]?\(?(\d{3})\)?[\s.\-]?(\d{3})[\s.\-]?(\d{4})\b', search_text)
            if m: contact["phone"] = m.group(0).strip()

        if not contact.get("linkedin"):
            m = _re.search(r'linkedin\.com/in/[\w\-]+', search_text, _re.IGNORECASE)
            if m: contact["linkedin"] = m.group(0)

        if not contact.get("github"):
            m = _re.search(r'github\.com/[\w\-]+', search_text, _re.IGNORECASE)
            if m: contact["github"] = m.group(0)

        result["contact"]   = contact
        result["_raw_text"] = raw_text

        return result


career_ai_client = CareerAIClient()
