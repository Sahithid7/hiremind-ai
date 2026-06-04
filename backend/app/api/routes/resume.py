from collections import defaultdict
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.resume import (
    ResumeExtractRead, ResumeExtractResponse, ResumeRead,
    ResumeParseAiRequest, ResumeParseAiResponse,
    ResumeRewriteRequest, ResumeRewriteResponse,
    ImproveSummaryRequest, ImproveSummaryResponse,
    ResumeUploadResponse,
)
from app.services.activity_service import record_activity
from app.services.ai_service import (
    improve_summary, parse_resume_with_ai, rewrite_resume_ats,
    improve_bullet as _improve_bullet,
    ai_review_resume as _ai_review_resume,
    rewrite_all_bullets as _rewrite_all_bullets,
    auto_fix_ats_resume as _auto_fix_ats_resume,
    optimize_resume_for_job as _optimize_for_job,
)
from app.services.resume_service import create_resume_from_upload, get_resume, list_resumes, parse_resume_from_upload

# ── Simple in-memory rate limiter ─────────────────────────────────────────────
_request_counts: dict = defaultdict(list)


def _rate_limit(request: Request, max_requests: int = 10, window_minutes: int = 60) -> None:
    ip  = getattr(request.client, "host", "unknown")
    now = datetime.now()
    cutoff = now - timedelta(minutes=window_minutes)
    _request_counts[ip] = [t for t in _request_counts[ip] if t > cutoff]
    if len(_request_counts[ip]) >= max_requests:
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Max {max_requests} requests per {window_minutes} minutes.",
        )
    _request_counts[ip].append(now)


router = APIRouter(prefix="/resume", tags=["Resumes"])


@router.post("/extract", response_model=ResumeExtractResponse, status_code=status.HTTP_200_OK)
async def extract_resume(
    request: Request,
    file: UploadFile = File(...),
) -> ResumeExtractResponse:
    _rate_limit(request, max_requests=50, window_minutes=60)
    print(f"=== /resume/extract HIT — filename={file.filename!r} ===", flush=True)
    original_filename, content_type, parsed = await parse_resume_from_upload(file)
    print(f"=== /resume/extract DONE — name={parsed.name!r} email={parsed.email!r} exp={len(parsed.experience)} ===", flush=True)
    return ResumeExtractResponse(
        resume=ResumeExtractRead(
            id="guest-extract",
            original_filename=original_filename,
            content_type=content_type,
            parsed_text=parsed.text,
            # Personal info
            name=parsed.name,
            title=parsed.title,
            email=parsed.email,
            phone=parsed.phone,
            location=parsed.location,
            linkedin=parsed.linkedin,
            github=parsed.github,
            # Core sections
            summary=parsed.summary,
            extracted_skills=parsed.skills,
            skills_categorized=parsed.skills_categorized,
            extracted_experience=parsed.experience,
            extracted_education=parsed.education,
            extracted_projects=parsed.projects,
            certifications=parsed.certifications,
            # Preserved additional sections
            achievements=parsed.achievements,
            awards=parsed.awards,
            publications=parsed.publications,
            volunteer=parsed.volunteer,
            # Extraction diagnostics
            diagnostics=parsed.diagnostics,
        ),
        message="Resume extracted successfully.",
    )


@router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
) -> ResumeUploadResponse:
    resume = await create_resume_from_upload(db, current_user, file)
    record_activity(
        db,
        user_id=current_user.id,
        action="resume.uploaded",
        metadata={"resume_id": resume.id, "filename": resume.original_filename},
    )
    return ResumeUploadResponse(
        resume=ResumeRead.model_validate(resume),
        message="Resume uploaded and parsed successfully.",
    )


@router.get("", response_model=list[ResumeRead])
def read_resumes(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ResumeRead]:
    return [ResumeRead.model_validate(resume) for resume in list_resumes(db, current_user)]


