from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.application import ApplicationStatus


class JobApplicationBase(BaseModel):
    company: str = Field(min_length=1, max_length=180)
    role_title: str = Field(min_length=1, max_length=180)
    location: str | None = Field(default=None, max_length=180)
    job_url: str | None = Field(default=None, max_length=500)
    status: ApplicationStatus = ApplicationStatus.applied
    applied_on: date | None = None
    next_step_date: date | None = None
    interview_round: str | None = Field(default=None, max_length=120)
    notes: str | None = None


class JobApplicationCreate(JobApplicationBase):
    pass


class JobApplicationUpdate(BaseModel):
    company: str | None = Field(default=None, min_length=1, max_length=180)
    role_title: str | None = Field(default=None, min_length=1, max_length=180)
    location: str | None = Field(default=None, max_length=180)
    job_url: str | None = Field(default=None, max_length=500)
    status: ApplicationStatus | None = None
    applied_on: date | None = None
    next_step_date: date | None = None
    interview_round: str | None = Field(default=None, max_length=120)
    notes: str | None = None


class JobApplicationRead(JobApplicationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationAnalytics(BaseModel):
    total: int
    by_status: dict[str, int]
    active: int
    interviews: int
    offers: int
