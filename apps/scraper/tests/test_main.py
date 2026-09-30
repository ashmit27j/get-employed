from fastapi.testclient import TestClient

from app.main import app, get_settings
from app.settings import Settings


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


def test_secret_is_enforced() -> None:
    client = client_with(linkedin_scraping_enabled=True, scraper_shared_secret="s" * 32)
    assert client.post("/linkedin/search", json={"keywords": "x"}).status_code == 401
    ok = client.post(
        "/linkedin/search", json={"keywords": "x"}, headers={"x-scraper-secret": "s" * 32}
    )
    assert ok.status_code == 501
