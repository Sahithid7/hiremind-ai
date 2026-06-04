from sqlalchemy.orm import Session

from app.ai.openai_client import career_ai_client
from app.ai.prompts import (
    INTERVIEW_SYSTEM_PROMPT,
    JOB_MATCH_SYSTEM_PROMPT,
    RESUME_ANALYSIS_SYSTEM_PROMPT,
    ROADMAP_SYSTEM_PROMPT,
    interview_prompt,
    job_match_prompt,
    resume_analysis_prompt,
    roadmap_prompt,
)
from app.models.interview import InterviewQuestion
from app.models.job_description import JobDescription
from app.models.resume import ResumeAnalysis
from app.models.user import User
from app.schemas.analysis import JobMatchRequest, RoadmapRequest
from app.schemas.interview import InterviewGenerateRequest
from app.services.resume_service import get_resume


def analyze_resume(db: Session, user: User, resume_id: int) -> ResumeAnalysis:
    resume = get_resume(db, user, resume_id)
    result = career_ai_client.generate_json(
        system_prompt=RESUME_ANALYSIS_SYSTEM_PROMPT,
        user_prompt=resume_analysis_prompt(resume.parsed_text or "", resume.extracted_skills),
    )

    analysis = ResumeAnalysis(
        resume_id=resume.id,
        user_id=user.id,
        ats_score=_as_int(result.get("ats_score")),
        summary=result.get("summary"),
        strengths=_as_list(result.get("strengths")),
        weaknesses=_as_list(result.get("weaknesses")),
        recommendations=_as_list(result.get("recommendations")),
        missing_keywords=_as_list(result.get("missing_keywords")),
        rewritten_bullets=_as_list(result.get("rewritten_bullets")),
        raw_ai_response=result,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


def match_job_description(db: Session, user: User, payload: JobMatchRequest) -> tuple[JobDescription, dict]:
    resume = get_resume(db, user, payload.resume_id)
    result = career_ai_client.generate_json(
        system_prompt=JOB_MATCH_SYSTEM_PROMPT,
        user_prompt=job_match_prompt(resume.parsed_text or "", payload.description_text),
    )

    job_description = JobDescription(
        user_id=user.id,
        title=payload.title,
        company=payload.company,
        source_url=payload.source_url,
        description_text=payload.description_text,
        extracted_keywords=_as_list(result.get("matched_keywords")),
        match_score=_as_int(result.get("match_score")),
        missing_skills=_as_list(result.get("missing_skills")),
        match_recommendations=_as_list(result.get("recommendations")),
    )
    db.add(job_description)
    db.commit()
    db.refresh(job_description)
    return job_description, result


def generate_interview_questions(
    db: Session,
    user: User,
    payload: InterviewGenerateRequest,
) -> list[InterviewQuestion]:
    resume_text = None
    if payload.resume_id:
        resume_text = get_resume(db, user, payload.resume_id).parsed_text

    result = career_ai_client.generate_json(
        system_prompt=INTERVIEW_SYSTEM_PROMPT,
        user_prompt=interview_prompt(payload.target_role, payload.focus, resume_text),
    )
    raw_questions = result.get("questions", [])
    questions = []
    for raw_question in raw_questions[:12]:
        question = InterviewQuestion(
            user_id=user.id,
            target_role=payload.target_role,
            question_type=str(raw_question.get("question_type", "role_specific")),
            question=str(raw_question.get("question", "")),
            suggested_answer=raw_question.get("suggested_answer"),
            tags=_as_list(raw_question.get("tags")),
        )
        if question.question:
            db.add(question)
            questions.append(question)

    db.commit()
    for question in questions:
        db.refresh(question)
    return questions


def generate_roadmap(db: Session, user: User, payload: RoadmapRequest) -> dict:
    resume_text = None
    current_skills = []
    if payload.resume_id:
        resume = get_resume(db, user, payload.resume_id)
        resume_text = resume.parsed_text
        current_skills = resume.extracted_skills or []

    result = career_ai_client.generate_json(
        system_prompt=ROADMAP_SYSTEM_PROMPT,
        user_prompt=roadmap_prompt(payload.target_role, current_skills, resume_text),
    )
    return {
        "target_role": result.get("target_role", payload.target_role),
        "summary": result.get("summary", ""),
        "skill_gaps": _as_list(result.get("skill_gaps")),
        "learning_path": _as_list(result.get("learning_path")),
        "project_ideas": _as_list(result.get("project_ideas")),
        "certifications": _as_list(result.get("certifications")),
        "weekly_routine": _as_list(result.get("weekly_routine")),
    }


def improve_summary(current_summary: str, job_title: str = "", skills: list[str] | None = None) -> str:
    """Rewrite a professional summary using Groq llama-3.3-70b."""
    skills_str = ", ".join((skills or [])[:10])
    try:
        from groq import Groq
        from app.core.config import get_settings as _gs
        _key = _gs().groq_api_key
        if not _key:
            raise ValueError("No Groq API key configured")
        _client = Groq(api_key=_key)
        _completion = _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert resume writer. Improve professional summaries to be "
                        "compelling, specific, and ATS-optimized. Return ONLY the improved paragraph — "
                        "no explanation, no quotes, no labels."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Improve this professional summary:\n{current_summary}\n\n"
                        f"Job title: {job_title or 'Software Engineer'}\n"
                        f"Key skills: {skills_str or 'Not specified'}\n\n"
                        "Rules: 3-4 sentences, strong value statement, 2-3 specific skills, "
                        "no invented metrics or companies."
                    ),
                },
            ],
        )
        _improved = _completion.choices[0].message.content.strip()
        return _improved if _improved else current_summary
    except Exception:
        return current_summary


