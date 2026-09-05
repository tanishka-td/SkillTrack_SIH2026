# Deploying `api.py` — Free-Tier Guide (Render)

This gets your API live at a public URL your teammate's gov dashboard can call.

## What "free" actually means here

Render's free web service tier has no persistent disk — the database file
gets rebuilt fresh every time you redeploy, using whatever Supabase data
exists at that moment. That's the honest trade-off for $0: **your data
updates once per redeploy, not continuously.** Refreshing = one click.
Good enough for an SIH prototype; not how you'd run this in production
with thousands of real users.

## Step 1 — Push this project to GitHub

Render deploys from a GitHub repo, not a zip upload.

1. Go to github.com, create a new repository (e.g. `skilling-analytics`).
2. In your project folder:
   ```bash
   cd skilling_analytics
   git init
   git add .
   git commit -m "Analytics layer for skilling outcomes project"
   git branch -M main
   git remote add origin https://github.com/<your-username>/skilling-analytics.git
   git push -u origin main
   ```
3. **Important:** add a `.gitignore` first so you never commit `data/skilling_outcomes.db`
   or secrets:
   ```
   data/*.db
   __pycache__/
   .env
   ```

## Step 2 — Create the Render service

1. Go to render.com, sign up/log in (free, no card needed for this tier).
2. **New +** → **Web Service** → connect your GitHub → pick the repo you just pushed.
3. Render will detect the `Dockerfile` automatically. Leave build/start commands blank — the Dockerfile handles both.
4. Under **Environment**, add these (as regular Environment Variables, not secret files):
   | Key | Value |
   |---|---|
   | `SUPABASE_URL` | your project's URL (from `supabase.js`) |
   | `SUPABASE_SERVICE_KEY` | the `service_role` key (Supabase → Project Settings → API) |
   | `ANALYTICS_API_KEY` | make up any password-like string — this is what your teammate's frontend sends back to you as proof it's allowed to call your API |

   These get read at **build time** by the Dockerfile (to pull real data) AND at runtime (for the API's own auth check).

5. Click **Create Web Service**. First build takes a few minutes — watch the logs; you should see `"Real Supabase credentials found — running real ETL..."` (if you don't see that line, check the env var names are exact).
6. Once live, Render gives you a URL like `https://skilling-analytics.onrender.com`. Test it:
   ```
   https://skilling-analytics.onrender.com/health
   ```
   should return `{"status":"ok"}`.

## Step 3 — Refreshing the data later

Whenever your teammate's real Supabase data changes and you want the live
API to reflect it: Render dashboard → your service → **Manual Deploy** →
**Deploy latest commit**. That re-runs the Dockerfile, re-pulls fresh data
from Supabase, and redeploys — free, one click, a couple of minutes.

## Step 4 — Give your teammate what they need

Once live, hand them exactly three things (see `HANDOFF_FOR_FRONTEND.md`):
1. The base URL (`https://skilling-analytics.onrender.com`)
2. The `ANALYTICS_API_KEY` value, to send as an `X-API-Key` header
3. The endpoint list (already in `api.py`, mirrored in the handoff doc)

## Known free-tier quirk

Render's free web services "spin down" after 15 minutes of no traffic, and
the next request takes ~30-50 seconds to wake back up. Not a bug — just
tell your teammate the first load might be slow if it's been idle.
