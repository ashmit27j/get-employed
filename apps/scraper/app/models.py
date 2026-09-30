from pydantic import BaseModel, Field


class LinkedInSearchRequest(BaseModel):
    keywords: str
    location: str | None = None
    experience: list[str] = Field(default_factory=list)
    remote: bool | None = None
    start: int = 0


class JobSummary(BaseModel):
    """Mirrors the schema in apps/worker/src/ingest/sources.ts; the worker validates it again."""

    external_id: str
    title: str
    company: str
    location: str
    url: str
    posted_at: str | None = None
    description: str | None = None


class JobDetail(JobSummary):
    criteria: dict[str, str] = Field(default_factory=dict)


class LinkedInJobRequest(BaseModel):
    id: str = Field(pattern=r"^\d{4,20}$")


class LinkedInProfileRequest(BaseModel):
    #: The part after linkedin.com/in/.
    handle: str = Field(pattern=r"^[\w%-]{3,100}$")


class LinkedInProfile(BaseModel):
    handle: str
    name: str = ""
    headline: str = ""
    about: str = ""
    experience: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
