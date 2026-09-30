from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Read from the environment (the repo-root .env is passed in by docker compose)."""

    model_config = SettingsConfigDict(env_file=("../../.env", ".env"), extra="ignore")

    linkedin_scraping_enabled: bool = False
    scraper_shared_secret: str | None = None
    #: Minimum seconds between LinkedIn requests; jitter is added on top.
    linkedin_min_interval_s: float = 2.5


settings = Settings()
