"""
ML layer — Section 6 of the blueprint.

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
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, f1_score
from schema import get_engine


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
    engine = get_engine("data/skilling_outcomes.db")

    print("--- Anomaly detection (cohort placement-rate outliers) ---")
    print(detect_cohort_anomalies(engine))

    print("\n--- Placement prediction (DEMO PIPELINE — see note) ---")
    print(placement_prediction_demo(engine))

    print("\n--- Attrition prediction (DEMO PIPELINE — see note) ---")
    print(attrition_prediction_demo(engine))