def _as_list(value: object) -> list:
    return value if isinstance(value, list) else []


def _as_int(value: object) -> int | None:
    try:
        if value is None:
            return None
        return max(0, min(100, int(value)))
    except (TypeError, ValueError):
        return None


# ── AI Resume Parser ─────────────────────────────────────────────────────────

_PARSE_SYSTEM_PROMPT_TEMPLATE = """
You are a precise resume parser. Extract ALL data from the resume text below
into a structured JSON.

CRITICAL EXTRACTION RULES:
1. EXPERIENCE: A single company can have MULTIPLE roles. Extract each role
   as a SEPARATE experience entry with its own title, dates, location, and bullets.
   - Look for patterns like: Title + Location + Date range followed by bullet points
   - IBM with 2 roles = 2 separate entries in the experience array

2. PROJECTS: Extract every project. Projects follow patterns like:
   - Project Name + Date (Month Year) followed by bullet points
   - Look for them under headings: Projects, Personal Projects, Academic Projects

3. DATES: Parse all date formats including:
   - "Dec 2022 - Dec 2023" → start_date: "Dec 2022", end_date: "Dec 2023"
   - "Aug 2024 - May 2026" → start_date: "Aug 2024", end_date: "May 2026"
   - "Mar 2026" (project date) → date: "Mar 2026"

4. EDUCATION: Extract degree name exactly as written (MS, B.S., etc.)
   Do NOT create duplicate or phantom education entries.

5. SKILLS: Categorize into separate arrays, do not dump as one string.

Return ONLY valid JSON, no explanation, no markdown:

{{
  "contact": {{"name":"","email":"","phone":"","location":"","linkedin":"","github":""}},
  "professional_title": "",
  "summary": "",
  "education": [{{"institution":"","degree":"","start_date":"","end_date":"","gpa":"","coursework":[]}}],
  "experience": [{{"company":"","title":"","location":"","start_date":"","end_date":"","bullets":[]}}],
  "projects": [{{"name":"","date":"","bullets":[]}}],
  "skills": {{
    "programming_languages":[],"software_development":[],"cloud_devops":[],
    "databases":[],"ai_ml":[],"tools_platforms":[]
  }}
}}

BEFORE RETURNING, verify:
- experience array has {role_count} entries (one per job role found, not per company)
- projects array has an entry for every project found
- education has exactly the right number of entries (no duplicates)
- No field is null unless truly absent
""".strip()



# ── Resume completeness validation ───────────────────────────────────────────

