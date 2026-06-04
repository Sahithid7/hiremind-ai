from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.analysis import (
    JobMatchRequest,
    JobMatchResponse,
    ResumeAnalysisRead,
    RoadmapRequest,
    RoadmapResponse,
)
from app.services.activity_service import record_activity
from app.services.ai_service import analyze_resume, generate_roadmap, match_job_description

router = APIRouter(prefix="/analysis", tags=["AI Analysis"])


@router.post("/resume/{resume_id}", response_model=ResumeAnalysisRead, status_code=status.HTTP_201_CREATED)
def create_resume_analysis(
    resume_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ResumeAnalysisRead:
    analysis = analyze_resume(db, current_user, resume_id)
    record_activity(
        db,
        user_id=current_user.id,
        action="ai.resume_analyzed",
        metadata={"resume_id": resume_id, "analysis_id": analysis.id},
    )
    return ResumeAnalysisRead.model_validate(analysis)


@router.post("/job-match", response_model=JobMatchResponse, status_code=status.HTTP_201_CREATED)
def create_job_match(
    payload: JobMatchRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> JobMatchResponse:
    job_description, result = match_job_description(db, current_user, payload)
    record_activity(
        db,
        user_id=current_user.id,
        action="ai.job_matched",
        metadata={"job_description_id": job_description.id, "resume_id": payload.resume_id},
    )
    return JobMatchResponse(
        id=job_description.id,
        title=job_description.title,
        company=job_description.company,
        match_score=job_description.match_score,
        summary=result.get("summary"),
        matched_keywords=result.get("matched_keywords", []),
        missing_skills=job_description.missing_skills,
        missing_keywords=result.get("missing_keywords", []),
        recommendations=job_description.match_recommendations,
        resume_edits=result.get("resume_edits", []),
        created_at=job_description.created_at,
    )


@router.post("/roadmap", response_model=RoadmapResponse)
def create_roadmap(
    payload: RoadmapRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> RoadmapResponse:
    roadmap = generate_roadmap(db, current_user, payload)
    record_activity(
        db,
        user_id=current_user.id,
        action="ai.roadmap_generated",
        metadata={"target_role": payload.target_role, "resume_id": payload.resume_id},
    )
    return RoadmapResponse(**roadmap)
