"""
AI/NLP layer
"""
import re
import os
from collections import Counter

USE_LLM = bool(os.environ.get("GEMINI_API_KEY"))
if USE_LLM:
    from llm_client import classify_reason_llm, generate_insight_llm, extract_skills_llm

TAXONOMY = {
    "low_wage": ["low wage", "wage too low", "underpaid", "wage offered", "workload"],
    "location_mismatch": ["location", "far", "relocation", "commute"],
    "family_reasons": ["family", "not permitted", "circumstances"],
    "further_study": ["further education", "study", "studies"],
    "skill_mismatch": ["skill mismatch", "underprepared", "did not match"],
    "no_jobs_available": ["no suitable openings", "no jobs", "no opening"],
    "health": ["health"],
    "better_opportunity": ["better opportunity", "moved to"],
    "workplace_issues": ["workplace conditions", "employer issues"],
}


def classify_reason_text(text: str) -> tuple[str, float]:
    """
    Classify a free-text reason into the fixed taxonomy.

    Automatically uses a real Gemini API call (llm_client.classify_reason_llm)
    if GEMINI_API_KEY is set in the environment. Otherwise falls back to
    the keyword-rule demo version below, so this always runs even with no key.
    """
    if USE_LLM:
        return classify_reason_llm(text)
    if not text:
        return "other", 0.0
    lower = text.lower()
    for code, keywords in TAXONOMY.items():
        for kw in keywords:
            if kw in lower:
                return code, 1.0
    return "other", 0.0


def reason_frequency_table(engine, category):
    import pandas as pd
    from sqlalchemy import text as sqltext
    q = f"""
        SELECT raw_text FROM reason WHERE category = :category
    """
    df = pd.read_sql(sqltext(q), engine, params={"category": category})
    codes = [classify_reason_text(t)[0] for t in df["raw_text"]]
    counts = Counter(codes)
    return pd.DataFrame(counts.items(), columns=["reason_code", "count"]).sort_values("count", ascending=False)


def generate_insight(course_name: str, metrics: dict) -> str:
    if USE_LLM:
        return generate_insight_llm(course_name, metrics)

    parts = [f"**{course_name}**:"]

    pr = metrics.get("placement_rate_pct")
    if pr is not None:
        if pr >= 70:
            parts.append(f"placement rate is strong at {pr}%.")
        elif pr >= 50:
            parts.append(f"placement rate is moderate at {pr}%, with room to improve employer partnerships.")
        else:
            parts.append(f"placement rate is low at {pr}% — this course needs attention.")

    rel = metrics.get("relevance_score")
    if rel is not None:
        if rel < 0.5:
            parts.append(f"Training-job relevance is weak ({rel:.2f}), suggesting graduates often land roles that under-use their training.")
        else:
            parts.append(f"Training-job relevance is healthy ({rel:.2f}).")

    wg = metrics.get("wage_growth_pct")
    if wg is not None:
        parts.append(f"Average wage growth post-placement is {wg}%.")

    top_reason = metrics.get("top_non_placement_reason")
    if top_reason:
        parts.append(f"The leading reason for non-placement is '{top_reason}' — worth addressing directly with employer partners or in counselling.")

    return " ".join(parts)


def generate_all_insights(engine):
    try:
        import analytics.metrics as m  # when imported as a package (e.g. from api.py)
    except ImportError:
        import metrics as m  # when run standalone from inside analytics/
    pr = m.placement_rate(engine, "course")
    rel = m.training_job_relevance(engine, "course")
    wg = m.wage_growth(engine, "course")
    reasons = m.non_placement_reasons(engine)
    top_reason = reasons.iloc[0]["reason_label"] if not reasons.empty else None

    insights = []
    for _, row in pr.iterrows():
        course = row["group_key"]
        rel_row = rel[rel["course_name"] == course]
        wg_row = wg[wg["course_name"] == course]
        metrics_dict = {
            "placement_rate_pct": row["placement_rate_pct"],
            "relevance_score": rel_row["relevance_score"].iloc[0] if not rel_row.empty else None,
            "wage_growth_pct": wg_row["wage_growth_pct"].iloc[0] if not wg_row.empty else None,
            "top_non_placement_reason": top_reason,
        }
        insights.append(generate_insight(course, metrics_dict))
    return insights


if __name__ == "__main__":
    from database.schema import get_engine
    engine = get_engine("data/skilling_outcomes.db")

    print("--- Non-placement reason classification (keyword demo version) ---")
    print(reason_frequency_table(engine, "non_placement"))

    print("\n--- Attrition reason classification ---")
    print(reason_frequency_table(engine, "attrition"))

    print("\n--- Auto-generated insights ---")
    for insight in generate_all_insights(engine):
        print("-", insight)

def extract_job_skills(text: str) -> list[str]:
    """
    Extract skills from a job title/description using Gemini.
    Falls back to an empty list when LLM is unavailable.
    """
    if not USE_LLM or not text:
        return []

    return extract_skills_llm(text)