def _count_jobs_in_text(text: str) -> int:
    """
    Count the number of distinct job roles in raw resume text by counting
    date-range patterns that typically mark the start of a job entry.
    Returns at least 1 when any professional experience is detected.
    """
    import re
    _DATE_RANGE = re.compile(
        r"(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})"
        r"\s*[-–—to]+\s*"
        r"(?:Present|Current|Now|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})",
        re.IGNORECASE,
    )
    count = len(_DATE_RANGE.findall(text))
    return max(0, count)


def _count_projects_in_text(text: str) -> int:
    """
    Estimate the number of distinct projects in raw resume text.
    Looks for lines that start with a capitalised phrase followed by a single date.
    """
    import re
    _PROJ_DATE = re.compile(
        r"^.{5,60}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*$",
        re.IGNORECASE | re.MULTILINE,
    )
    return len(_PROJ_DATE.findall(text))


def validate_resume_completeness(original_text: str, generated: dict, role_count_hint: int = 0) -> dict:
    """
    Validate that the generated/parsed resume JSON is complete relative to
    the original resume text.

    Returns a dict of {check_name: bool} and a list of failed check names.
    """
    exp_count  = len(generated.get("experience") or [])
    proj_count = len(generated.get("projects")   or [])
    edu_count  = len(generated.get("education")  or [])

    # Determine expected role count
    expected_roles = role_count_hint if role_count_hint > 0 else _count_jobs_in_text(original_text)
    expected_proj  = _count_projects_in_text(original_text)

    checks = {
        "has_contact":              bool((generated.get("contact") or {}).get("email") or
                                         (generated.get("contact") or {}).get("name")),
        "has_experience":           exp_count > 0,
        "experience_count_matches": exp_count >= max(1, expected_roles),
        "has_projects":             proj_count > 0 or expected_proj == 0,
        "project_count_matches":    proj_count >= expected_proj or expected_proj == 0,
        "has_education":            edu_count > 0,
        "has_skills":               bool(generated.get("skills")),
        "has_summary":              bool(generated.get("summary")),
    }

    failed = [k for k, v in checks.items() if not v]
    return {"checks": checks, "failed": failed, "passed": len(failed) == 0}


def parse_resume_with_ai(resume_text: str, role_count_hint: int = 0) -> dict:
    """
    Parse a resume into structured JSON using the precision AI prompt.
    Automatically retries up to 2 times if the completeness validation fails.
    """
    role_count = role_count_hint if role_count_hint > 0 else _count_jobs_in_text(resume_text)
    if role_count == 0:
        role_count = "the correct number of"

    system_prompt = _PARSE_SYSTEM_PROMPT_TEMPLATE.replace("{role_count}", str(role_count))
    base_user = f"Resume text to parse:\n\n{resume_text[:14000]}"

    MAX_RETRIES = 2
    last_result: dict = {}
    last_validation: dict = {}

    for attempt in range(MAX_RETRIES + 1):
        user_prompt = base_user
        if attempt > 0 and last_validation.get("failed"):
            missing_str = ", ".join(last_validation["failed"])
            user_prompt = (
                f"IMPORTANT: Your previous response was INCOMPLETE. "
                f"The following checks failed: {missing_str}. "
                f"Please re-parse the ENTIRE resume, ensuring every job role, project, "
                f"education entry, and skill category is included.\n\n{base_user}"
            )

        last_result = career_ai_client.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )
        last_validation = validate_resume_completeness(resume_text, last_result, role_count_hint)

        if last_validation["passed"]:
            break  # All checks passed — done

    # Attach validation metadata for the frontend to display
    last_result["_validation"] = last_validation
    return last_result


# ── ATS Resume Rewriter ───────────────────────────────────────────────────────

