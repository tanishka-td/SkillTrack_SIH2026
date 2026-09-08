import pandas as pd
import os

DATA_DIR = "demo_data"
OUTPUT_FILE = os.path.join(DATA_DIR, "SkillTrack_Demo_Dataset.csv")


# Load data
trainee = pd.read_csv(os.path.join(DATA_DIR, "trainee.csv"))
district = pd.read_csv(os.path.join(DATA_DIR, "district.csv"))
training = pd.read_csv(os.path.join(DATA_DIR, "training.csv"))
course = pd.read_csv(os.path.join(DATA_DIR, "course.csv"))
provider = pd.read_csv(os.path.join(DATA_DIR, "provider.csv"))
placement = pd.read_csv(os.path.join(DATA_DIR, "placement.csv"))
employer = pd.read_csv(os.path.join(DATA_DIR, "employer.csv"))
employment = pd.read_csv(os.path.join(DATA_DIR, "employment_history.csv"))
wages = pd.read_csv(os.path.join(DATA_DIR, "wage_history.csv"))


# Rename columns BEFORE merging
district = district.rename(columns={
    "district_name": "district"
})

course = course.rename(columns={
    "course_name": "course",
    "sector": "course_sector"
})

provider = provider.rename(columns={
    "provider_name": "provider"
})

training = training.rename(columns={
    "start_date": "training_start_date",
    "end_date": "training_end_date"
})

placement = placement.rename(columns={
    "start_date": "placement_start_date",
    "non_placement_reason_text": "non_placement_reason"
})

employer = employer.rename(columns={
    "employer_name": "employer"
})

employment = employment.rename(columns={
    "status": "employment_status",
    "exit_reason_text": "attrition_reason"
})


# ---------------------------------------------------------
# Build the main trainee-level dataset
# ---------------------------------------------------------

df = trainee.merge(
    district,
    on="district_id",
    how="left"
)

df = df.merge(
    training,
    on="trainee_id",
    how="left"
)

df = df.merge(
    course,
    on="course_id",
    how="left"
)

df = df.merge(
    provider,
    on="provider_id",
    how="left"
)

df = df.merge(
    placement,
    on=["trainee_id", "training_id"],
    how="left"
)

df = df.merge(
    employer,
    on="employer_id",
    how="left"
)


# ---------------------------------------------------------
# Employment history
# Keep latest record for each placement
# ---------------------------------------------------------

employment["period_end"] = pd.to_datetime(
    employment["period_end"],
    errors="coerce"
)

employment_latest = (
    employment
    .sort_values("period_end")
    .drop_duplicates(
        subset=["placement_id"],
        keep="last"
    )
)

df = df.merge(
    employment_latest[
        [
            "placement_id",
            "employment_status",
            "attrition_reason"
        ]
    ],
    on="placement_id",
    how="left"
)


# ---------------------------------------------------------
# Wage history
# ---------------------------------------------------------

wages["recorded_date"] = pd.to_datetime(
    wages["recorded_date"],
    errors="coerce"
)

wages = wages.sort_values(
    ["placement_id", "recorded_date"]
)

wages["wage_number"] = (
    wages.groupby("placement_id").cumcount() + 1
)

wage_pivot = (
    wages[wages["wage_number"] <= 4]
    .pivot(
        index="placement_id",
        columns="wage_number",
        values="wage_amount"
    )
    .rename(
        columns={
            1: "initial_wage",
            2: "wage_3_month",
            3: "wage_6_month",
            4: "wage_12_month"
        }
    )
    .reset_index()
)

df = df.merge(
    wage_pivot,
    on="placement_id",
    how="left"
)


# ---------------------------------------------------------
# Select final presentation columns
# ---------------------------------------------------------

columns = [
    "trainee_id",
    "district",
    "state",
    "gender",
    "category",
    "dob_year",
    "consent_flag",

    "course",
    "course_sector",
    "provider",

    "training_start_date",
    "training_end_date",
    "completion_status",
    "assessment_score",
    "certification_id",

    "placement_type",
    "job_title",
    "job_sector",
    "employer",
    "placement_start_date",
    "verification_status",
    "non_placement_reason",

    "employment_status",
    "attrition_reason",

    "initial_wage",
    "wage_3_month",
    "wage_6_month",
    "wage_12_month"
]

output = df[columns].copy()


# ---------------------------------------------------------
# One row per trainee
# ---------------------------------------------------------

output = output.drop_duplicates(
    subset=["trainee_id"]
)

output = output.sort_values(
    "trainee_id"
)


# ---------------------------------------------------------
# Save
# ---------------------------------------------------------

output.to_csv(
    OUTPUT_FILE,
    index=False
)

print(f"Created: {OUTPUT_FILE}")
print(f"Rows: {len(output)}")
print(f"Columns: {len(output.columns)}")

print("\nColumns:")
for column in output.columns:
    print(f"  - {column}")

print("\nDone!")