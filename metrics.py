"""
Metrics engine — Section 4 of the blueprint.
Pure SQL/pandas, no AI/ML. Each function returns a pandas DataFrame or a scalar.
"""
import pandas as pd
from sqlalchemy import text
from schema import get_engine


def _read(engine, query, params=None):
    return pd.read_sql(text(query), engine, params=params or {})


def placement_rate(engine, group_by=None):
    """
    Placement rate = placed / completed trainees, overall or grouped.

    A trainee's employment_records get a NEW row per status update over time
    (correct, append-only design) — so a training can have several Placement
    rows across its history. This metric must count each training's CURRENT
    (latest) status once, not every historical update, or someone who
    updated their status twice looks like two placements.
    """
    gb_col = {"course": "co.course_name", "provider": "p.provider_name",
              "district": "d.district_name", "cohort": "t.cohort_id", None: None}[group_by]
    select = f"{gb_col} as group_key, " if gb_col else ""
    group_clause = f"GROUP BY {gb_col}" if gb_col else ""
    q = f"""
        WITH latest_placement AS (
            SELECT pl.*
            FROM placement pl
            JOIN (
                SELECT training_id, MAX(placement_id) as max_id
                FROM placement
                GROUP BY training_id
            ) latest ON pl.placement_id = latest.max_id
        )
        SELECT {select}
            COUNT(DISTINCT tr.training_id) as completed,
            SUM(CASE WHEN pl.placement_type IS NOT NULL AND pl.placement_type != 'not_placed' THEN 1 ELSE 0 END) as placed
        FROM training tr
        JOIN course co ON tr.course_id = co.course_id
        JOIN provider p ON tr.provider_id = p.provider_id
        JOIN district d ON p.district_id = d.district_id
        LEFT JOIN latest_placement pl ON pl.training_id = tr.training_id
        WHERE tr.completion_status = 'completed'
        {group_clause}
    """
    df = _read(engine, q)
    df["placement_rate_pct"] = (df["placed"] / df["completed"] * 100).round(1)
    return df


def employment_type_distribution(engine):
    """Current status distribution — one row per training (latest status only), not every historical update."""
    q = """
        WITH latest_placement AS (
            SELECT pl.*
            FROM placement pl
            JOIN (
                SELECT training_id, MAX(placement_id) as max_id
                FROM placement
                GROUP BY training_id
            ) latest ON pl.placement_id = latest.max_id
        )
        SELECT placement_type, COUNT(*) as n
        FROM latest_placement
        GROUP BY placement_type
    """
    df = _read(engine, q)
    df["pct"] = (df["n"] / df["n"].sum() * 100).round(1)
    return df


def time_to_placement(engine):
    q = """
        SELECT tr.course_id, co.course_name,
               julianday(pl.start_date) - julianday(tr.end_date) as days_to_placement
        FROM placement pl
        JOIN training tr ON pl.training_id = tr.training_id
        JOIN course co ON tr.course_id = co.course_id
        WHERE pl.start_date IS NOT NULL
    """
    df = _read(engine, q)
    summary = df.groupby("course_name")["days_to_placement"].agg(["mean", "median"]).reset_index()
    summary.columns = ["course_name", "mean_days_to_placement", "median_days_to_placement"]
    return summary.round(1)


def retention_rate(engine, month_mark=6):
    """
    Retention at month N = placements still 'active' (or ended after N months)
    at that horizon / total placements with employment_history.
    """
    q = """
        SELECT p.placement_id, p.start_date, eh.status, eh.period_end
        FROM placement p
        JOIN employment_history eh ON eh.placement_id = p.placement_id
        WHERE p.placement_type IN ('wage_employment','apprenticeship')
    """
    df = _read(engine, q)
    if df.empty:
        return {"month": month_mark, "retention_rate_pct": None, "n": 0}
    df["start_date"] = pd.to_datetime(df["start_date"])
    df["period_end"] = pd.to_datetime(df["period_end"])
    horizon = df["start_date"] + pd.Timedelta(days=month_mark * 30)
    still_employed = (df["status"] == "active") | (df["period_end"] > horizon)
    rate = still_employed.mean() * 100
    return {"month": month_mark, "retention_rate_pct": round(rate, 1), "n": len(df)}


def attrition_rate(engine, month_mark=6):
    r = retention_rate(engine, month_mark)
    if r["retention_rate_pct"] is None:
        return {"month": month_mark, "attrition_rate_pct": None, "n": r["n"]}
    return {"month": month_mark, "attrition_rate_pct": round(100 - r["retention_rate_pct"], 1), "n": r["n"]}


