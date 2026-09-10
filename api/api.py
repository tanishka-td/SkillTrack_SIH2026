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
from sqlalchemy import text

from database.schema import get_engine
import analytics.metrics as m
import analytics.nlp_analysis as nlp
import analytics.ml_models as ml


app = FastAPI(
    title="Skilling Outcomes Analytics API",
    version="1.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


# =========================================================
# DATABASE
# =========================================================

engine = get_engine("data/skilling_outcomes_demo.db")

API_KEY = os.environ.get(
    "ANALYTICS_API_KEY"
)


# =========================================================
# AUTH
# =========================================================

def check_auth(
    x_api_key: Optional[str] = Header(default=None)
):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing X-API-Key header"
        )


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "ok"
    }


# =========================================================
# BASIC METRICS
# =========================================================

@app.get("/api/metrics/placement-rate")
def get_placement_rate(
    group_by: Optional[str] = None,
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    df = m.placement_rate(
        engine,
        group_by
    )

    return df.to_dict(
        orient="records"
    )


@app.get("/api/metrics/retention")
def get_retention(
    month: int = 6,
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    return {
        "retention": m.retention_rate(
            engine,
            month
        ),
        "attrition": m.attrition_rate(
            engine,
            month
        )
    }


@app.get("/api/metrics/wage-growth")
def get_wage_growth(
    group_by: str = "course",
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    result = m.wage_growth(
        engine,
        group_by
    )

    return (
        result.to_dict(orient="records")
        if hasattr(result, "to_dict")
        else {
            "overall_pct": result
        }
    )


@app.get("/api/metrics/relevance")
def get_relevance(
    group_by: str = "course",
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    return m.training_job_relevance(
        engine,
        group_by
    ).to_dict(
        orient="records"
    )


@app.get("/api/metrics/composite-score")
def get_composite_score(
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    return m.course_provider_composite_score(
        engine
    ).to_dict(
        orient="records"
    )


@app.get("/api/metrics/skill-gap")
def get_skill_gap(
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    return m.skill_gap(
        engine
    ).to_dict(
        orient="records"
    )


@app.get("/api/metrics/impact-index")
def get_impact_index(
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    return {
        "overall_impact_index": m.overall_impact_index(
            engine
        )
    }


# =========================================================
# REASONS
# =========================================================

@app.get("/api/reasons/non-placement")
def get_non_placement_reasons(
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    return m.non_placement_reasons(
        engine
    ).to_dict(
        orient="records"
    )


@app.get("/api/reasons/attrition")
def get_attrition_reasons(
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    return m.attrition_reasons(
        engine
    ).to_dict(
        orient="records"
    )


# =========================================================
# AI INSIGHTS
# =========================================================

@app.get("/api/insights")
def get_insights(
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    return {
        "insights": nlp.generate_all_insights(
            engine
        )
    }


# =========================================================
# MACHINE LEARNING
# =========================================================

@app.get("/api/ml/anomalies")
def get_anomalies(
    z_threshold: float = 1.0,
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    return ml.detect_cohort_anomalies(
        engine,
        z_threshold
    ).to_dict(
        orient="records"
    )


@app.get("/api/ml/placement-prediction-demo")
def get_placement_prediction(
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    return ml.placement_prediction_demo(
        engine
    )


@app.get("/api/ml/attrition-prediction-demo")
def get_attrition_prediction(
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    return ml.attrition_prediction_demo(
        engine
    )


# =========================================================
# EXTENDED ML / VALIDATION ENDPOINTS
# =========================================================

@app.get("/api/ml/dropout-risk")
def get_dropout_risk(
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    result = ml.dropout_prediction_model(
        engine
    )

    if (
        result.get("trained")
        and hasattr(
            result.get("at_risk_trainees"),
            "to_dict"
        )
    ):
        result["at_risk_trainees"] = (
            result["at_risk_trainees"]
            .to_dict(orient="records")
        )

    # Never send internal model objects
    result.pop(
        "_model",
        None
    )

    result.pop(
        "_columns",
        None
    )

    return result


@app.get("/api/ml/salary-model-summary")
def get_salary_model_summary(
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    result = ml.salary_prediction_model(
        engine
    )

    # Remove Python model objects
    result.pop(
        "_model",
        None
    )

    result.pop(
        "_columns",
        None
    )

    return result


@app.get("/api/followups/compliance")
def get_followup_compliance(
    group_by: str = "scheduled_month",
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    result = ml.followup_compliance_summary(
        engine,
        group_by
    )

    return result.to_dict(
        orient="records"
    )


@app.get("/api/followups/risk")
def get_followup_risk(
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    return ml.followup_risk_model(
        engine
    )


@app.get("/api/validation/employer-scorecard")
def get_employer_scorecard(
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    result = ml.employer_verification_scorecard(
        engine
    )

    return result.to_dict(
        orient="records"
    )


@app.get("/api/validation/dispute-risk")
def get_dispute_risk(
    x_api_key: Optional[str] = Header(default=None)
):
    check_auth(x_api_key)

    return ml.dispute_risk_model(
        engine
    )


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

    return result.to_dict(
        orient="records"
    )


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

    return result.to_dict(
        orient="records"
    )


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

    fitted = ml.salary_prediction_model(
        engine
    )

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


# =========================================================
# LOCAL DEMO PROGRAMME DATA
# =========================================================
#
# This endpoint reads directly from:
#
# data/skilling_outcomes_demo.db
#
# It does NOT use Supabase.
#
# The response is shaped to match the fields expected by
# govt_dashboard.js.
# =========================================================

@app.get("/api/demo/programme-data")
def get_demo_programme_data():

    with engine.connect() as conn:

        # =================================================
        # TRAINEE PROFILES
        # =================================================

        profiles = conn.execute(
            text("""
                SELECT
                    t.trainee_id AS id,
                    t.trainee_id AS user_id,
                    t.name_or_anon_id AS full_name,
                    t.gender,
                    t.category,
                    d.state,
                    d.district_name AS district,
                    NULL AS email
                FROM trainee t
                LEFT JOIN district d
                    ON t.district_id = d.district_id
            """)
        ).mappings().all()


        # =================================================
        # TRAINING RECORDS
        # =================================================

        training = conn.execute(
            text("""
                SELECT
                    tr.training_id AS id,
                    tr.trainee_id,

                    c.course_name,

                    p.provider_name,

                    tr.start_date,

                    tr.end_date AS completion_date,

                    NULL AS attendance,

                    tr.assessment_score,

                    CASE
                        WHEN tr.certification_id IS NOT NULL
                        THEN 'verified'
                        ELSE 'pending'
                    END AS certification_status,

                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM placement pl
                            WHERE pl.training_id = tr.training_id
                            AND (
                                pl.verification_status = 'confirmed'
                                OR EXISTS (
                                    SELECT 1
                                    FROM verification v
                                    WHERE v.placement_id = pl.placement_id
                                    AND LOWER(v.result) = 'confirmed'
                                )
                            )
                        )
                        THEN 1
                        ELSE 0
                    END AS is_verified,

                    CASE
                        WHEN tr.start_date IS NOT NULL
                        AND tr.end_date IS NOT NULL
                        THEN ROUND(
                            (
                                julianday(tr.end_date)
                                - julianday(tr.start_date)
                            ) / 30.0,
                            1
                        )
                        ELSE NULL
                    END AS duration_months,

                    (
                        SELECT GROUP_CONCAT(
                            s.skill_name,
                            ', '
                        )
                        FROM course_skill_map csm
                        JOIN skill s
                            ON s.skill_id = csm.skill_id
                        WHERE csm.course_id = tr.course_id
                    ) AS skills,

                    tr.start_date AS created_at,
                    tr.end_date AS updated_at

                FROM training tr

                LEFT JOIN course c
                    ON tr.course_id = c.course_id

                LEFT JOIN provider p
                    ON tr.provider_id = p.provider_id
            """)
        ).mappings().all()


        # =================================================
        # EMPLOYMENT / PLACEMENT RECORDS
        # =================================================

        employment = conn.execute(
            text("""
                SELECT
                    pl.placement_id AS id,

                    pl.trainee_id,

                    CASE
                        WHEN pl.placement_type = 'wage_employment'
                        THEN 'Employed'

                        WHEN pl.placement_type = 'self_employment'
                        THEN 'Business'

                        WHEN pl.placement_type = 'apprenticeship'
                        THEN 'Apprenticeship'

                        ELSE 'Unemployed'
                    END AS status,

                    CASE
                        WHEN pl.placement_type = 'self_employment'
                        THEN 'Self-employed'

                        WHEN e.employer_name IS NOT NULL
                        THEN e.employer_name

                        ELSE NULL
                    END AS company_name,

                    pl.job_title AS job_role,

                    (
                        SELECT wh.wage_amount
                        FROM wage_history wh
                        WHERE wh.placement_id = pl.placement_id
                        ORDER BY wh.recorded_date DESC
                        LIMIT 1
                    ) AS monthly_salary,

                    pl.start_date AS joining_date,

                    pl.placement_type AS employment_type,

                    pl.non_placement_reason_text AS unemployed_reason,

                    pl.start_date AS recorded_at,

                    pl.start_date AS created_at

                FROM placement pl

                LEFT JOIN employer e
                    ON pl.employer_id = e.employer_id

                ORDER BY
                    pl.start_date DESC
            """)
        ).mappings().all()


    # =====================================================
    # CONVERT SQL ROWS TO NORMAL PYTHON DICTS
    # =====================================================

    profile_records = [
        dict(row)
        for row in profiles
    ]


    training_records = []

    for row in training:

        item = dict(row)

        # SQLite returns 0/1.
        # Frontend expects true/false.
        item["is_verified"] = bool(
            item.get("is_verified")
        )

        training_records.append(
            item
        )


    employment_records = [
        dict(row)
        for row in employment
    ]


    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "profiles": profile_records,
        "training": training_records,
        "employment": employment_records,

        # Useful for debugging / confirming data source
        "source": "local-demo-database",
    }