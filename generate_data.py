"""
Synthetic data generator — Section 7 of the blueprint.

Builds a realistic (not random-nonsense) dataset:
- sector-correlated placement rates (IT/ITES high, hospitality/construction lower)
- one deliberately weak provider
- wage histories with realistic growth, occasional stagnation/drops
- attrition loosely correlated with low relevance score / low wage growth
- realistic non-placement / attrition reason distribution
- missed follow-ups (real-world data always has gaps)

Run: python generate_data.py
"""
import random
from datetime import date, timedelta
from faker import Faker
from sqlalchemy.orm import sessionmaker

from schema import (
    init_db, District, Provider, Skill, Course, CourseSkillMap, Cohort,
    Trainee, Training, Employer, Placement, JobSkillMap, EmploymentHistory,
    WageHistory, Followup, Verification, Reason,
)

fake = Faker("en_IN")
random.seed(42)
Faker.seed(42)

# ---------------------------------------------------------------- reference data

DISTRICTS = [
    ("Gautam Buddh Nagar", "Uttar Pradesh"),
    ("Ghaziabad", "Uttar Pradesh"),
    ("Gurugram", "Haryana"),
    ("Faridabad", "Haryana"),
    ("Jaipur", "Rajasthan"),
]

SECTORS = {
    "IT/ITES": {
        "courses": ["Data Entry & Basic IT", "Customer Support & CRM", "Web Development Basics"],
        "skills": ["MS Excel", "Data Entry", "Basic SQL", "Communication", "CRM Tools", "HTML/CSS", "Troubleshooting"],
        "base_placement_rate": 0.78,
        "wage_range": (13000, 19000),
        "relevance_bias": 0.75,
    },
    "Healthcare Support": {
        "courses": ["General Duty Assistant", "Home Health Aide"],
        "skills": ["Patient Care", "First Aid", "Vitals Monitoring", "Communication", "Hygiene Protocols"],
        "base_placement_rate": 0.65,
        "wage_range": (11000, 16000),
        "relevance_bias": 0.65,
    },
    "Retail": {
        "courses": ["Retail Sales Associate", "Inventory & POS Operations"],
        "skills": ["POS Systems", "Customer Service", "Inventory Management", "Communication"],
        "base_placement_rate": 0.60,
        "wage_range": (10000, 14000),
        "relevance_bias": 0.55,
    },
    "Construction": {
        "courses": ["Mason Training", "Electrician Assistant"],
        "skills": ["Masonry", "Wiring Basics", "Safety Protocols", "Tool Handling"],
        "base_placement_rate": 0.55,
        "wage_range": (9000, 15000),
        "relevance_bias": 0.60,
    },
    "Hospitality": {
        "courses": ["Housekeeping Operations", "F&B Service"],
        "skills": ["Housekeeping", "Guest Service", "Food Safety", "Communication"],
        "base_placement_rate": 0.50,
        "wage_range": (9000, 13000),
        "relevance_bias": 0.50,
    },
}

NON_PLACEMENT_REASONS = [
    ("low_wage", "Wage offered too low", 0.28),
    ("location_mismatch", "Job location too far / relocation not feasible", 0.22),
    ("family_reasons", "Family responsibilities / not permitted to work", 0.15),
    ("further_study", "Pursuing further education", 0.10),
    ("skill_mismatch", "Felt underprepared / skill mismatch", 0.13),
    ("no_jobs_available", "No suitable openings in area", 0.08),
    ("health", "Health-related reasons", 0.04),
]

ATTRITION_REASONS = [
    ("low_wage", "Left due to low wage relative to workload", 0.30),
    ("location_mismatch", "Commute / relocation issues", 0.18),
    ("skill_mismatch", "Job did not match trained skillset", 0.16),
    ("family_reasons", "Family circumstances changed", 0.12),
    ("better_opportunity", "Moved to a better opportunity", 0.14),
    ("workplace_issues", "Workplace conditions / employer issues", 0.06),
    ("health", "Health-related reasons", 0.04),
]

N_TRAINEES = 1500
N_COHORTS_PER_COURSE = 2
WEAK_PROVIDER_PENALTY = 0.30  # placement-rate penalty for the deliberately weak provider


def weighted_choice(options):
    items, weights = zip(*[(o[:-1], o[-1]) for o in options])
    return random.choices(items, weights=weights, k=1)[0]


