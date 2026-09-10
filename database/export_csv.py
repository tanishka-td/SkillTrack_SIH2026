import sqlite3
import os
import pandas as pd

DB_PATH = "data/skilling_outcomes_demo.db"
OUTPUT_DIR = "demo_data"

os.makedirs(OUTPUT_DIR, exist_ok=True)

conn = sqlite3.connect(DB_PATH)

# Get all tables
tables = pd.read_sql_query(
    """
    SELECT name
    FROM sqlite_master
    WHERE type='table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
    """,
    conn
)["name"].tolist()

print("Tables found:")
for table in tables:
    print(f"  - {table}")

# Export every table
for table in tables:
    df = pd.read_sql_query(f'SELECT * FROM "{table}"', conn)

    output_file = os.path.join(OUTPUT_DIR, f"{table}.csv")
    df.to_csv(output_file, index=False)

    print(f"Exported {table}: {len(df)} rows")

conn.close()

print("\nDone!")
print(f"CSV files are in: {OUTPUT_DIR}/")