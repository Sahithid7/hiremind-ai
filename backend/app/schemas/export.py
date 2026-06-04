from pydantic import BaseModel, Field


class PdfExportRequest(BaseModel):
    title: str = Field(default="HireMind Resume", max_length=120)
    html: str = Field(..., min_length=1, max_length=1_500_000)
