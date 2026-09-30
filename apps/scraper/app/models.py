from pydantic import BaseModel, Field


class LinkedInSearchRequest(BaseModel):
    keywords: str
    location: str | None = None
    experience: list[str] = Field(default_factory=list)
    remote: bool | None = None
    start: int = 0


class JobSummary(BaseModel):
    """Mirrors the RawJob zod schema in packages/core; the worker validates it again."""

    external_id: str
    title: str
    company: str
    location: str
    url: str
    posted_at: str | None = None


class JobDetail(JobSummary):
    description: str = ""
    criteria: dict[str, str] = Field(default_factory=dict)


class LinkedInJobRequest(BaseModel):
    id: str
