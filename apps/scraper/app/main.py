"""Internal scraping API. Never expose publicly; the worker is the only client.

Phase 6 implements the LinkedIn guest-page fetchers (docs/job-ingestion.md). Until then the
endpoints validate input, enforce the enable switch and shared secret, and return 501.
"""

from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, status

from .models import JobDetail, JobSummary, LinkedInJobRequest, LinkedInSearchRequest
from .settings import Settings, settings

app = FastAPI(title="GetEmployed scraper", docs_url=None, redoc_url=None)


def get_settings() -> Settings:
    return settings


SettingsDep = Annotated[Settings, Depends(get_settings)]


def require_secret(
    cfg: SettingsDep,
    x_scraper_secret: Annotated[str | None, Header()] = None,
) -> None:
    if cfg.scraper_shared_secret and x_scraper_secret != cfg.scraper_shared_secret:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid scraper secret")


def require_linkedin(cfg: SettingsDep) -> None:
    if not cfg.linkedin_scraping_enabled:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "LinkedIn scraping is disabled")


@app.get("/health")
def health(cfg: SettingsDep) -> dict[str, object]:
    return {"ok": True, "linkedin": cfg.linkedin_scraping_enabled}


@app.post(
    "/linkedin/search",
    response_model=list[JobSummary],
    dependencies=[Depends(require_secret), Depends(require_linkedin)],
)
def linkedin_search(_req: LinkedInSearchRequest) -> list[JobSummary]:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Implemented in Phase 6")


@app.post(
    "/linkedin/job",
    response_model=JobDetail,
    dependencies=[Depends(require_secret), Depends(require_linkedin)],
)
def linkedin_job(_req: LinkedInJobRequest) -> JobDetail:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Implemented in Phase 6")
