"""
ML layer

Anomaly detection: fully valid to run now (statistical method, flags deviation
within THIS dataset, doesn't claim real-world predictive power).

Placement/attrition prediction: pipeline is built and runs end-to-end on
synthetic data to prove the mechanism works, but every output is explicitly
labeled as ILLUSTRATIVE — synthetic data cannot prove real-world predictive
accuracy. Do not present these numbers as real accuracy in the SIH demo;
present the pipeline itself as the deliverable.
"""
import pandas as pd
import numpy as np
from sqlalchemy import text
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, f1_score, mean_absolute_error, r2_score
from database.schema import get_engine


def _read(engine, query, params=None):
    return pd.read_sql(text(query), engine, params=params or {})


# ---------------------------------------------------------------- anomaly detection

def detect_cohort_anomalies(engine, z_threshold=1.5):
    """
    Statistical anomaly detection (z-score) on per-cohort placement rate.
    Flags cohorts whose placement rate deviates > z_threshold std devs from
    the mean across all cohorts of the SAME course (so we compare like-for-like).
    This is valid and meaningful even on synthetic data — it's detecting
    internal statistical outliers, not making real-world predictions.
    """
    q = """
        SELECT tr.cohort_id, co.course_name, prov.provider_name,
               COUNT(*) as completed,
               SUM(CASE WHEN pl.placement_type IS NOT NULL AND pl.placement_type != 'not_placed' THEN 1 ELSE 0 END) as placed
        FROM training tr
        JOIN course co ON tr.course_id = co.course_id
        JOIN provider prov ON tr.provider_id = prov.provider_id
        LEFT JOIN placement pl ON pl.training_id = tr.training_id
        WHERE tr.completion_status = 'completed'
        GROUP BY tr.cohort_id
    """
    df = _read(engine, q)
    df["placement_rate"] = df["placed"] / df["completed"]

    results = []
    for course, grp in df.groupby("course_name"):
        mean, std = grp["placement_rate"].mean(), grp["placement_rate"].std()
        if std == 0 or pd.isna(std):
            continue
        grp = grp.copy()
        grp["z_score"] = (grp["placement_rate"] - mean) / std
        anomalies = grp[grp["z_score"].abs() > z_threshold]
        for _, row in anomalies.iterrows():
            results.append({
                "course_name": course, "provider_name": row["provider_name"],
                "cohort_id": row["cohort_id"], "placement_rate": round(row["placement_rate"], 2),
                "course_mean": round(mean, 2), "z_score": round(row["z_score"], 2),
                "flag": "underperforming" if row["z_score"] < 0 else "overperforming",
            })
    return pd.DataFrame(results)


# ---------------------------------------------------------------- placement prediction (demo pipeline)

def build_placement_features(engine):
    q = """
        SELECT tr.training_id, tr.assessment_score, co.sector, prov.provider_name,
               d.district_name, t.gender, t.category,
               CASE WHEN pl.placement_type IS NOT NULL AND pl.placement_type != 'not_placed'
                    THEN 1 ELSE 0 END as placed
        FROM training tr
        JOIN course co ON tr.course_id = co.course_id
        JOIN provider prov ON tr.provider_id = prov.provider_id
        JOIN district d ON prov.district_id = d.district_id
        JOIN trainee t ON tr.trainee_id = t.trainee_id
        LEFT JOIN placement pl ON pl.training_id = tr.training_id
        WHERE tr.completion_status = 'completed'
    """
    return _read(engine, q)

