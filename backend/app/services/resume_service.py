from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.openai_client import career_ai_client
from app.core.config import get_settings
from app.models.resume import Resume
from app.models.user import User
from app.services.resume_parser import ParsedResume, parse_resume_file

settings = get_settings()

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
    "binary/octet-stream",
}


# ── Auth-only helpers (unchanged) ─────────────────────────────────────────────

def list_resumes(db: Session, user: User) -> list[Resume]:
    statement = select(Resume).where(Resume.user_id == user.id).order_by(Resume.created_at.desc())
    return list(db.scalars(statement).all())


def get_resume(db: Session, user: User, resume_id: int) -> Resume:
    resume = db.get(Resume, resume_id)
    if resume is None or resume.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")
    return resume


async def create_resume_from_upload(db: Session, user: User, file: UploadFile) -> Resume:
    original_filename, suffix, contents = await read_validated_resume_upload(file)

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_filename = f"{user.id}_{uuid4().hex}{suffix}"
    stored_path = upload_dir / stored_filename
    stored_path.write_bytes(contents)

    try:
        parsed = parse_resume_file(stored_path)
    except Exception:
        parsed = ParsedResume(text="", diagnostics={"error": "Unexpected parser failure"})

    resume = Resume(
        user_id=user.id,
        original_filename=original_filename,
        stored_filename=stored_filename,
        content_type=file.content_type or "application/octet-stream",
        parsed_text=parsed.text,
        extracted_skills=parsed.skills,
        extracted_experience=parsed.experience,
        extracted_education=parsed.education,
        extracted_projects=parsed.projects,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


# ── Guest upload / extract endpoint ───────────────────────────────────────────

async def parse_resume_from_upload(file: UploadFile) -> tuple[str, str, ParsedResume]:
    """
    Phase 1 extraction:
      1. Read file bytes
      2. Send directly to gpt-4o via image_url (no regex text extraction)
      3. AI returns the unified resume schema (camelCase)
      4. Map camelCase → ParsedResume (snake_case for the existing API contract)
      5. Validate critical fields and log everything
    """
    original_filename, suffix, contents = await read_validated_resume_upload(file)

    if len(contents) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty.")

    try:
        # ── Call gpt-4o-mini with extracted PDF text ─────────────────────────
        r = career_ai_client.extract_resume_from_pdf(contents)

        # ── Grab raw text for fallback recovery and ATS scoring ───────────────
        raw_text = r.pop("_raw_text", "") or ""

        # ── Map contact info ──────────────────────────────────────────────────
        pi         = r.get("contact") or {}
        first_name = _s(pi.get("firstName"))
        last_name  = _s(pi.get("lastName"))

        # Guard: AI sometimes bleeds job title into lastName (e.g. "Devineni Software Eng Intern")
        # Real last names are 1-2 words max
        last_name_parts = last_name.split()
        if len(last_name_parts) > 2:
            last_name = last_name_parts[0]  # Keep only the actual surname

        full_name  = f"{first_name} {last_name}".strip()

        city      = _s(pi.get("city"))
        state_    = _s(pi.get("state"))
        location  = f"{city}, {state_}".strip(", ")

        # ── Regex fallbacks for contact fields that AI missed ─────────────────
        import re as _re
        if not pi.get("email") and raw_text:
            m = _re.search(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', raw_text)
            if m:
                pi["email"] = m.group(0)

        if not pi.get("phone") and raw_text:
            m = _re.search(r'[\+]?[\(]?[0-9]{3}[\)]?[\-\s\.]?[0-9]{3}[\-\s\.]?[0-9]{4}', raw_text)
            if m:
                pi["phone"] = m.group(0).strip()

        if not pi.get("linkedin") and raw_text:
            m = _re.search(r'linkedin\.com/in/[\w\-]+', raw_text, _re.IGNORECASE)
            if m:
                pi["linkedin"] = m.group(0)

        if not pi.get("github") and raw_text:
            m = _re.search(r'github\.com/[\w\-]+', raw_text, _re.IGNORECASE)
            if m:
                pi["github"] = m.group(0)

        # ── Map skills — handle both dict and flat-list responses from Groq ──────
        sk_raw = r.get("skills") or {}
        if isinstance(sk_raw, list):
            # Groq returned flat list — put everything in Languages
            all_skills = [_s(s) for s in sk_raw if s]
            skills_categorized = {"Programming Languages": all_skills}
        else:
            sk = sk_raw
            def _sk(*keys) -> list:
                for k in keys:
                    v = _as_list(sk.get(k))
                    if v:
                        return v
                return []
            all_skills = (
                _sk("programmingLanguages", "programming_languages", "languages") +
                _sk("softwareDevelopment",  "software_development",  "frameworks") +
                _sk("cloudDevops",          "cloud_devops",          "cloud") +
                _sk("databases") +
                _sk("aiMl",                 "ai_ml",                 "ml") +
                _sk("tools",                "toolsPlatforms",        "other")
            )
            skills_categorized = {
                "Programming Languages": _sk("programmingLanguages", "programming_languages", "languages"),
                "Software Development":  _sk("softwareDevelopment",  "software_development",  "frameworks"),
                "Cloud & DevOps":        _sk("cloudDevops",          "cloud_devops",          "cloud"),
                "Databases":             _sk("databases"),
                "AI / ML":               _sk("aiMl",                 "ai_ml",                 "ml"),
                "Tools & Platforms":     _sk("tools",                "toolsPlatforms",        "other"),
            }
        all_skills = [s for s in all_skills if s]

        # ── Map experience — accept any field-name variant Groq might use ────────
        raw_exp = _as_list(r.get("experience") or r.get("workExperience") or r.get("work_experience"))
        experience = [
            {
                "job_title":  _s(e.get("jobTitle") or e.get("title") or e.get("job_title") or e.get("position") or e.get("role")),
                "company":    _s(e.get("company")  or e.get("employer") or e.get("organization")),
                "location":   _s(e.get("location") or e.get("city")    or ""),
                "start_date": _s(e.get("startDate") or e.get("start_date") or e.get("from") or ""),
                "end_date":   _s(e.get("endDate")   or e.get("end_date")   or e.get("to")   or ""),
                "bullets":    [b for b in _as_list(e.get("bullets") or e.get("responsibilities") or e.get("achievements") or []) if isinstance(b, str) and b],
            }
            for e in raw_exp
        ]
        # ── Map education — accept any field-name variant ─────────────────────
        raw_edu = _as_list(r.get("education") or r.get("Education") or r.get("academic"))
        education = [
            {
                "degree":          _s(e.get("degree")  or e.get("qualification") or e.get("program") or e.get("major")),
                "school":          _s(e.get("school")  or e.get("institution")   or e.get("university") or e.get("college") or e.get("name")),
                "gpa":             _s(e.get("gpa")     or e.get("GPA")           or ""),
                "graduation_date": f"{_s(e.get('startDate') or e.get('start_date') or '')} - {_s(e.get('endDate') or e.get('end_date') or e.get('graduationYear') or '')}".strip(" -"),
                "coursework":      _s(e.get("coursework") or e.get("fieldOfStudy") or "") if isinstance(e.get("coursework") or e.get("fieldOfStudy"), str)
                                   else ", ".join(_as_list(e.get("coursework") or [])),
            }
            for e in raw_edu
        ]
        # ── Map projects (pass through — keys match) ──────────────────────────
        projects = [
            {
                "name":         _s(p.get("name")),
                "date":         _s(p.get("date")),
                "technologies": "",
                "description":  "",
                "bullets":      [b for b in _as_list(p.get("bullets")) if isinstance(b, str) and b],
            }
            for p in _as_list(r.get("projects"))
        ]
        # ── Certifications ────────────────────────────────────────────────────
        certifications = [str(c) for c in _as_list(r.get("certifications")) if c]

        # ── Validation ────────────────────────────────────────────────────────
        missing: list[str] = []
        if not first_name:
            missing.append("firstName")
        if not _s(pi.get("email")):
            missing.append("email")
        if not experience:
            missing.append("experience")
        if not education:
            missing.append("education")

        # ── Build ParsedResume ────────────────────────────────────────────────
        parsed = ParsedResume(
            text=raw_text,
            name=full_name,
            title="",
            email=_s(pi.get("email")),
            phone=_s(pi.get("phone")),
            location=location,
            linkedin=_s(pi.get("linkedin")),
            github=_s(pi.get("github")),
            summary=_s(r.get("summary")),
            skills=all_skills,
            skills_categorized=skills_categorized,
            experience=experience,
            education=education,
            projects=projects,
            certifications=certifications,
            diagnostics={
                "ai_parsed":         True,
                "extraction_failed": bool(missing),
                "missing_fields":    missing,
                "exp_count":         len(experience),
                "edu_count":         len(education),
            },
        )

    except Exception as exc:
        print(f"EXTRACTION ERROR: {type(exc).__name__}: {exc}", flush=True)
        parsed = ParsedResume(
            text="",
            diagnostics={"error": str(exc), "file": original_filename},
        )

    return original_filename, file.content_type or "application/octet-stream", parsed


# ── Internal helpers ─────────────────────────────────────────────────────────

def _s(v: object) -> str:
    """Return stripped string, empty string for None/falsy."""
    return str(v).strip() if v else ""


def _as_list(v: object) -> list:
    """Return list, empty list for None/non-list."""
    return v if isinstance(v, list) else []


async def read_validated_resume_upload(file: UploadFile) -> tuple[str, str, bytes]:
    original_filename = Path(file.filename or "resume").name
    suffix = Path(original_filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Please upload a PDF or DOCX file. Received: {suffix or 'unknown extension'}",
        )

    contents = await file.read()
    max_size = settings.max_upload_size_mb * 1024 * 1024
    if len(contents) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Resume must be smaller than {settings.max_upload_size_mb} MB.",
        )
    return original_filename, suffix, contents


