"""
Analytical database schema for the Skilling Outcomes & Impact Measurement system.
Implements the entities from Section 3 of the blueprint.

Key design principle: employment_history and wage_history are APPEND-ONLY —
new rows for new states/observations, never overwritten. This is what makes
retention, attrition and wage-progression analysis possible.
"""
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Date, Boolean,
    ForeignKey, Text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class District(Base):
    __tablename__ = "district"
    district_id = Column(Integer, primary_key=True)
    district_name = Column(String, nullable=False)
    state = Column(String, nullable=False)


class Provider(Base):
    __tablename__ = "provider"
    provider_id = Column(Integer, primary_key=True)
    provider_name = Column(String, nullable=False)
    district_id = Column(Integer, ForeignKey("district.district_id"))
    provider_type = Column(String)  # govt / private / ngo


class Skill(Base):
    __tablename__ = "skill"
    skill_id = Column(Integer, primary_key=True)
    skill_name = Column(String, nullable=False, unique=True)
    skill_category = Column(String)


class Course(Base):
    __tablename__ = "course"
    course_id = Column(Integer, primary_key=True)
    course_name = Column(String, nullable=False)
    sector = Column(String)
    duration_weeks = Column(Integer)


class CourseSkillMap(Base):
    __tablename__ = "course_skill_map"
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("course.course_id"))
    skill_id = Column(Integer, ForeignKey("skill.skill_id"))


class Cohort(Base):
    __tablename__ = "cohort"
    cohort_id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("course.course_id"))
    provider_id = Column(Integer, ForeignKey("provider.provider_id"))
    batch_start = Column(Date)
    batch_end = Column(Date)


class Trainee(Base):
    __tablename__ = "trainee"
    trainee_id = Column(Integer, primary_key=True)
    name_or_anon_id = Column(String, nullable=False)
    dob_year = Column(Integer)
    gender = Column(String)
    category = Column(String)  # social category, kept generic
    district_id = Column(Integer, ForeignKey("district.district_id"))
    consent_flag = Column(Boolean, default=True)
    consent_ts = Column(Date)


class Training(Base):
    __tablename__ = "training"
    training_id = Column(Integer, primary_key=True)
    trainee_id = Column(Integer, ForeignKey("trainee.trainee_id"))
    course_id = Column(Integer, ForeignKey("course.course_id"))
    provider_id = Column(Integer, ForeignKey("provider.provider_id"))
    cohort_id = Column(Integer, ForeignKey("cohort.cohort_id"))
    start_date = Column(Date)
    end_date = Column(Date)
    completion_status = Column(String)  # completed / dropped_out
    assessment_score = Column(Float)
    certification_id = Column(String)


class Employer(Base):
    __tablename__ = "employer"
    employer_id = Column(Integer, primary_key=True)
    employer_name = Column(String, nullable=False)
    sector = Column(String)
    district_id = Column(Integer, ForeignKey("district.district_id"))


class Placement(Base):
    __tablename__ = "placement"
    placement_id = Column(Integer, primary_key=True)
    trainee_id = Column(Integer, ForeignKey("trainee.trainee_id"))
    training_id = Column(Integer, ForeignKey("training.training_id"))
    placement_type = Column(String)  # wage_employment/self_employment/apprenticeship/not_placed
    employer_id = Column(Integer, ForeignKey("employer.employer_id"), nullable=True)
    job_title = Column(String)
    job_sector = Column(String)
    start_date = Column(Date)
    source = Column(String)  # dashboard / follow_up
    verification_status = Column(String)  # confirmed/disputed/unverified
    non_placement_reason_text = Column(Text, nullable=True)


class JobSkillMap(Base):
    __tablename__ = "job_skill_map"
    id = Column(Integer, primary_key=True)
    placement_id = Column(Integer, ForeignKey("placement.placement_id"))
    skill_id = Column(Integer, ForeignKey("skill.skill_id"))


class EmploymentHistory(Base):
    """Append-only: one row per job spell. New spell = new row."""
    __tablename__ = "employment_history"
    history_id = Column(Integer, primary_key=True)
    placement_id = Column(Integer, ForeignKey("placement.placement_id"))
    status = Column(String)  # active / ended
    period_start = Column(Date)
    period_end = Column(Date, nullable=True)
    employer_id = Column(Integer, ForeignKey("employer.employer_id"))
    job_title = Column(String)
    exit_reason_code = Column(String, nullable=True)
    exit_reason_text = Column(Text, nullable=True)


class WageHistory(Base):
    """Append-only: one row per wage observation."""
    __tablename__ = "wage_history"
    wage_id = Column(Integer, primary_key=True)
    placement_id = Column(Integer, ForeignKey("placement.placement_id"))
    employment_history_id = Column(Integer, ForeignKey("employment_history.history_id"))
    recorded_date = Column(Date)
    wage_amount = Column(Float)
    wage_unit = Column(String)  # monthly/daily
    source = Column(String)  # self_reported / verified


class Followup(Base):
    __tablename__ = "followup"
    followup_id = Column(Integer, primary_key=True)
    trainee_id = Column(Integer, ForeignKey("trainee.trainee_id"))
    placement_id = Column(Integer, ForeignKey("placement.placement_id"))
    followup_date = Column(Date)
    scheduled_month = Column(Integer)  # 3 / 6 / 12
    status = Column(String)  # completed/pending/missed
    employment_status_at_followup = Column(String)
    wage_at_followup = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)


class Verification(Base):
    __tablename__ = "verification"
    verification_id = Column(Integer, primary_key=True)
    placement_id = Column(Integer, ForeignKey("placement.placement_id"))
    method = Column(String)
    verified_by = Column(String)
    verified_on = Column(Date)
    result = Column(String)


class Reason(Base):
    """Normalized output of NLP reason classification."""
    __tablename__ = "reason"
    reason_id = Column(Integer, primary_key=True)
    category = Column(String)  # non_placement / attrition
    reason_code = Column(String)
    reason_label = Column(String)
    raw_text = Column(Text)
    linked_placement_id = Column(Integer, ForeignKey("placement.placement_id"), nullable=True)
    linked_history_id = Column(Integer, ForeignKey("employment_history.history_id"), nullable=True)


def get_engine(db_path="data/skilling_outcomes.db"):
    return create_engine(f"sqlite:///{db_path}")


def init_db(db_path="data/skilling_outcomes.db"):
    engine = get_engine(db_path)
    Base.metadata.create_all(engine)
    return engine


if __name__ == "__main__":
    engine = init_db()
    print("Schema created at data/skilling_outcomes.db")
