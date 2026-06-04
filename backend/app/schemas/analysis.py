from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ResumeAnalysisRead(BaseModel):
    id: int
    resume_id: int
    ats_score: int | None
    summary: str | None
    strengths: list[str] | None
    weaknesses: list[str] | None
    recommendations: list[str] | None
    missing_keywords: list[str] | None
    rewritten_bullets: list[dict] | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobMatchRequest(BaseModel):
    resume_id: int
    title: str = Field(min_length=2, max_length=180)
    company: str | None = Field(default=None, max_length=180)
    source_url: str | None = Field(default=None, max_length=500)
    description_text: str = Field(min_length=50)


class JobMatchResponse(BaseModel):
    id: int
    title: str
    company: str | None
    match_score: int | None
    summary: str | None = None
    matched_keywords: list[str] | None = None
    missing_skills: list[str] | None
    missing_keywords: list[str] | None = None
    recommendations: list[str] | None
    resume_edits: list[str] | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoadmapRequest(BaseModel):
    resume_id: int | None = None
    target_role: str = Field(min_length=2, max_length=160)


class RoadmapResponse(BaseModel):
    target_role: str
    summary: str
    skill_gaps: list[str]
    learning_path: list[dict]
    project_ideas: list[str]
    certifications: list[str]
    weekly_routine: list[str]