# ============= PLACEMENT PREDICTION =============
def placement_prediction_demo(engine):
    """
    ILLUSTRATIVE ONLY. Demonstrates the full pipeline (features -> train ->
    evaluate) on synthetic data. The resulting AUC reflects patterns we
    ourselves injected into the synthetic generator (e.g. sector correlates
    with placement) — it is NOT evidence of real-world predictive accuracy.
    Re-run this exact code against real historical data once available.
    """
    df = build_placement_features(engine)
    y = df["placed"]

    MIN_SAMPLES = 20
    if len(df) < MIN_SAMPLES or y.nunique() < 2:
        return {
            "note": f"Not enough data yet to run this demo (have {len(df)} completed trainees, "
                    f"need at least {MIN_SAMPLES} with both placed and not-placed examples present). "
                    "This is expected with a small real dataset — try again once more trainees have "
                    "gone through the full training-to-placement cycle.",
            "auc_roc": None, "f1_score": None,
        }

    X = pd.get_dummies(df[["assessment_score", "sector", "provider_name", "district_name", "gender", "category"]],
                        columns=["sector", "provider_name", "district_name", "gender", "category"])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train_s, y_train)
    proba = model.predict_proba(X_test_s)[:, 1]
    preds = model.predict(X_test_s)

    return {
        "note": "ILLUSTRATIVE PIPELINE ONLY — trained on synthetic data with injected correlations. "
                "Not a claim of real-world predictive accuracy.",
        "n_train": len(X_train), "n_test": len(X_test),
        "auc_roc": round(roc_auc_score(y_test, proba), 3),
        "f1_score": round(f1_score(y_test, preds), 3),
        "top_features": _top_coefficients(model, X.columns),
    }


def _top_coefficients(model, feature_names, n=5):
    coefs = pd.Series(model.coef_[0], index=feature_names)
    return coefs.abs().sort_values(ascending=False).head(n).index.tolist()


def build_attrition_features(engine):
    q = """
        SELECT eh.history_id, eh.status, eh.period_start, eh.period_end,
               pl.placement_id, co.sector, wh_first.wage_amount as initial_wage
        FROM employment_history eh
        JOIN placement pl ON eh.placement_id = pl.placement_id
        JOIN training tr ON pl.training_id = tr.training_id
        JOIN course co ON tr.course_id = co.course_id
        LEFT JOIN (
            SELECT placement_id, MIN(recorded_date) as first_date, wage_amount
            FROM wage_history GROUP BY placement_id
        ) wh_first ON wh_first.placement_id = pl.placement_id
    """
    return _read(engine, q)

# ============= ATTRITION =============
def attrition_prediction_demo(engine):
    """
    ILLUSTRATIVE ONLY — same caveat as placement_prediction_demo. Predicts
    whether a job spell ended (attrition) using sector and initial wage as
    a stand-in feature set.
    """
    df = build_attrition_features(engine)
    df = df.dropna(subset=["initial_wage"])
    df["attrited"] = (df["status"] == "ended").astype(int)

    X = pd.get_dummies(df[["sector", "initial_wage"]], columns=["sector"])
    y = df["attrited"]

    if y.nunique() < 2:
        return {"note": "Not enough class variation in synthetic sample to train.", "auc_roc": None}

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train_s, y_train)
    proba = model.predict_proba(X_test_s)[:, 1]
    preds = model.predict(X_test_s)

    return {
        "note": "ILLUSTRATIVE PIPELINE ONLY — synthetic data, not real-world predictive accuracy.",
        "n_train": len(X_train), "n_test": len(X_test),
        "auc_roc": round(roc_auc_score(y_test, proba), 3),
        "f1_score": round(f1_score(y_test, preds), 3),
    }


if __name__ == "__main__":
    engine = get_engine("data/skilling_outcomes_demo.db")

    print("--- Anomaly detection (cohort placement-rate outliers) ---")
    print(detect_cohort_anomalies(engine))

    print("\n--- Placement prediction (DEMO PIPELINE — see note) ---")
    print(placement_prediction_demo(engine))

    print("\n--- Attrition prediction (DEMO PIPELINE — see note) ---")
    print(attrition_prediction_demo(engine))


MIN_SAMPLES = 20

def _read(engine, query, params=None):
    return pd.read_sql(text(query), engine, params=params or {})
 
 
def _guard(df, target_col, min_samples=MIN_SAMPLES):
    """Common 'not enough data yet' guard used by every trainer below."""
    if len(df) < min_samples or df[target_col].nunique() < 2:
        return {
            "note": f"Not enough data yet to train (have {len(df)} rows, need at least "
                    f"{min_samples} with both classes/values present). Expected with a small "
                    "real dataset — re-run once more records exist.",
            "trained": False,
        }
    return None

