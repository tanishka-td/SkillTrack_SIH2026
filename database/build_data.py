"""
Build-time data loader for deployment.

Tries the real Supabase ETL first (if SUPABASE_URL + SUPABASE_SERVICE_KEY are
set as build-time env vars/secrets on your host). Falls back to synthetic
data if they're not set, so the image still builds and runs standalone
for local testing or before real credentials exist.
"""
import os
import subprocess

print("Building with local demo data...")
subprocess.run(
    ["python", os.path.join(os.path.dirname(__file__), "generate_data.py")],
    check=True
)