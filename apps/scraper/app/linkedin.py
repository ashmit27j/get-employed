"""LinkedIn's public (logged-out) pages: guest job search, job postings and public profiles.

Never logs in or uses an account (docs/job-ingestion.md). Parsing is separate from fetching so it
can be tested against saved HTML.
"""

from __future__ import annotations

import random
import re
import threading
import time
from urllib.parse import urlencode

from scrapling.fetchers import Fetcher
from scrapling.parser import Selector

from .models import JobDetail, JobSummary, LinkedInProfile

GUEST_SEARCH = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
GUEST_JOB = "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{id}"
PROFILE = "https://www.linkedin.com/in/{handle}"


class Blocked(Exception):
    """LinkedIn refused or redirected to its sign-in wall."""


# ---------- politeness: one request at a time, spaced, with a short cache ----------

_lock = threading.Lock()
_last = 0.0
_cache: dict[str, tuple[float, int, str]] = {}
CACHE_TTL_S = 600


def fetch(url: str, min_interval_s: float) -> str:
    hit = _cache.get(url)
    if hit and time.time() - hit[0] < CACHE_TTL_S:
        return hit[2]
    global _last
    delay = 1.0
    for attempt in range(3):
        with _lock:
            wait = _last + min_interval_s + random.uniform(0, 1.0) - time.time()
            if wait > 0:
                time.sleep(wait)
            page = Fetcher.get(url, stealthy_headers=True, timeout=20)
            _last = time.time()
        status = page.status
        final = str(getattr(page, "url", url))
        if "authwall" in final or "/login" in final or "/signup" in final:
            raise Blocked("LinkedIn asked to sign in")
        if status in (429, 999) or status >= 500:
            if attempt == 2:
                raise Blocked(f"LinkedIn returned {status}")
            time.sleep(delay + random.uniform(0, delay))
            delay *= 2
            continue
        if status == 404:
            raise LookupError("Not found")
        html = page.html_content
        _cache[url] = (time.time(), status, html)
        return html
    raise Blocked("LinkedIn kept refusing")


# ---------- parsing ----------


def _text(sel: Selector | None) -> str:
    return re.sub(r"\s+", " ", sel.get_all_text(strip=True)).strip() if sel is not None else ""


def _first(sel: Selector, query: str) -> Selector | None:
    found = sel.css(query)
    return found[0] if found else None


def parse_search(html: str) -> list[JobSummary]:
    root = Selector(html)
    out: list[JobSummary] = []
    for card in root.css("div.base-card, div.job-search-card"):
        urn = card.attrib.get("data-entity-urn", "")
        m = re.search(r"(\d{6,})", urn)
        link = _first(card, "a.base-card__full-link")
        href = (link.attrib.get("href", "") if link is not None else "").split("?")[0]
        if not m:
            m = re.search(r"-(\d{6,})", href)
        if not m:
            continue
        time_el = _first(card, "time")
        out.append(
            JobSummary(
                external_id=m.group(1),
                title=_text(_first(card, "h3")),
                company=_text(_first(card, "h4")),
                location=_text(_first(card, ".job-search-card__location")),
                url=href or f"https://www.linkedin.com/jobs/view/{m.group(1)}",
                posted_at=time_el.attrib.get("datetime") if time_el is not None else None,
            )
        )
    return out


def parse_job(html: str, job_id: str) -> JobDetail:
    root = Selector(html)
    criteria: dict[str, str] = {}
    for item in root.css("li.description__job-criteria-item"):
        key = _text(_first(item, "h3"))
        val = _text(_first(item, "span"))
        if key:
            criteria[key] = val
    desc = _first(root, "div.show-more-less-html__markup") or _first(root, "div.description__text")
    time_el = _first(root, "span.posted-time-ago__text")
    return JobDetail(
        external_id=job_id,
        title=_text(_first(root, "h2.top-card-layout__title")) or _text(_first(root, "h1")),
        company=_text(_first(root, "a.topcard__org-name-link"))
        or _text(_first(root, ".topcard__flavor")),
        location=_text(_first(root, ".topcard__flavor--bullet")),
        url=f"https://www.linkedin.com/jobs/view/{job_id}",
        posted_at=_text(time_el) or None,
        description=desc.get_all_text(separator="\n", strip=True) if desc is not None else "",
        criteria=criteria,
    )


def parse_profile(html: str, handle: str) -> LinkedInProfile:
    root = Selector(html)
    if _first(root, "form.join-form") is not None or "authwall" in html[:5000]:
        raise Blocked("LinkedIn asked to sign in")
    title = _text(_first(root, "title"))
    name, _, headline = title.replace("| LinkedIn", "").partition(" - ")
    meta = _first(root, 'meta[name="description"]')

    def entries(section: str) -> list[str]:
        items = root.css(f"section[data-section='{section}'] li, section.{section} li")
        return [t for t in (_text(i) for i in items) if t][:12]

    return LinkedInProfile(
        handle=handle,
        name=_text(_first(root, "h1")) or name.strip(),
        headline=_text(_first(root, ".top-card-layout__headline")) or headline.strip(),
        about=_text(_first(root, "section.summary div, section[data-section='summary'] p"))
        or (meta.attrib.get("content", "") if meta is not None else ""),
        experience=entries("experience"),
        education=entries("educationsDetails") or entries("education"),
        skills=entries("skills"),
    )


# ---------- entry points ----------


def search(
    keywords: str,
    location: str | None,
    remote: bool | None,
    experience: list[str],
    start: int,
    min_interval_s: float,
) -> list[JobSummary]:
    params: dict[str, str | int] = {
        "keywords": keywords,
        "location": location or "India",
        "start": start,
    }
    if remote:
        params["f_WT"] = 2
    if any("intern" in e.lower() for e in experience):
        params["f_E"] = 1
    jobs = parse_search(fetch(f"{GUEST_SEARCH}?{urlencode(params)}", min_interval_s))
    # Fill descriptions for the first few so skills and experience can be read.
    detailed: list[JobSummary] = []
    for j in jobs[:10]:
        try:
            d = parse_job(fetch(GUEST_JOB.format(id=j.external_id), min_interval_s), j.external_id)
            detailed.append(j.model_copy(update={"description": d.description}))
        except (Blocked, LookupError):
            detailed.append(j)
    return detailed + jobs[10:]


def job(job_id: str, min_interval_s: float) -> JobDetail:
    return parse_job(fetch(GUEST_JOB.format(id=job_id), min_interval_s), job_id)


def profile(handle: str, min_interval_s: float) -> LinkedInProfile:
    return parse_profile(fetch(PROFILE.format(handle=handle), min_interval_s), handle)