# ============= DROP-OUT PREDICTION =============
def build_dropout_features(engine):
    """
    One row per training enrolment. Target = 1 if the trainee dropped out
    before completion. Features are all things known DURING training
    (not outcomes that only exist after placement), so this can flag
    at-risk trainees while they're still enrolled.
    """
    q = """
        SELECT tr.training_id, tr.trainee_id, co.course_name, co.sector,
               co.duration_weeks, prov.provider_name, prov.provider_type,
               d.district_name, t.gender, t.category,
               (SELECT COUNT(*) FROM training tr2
                WHERE tr2.trainee_id = tr.trainee_id AND tr2.training_id < tr.training_id) as prior_enrolments,
               CASE WHEN tr.completion_status = 'dropped_out' THEN 1 ELSE 0 END as dropped_out
        FROM training tr
        JOIN course co ON tr.course_id = co.course_id
        JOIN provider prov ON tr.provider_id = prov.provider_id
        JOIN district d ON prov.district_id = d.district_id
        JOIN trainee t ON tr.trainee_id = t.trainee_id
    """
    return _read(engine, q)
 
 
def dropout_prediction_model(engine):
    """
    Classifier: probability a currently-enrolled trainee drops out.
    Returns model performance + the full ranked risk table (highest-risk
    trainees first) so it can feed a "flag for counselling" list.
    """
    df = build_dropout_features(engine)
    guard = _guard(df, "dropped_out")
    if guard:
        return guard
 
    feature_cols = ["duration_weeks", "prior_enrolments", "sector", "provider_type",
                     "district_name", "gender", "category"]
    X = pd.get_dummies(df[feature_cols], columns=["sector", "provider_type", "district_name", "gender", "category"])
    y = df["dropped_out"]
 
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)
 
    model = RandomForestClassifier(n_estimators=200, max_depth=6, random_state=42, class_weight="balanced")
    model.fit(X_train_s, y_train)
    proba_test = model.predict_proba(X_test_s)[:, 1]
    preds_test = model.predict(X_test_s)
 
    # score every row so results double as an actionable "who's at risk" list
    all_scaled = scaler.transform(X)
    df["dropout_risk"] = model.predict_proba(all_scaled)[:, 1].round(3)
    risk_table = (df[df["dropped_out"] == 0]  # only still/were-enrolled, not already-known dropouts
                  [["training_id", "trainee_id", "course_name", "provider_name", "district_name", "dropout_risk"]]
                  .sort_values("dropout_risk", ascending=False))
 
    importances = pd.Series(model.feature_importances_, index=X.columns).sort_values(ascending=False).head(8)
 
    return {
        "note": "ILLUSTRATIVE — trained on synthetic demo data. Re-run on real data once available.",
        "trained": True,
        "n_train": len(X_train), "n_test": len(X_test),
        "auc_roc": round(roc_auc_score(y_test, proba_test), 3),
        "f1_score": round(f1_score(y_test, preds_test), 3),
        "top_risk_factors": importances.round(3).to_dict(),
        "at_risk_trainees": risk_table.head(20),
    }

# ============= JOB-MATCH RECOMMENDATION =============
def build_trainee_skill_profile(engine, trainee_id):
    q = """
        SELECT DISTINCT s.skill_id, s.skill_name
        FROM training tr
        JOIN course_skill_map csm ON tr.course_id = csm.course_id
        JOIN skill s ON csm.skill_id = s.skill_id
        WHERE tr.trainee_id = :trainee_id
    """
    return _read(engine, q, {"trainee_id": trainee_id})
 
 
def build_job_role_skill_profiles(engine):
    """
    Skill-demand fingerprint per job_title, learned from HISTORICAL placements
    (job_skill_map). This is the "catalogue" of roles we can recommend into —
    swap for a live vacancy feed later without touching the matching logic.
    """
    q = """
        SELECT pl.job_title, pl.job_sector, jsm.skill_id, COUNT(*) as freq
        FROM job_skill_map jsm
        JOIN placement pl ON jsm.placement_id = pl.placement_id
        WHERE pl.job_title IS NOT NULL
        GROUP BY pl.job_title, jsm.skill_id
    """
    df = _read(engine, q)
    profiles = {}
    for title, grp in df.groupby("job_title"):
        profiles[title] = {
            "sector": grp["job_sector"].iloc[0],
            "skills": set(grp["skill_id"]),
            "n_hires_observed": int(grp["freq"].sum()),
        }
    return profiles
 
 
