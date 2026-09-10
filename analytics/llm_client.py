"""
Real LLM integration using Google Gemini — replaces the keyword-rule demo versions in nlp_analysis.py.
"""
import os
import json
from google import genai
from google.genai import types

_client = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY or GOOGLE_API_KEY not set. Get one at ai.google.dev, "
                "then `export GEMINI_API_KEY=your_key_here` before running."
            )
        _client = genai.Client(api_key=api_key)
    return _client


REASON_TAXONOMY = [
    "low_wage", "location_mismatch", "family_reasons", "further_study",
    "skill_mismatch", "no_jobs_available", "health", "better_opportunity",
    "workplace_issues", "other",
]


def classify_reason_llm(text: str) -> tuple[str, float]:
    """Real LLM version of nlp_analysis.classify_reason_text() using Gemini."""
    if not text:
        return "other", 0.0
    client = get_client()
    prompt = f"""Classify this reason into exactly one category from this list:
{REASON_TAXONOMY}

Reason: "{text}"

Respond with ONLY valid JSON: {{"category": "...", "confidence": 0.0-1.0}}"""
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=100,
            ),
        )
        parsed = json.loads(response.text.strip())
        return parsed["category"], float(parsed["confidence"])
    except (json.JSONDecodeError, KeyError, Exception):
        return "other", 0.0


def generate_insight_llm(course_name: str, metrics: dict) -> str:
    """Real LLM version of nlp_analysis.generate_insight() using Gemini."""
    client = get_client()
    prompt = f"""You are writing a 2-3 sentence insight for a government skilling-programme dashboard.
Course: {course_name}
Metrics: {json.dumps(metrics)}

Write a short, plain-language insight a programme manager could act on. No preamble, just the insight."""
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=200,
            ),
        )
        return response.text.strip()
    except Exception as e:
        return f"Unable to generate insight: {e}"


def extract_skills_llm(job_title_or_description: str) -> list[str]:
    """
    Bonus: Section 5(c) skill extraction using Gemini.
    Returns a JSON array of skill strings.
    """
    client = get_client()
    prompt = f"""Extract a short list of concrete skills required for this job, as a JSON array of strings only:
"{job_title_or_description}" """
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=200,
            ),
        )
        return json.loads(response.text.strip())
    except (json.JSONDecodeError, Exception):
        return []


if __name__ == "__main__":
    # Quick manual test — requires GEMINI_API_KEY to be set
    print(classify_reason_llm("Wage offered too low"))
    print(generate_insight_llm("Data Entry & Basic IT", {"placement_rate_pct": 82, "wage_growth_pct": 14}))