@router.get("/{resume_id}", response_model=ResumeRead)
def read_resume(
    resume_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ResumeRead:
    return ResumeRead.model_validate(get_resume(db, current_user, resume_id))


@router.post("/rewrite", response_model=ResumeRewriteResponse, status_code=status.HTTP_200_OK)
def rewrite_resume(payload: ResumeRewriteRequest) -> ResumeRewriteResponse:
    """Rewrite a resume into ATS-optimised structured JSON using GPT."""
    result = rewrite_resume_ats(payload.resume_text, payload.jd_text)
    return ResumeRewriteResponse(rewritten=result, message="Resume rewritten successfully.")


@router.post("/improve-summary", response_model=ImproveSummaryResponse, status_code=status.HTTP_200_OK)
def improve_summary_endpoint(request: Request, payload: ImproveSummaryRequest) -> ImproveSummaryResponse:
    """Rewrite a professional summary to be more compelling and ATS-friendly."""
    _rate_limit(request, max_requests=50, window_minutes=60)
    result = improve_summary(payload.summary_text, payload.job_title, payload.skills)
    return ImproveSummaryResponse(improved_summary=result, message="Summary improved successfully.")


@router.post("/parse-ai", response_model=ResumeParseAiResponse, status_code=status.HTTP_200_OK)
def parse_resume_ai(payload: ResumeParseAiRequest) -> ResumeParseAiResponse:
    """
    Parse a resume with the precision AI prompt.
    Handles multiple roles per company, proper date extraction, and categorized skills.
    Requires OPENAI_API_KEY. Works in guest mode (no auth required).
    """
    result = parse_resume_with_ai(payload.resume_text, payload.role_count_hint)
    return ResumeParseAiResponse(parsed=result, message="Resume parsed successfully.")


# ── AI feature endpoints (no auth required) ───────────────────────────────────
from pydantic import BaseModel as _BM
from typing import Any as _Any


class _ImproveBulletReq(_BM):
    bullet: str
    job_title: str = ""
    company: str = ""


class _AiReviewReq(_BM):
    resume_data: dict[str, _Any]


class _RewriteBulletsReq(_BM):
    bullets: list[str]
    job_title: str = ""
    company: str = ""


@router.post("/improve-bullet", status_code=status.HTTP_200_OK)
def improve_bullet_endpoint(payload: _ImproveBulletReq):
    """Rewrite a single resume bullet point using AI."""
    improved = _improve_bullet(payload.bullet, payload.job_title, payload.company)
    return {"improved_bullet": improved}


@router.post("/ai-review", status_code=status.HTTP_200_OK)
def ai_review_endpoint(request: Request, payload: _AiReviewReq):
    """Get an AI-powered review of the resume with actionable feedback."""
    _rate_limit(request, max_requests=50, window_minutes=60)
    return _ai_review_resume(payload.resume_data)


@router.post("/rewrite-bullets", status_code=status.HTTP_200_OK)
def rewrite_bullets_endpoint(payload: _RewriteBulletsReq):
    """Rewrite all bullets for a job role using AI."""
    rewritten = _rewrite_all_bullets(payload.bullets, payload.job_title, payload.company)
    return {"rewritten_bullets": rewritten}


class _AutoFixAtsReq(_BM):
    resume_text: str = ""
    issues: list[str] = []
    missing_keywords: list[str] = []
    resume_data: dict[str, _Any] = {}


@router.post("/auto-fix-ats", status_code=status.HTTP_200_OK)
def auto_fix_ats_endpoint(request: Request, payload: _AutoFixAtsReq):
    """Auto-fix a resume for ATS optimization using AI."""
    _rate_limit(request, max_requests=50, window_minutes=60)
    return _auto_fix_ats_resume(
        payload.resume_text, payload.issues,
        payload.missing_keywords, payload.resume_data,
    )


class _OptimizeForJobReq(_BM):
    resume_text: str = ""
    resume_data: dict[str, _Any] = {}
    job_description: str = ""
    missing_keywords: list[str] = []
    match_score: int = 0


@router.post("/optimize-for-job", status_code=status.HTTP_200_OK)
def optimize_for_job_endpoint(request: Request, payload: _OptimizeForJobReq):
    """Optimize a resume for a specific job description using AI."""
    _rate_limit(request, max_requests=50, window_minutes=60)
    return _optimize_for_job(
        payload.resume_text, payload.resume_data,
        payload.job_description, payload.missing_keywords,
    )