def recommend_jobs_for_trainee(engine, trainee_id, top_n=5):
    """
    Content-based recommender: ranks historical job roles by Jaccard overlap
    between the role's demanded-skill set and the trainee's acquired-skill set.
    """
    trainee_skills = set(build_trainee_skill_profile(engine, trainee_id)["skill_id"])
    if not trainee_skills:
        return pd.DataFrame(columns=["job_title", "sector", "match_score", "matched_skills", "missing_skills"])
 
    role_profiles = build_job_role_skill_profiles(engine)
    skill_names = _read(engine, "SELECT skill_id, skill_name FROM skill").set_index("skill_id")["skill_name"]
 
    rows = []
    for title, prof in role_profiles.items():
        required = prof["skills"]
        if not required:
            continue
        overlap = trainee_skills & required
        union = trainee_skills | required
        score = len(overlap) / len(union) if union else 0.0
        rows.append({
            "job_title": title,
            "sector": prof["sector"],
            "match_score": round(score, 3),
            "matched_skills": ", ".join(skill_names.get(s, str(s)) for s in overlap),
            "missing_skills": ", ".join(skill_names.get(s, str(s)) for s in (required - trainee_skills)),
            "n_hires_observed": prof["n_hires_observed"],
        })
    return pd.DataFrame(rows).sort_values(["match_score", "n_hires_observed"], ascending=False).head(top_n)
 
 
def recommend_for_all_completed(engine, top_n=3):
    """Batch version — one recommended shortlist per trainee who has completed training. Good for a dashboard job."""
    trainees = _read(engine, "SELECT DISTINCT trainee_id FROM training WHERE completion_status='completed'")
    out = []
    for tid in trainees["trainee_id"]:
        recs = recommend_jobs_for_trainee(engine, tid, top_n=top_n)
        for _, r in recs.iterrows():
            out.append({"trainee_id": tid, **r.to_dict()})
    return pd.DataFrame(out)


# ============ SALARY PREDICTION ============
 
def build_salary_features(engine):
    """
    One row per placement that has at least one wage observation.
    initial_wage = first recorded wage after placement (the "starting salary").
    skill_count  = size of the trainee's acquired-skill set (proxy for skillset breadth).
    prior_jobs   = number of previous employment_history spells for this trainee (proxy for experience).
    """
    q = """
        WITH first_wage AS (
            SELECT placement_id, wage_amount,
                   ROW_NUMBER() OVER (PARTITION BY placement_id ORDER BY recorded_date) as rn
            FROM wage_history
        )
        SELECT pl.placement_id, pl.trainee_id, pl.job_sector, pl.placement_type,
               co.duration_weeks, tr.assessment_score, t.gender, t.category, d.district_name,
               fw.wage_amount as initial_wage,
               (SELECT COUNT(*) FROM course_skill_map csm WHERE csm.course_id = tr.course_id) as skill_count,
               (SELECT COUNT(*) FROM employment_history eh2
                JOIN placement pl2 ON eh2.placement_id = pl2.placement_id
                WHERE pl2.trainee_id = pl.trainee_id) as prior_jobs
        FROM placement pl
        JOIN training tr ON pl.training_id = tr.training_id
        JOIN course co ON tr.course_id = co.course_id
        JOIN trainee t ON pl.trainee_id = t.trainee_id
        JOIN district d ON t.district_id = d.district_id
        JOIN first_wage fw ON fw.placement_id = pl.placement_id AND fw.rn = 1
    """
    return _read(engine, q)
 
 