def wage_growth(engine, group_by=None):
    """Wage growth % = (latest - first) / first * 100, per placement, then aggregated."""
    empty_col = {"course": "course_name", "provider": "provider_name", "district": "district_name"}.get(group_by, "group_key")
    q = """
        SELECT wh.placement_id, wh.recorded_date, wh.wage_amount,
               co.course_name, prov.provider_name, d.district_name
        FROM wage_history wh
        JOIN placement pl ON wh.placement_id = pl.placement_id
        JOIN training tr ON pl.training_id = tr.training_id
        JOIN course co ON tr.course_id = co.course_id
        JOIN provider prov ON tr.provider_id = prov.provider_id
        JOIN district d ON prov.district_id = d.district_id
        ORDER BY wh.placement_id, wh.recorded_date
    """
    df = _read(engine, q)
    if df.empty:
        if group_by:
            return pd.DataFrame(columns=[empty_col, "wage_growth_pct"])
        return None
    first = df.groupby("placement_id").first()
    last = df.groupby("placement_id").last()
    growth = ((last["wage_amount"] - first["wage_amount"]) / first["wage_amount"] * 100).rename("wage_growth_pct")
    merged = pd.concat([first[["course_name", "provider_name", "district_name"]], growth], axis=1)

    if group_by:
        col = {"course": "course_name", "provider": "provider_name", "district": "district_name"}[group_by]
        return merged.groupby(col)["wage_growth_pct"].mean().round(1).reset_index()
    return merged["wage_growth_pct"].mean().round(1)


def training_job_relevance(engine, group_by="course"):
    """
    Relevance score via Jaccard overlap between course_skill_map and job_skill_map,
    per placement, then aggregated.
    """
    course_skills_q = """
        SELECT tr.training_id, csm.skill_id
        FROM training tr
        JOIN course_skill_map csm ON tr.course_id = csm.course_id
    """
    job_skills_q = """
        SELECT jsm.placement_id, jsm.skill_id, pl.training_id
        FROM job_skill_map jsm
        JOIN placement pl ON jsm.placement_id = pl.placement_id
    """
    course_skills = _read(engine, course_skills_q)
    job_skills = _read(engine, job_skills_q)
    col = {"course": "course_name", "provider": "provider_name", "district": "district_name"}[group_by]
    if job_skills.empty:
        return pd.DataFrame(columns=[col, "relevance_score"])

    course_sets = course_skills.groupby("training_id")["skill_id"].apply(set)
    job_sets = job_skills.groupby(["placement_id", "training_id"])["skill_id"].apply(set).reset_index()

    def jaccard(row):
        c = course_sets.get(row["training_id"], set())
        j = row["skill_id"]
        if not c and not j:
            return 0.0
        union = c | j
        return len(c & j) / len(union) if union else 0.0

    job_sets["relevance_score"] = job_sets.apply(jaccard, axis=1)

    meta_q = """
        SELECT pl.placement_id, co.course_name, prov.provider_name, d.district_name
        FROM placement pl
        JOIN training tr ON pl.training_id = tr.training_id
        JOIN course co ON tr.course_id = co.course_id
        JOIN provider prov ON tr.provider_id = prov.provider_id
        JOIN district d ON prov.district_id = d.district_id
    """
    meta = _read(engine, meta_q)
    merged = job_sets.merge(meta, on="placement_id")
    col = {"course": "course_name", "provider": "provider_name", "district": "district_name"}[group_by]
    return merged.groupby(col)["relevance_score"].mean().round(3).reset_index()


def course_provider_composite_score(engine, weights=(0.35, 0.30, 0.20, 0.15)):
    """
    Composite = w1*placement_rate + w2*retention_rate(6mo, approx per-course) +
                w3*normalized_wage_growth + w4*relevance_score
    Simplified: uses overall retention (not per-course) since retention query is global;
    documented as a known simplification for the prototype.
    """
    w1, w2, w3, w4 = weights
    pr = placement_rate(engine, group_by="course")[["group_key", "placement_rate_pct"]]
    wg = wage_growth(engine, group_by="course").rename(columns={"course_name": "group_key"})
    rel = training_job_relevance(engine, group_by="course").rename(columns={"course_name": "group_key"})
    ret = retention_rate(engine, 6)["retention_rate_pct"] or 0

    merged = pr.merge(wg, on="group_key", how="left").merge(rel, on="group_key", how="left")
    merged["wage_growth_pct"] = merged["wage_growth_pct"].fillna(0)
    merged["relevance_score"] = merged["relevance_score"].fillna(0)

    def norm(s):
        rng = s.max() - s.min()
        return (s - s.min()) / rng if rng > 0 else s * 0

    merged["composite_score"] = (
        w1 * norm(merged["placement_rate_pct"]) +
        w2 * (ret / 100) +
        w3 * norm(merged["wage_growth_pct"]) +
        w4 * merged["relevance_score"]
    ).round(3)
    return merged.sort_values("composite_score", ascending=False)