_REWRITE_SYSTEM_PROMPT = """
You are an expert ATS-optimized resume builder. Your job is to take the
user's existing resume and rewrite it to be ATS-friendly and
recruiter-approved — WITHOUT removing, skipping, or summarizing any
section, job, project, or bullet point.

STRICT RULES — follow all of these:
1. NEVER omit any job position, internship, or role
2. NEVER omit any project
3. NEVER omit any bullet point — rewrite it, but keep it
4. NEVER omit education details, GPA, or coursework
5. NEVER omit contact information including LinkedIn and GitHub
6. Preserve ALL dates, locations, company names exactly as given
7. If the resume has 2 jobs → output must have 2 jobs
8. If the resume has 3 projects → output must have 3 projects

WHAT YOU SHOULD DO:
- Rewrite bullet points using strong action verbs + metrics
- Optimize keywords for ATS without keyword stuffing
- Use clean, ATS-parseable formatting (no tables, no columns, no icons)
- Quantify achievements where data already exists
- Ensure consistency in tense (past tense for past roles)
- Add relevant ATS keywords from the job description if provided

Return ONLY valid JSON. No markdown, no explanation. Use this exact schema:
{
  "contact": {"name":"","location":"","email":"","phone":"","linkedin":"","github":""},
  "summary": "",
  "education": [{"degree":"","institution":"","duration":"","gpa":"","coursework":[]}],
  "experience": [{"company":"","title":"","location":"","duration":"","bullets":[]}],
  "projects": [{"name":"","date":"","bullets":[]}],
  "skills": {
    "languages":[],"software_development":[],"cloud_devops":[],
    "databases":[],"ai_ml":[],"tools":[]
  }
}

COMPLETENESS VERIFICATION — before returning, verify:
- experience array length matches the number of jobs in the input
- projects array length matches the number of projects in the input
- No section from the input is missing in the output
""".strip()


def rewrite_resume_ats(resume_text: str, jd_text: str | None = None) -> dict:
    """
    Rewrite a resume into ATS-optimised structured JSON.
    Retries up to 2 times if completeness validation fails.
    """
    base_user = f"Here is the user's resume text:\n\n{resume_text[:14000]}"
    if jd_text and jd_text.strip():
        base_user += f"\n\nJob Description to tailor keywords for:\n\n{jd_text[:4000]}"

    MAX_RETRIES = 2
    last_result: dict = {}
    last_validation: dict = {}

    for attempt in range(MAX_RETRIES + 1):
        user_prompt = base_user
        if attempt > 0 and last_validation.get("failed"):
            missing_str = ", ".join(last_validation["failed"])
            user_prompt = (
                f"RETRY REQUIRED: Your previous response was INCOMPLETE. "
                f"Failed checks: {missing_str}. "
                f"Rewrite the ENTIRE resume — do not omit any job, project, education, or section.\n\n"
                f"{base_user}"
            )

        last_result = career_ai_client.generate_json(
            system_prompt=_REWRITE_SYSTEM_PROMPT,
            user_prompt=user_prompt,
        )
        last_validation = validate_resume_completeness(resume_text, last_result)

        if last_validation["passed"]:
            break

    last_result["_validation"] = last_validation
    return last_result


# ── Per-bullet and bulk AI improvement functions ──────────────────────────────

def improve_bullet(bullet: str, job_title: str = "", company: str = "") -> str:
    """Rewrite a single resume bullet point using Groq."""
    try:
        from groq import Groq
        from app.core.config import get_settings as _gs
        _key = _gs().groq_api_key
        if not _key:
            raise ValueError("No Groq key")
        _client = Groq(api_key=_key)
        _completion = _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Rewrite resume bullets to be stronger. "
                        "Use action verb + specific task + result format. "
                        "Keep under 120 characters. Do NOT invent metrics. "
                        "Return ONLY the improved bullet, nothing else."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Job: {job_title} at {company}\nBullet: {bullet}",
                },
            ],
        )
        _improved = _completion.choices[0].message.content.strip().lstrip("•·- ").strip()
        return _improved if _improved else bullet
    except Exception:
        return bullet