def build_reference_data(session):
    districts = []
    for name, state in DISTRICTS:
        d = District(district_name=name, state=state)
        session.add(d)
        districts.append(d)
    session.flush()

    skills_by_name = {}
    for sector, info in SECTORS.items():
        for sname in info["skills"]:
            if sname not in skills_by_name:
                s = Skill(skill_name=sname, skill_category=sector)
                session.add(s)
                skills_by_name[sname] = s
    session.flush()

    courses = []
    for sector, info in SECTORS.items():
        for cname in info["courses"]:
            c = Course(course_name=cname, sector=sector, duration_weeks=random.choice([8, 12, 16]))
            session.add(c)
            session.flush()
            for sname in info["skills"]:
                session.add(CourseSkillMap(course_id=c.course_id, skill_id=skills_by_name[sname].skill_id))
            courses.append((c, sector))
    session.flush()

    providers = []
    for i, d in enumerate(districts * 2):  # ~10 providers
        p = Provider(
            provider_name=f"{d.district_name} Skill Centre {i+1}",
            district_id=d.district_id,
            provider_type=random.choice(["govt", "private", "ngo"]),
        )
        session.add(p)
        providers.append(p)
    session.flush()
    weak_provider = providers[0]  # deliberately weak performer

    employers = []
    for sector in SECTORS:
        for _ in range(6):
            e = Employer(
                employer_name=fake.company(),
                sector=sector,
                district_id=random.choice(districts).district_id,
            )
            session.add(e)
            employers.append(e)
    session.flush()

    return districts, skills_by_name, courses, providers, weak_provider, employers


def build_cohorts(session, courses, providers):
    cohorts = []
    base = date(2024, 1, 1)
    for course, sector in courses:
        for i in range(N_COHORTS_PER_COURSE):
            provider = random.choice(providers)
            start = base + timedelta(days=random.randint(0, 540))
            end = start + timedelta(weeks=SECTORS[sector]["courses"] and 12)
            coh = Cohort(course_id=course.course_id, provider_id=provider.provider_id,
                         batch_start=start, batch_end=end)
            session.add(coh)
            session.flush()
            cohorts.append((coh, course, sector, provider))
    return cohorts