def skill_gap(engine):
    """Skills demanded by jobs but absent from the course curriculum, per course."""
    q_course = """
        SELECT co.course_id, co.course_name, s.skill_name
        FROM course_skill_map csm
        JOIN course co ON csm.course_id = co.course_id
        JOIN skill s ON csm.skill_id = s.skill_id
    """
    q_job = """
        SELECT tr.course_id, s.skill_name, COUNT(*) as demand_count
        FROM job_skill_map jsm
        JOIN placement pl ON jsm.placement_id = pl.placement_id
        JOIN training tr ON pl.training_id = tr.training_id
        JOIN skill s ON jsm.skill_id = s.skill_id
        GROUP BY tr.course_id, s.skill_name
    """
    course_skills = _read(engine, q_course)
    job_skills = _read(engine, q_job)
    rows = []
    for cid, grp in course_skills.groupby("course_id"):
        course_name = grp["course_name"].iloc[0]
        taught = set(grp["skill_name"])
        demanded = job_skills[job_skills["course_id"] == cid]
        gap = demanded[~demanded["skill_name"].isin(taught)]
        for _, r in gap.iterrows():
            rows.append({"course_name": course_name, "missing_skill": r["skill_name"], "demand_count": r["demand_count"]})
    return pd.DataFrame(rows).sort_values("demand_count", ascending=False) if rows else pd.DataFrame(
        columns=["course_name", "missing_skill", "demand_count"])


def overall_impact_index(engine):
    """Size-weighted average of course composite scores = programme impact index."""
    comp = course_provider_composite_score(engine)
    sizes_q = """
        SELECT co.course_name as group_key, COUNT(*) as n
        FROM training tr JOIN course co ON tr.course_id = co.course_id
        WHERE tr.completion_status = 'completed'
        GROUP BY co.course_name
    """
    sizes = _read(engine, sizes_q)
    merged = comp.merge(sizes, on="group_key")
    impact = (merged["composite_score"] * merged["n"]).sum() / merged["n"].sum()
    return round(impact, 3)


def non_placement_reasons(engine):
    q = "SELECT reason_label, COUNT(*) as n FROM reason WHERE category='non_placement' GROUP BY reason_label ORDER BY n DESC"
    return _read(engine, q)


def attrition_reasons(engine):
    q = "SELECT reason_label, COUNT(*) as n FROM reason WHERE category='attrition' GROUP BY reason_label ORDER BY n DESC"
    return _read(engine, q)


if __name__ == "__main__":
    engine = get_engine("data/skilling_outcomes.db")
    print("\n--- Placement rate by course ---")
    print(placement_rate(engine, "course")[["group_key", "completed", "placed", "placement_rate_pct"]])
    print("\n--- Employment type distribution ---")
    print(employment_type_distribution(engine))
    print("\n--- Time to placement ---")
    print(time_to_placement(engine))
    print("\n--- Retention @ 6mo ---")
    print(retention_rate(engine, 6))
    print("\n--- Attrition @ 6mo ---")
    print(attrition_rate(engine, 6))
    print("\n--- Wage growth by course ---")
    print(wage_growth(engine, "course"))
    print("\n--- Training-job relevance by course ---")
    print(training_job_relevance(engine, "course"))
    print("\n--- Composite score by course ---")
    print(course_provider_composite_score(engine)[["group_key", "placement_rate_pct", "composite_score"]])
    print("\n--- Skill gap ---")
    print(skill_gap(engine).head(10))
    print("\n--- Overall impact index ---")
    print(overall_impact_index(engine))
    print("\n--- Non-placement reasons ---")
    print(non_placement_reasons(engine))
    print("\n--- Attrition reasons ---")
    print(attrition_reasons(engine))
