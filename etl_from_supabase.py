"""
ETL — pulls real data from the Skilltrack Supabase project (your teammate's
trainee dashboard backend) and loads it into YOUR analytics database
(schema.py). This replaces generate_data.py once real data exists.

WHAT THIS NEEDS FROM YOU BEFORE RUNNING:
    export SUPABASE_URL="https://vymzncykkdqyhzlnoyoh.supabase.co"
    export SUPABASE_SERVICE_KEY="..."   <- the SERVICE ROLE key, NOT the
                                            publishable/anon key in supabase.js.
    Get it from: Supabase dashboard -> Project Settings -> API -> service_role.
    NEVER commit this key or put it in a frontend file — it bypasses all
    row-level security. Keep it only in your own environment/server.

WHAT THIS DOES:
    trainees            -> Trainee (+ District, looked up/created by name)
    training_records    -> Training (+ Course, Provider, looked up/created
                            by free-text name, since the frontend doesn't
                            use IDs for these yet)
    employment_records   -> Placement + EmploymentHistory + WageHistory
                            (one employment_records ROW becomes a NEW spell
                            each time, matching how the frontend now inserts
                            rather than updates)
    followups            -> Followup

WHAT THIS DELIBERATELY SKIPS (nothing to map yet):
    - job_skill_map / relevance scoring inputs (frontend captures no job-skill
      data yet — flagged separately, not an ETL problem)
    - course_skill_map (frontend has no skill tagging on courses yet; if you
      want relevance scoring to work on real data, you'll need to maintain a
      manual course_name -> skills mapping table yourself, separately)

Run:
    python etl_from_supabase.py
"""
import os
from datetime import datetime
from supabase import create_client
from sqlalchemy.orm import sessionmaker

from schema import (
    init_db, District, Provider, Course, Trainee, Training,
    Placement, EmploymentHistory, WageHistory, Followup,
)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError(
        "Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables first. "
        "See the module docstring for where to get the service_role key."
    )

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_or_create_district(session, name, cache):
    if not name:
        name = "Unknown"
    if name in cache:
        return cache[name]
    existing = session.query(District).filter_by(district_name=name).first()
    if existing:
        cache[name] = existing
        return existing
    d = District(district_name=name, state="Unknown")
    session.add(d)
    session.flush()
    cache[name] = d
    return d


def get_or_create_provider(session, name, district, cache):
    if not name:
        name = "Unknown Provider"
    key = (name, district.district_id)
    if key in cache:
        return cache[key]
    existing = session.query(Provider).filter_by(provider_name=name).first()
    if existing:
        cache[key] = existing
        return existing
    p = Provider(provider_name=name, district_id=district.district_id, provider_type="unknown")
    session.add(p)
    session.flush()
    cache[key] = p
    return p


def get_or_create_course(session, name, cache):
    if not name:
        name = "Unknown Course"
    if name in cache:
        return cache[name]
    existing = session.query(Course).filter_by(course_name=name).first()
    if existing:
        cache[name] = existing
        return existing
    c = Course(course_name=name, sector="Unclassified", duration_weeks=None)
    session.add(c)
    session.flush()
    cache[name] = c
    return c


def parse_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except (ValueError, AttributeError):
        return None


def sync_trainees(session, district_cache):
    """trainees table -> Trainee (+ District looked up by name)."""
    trainee_id_map = {}  # supabase auth id (uuid string) -> our integer trainee_id
    rows = sb.table("trainees").select("*").execute().data
    print(f"Fetched {len(rows)} rows from 'trainees'")

    for row in rows:
        district = get_or_create_district(session, row.get("district"), district_cache)
        existing = session.query(Trainee).filter_by(name_or_anon_id=row["id"]).first()
        if existing:
            trainee_id_map[row["id"]] = existing.trainee_id
            continue

        trainee = Trainee(
            name_or_anon_id=row["id"],  # store the Supabase auth UUID as the anon id
            dob_year=(datetime.now().year - row["age"]) if row.get("age") else None,
            gender=row.get("gender"),
            category=None,  # not captured on the frontend yet
            district_id=district.district_id,
            consent_flag=bool(row.get("consent_flag", False)),
            consent_ts=parse_date(row.get("consent_ts")),
        )
        session.add(trainee)
        session.flush()
        trainee_id_map[row["id"]] = trainee.trainee_id

    session.commit()
    print(f"Synced {len(trainee_id_map)} trainees")
    return trainee_id_map


def sync_training(session, trainee_id_map, course_cache, provider_cache, district_cache):
    """training_records table -> Training (+ Course, Provider by free-text name)."""
    rows = sb.table("training_records").select("*").execute().data
    print(f"Fetched {len(rows)} rows from 'training_records'")

    training_id_map = {}  # supabase training_records.id -> our Training.training_id
    default_district = get_or_create_district(session, "Unknown", district_cache)

    for row in rows:
        our_trainee_id = trainee_id_map.get(row["trainee_id"])
        if our_trainee_id is None:
            continue  # trainee not synced (shouldn't happen if trainees ran first)

        course = get_or_create_course(session, row.get("course_name"), course_cache)
        provider = get_or_create_provider(session, row.get("provider_name"), default_district, provider_cache)

        completion_status = "completed" if row.get("completion_date") else "in_progress"

        training = Training(
            trainee_id=our_trainee_id,
            course_id=course.course_id,
            provider_id=provider.provider_id,
            cohort_id=None,  # frontend has no cohort concept yet
            start_date=parse_date(row.get("start_date")),
            end_date=parse_date(row.get("completion_date")),
            completion_status=completion_status,
            assessment_score=row.get("assessment_score"),
            certification_id=row.get("certification_status"),
        )
        session.add(training)
        session.flush()
        training_id_map[row["id"]] = training.training_id

    session.commit()
    print(f"Synced {len(training_id_map)} training records")
    return training_id_map


