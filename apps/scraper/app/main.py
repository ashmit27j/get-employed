"""Internal scraping API. Never expose publicly; the worker is the only client.

Reads LinkedIn's public, logged-out pages (docs/job-ingestion.md), behind the enable switch and the
shared secret, one polite request at a time.
"""

from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, status

from . import linkedin
from .models import (
    JobDetail,
    JobSummary,
    LinkedInJobRequest,
    LinkedInProfile,
    LinkedInProfileRequest,
    LinkedInSearchRequest,
)
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


def _guard(fn):  # type: ignore[no-untyped-def]
    try:
        return fn()
    except linkedin.Blocked as err:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Blocked: {err}") from err
    except LookupError as err:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found") from err


@app.get("/health")
def health(cfg: SettingsDep) -> dict[str, object]:
    return {"ok": True, "linkedin": cfg.linkedin_scraping_enabled}


@app.post(
    "/linkedin/search",
    response_model=list[JobSummary],
    dependencies=[Depends(require_secret), Depends(require_linkedin)],
)
def linkedin_search(req: LinkedInSearchRequest, cfg: SettingsDep) -> list[JobSummary]:
    return _guard(
        lambda: linkedin.search(
            req.keywords,
            req.location,
            req.remote,
            req.experience,
            req.start,
            cfg.linkedin_min_interval_s,
        )
    )


@app.post(
    "/linkedin/job",
    response_model=JobDetail,
    dependencies=[Depends(require_secret), Depends(require_linkedin)],
)
def linkedin_job(req: LinkedInJobRequest, cfg: SettingsDep) -> JobDetail:
    return _guard(lambda: linkedin.job(req.id, cfg.linkedin_min_interval_s))


@app.post(
    "/linkedin/profile",
    response_model=LinkedInProfile,
    dependencies=[Depends(require_secret), Depends(require_linkedin)],
)
def linkedin_profile(req: LinkedInProfileRequest, cfg: SettingsDep) -> LinkedInProfile:
    return _guard(lambda: linkedin.profile(req.handle, cfg.linkedin_min_interval_s))