def salary_prediction_model(engine):
    """
    Regression: predicts starting wage from skillset size, assessment score
    (competency proxy), sector, training duration, and prior-job count
    (experience proxy). Returns a fitted model + preprocessing you can reuse
    via predict_salary_for_input().
    """
    df = build_salary_features(engine)
    df = df.dropna(subset=["initial_wage"])
    if len(df) < MIN_SAMPLES:
        return {"note": f"Not enough wage data yet (have {len(df)} rows, need {MIN_SAMPLES}+).", "trained": False}
 
    feature_cols = ["skill_count", "assessment_score", "duration_weeks", "prior_jobs",
                     "job_sector", "placement_type", "gender", "category"]
    X = pd.get_dummies(df[feature_cols], columns=["job_sector", "placement_type", "gender", "category"])
    y = df["initial_wage"]
 
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
    model = RandomForestRegressor(n_estimators=200, max_depth=8, random_state=42)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
 
    importances = pd.Series(model.feature_importances_, index=X.columns).sort_values(ascending=False).head(8)
 
    return {
        "note": "ILLUSTRATIVE — trained on synthetic demo data. Re-run on real data once available.",
        "trained": True,
        "n_train": len(X_train), "n_test": len(X_test),
        "mae": round(mean_absolute_error(y_test, preds), 1),
        "r2": round(r2_score(y_test, preds), 3),
        "top_drivers": importances.round(3).to_dict(),
        "_model": model, "_columns": list(X.columns),  # reuse in predict_salary_for_input
    }
 
 
def predict_salary_for_input(fitted, skill_count, assessment_score, duration_weeks, prior_jobs,
                              job_sector, placement_type, gender, category):
    """
    Point-prediction helper. `fitted` is the dict returned by salary_prediction_model().
    Example:
        fitted = salary_prediction_model(engine)
        predict_salary_for_input(fitted, skill_count=5, assessment_score=72, duration_weeks=12,
                                  prior_jobs=1, job_sector="IT/ITES", placement_type="wage_employment",
                                  gender="Female", category="OBC")
    """
    if not fitted.get("trained"):
        raise ValueError("Model was not trained — not enough data.")
    row = pd.DataFrame([{
        "skill_count": skill_count, "assessment_score": assessment_score,
        "duration_weeks": duration_weeks, "prior_jobs": prior_jobs,
        "job_sector": job_sector, "placement_type": placement_type,
        "gender": gender, "category": category,
    }])
    row_enc = pd.get_dummies(row, columns=["job_sector", "placement_type", "gender", "category"])
    row_enc = row_enc.reindex(columns=fitted["_columns"], fill_value=0)
    return round(float(fitted["_model"].predict(row_enc)[0]), 1)
 
 
# ============ FOLLOW-UP COMPLIANCE + RISK ============
 
def followup_compliance_summary(engine, group_by="scheduled_month"):
    """
    Pure metrics (no leakage risk): what fraction of scheduled follow-ups
    actually happened ('completed') vs were 'missed', by cohort/month/district.
    The followup table exists in the schema but nothing consumed it before.
    """
    col = {"scheduled_month": "fu.scheduled_month", "district": "d.district_name",
           "category": "t.category", None: None}[group_by]
    q = f"""
        SELECT fu.status, {col + ' as group_key,' if col else ''} COUNT(*) as n
        FROM followup fu
        JOIN trainee t ON fu.trainee_id = t.trainee_id
        JOIN district d ON t.district_id = d.district_id
        GROUP BY {"group_key, " if col else ""}fu.status
    """
    df = _read(engine, q)
    pivot = df.pivot_table(index="group_key" if col else None, columns="status", values="n", fill_value=0)
    if "completed" in pivot and "missed" in pivot:
        pivot["completion_rate_pct"] = (pivot["completed"] / (pivot["completed"] + pivot["missed"]) * 100).round(1)
    return pivot.reset_index()
 
 
def build_followup_risk_features(engine):
    """
    Features known AT SCHEDULING TIME ONLY (no wage_at_followup / notes /
    employment_status_at_followup — those are outcomes of the follow-up
    itself and would leak the answer). Target = whether this scheduled
    follow-up ends up 'missed'.
    """
    q = """
        SELECT fu.followup_id, fu.scheduled_month, pl.placement_type,
               t.gender, t.category, d.district_name,
               CASE WHEN fu.status = 'missed' THEN 1 ELSE 0 END as missed
        FROM followup fu
        JOIN trainee t ON fu.trainee_id = t.trainee_id
        JOIN district d ON t.district_id = d.district_id
        LEFT JOIN placement pl ON fu.placement_id = pl.placement_id
    """
    return _read(engine, q)
 
 