def sync_employment(session, trainee_id_map, training_id_map):
    """
    employment_records table -> Placement + EmploymentHistory + WageHistory.

    The frontend inserts a NEW row per status update (append-only, confirmed
    fixed) but doesn't link rows to each other or set a previous row's
    leaving_date. We infer sequencing here: for each trainee, order their
    employment_records rows by created_at, and treat each one as a new
    "spell" that implicitly ends when the next one begins.
    """
    rows = sb.table("employment_records").select("*").order("trainee_id").order("created_at").execute().data
    print(f"Fetched {len(rows)} rows from 'employment_records'")

    from collections import defaultdict
    by_trainee = defaultdict(list)
    for row in rows:
        by_trainee[row["trainee_id"]].append(row)

    placements_created = 0

    for supa_trainee_id, records in by_trainee.items():
        our_trainee_id = trainee_id_map.get(supa_trainee_id)
        if our_trainee_id is None:
            continue

        # Find that trainee's most recent training record to link the placement to
        latest_training = (
            session.query(Training)
            .filter_by(trainee_id=our_trainee_id)
            .order_by(Training.start_date.desc())
            .first()
        )
        if latest_training is None:
            continue

        for i, record in enumerate(records):
            status = record.get("employment_status", "Unemployed")

            if status == "Unemployed":
                placement_type = "not_placed"
            elif status == "Business":
                placement_type = "self_employment"
            elif status == "Apprenticeship":
                placement_type = "apprenticeship"
            else:
                placement_type = "wage_employment"

            placement = Placement(
                trainee_id=our_trainee_id,
                training_id=latest_training.training_id,
                placement_type=placement_type,
                employer_id=None,  # frontend captures company as free text, not linked
                job_title=record.get("job_role"),
                job_sector=None,
                start_date=parse_date(record.get("joining_date")),
                source="dashboard",
                verification_status="unverified",
                non_placement_reason_text=record.get("reason_text") if status == "Unemployed" else None,
            )
            session.add(placement)
            session.flush()
            placements_created += 1

            if placement_type == "not_placed":
                continue  # no employment/wage history for a non-placement row

            # This spell's end = when the NEXT record for this trainee started
            # (None if this is their latest/current record)
            period_end = None
            spell_status = "active"
            exit_reason_code = None
            exit_reason_text = None
            if i + 1 < len(records):
                next_record = records[i + 1]
                period_end = parse_date(next_record.get("created_at", "")) or parse_date(next_record.get("joining_date"))
                spell_status = "ended"
                if next_record.get("employment_status") == "Unemployed":
                    exit_reason_text = next_record.get("reason_text")

            emp_history = EmploymentHistory(
                placement_id=placement.placement_id,
                status=spell_status,
                period_start=parse_date(record.get("joining_date")),
                period_end=period_end,
                employer_id=None,
                job_title=record.get("job_role"),
                exit_reason_code=exit_reason_code,
                exit_reason_text=exit_reason_text,
            )
            session.add(emp_history)
            session.flush()

            if record.get("salary"):
                session.add(WageHistory(
                    placement_id=placement.placement_id,
                    employment_history_id=emp_history.history_id,
                    recorded_date=parse_date(record.get("joining_date")) or parse_date(record.get("created_at")),
                    wage_amount=record["salary"],
                    wage_unit="monthly",
                    source="dashboard",
                ))

    session.commit()
    print(f"Synced {placements_created} placement/employment records")


def sync_followups(session, trainee_id_map):
    """followups table -> Followup."""
    rows = sb.table("followups").select("*").execute().data
    print(f"Fetched {len(rows)} rows from 'followups'")

    synced = 0
    for row in rows:
        our_trainee_id = trainee_id_map.get(row["trainee_id"])
        if our_trainee_id is None:
            continue

        followup_type = row.get("followup_type", "")
        month = 3 if "3" in followup_type else 6 if "6" in followup_type else 12 if "12" in followup_type else None

        session.add(Followup(
            trainee_id=our_trainee_id,
            placement_id=None,  # not explicitly linked on the frontend's followups table
            followup_date=parse_date(row.get("scheduled_date")),
            scheduled_month=month,
            status="completed" if row.get("completed") else "pending",
            employment_status_at_followup=None,
            wage_at_followup=None,
            notes=None,
        ))
        synced += 1

    session.commit()
    print(f"Synced {synced} follow-ups")


def main():
    engine = init_db("data/skilling_outcomes.db")
    Session = sessionmaker(bind=engine)
    session = Session()

    district_cache, provider_cache, course_cache = {}, {}, {}

    trainee_id_map = sync_trainees(session, district_cache)
    training_id_map = sync_training(session, trainee_id_map, course_cache, provider_cache, district_cache)
    sync_employment(session, trainee_id_map, training_id_map)
    sync_followups(session, trainee_id_map)

    print("\nETL complete. Run metrics.py or streamlit run app.py to see it reflected.")


if __name__ == "__main__":
    main()