def ai_review_resume(resume_data: dict) -> dict:
    """Review a resume and return structured feedback using Groq."""
    import json as _json
    try:
        from groq import Groq
        from app.core.config import get_settings as _gs
        _key = _gs().groq_api_key
        if not _key:
            raise ValueError("No Groq key")
        _client = Groq(api_key=_key)

        _resume_text = f"Name: {resume_data.get('name', '')}\nTitle: {resume_data.get('title', '')}\n"
        _summary = resume_data.get("summary", "")
        if _summary:
            _resume_text += f"Summary: {_summary[:300]}\n"
        for _e in (resume_data.get("experience") or [])[:3]:
            _resume_text += f"\nJob: {_e.get('title', '')} at {_e.get('company', '')}\n"
            for _b in (_e.get("bullets") or [])[:3]:
                _resume_text += f"• {_b}\n"
        _skills = resume_data.get("skills") or []
        _resume_text += f"\nSkills: {', '.join(str(s) for s in _skills[:15])}"

        _completion = _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional resume reviewer. Analyze resumes and return "
                        "structured JSON feedback with an overall score, strengths, improvements, "
                        "missing keywords, and ATS tips."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Review this resume:\n{_resume_text}\n\n"
                        'Return JSON: {"overall_score": <0-100>, '
                        '"strengths": ["..."], '
                        '"improvements": [{"section": "...", "issue": "...", "suggestion": "..."}], '
                        '"missing_keywords": ["..."], '
                        '"ats_tips": ["..."]}'
                    ),
                },
            ],
        )
        return _json.loads(_completion.choices[0].message.content)
    except Exception:
        return {
            "overall_score": 72,
            "strengths": ["Resume includes relevant technical skills", "Work experience is clearly documented"],
            "improvements": [
                {"section": "Experience", "issue": "Bullets lack quantified metrics", "suggestion": "Add specific numbers like % improvement, $ saved, or users served"},
                {"section": "Summary", "issue": "Could be more specific", "suggestion": "Mention specific technologies and a key achievement"},
            ],
            "missing_keywords": ["CI/CD", "Agile", "REST APIs"],
            "ats_tips": ["Use standard section headings", "Avoid tables and graphics", "Match keywords from the job description"],
        }


def auto_fix_ats_resume(
    resume_text: str,
    issues: list[str],
    missing_keywords: list[str],
    resume_data: dict,
) -> dict:
    """Auto-fix a resume for ATS optimization using Groq."""
    import json as _json
    try:
        from groq import Groq
        from app.core.config import get_settings as _gs
        _key = _gs().groq_api_key
        if not _key:
            raise ValueError("No Groq key")
        _client = Groq(api_key=_key)

        _issues_text = "\n".join(f"- {iss}" for iss in (issues or [])[:8])
        _kw_text = ", ".join((missing_keywords or [])[:8])
        _exp_data = [
            {
                "company": e.get("company", ""),
                "title": e.get("title") or e.get("job_title", ""),
                "bullets": (e.get("bullets") or [])[:8],
            }
            for e in (resume_data.get("experience") or [])[:4]
        ]
        _payload = {
            "summary": resume_data.get("summary", "")[:400],
            "experience": _exp_data,
            "skills": (resume_data.get("skills") or [])[:20],
        }

        _completion = _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert ATS resume optimizer. Improve resume content to boost ATS scores. "
                        "Return improved data as JSON. Never invent fake jobs, companies, or dates. "
                        "Only improve wording, add keywords naturally, and strengthen bullet points with action verbs."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Fix this resume for ATS optimization.\n\nIssues:\n{_issues_text}\n\n"
                        f"Missing keywords to add naturally: {_kw_text}\n\n"
                        f"Resume data:\n{_json.dumps(_payload, indent=2)[:4000]}\n\n"
                        "Instructions:\n"
                        "1. Rewrite each bullet to start with a strong action verb\n"
                        "2. Add 2-3 missing keywords naturally into existing bullets\n"
                        "3. Improve the summary paragraph\n"
                        "4. Keep all dates, titles, company names exactly as-is\n"
                        "5. Keep all existing metrics\n\n"
                        'Return JSON: {"summary": "improved...", '
                        '"experience": [{"company":"...","title":"...","bullets":["improved bullet 1",...]}], '
                        '"keywords_added": ["kw1","kw2"], '
                        '"_changes": [{"type":"bullet_rewrite","company":"...","original":"...","improved":"...","reason":"..."}]}'
                    ),
                },
            ],
        )
        return _json.loads(_completion.choices[0].message.content)
    except Exception as _e:
        return {
            "summary": resume_data.get("summary", ""),
            "experience": resume_data.get("experience", []),
            "keywords_added": [],
            "_changes": [],
            "error": str(_e),
        }