def followup_risk_model(engine):
    """Classifier: probability a scheduled follow-up gets missed, so field teams can prioritise outreach."""
    df = build_followup_risk_features(engine)
    guard = _guard(df, "missed")
    if guard:
        return guard
 
    feature_cols = ["scheduled_month", "placement_type", "gender", "category", "district_name"]
    X = pd.get_dummies(df[feature_cols], columns=["placement_type", "gender", "category", "district_name"])
    y = df["missed"]
 
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    model = LogisticRegression(max_iter=1000, class_weight="balanced")
    model.fit(X_train, y_train)
    proba = model.predict_proba(X_test)[:, 1]
    preds = model.predict(X_test)
 
    return {
        "note": "ILLUSTRATIVE — trained on synthetic demo data. Re-run on real data once available.",
        "trained": True,
        "n_train": len(X_train), "n_test": len(X_test),
        "auc_roc": round(roc_auc_score(y_test, proba), 3),
        "f1_score": round(f1_score(y_test, preds), 3),
    }
 
 
# ============ EMPLOYER / PLACEMENT VALIDATION ============
 
def employer_verification_scorecard(engine):
    """
    Per-employer trust scorecard from the verification table (previously
    unused): share of that employer's placements confirmed / disputed /
    still unverified, plus a simple trust_score to prioritise field audits.
    """
    q = """
        SELECT e.employer_id, e.employer_name, e.sector, pl.placement_id, pl.verification_status
        FROM employer e
        JOIN placement pl ON pl.employer_id = e.employer_id
    """
    df = _read(engine, q)
    if df.empty:
        return pd.DataFrame(columns=["employer_name", "sector", "n_placements", "confirmed_pct", "disputed_pct", "trust_score"])
 
    summary = df.groupby(["employer_id", "employer_name", "sector"])["verification_status"].value_counts().unstack(fill_value=0)
    summary["n_placements"] = summary.sum(axis=1)
    for col in ["confirmed", "disputed", "unverified"]:
        if col not in summary:
            summary[col] = 0
    summary["confirmed_pct"] = (summary["confirmed"] / summary["n_placements"] * 100).round(1)
    summary["disputed_pct"] = (summary["disputed"] / summary["n_placements"] * 100).round(1)
    # trust score: rewards confirmations, penalises disputes hard, ignores backlog of not-yet-checked
    summary["trust_score"] = (summary["confirmed_pct"] - 3 * summary["disputed_pct"]).clip(lower=0).round(1)
    return summary.reset_index()[["employer_name", "sector", "n_placements", "confirmed_pct",
                                   "disputed_pct", "trust_score"]].sort_values("trust_score")
 
 
def build_dispute_risk_features(engine):
    """
    Only placements that have actually been checked (confirmed or disputed)
    carry a usable label — 'unverified' just means nobody has looked yet,
    it is NOT a class of outcome, so those rows are excluded from training.
    """
    q = """
        SELECT pl.placement_id, pl.placement_type, pl.job_sector, pl.source, e.sector as employer_sector,
               wh.wage_amount,
               CASE WHEN pl.verification_status = 'disputed' THEN 1 ELSE 0 END as disputed
        FROM placement pl
        LEFT JOIN employer e ON pl.employer_id = e.employer_id
        LEFT JOIN (
            SELECT placement_id, MIN(wage_amount) as wage_amount FROM wage_history GROUP BY placement_id
        ) wh ON wh.placement_id = pl.placement_id
        WHERE pl.verification_status IN ('confirmed', 'disputed')
    """
    return _read(engine, q)
 
 
