from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InterviewGenerateRequest(BaseModel):
    target_role: str = Field(min_length=2, max_length=160)
    focus: str | None = Field(default=None, max_length=160)
    resume_id: int | None = None


class InterviewQuestionRead(BaseModel):
    id: int
    target_role: str
    question_type: str
    question: str
    suggested_answer: str | None
    tags: list[str] | None
    is_favorite: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InterviewGenerateResponse(BaseModel):
    questions: list[InterviewQuestionRead]
