from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ResumeRead(BaseModel):
    id: int
    original_filename: str
    content_type: str
    parsed_text: str | None
    extracted_skills: list[str] | None
    extracted_experience: list[dict] | None
    extracted_education: list[dict] | None
    extracted_projects: list[dict] | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResumeUploadResponse(BaseModel):
    resume: ResumeRead
    message: str


class ResumeExtractRead(BaseModel):
    id: str
    original_filename: str
    content_type: str
    parsed_text: str | None = None

    # Personal information — individually extracted
    name: str = ""
    title: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""

    # Core sections
    summary: str = ""
    extracted_skills: list[str] = []
    skills_categorized: dict[str, list[str]] = {}
    extracted_experience: list[dict] = []
    extracted_education: list[dict] = []
    extracted_projects: list[dict] = []
    certifications: list[str] = []

    # Preserved additional sections — NEVER mixed with certifications
    achievements: list[str] = []    # Leadership Impact, Key Achievements
    awards: list[str] = []          # Awards, Honors
    publications: list[str] = []    # Publications, Research
    volunteer: list[dict] = []      # Volunteer Experience
    # Extraction diagnostics — shows exactly what was found
    diagnostics: dict = {}          # text_length, sections_detected, sections_missing, etc.


class ResumeExtractResponse(BaseModel):
    resume: ResumeExtractRead
    message: str


class ResumeRewriteRequest(BaseModel):
    resume_text: str
    jd_text: str | None = None


class ResumeRewriteResponse(BaseModel):
    rewritten: dict
    message: str


class ResumeParseAiRequest(BaseModel):
    resume_text: str
    role_count_hint: int = 0        # Python-parser's role count used for prompt verification


class ResumeParseAiResponse(BaseModel):
    parsed: dict                    # Structured JSON from the precision parse prompt
    message: str


class ImproveSummaryRequest(BaseModel):
    summary_text: str
    job_title: str = ""
    skills: list[str] = []


class ImproveSummaryResponse(BaseModel):
    improved_summary: str
    message: str
