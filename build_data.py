"""
Build-time data loader for deployment.

Tries the real Supabase ETL first (if SUPABASE_URL + SUPABASE_SERVICE_KEY are
set as build-time env vars/secrets on your host). Falls back to synthetic
data if they're not set, so the image still builds and runs standalone
for local testing or before real credentials exist.
"""
import os
import subprocess

if os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_KEY"):
    print("Real Supabase credentials found — running real ETL...")
    subprocess.run(["python", "etl_from_supabase.py"], check=True)
else:
    print("No Supabase credentials set — building with synthetic demo data instead.")
    subprocess.run(["python", "generate_data.py"], check=True)
