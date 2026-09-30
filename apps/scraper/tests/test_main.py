from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import linkedin
from app.main import app, get_settings
from app.models import JobSummary
from app.settings import Settings

FIXTURES = Path(__file__).parent / "fixtures"


def client_with(**overrides: object) -> TestClient:
    app.dependency_overrides[get_settings] = lambda: Settings(**overrides)
    return TestClient(app)


def test_health() -> None:
    res = client_with(linkedin_scraping_enabled=False).get("/health")
    assert res.status_code == 200
    assert res.json() == {"ok": True, "linkedin": False}


def test_linkedin_disabled_returns_503() -> None:
    res = client_with(linkedin_scraping_enabled=False).post(
        "/linkedin/search", json={"keywords": "backend"}
    )
    assert res.status_code == 503


def test_secret_is_enforced(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(linkedin, "search", lambda *a, **k: [])
    client = client_with(linkedin_scraping_enabled=True, scraper_shared_secret="s" * 32)
    assert client.post("/linkedin/search", json={"keywords": "x"}).status_code == 401
    ok = client.post(
        "/linkedin/search", json={"keywords": "x"}, headers={"x-scraper-secret": "s" * 32}
    )
    assert ok.status_code == 200
    assert ok.json() == []


def test_blocked_is_a_502(monkeypatch: pytest.MonkeyPatch) -> None:
    def blocked(*_a: object, **_k: object) -> list[JobSummary]:
        raise linkedin.Blocked("LinkedIn returned 999")

    monkeypatch.setattr(linkedin, "search", blocked)
    res = client_with(linkedin_scraping_enabled=True).post(
        "/linkedin/search", json={"keywords": "x"}
    )
    assert res.status_code == 502


def test_profile_handle_is_validated() -> None:
    res = client_with(linkedin_scraping_enabled=True).post(
        "/linkedin/profile", json={"handle": "../etc"}
    )
    assert res.status_code == 422


def test_parse_search_fixture() -> None:
    jobs = linkedin.parse_search((FIXTURES / "search.html").read_text(encoding="utf8"))
    assert len(jobs) >= 5
    first = jobs[0]
    assert first.external_id.isdigit()
    assert first.title and first.company and first.location
    assert first.url.startswith("https://")


def test_parse_job_fixture() -> None:
    job = linkedin.parse_job((FIXTURES / "job.html").read_text(encoding="utf8"), "4455303752")
    assert job.title
    assert len(job.description) > 200
    assert "Employment type" in job.criteria