def generate_trainees_and_outcomes(session, cohorts, districts, skills_by_name, weak_provider, employers):
    trainee_id_counter = 1
    per_cohort = max(1, N_TRAINEES // len(cohorts))

    for coh, course, sector, provider in cohorts:
        info = SECTORS[sector]
        base_rate = info["base_placement_rate"]
        if provider.provider_id == weak_provider.provider_id:
            base_rate = max(0.15, base_rate - WEAK_PROVIDER_PENALTY)

        for _ in range(per_cohort):
            district = random.choice(districts)
            trainee = Trainee(
                name_or_anon_id=f"TR-{trainee_id_counter:05d}",
                dob_year=random.randint(1990, 2007),
                gender=random.choice(["Female", "Male", "Other"]),
                category=random.choice(["General", "OBC", "SC", "ST"]),
                district_id=district.district_id,
                consent_flag=True,
                consent_ts=coh.batch_start,
            )
            session.add(trainee)
            session.flush()
            trainee_id_counter += 1

            completion_status = "completed" if random.random() > 0.08 else "dropped_out"
            training = Training(
                trainee_id=trainee.trainee_id,
                course_id=course.course_id,
                provider_id=provider.provider_id,
                cohort_id=coh.cohort_id,
                start_date=coh.batch_start,
                end_date=coh.batch_end,
                completion_status=completion_status,
                assessment_score=round(random.uniform(45, 98), 1),
                certification_id=f"CERT-{trainee.trainee_id}" if completion_status == "completed" else None,
            )
            session.add(training)
            session.flush()

            if completion_status != "completed":
                continue

            placed = random.random() < base_rate
            if not placed:
                code, label = weighted_choice(NON_PLACEMENT_REASONS)
                placement = Placement(
                    trainee_id=trainee.trainee_id,
                    training_id=training.training_id,
                    placement_type="not_placed",
                    job_title=None,
                    job_sector=None,
                    start_date=None,
                    source="dashboard",
                    verification_status="unverified",
                    non_placement_reason_text=label,
                )
                session.add(placement)
                session.flush()
                session.add(Reason(category="non_placement", reason_code=code, reason_label=label,
                                    raw_text=label, linked_placement_id=placement.placement_id))
                continue

            placement_type = random.choices(
                ["wage_employment", "self_employment", "apprenticeship"],
                weights=[0.65, 0.25, 0.10], k=1
            )[0]
            employer = random.choice([e for e in employers if e.sector == sector]) if placement_type != "self_employment" else None
            time_to_placement_days = random.randint(5, 75)
            start_date = coh.batch_end + timedelta(days=time_to_placement_days)

            relevance = min(1.0, max(0.1, random.gauss(info["relevance_bias"], 0.15)))
            job_title = f"{sector} Associate" if relevance > 0.6 else f"{sector} Helper (low-relevance role)"

            placement = Placement(
                trainee_id=trainee.trainee_id,
                training_id=training.training_id,
                placement_type=placement_type,
                employer_id=employer.employer_id if employer else None,
                job_title=job_title,
                job_sector=sector,
                start_date=start_date,
                source="dashboard",
                verification_status=random.choices(["confirmed", "unverified", "disputed"], weights=[0.5, 0.45, 0.05])[0],
            )
            session.add(placement)
            session.flush()

            # job skill map: subset of course skills scaled by relevance,
            # plus a chance of an "emerging" skill the curriculum doesn't teach
            # (this is what powers the skill-gap analysis)
            n_job_skills = max(1, int(len(info["skills"]) * relevance))
            for sname in random.sample(info["skills"], min(n_job_skills, len(info["skills"]))):
                session.add(JobSkillMap(placement_id=placement.placement_id, skill_id=skills_by_name[sname].skill_id))
            if random.random() < 0.35:
                emerging_name = f"{sector} - Digital Tools (emerging)"
                if emerging_name not in skills_by_name:
                    emerging_skill = Skill(skill_name=emerging_name, skill_category=sector)
                    session.add(emerging_skill)
                    session.flush()
                    skills_by_name[emerging_name] = emerging_skill
                session.add(JobSkillMap(placement_id=placement.placement_id, skill_id=skills_by_name[emerging_name].skill_id))

            # employment history + wage history (append-only)
            wmin, wmax = info["wage_range"]
            initial_wage = round(random.uniform(wmin, wmax), -2)
            emp_hist = EmploymentHistory(
                placement_id=placement.placement_id,
                status="active",
                period_start=start_date,
                period_end=None,
                employer_id=employer.employer_id if employer else None,
                job_title=job_title,
            )
            session.add(emp_hist)
            session.flush()
            session.add(WageHistory(placement_id=placement.placement_id, employment_history_id=emp_hist.history_id,
                                     recorded_date=start_date, wage_amount=initial_wage, wage_unit="monthly",
                                     source="dashboard"))

            # attrition probability inversely related to relevance & wage growth potential
            attrition_prob = max(0.05, 0.45 - 0.35 * relevance)
            months_survived = None
            wage = initial_wage
            cur_date = start_date
            attrited = False

            for month_mark in [3, 6, 12]:
                followup_date = start_date + timedelta(days=month_mark * 30)
                missed = random.random() < 0.15  # realistic follow-up drop-off
                if missed:
                    session.add(Followup(trainee_id=trainee.trainee_id, placement_id=placement.placement_id,
                                          followup_date=followup_date, scheduled_month=month_mark,
                                          status="missed", employment_status_at_followup=None, wage_at_followup=None))
                    continue

                if not attrited and random.random() < attrition_prob / 3:
                    attrited = True
                    code, label = weighted_choice(ATTRITION_REASONS)
                    emp_hist.status = "ended"
                    emp_hist.period_end = followup_date
                    emp_hist.exit_reason_code = code
                    emp_hist.exit_reason_text = label
                    session.add(Reason(category="attrition", reason_code=code, reason_label=label, raw_text=label,
                                        linked_placement_id=placement.placement_id, linked_history_id=emp_hist.history_id))
                    session.add(Followup(trainee_id=trainee.trainee_id, placement_id=placement.placement_id,
                                          followup_date=followup_date, scheduled_month=month_mark,
                                          status="completed", employment_status_at_followup="unemployed",
                                          wage_at_followup=None, notes=label))
                    continue

                if attrited:
                    session.add(Followup(trainee_id=trainee.trainee_id, placement_id=placement.placement_id,
                                          followup_date=followup_date, scheduled_month=month_mark,
                                          status="completed", employment_status_at_followup="unemployed",
                                          wage_at_followup=None))
                    continue

                growth = random.gauss(0.04 * (0.5 + relevance), 0.03)
                wage = round(wage * (1 + growth), -2)
                session.add(WageHistory(placement_id=placement.placement_id, employment_history_id=emp_hist.history_id,
                                         recorded_date=followup_date, wage_amount=wage, wage_unit="monthly",
                                         source="follow_up"))
                session.add(Followup(trainee_id=trainee.trainee_id, placement_id=placement.placement_id,
                                      followup_date=followup_date, scheduled_month=month_mark,
                                      status="completed", employment_status_at_followup="employed",
                                      wage_at_followup=wage))

                if random.random() < 0.5:
                    session.add(Verification(placement_id=placement.placement_id, method="employer_call",
                                              verified_by="follow_up_team", verified_on=followup_date,
                                              result="confirmed"))

    session.commit()


def main():
    engine = init_db("data/skilling_outcomes.db")
    Session = sessionmaker(bind=engine)
    session = Session()

    districts, skills_by_name, courses, providers, weak_provider, employers = build_reference_data(session)
    session.commit()
    cohorts = build_cohorts(session, courses, providers)
    session.commit()
    generate_trainees_and_outcomes(session, cohorts, districts, skills_by_name, weak_provider, employers)

    print("Synthetic dataset generated at data/skilling_outcomes.db")
    print(f"  Districts: {len(districts)}, Providers: {len(providers)}, Courses: {len(courses)}, Cohorts: {len(cohorts)}")
    print(f"  Weak provider (deliberately lower placement rate): {weak_provider.provider_name}")


if __name__ == "__main__":
    main()
