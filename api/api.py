"""
Results API
Auth: a single header-based API key check is included as a minimum viable
guard (SIH-prototype level). Swap for real auth (JWT/OAuth) before any
real deployment with real trainee data.
"""
import os
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from database.schema import get_engine
import analytics.metrics as m
import analytics.nlp_analysis as nlp
import analytics.ml_models as ml

app = FastAPI(title="Skilling Outcomes Analytics API", version="1.0")

# CORS: allow your teammate's frontend origin to call this API from the browser.
# Tighten allow_origins to the real frontend URL before deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

engine = get_engine("data/skilling_outcomes_demo.db")
API_KEY = os.environ.get("ANALYTICS_API_KEY")  # set this in deployment; None = auth disabled (dev only)


def check_auth(x_api_key: Optional[str] = Header(default=None)):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key header")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/metrics/placement-rate")
def get_placement_rate(group_by: Optional[str] = None, x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)
    df = m.placement_rate(engine, group_by)
    return df.to_dict(orient="records")


@app.get("/api/metrics/retention")
def get_retention(month: int = 6, x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)
    return {"retention": m.retention_rate(engine, month), "attrition": m.attrition_rate(engine, month)}


@app.get("/api/metrics/wage-growth")
def get_wage_growth(group_by: str = "course", x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)
    result = m.wage_growth(engine, group_by)
    return result.to_dict(orient="records") if hasattr(result, "to_dict") else {"overall_pct": result}


@app.get("/api/metrics/relevance")
def get_relevance(group_by: str = "course", x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)
    return m.training_job_relevance(engine, group_by).to_dict(orient="records")


@app.get("/api/metrics/composite-score")
def get_composite_score(x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)
    return m.course_provider_composite_score(engine).to_dict(orient="records")


@app.get("/api/metrics/skill-gap")
def get_skill_gap(x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)
    return m.skill_gap(engine).to_dict(orient="records")


@app.get("/api/metrics/impact-index")
def get_impact_index(x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)
    return {"overall_impact_index": m.overall_impact_index(engine)}


@app.get("/api/reasons/non-placement")
def get_non_placement_reasons(x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)
    return m.non_placement_reasons(engine).to_dict(orient="records")


@app.get("/api/reasons/attrition")
def get_attrition_reasons(x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)
    return m.attrition_reasons(engine).to_dict(orient="records")


@app.get("/api/insights")
def get_insights(x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)
    return {"insights": nlp.generate_all_insights(engine)}


@app.get("/api/ml/anomalies")
def get_anomalies(z_threshold: float = 1.0, x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)
    return ml.detect_cohort_anomalies(engine, z_threshold).to_dict(orient="records")


@app.get("/api/ml/placement-prediction-demo")
def get_placement_prediction(x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)
    return ml.placement_prediction_demo(engine)


@app.get("/api/ml/attrition-prediction-demo")
def get_attrition_prediction(x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)
    return ml.attrition_prediction_demo(engine)

# =========================================================
# EXTENDED ML / VALIDATION ENDPOINTS
# =========================================================

@app.get("/api/ml/dropout-risk")
def get_dropout_risk(x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)

    result = ml.dropout_prediction_model(engine)

    if result.get("trained") and hasattr(result.get("at_risk_trainees"), "to_dict"):
        result["at_risk_trainees"] = result["at_risk_trainees"].to_dict(orient="records")

    # Never send internal model objects to the frontend
    result.pop("_model", None)
    result.pop("_columns", None)

    return result


@app.get("/api/ml/salary-model-summary")
def get_salary_model_summary(x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)

    result = ml.salary_prediction_model(engine)

    # Remove Python model objects before JSON serialization
    result.pop("_model", None)
    result.pop("_columns", None)

    return result


@app.get("/api/followups/compliance")
def get_followup_compliance(
    group_by: str = "scheduled_month",
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    result = ml.followup_compliance_summary(engine, group_by)

    return result.to_dict(orient="records")


@app.get("/api/followups/risk")
def get_followup_risk(x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)

    return ml.followup_risk_model(engine)


@app.get("/api/validation/employer-scorecard")
def get_employer_scorecard(x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)

    result = ml.employer_verification_scorecard(engine)

    return result.to_dict(orient="records")


@app.get("/api/validation/dispute-risk")
def get_dispute_risk(x_api_key: Optional[str] = Header(default=None)):
    check_auth(x_api_key)

    return ml.dispute_risk_model(engine)


@app.get("/api/validation/suspicious-placements")
def get_suspicious_placements(
    wage_z_threshold: float = 2.5,
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    result = ml.flag_suspicious_placements(
        engine,
        wage_z_threshold
    )

    return result.to_dict(orient="records")


# =========================================================
# JOB MATCHING
# =========================================================

@app.get("/api/ml/job-match/{trainee_id}")
def get_job_match(
    trainee_id: int,
    top_n: int = 5,
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    result = ml.recommend_jobs_for_trainee(
        engine,
        trainee_id,
        top_n
    )

    return result.to_dict(orient="records")


# =========================================================
# SALARY PREDICTION
# =========================================================

@app.get("/api/ml/salary-predict")
def get_salary_prediction(
    skill_count: int,
    assessment_score: float,
    duration_weeks: int,
    prior_jobs: int,
    job_sector: str,
    placement_type: str,
    gender: str,
    category: str,
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    fitted = ml.salary_prediction_model(engine)

    if not fitted.get("trained"):
        return fitted

    predicted = ml.predict_salary_for_input(
        fitted,
        skill_count=skill_count,
        assessment_score=assessment_score,
        duration_weeks=duration_weeks,
        prior_jobs=prior_jobs,
        job_sector=job_sector,
        placement_type=placement_type,
        gender=gender,
        category=category,
    )

    return {
        "predicted_starting_wage": predicted,
        "note": fitted.get("note"),
    }