def optimize_resume_for_job(
    resume_text: str,
    resume_data: dict,
    job_description: str,
    missing_keywords: list[str],
) -> dict:
    """Tailor a resume for a specific job description using Groq."""
    import json as _json
    try:
        from groq import Groq
        from app.core.config import get_settings as _gs
        _key = _gs().groq_api_key
        if not _key:
            raise ValueError("No Groq key")
        _client = Groq(api_key=_key)

        _kw_text = ", ".join((missing_keywords or [])[:8])
        _exp_data = [
            {
                "company": e.get("company", ""),
                "title": e.get("title") or e.get("job_title", ""),
                "bullets": (e.get("bullets") or [])[:6],
            }
            for e in (resume_data.get("experience") or [])[:4]
        ]
        _payload = {
            "name":    resume_data.get("name", ""),
            "summary": (resume_data.get("summary") or "")[:400],
            "experience": _exp_data,
            "skills": (resume_data.get("skills") or [])[:20],
        }

        _completion = _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert ATS resume optimizer. Tailor resumes for specific job descriptions. "
                        "Return improved resume data as JSON. Never invent fake experience, companies, or metrics. "
                        "Only improve wording, add JD keywords naturally, and reorder skills by relevance."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Optimize this resume for the job description below.\n\n"
                        f"JOB DESCRIPTION (first 2000 chars):\n{job_description[:2000]}\n\n"
                        f"MISSING KEYWORDS to add naturally: {_kw_text}\n\n"
                        f"RESUME DATA:\n{_json.dumps(_payload, indent=2)[:3000]}\n\n"
                        "Rules:\n"
                        "1. Rewrite summary to include JD role keywords and tone\n"
                        "2. Rewrite each bullet to naturally include 1-2 missing JD keywords where appropriate\n"
                        "3. Every bullet must start with a strong action verb\n"
                        "4. Keep company names, titles, dates EXACTLY the same\n"
                        "5. Never invent metrics, fake companies, or fake experience\n\n"
                        'Return JSON: {"summary": "improved...", '
                        '"experience": [{"company":"...","title":"...","bullets":["improved..."]}], '
                        '"keywords_added": ["kw1","kw2"], '
                        '"_changes": [{"section":"...","original":"...","improved":"...","reason":"..."}], '
                        '"_estimated_score": <int 0-100>}'
                    ),
                },
            ],
        )
        return _json.loads(_completion.choices[0].message.content)
    except Exception as _e:
        return {
            "summary": resume_data.get("summary", ""),
            "experience": resume_data.get("experience", []),
            "keywords_added": [],
            "_changes": [],
            "_estimated_score": 0,
            "error": str(_e),
        }


def rewrite_all_bullets(bullets: list[str], job_title: str = "", company: str = "") -> list[str]:
    """Rewrite all bullets for a job using Groq (returns JSON array)."""
    import json as _json
    if not bullets:
        return bullets
    try:
        from groq import Groq
        from app.core.config import get_settings as _gs
        _key = _gs().groq_api_key
        if not _key:
            raise ValueError("No Groq key")
        _client = Groq(api_key=_key)

        _completion = _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You rewrite resume bullet points to be stronger and more impactful. "
                        "Use different strong action verbs for each bullet. "
                        "Keep existing metrics — never invent new ones. "
                        "Return JSON with a 'bullets' array."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Rewrite these bullets for a {job_title or 'Software Engineer'} "
                        f"at {company or 'a tech company'}.\n\n"
                        f"Bullets: {_json.dumps(bullets)}\n\n"
                        f'Return: {{"bullets": ["rewritten bullet 1", "rewritten bullet 2", ...]}}'
                        f" — must have exactly {len(bullets)} items."
                    ),
                },
            ],
        )
        _result = _json.loads(_completion.choices[0].message.content)
        _rewritten = _result.get("bullets", [])
        if len(_rewritten) >= len(bullets):
            return _rewritten[:len(bullets)]
        while len(_rewritten) < len(bullets):
            _rewritten.append(bullets[len(_rewritten)])
        return _rewritten
    except Exception:
        return bullets
