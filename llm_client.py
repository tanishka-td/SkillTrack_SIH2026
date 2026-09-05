"""
Real LLM integration — replaces the keyword-rule demo versions in nlp_analysis.py.

Usage:
    export ANTHROPIC_API_KEY=sk-ant-...
    In nlp_analysis.py, USE_LLM will automatically switch on when the key is present.

This file is intentionally small: one function per AI task, each a single
Anthropic API call. If you're running this INSIDE a Claude Artifact instead
of your own server, use the fetch()-based pattern from that environment
instead (no API key needed there — it's injected). This version is for your
own backend/server deployment, where you provide the key yourself.
"""
import os
import json
from anthropic import Anthropic

_client = None


def get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY not set. Get one at console.anthropic.com, "
                "then `export ANTHROPIC_API_KEY=sk-ant-...` before running."
            )
        _client = Anthropic(api_key=api_key)
    return _client


REASON_TAXONOMY = [
    "low_wage", "location_mismatch", "family_reasons", "further_study",
    "skill_mismatch", "no_jobs_available", "health", "better_opportunity",
    "workplace_issues", "other",
]


def classify_reason_llm(text: str) -> tuple[str, float]:
    """Real LLM version of nlp_analysis.classify_reason_text()."""
    if not text:
        return "other", 0.0
    client = get_client()
    prompt = f"""Classify this reason into exactly one category from this list:
{REASON_TAXONOMY}

Reason: "{text}"

Respond with ONLY valid JSON, nothing else: {{"category": "...", "confidence": 0.0-1.0}}"""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",  # fast/cheap model, appropriate for simple classification
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text.strip()
    try:
        parsed = json.loads(raw)
        return parsed["category"], float(parsed["confidence"])
    except (json.JSONDecodeError, KeyError):
        return "other", 0.0


def generate_insight_llm(course_name: str, metrics: dict) -> str:
    """Real LLM version of nlp_analysis.generate_insight()."""
    client = get_client()
    prompt = f"""You are writing a 2-3 sentence insight for a government skilling-programme dashboard.
Course: {course_name}
Metrics: {json.dumps(metrics)}

Write a short, plain-language insight a programme manager could act on. No preamble, just the insight."""
    response = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text.strip()


def extract_skills_llm(job_title_or_description: str) -> list[str]:
    """
    Bonus: Section 5(c) skill extraction — not wired into nlp_analysis.py yet,
    but follows the exact same one-call pattern if you want to add it.
    """
    client = get_client()
    prompt = f"""Extract a short list of concrete skills required for this job, as a JSON array of strings only:
"{job_title_or_description}" """
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    try:
        return json.loads(response.content[0].text.strip())
    except json.JSONDecodeError:
        return []


if __name__ == "__main__":
    # Quick manual test — requires ANTHROPIC_API_KEY to be set
    print(classify_reason_llm("Wage offered too low"))
    print(generate_insight_llm("Data Entry & Basic IT", {"placement_rate_pct": 82, "wage_growth_pct": 14}))