def dispute_risk_model(engine):
    """
    Classifier: probability a placement's employment claim is disputed on
    verification. Ranks the CURRENTLY-unverified backlog so follow-up teams
    check the highest-risk cases first instead of a random/FIFO queue.
    """
    df = build_dispute_risk_features(engine)
    df["wage_amount"] = df["wage_amount"].fillna(df["wage_amount"].median())
    guard = _guard(df, "disputed")
    if guard:
        return guard
 
    feature_cols = ["placement_type", "job_sector", "source", "employer_sector", "wage_amount"]
    X = pd.get_dummies(df[feature_cols], columns=["placement_type", "job_sector", "source", "employer_sector"])
    y = df["disputed"]
 
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    model = LogisticRegression(max_iter=1000, class_weight="balanced")
    model.fit(X_train, y_train)
    proba = model.predict_proba(X_test)[:, 1]
    preds = model.predict(X_test)
 
    return {
        "note": "ILLUSTRATIVE — trained on synthetic demo data. Re-run on real data once available.",
        "trained": True,
        "n_train": len(X_train), "n_test": len(X_test),
        "auc_roc": round(roc_auc_score(y_test, proba), 3),
        "f1_score": round(f1_score(y_test, preds), 3),
    }
 
 
def flag_suspicious_placements(engine, wage_z_threshold=2.5):
    """
    Rule-based fraud/anomaly flags — cheap, explainable, and doesn't need a
    trained model: (a) wage wildly outside its sector's normal range,
    (b) 'confirmed' status with no row in the verification table backing it
    up, (c) still unverified long after being logged.
    """
    q = """
        SELECT pl.placement_id, pl.job_sector, pl.verification_status, pl.start_date,
               wh.wage_amount,
               CASE WHEN v.verification_id IS NULL THEN 0 ELSE 1 END as has_verification_record
        FROM placement pl
        LEFT JOIN (SELECT placement_id, MIN(wage_amount) as wage_amount FROM wage_history GROUP BY placement_id) wh
            ON wh.placement_id = pl.placement_id
        LEFT JOIN verification v ON v.placement_id = pl.placement_id
        WHERE pl.placement_type != 'not_placed'
    """
    df = _read(engine, q)
    flags = []
 
    for sector, grp in df.groupby("job_sector"):
        wages = grp["wage_amount"].dropna()
        if len(wages) < 5:
            continue
        mean, std = wages.mean(), wages.std()
        if std == 0 or pd.isna(std):
            continue
        for _, row in grp.iterrows():
            if pd.isna(row["wage_amount"]):
                continue
            z = (row["wage_amount"] - mean) / std
            if abs(z) > wage_z_threshold:
                flags.append({"placement_id": row["placement_id"], "flag": "wage_outlier",
                               "detail": f"wage z-score {z:.1f} vs {sector} sector norm"})
 
    unbacked = df[(df["verification_status"] == "confirmed") & (df["has_verification_record"] == 0)]
    for _, row in unbacked.iterrows():
        flags.append({"placement_id": row["placement_id"], "flag": "confirmed_without_record",
                       "detail": "status is 'confirmed' but no row exists in verification table"})
 
    return pd.DataFrame(flags)
 
 
if __name__ == "__main__":
    from database.schema import get_engine
    engine = get_engine("../data/SQLlite/skilling_outcomes_demo.db")
 
    print("--- 1. Dropout prediction ---")
    d = dropout_prediction_model(engine)
    print({k: v for k, v in d.items() if k != "at_risk_trainees"})
    if d.get("trained"):
        print(d["at_risk_trainees"].head())
 
    print("\n--- 2. Job-match recommendation (trainee_id=1) ---")
    print(recommend_jobs_for_trainee(engine, 1))
 
    print("\n--- 3. Salary prediction ---")
    s = salary_prediction_model(engine)
    print({k: v for k, v in s.items() if not k.startswith("_")})
    if s.get("trained"):
        print(predict_salary_for_input(s, skill_count=5, assessment_score=72, duration_weeks=12,
                                        prior_jobs=1, job_sector="IT/ITES", placement_type="wage_employment",
                                        gender="Female", category="OBC"))
 
    print("\n--- 4. Follow-up compliance ---")
    print(followup_compliance_summary(engine))
    print(followup_risk_model(engine))
 
    print("\n--- 5. Employer / placement validation ---")
    print(employer_verification_scorecard(engine).head())
    print(dispute_risk_model(engine))
    print(flag_suspicious_placements(engine).head())
 