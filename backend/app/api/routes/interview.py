from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.interview import InterviewGenerateRequest, InterviewGenerateResponse, InterviewQuestionRead
from app.services.activity_service import record_activity
from app.services.ai_service import generate_interview_questions

router = APIRouter(prefix="/interview", tags=["Interview Prep"])


@router.post("/generate", response_model=InterviewGenerateResponse, status_code=status.HTTP_201_CREATED)
def create_interview_questions(
    payload: InterviewGenerateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> InterviewGenerateResponse:
    questions = generate_interview_questions(db, current_user, payload)
    record_activity(
        db,
        user_id=current_user.id,
        action="ai.interview_questions_generated",
        metadata={"target_role": payload.target_role, "resume_id": payload.resume_id},
    )
    return InterviewGenerateResponse(
        questions=[InterviewQuestionRead.model_validate(question) for question in questions]
    )
