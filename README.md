# Skilling Outcomes Analytics — Working Prototype

Implements the analytics + AI/ML layer from `skilling-outcomes-analytics-blueprint.md`.
This is YOUR workstream (analytics/AI-ML) — the trainee dashboard/frontend is owned
by your teammate and is not part of this codebase.

## Setup

```bash
pip install -r requirements.txt
```

## Run order

```bash
python schema.py          # creates data/skilling_outcomes.db with all tables
python generate_data.py   # populates it with a realistic synthetic dataset
python metrics.py         # prints all Section-4 metrics to console (sanity check)
python nlp_analysis.py    # prints NLP reason classification + generated insights
python ml_models.py       # prints anomaly detection + illustrative ML pipeline output
streamlit run app.py      # launches the full interactive dashboard
```

`generate_data.py` calls `init_db()` itself, so you can also just run
`generate_data.py` directly on a fresh checkout — it creates the schema first.

## File map

| File | Purpose | Blueprint section |
|---|---|---|
| `schema.py` | SQLAlchemy models — append-only employment/wage history | Section 3 |
| `generate_data.py` | Realistic synthetic dataset generator | Section 7 |
| `metrics.py` | All SQL/pandas formulas — placement, retention, wages, relevance, composite score, impact index | Section 4 |
| `nlp_analysis.py` | Reason classification + auto-generated insights (keyword-rule demo standing in for an LLM call) | Section 5 |
| `ml_models.py` | Anomaly detection (valid now) + placement/attrition prediction (illustrative pipeline only) | Section 6 |
| `app.py` | Streamlit dashboard tying it all together | Section 9 (the "results" side) |
| `llm_client.py` | Real Claude API calls for classification + insight generation | Section 5, live version |
| `api.py` | FastAPI REST wrapper — what a real frontend/teammate's dashboard calls | Section 9 |
| `Dockerfile` | Container definition for deploying `api.py` | deployment |
| `01_eda_synthetic_data.ipynb` | Sanity-checks the synthetic dataset before trusting anything downstream | supports Section 7 |
| `02_metrics_walkthrough.ipynb` | Narrated walkthrough of every Section 4 metric — the notebook to present | Section 4 |
| `03_nlp_and_insights.ipynb` | Reason classification + auto-generated insights, with the taxonomy shown | Section 5 |
| `04_ml_pipeline_demo.ipynb` | Anomaly detection + illustrative placement/attrition prediction, caveats inline | Section 6 |

The notebooks `import` from the `.py` modules rather than redefining logic — the modules are the
single source of truth (and what `app.py` also uses), the notebooks are the narrated, presentable
version of the same thing. Re-run `python build_notebooks.py` any time you change a module and want
the notebooks' outputs refreshed.

## Honest framing for the SIH demo

- **Metrics and NLP-for-classification are real and would work the same way on real data.**
- **Predictive ML (placement/attrition) is a working pipeline, not a proven predictor.** The AUC/F1 numbers you'll see reflect patterns *we ourselves injected* into the synthetic generator (e.g. IT/ITES sector → higher placement). Say this explicitly to judges: "the pipeline is built and demonstrable end-to-end; real predictive accuracy claims require training on genuine longitudinal outcomes post-deployment."
- **The NLP reason classifier uses keyword rules here** (no LLM API key wired into this environment). Swap `classify_reason_text()` in `nlp_analysis.py` for a single LLM call with the taxonomy in the prompt — the function signature doesn't need to change. Same applies to `generate_insight()`.

## Using a real LLM (Section 5, live)

`llm_client.py` wraps real Claude API calls. `nlp_analysis.py` auto-detects
and switches to it — no code changes needed elsewhere:

```bash
export ANTHROPIC_API_KEY=sk-ant-...    # get one at console.anthropic.com
python nlp_analysis.py                 # now uses real Claude calls instead of keyword rules
```

With no key set, everything silently falls back to the keyword/template demo
versions — nothing breaks either way. Model choice: `claude-haiku-4-5-20251001`
for classification/extraction (fast, cheap, appropriate for simple structured
tasks), `claude-sonnet-5` for insight narration (needs more nuance).

## Deploying it (`api.py`)

See **`DEPLOYMENT_GUIDE.md`** for the full free-tier Render walkthrough
(step-by-step, including exact environment variables). Short version:

`api.py` wraps every metrics/NLP/ML function as a REST endpoint using FastAPI
— this is what a real frontend or another service calls, instead of importing
your Python files directly.

**Run locally:**
```bash
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
# open http://localhost:8000/docs for interactive, auto-generated API docs
```

**Deploy for real (pick one, roughly easiest first):**

| Option | What it's good for | Notes |
|---|---|---|
| [Render](https://render.com) / [Railway](https://railway.app) | Fastest path to a public URL | Free/cheap tier, connect your GitHub repo, they auto-detect the Dockerfile |
| Docker anywhere (`docker build -t skilling-api . && docker run -p 8000:8000 skilling-api`) | Portable, matches what you'd run on any cloud VM | `Dockerfile` included — **not tested in this sandbox** (no Docker here), but every command inside it has been verified separately |
| AWS/GCP/Azure (App Runner, Cloud Run, Container Apps) | If your college/SIH team already has cloud credits | Same Docker image works on all three with minor config |
| Streamlit Community Cloud | Easiest way to publicly host **just** `app.py` (the dashboard) | Free, but it's the dashboard only, not the API — fine for a demo, not for teammate integration |

**Before deploying with real data:**
- Set `ANALYTICS_API_KEY` as an environment variable in your host's dashboard — the API checks it via the `X-API-Key` header and returns 401 without it. Replace with real auth (JWT/OAuth) before handling real trainee data; the current check is prototype-level only.
- Tighten `allow_origins=["*"]` in `api.py`'s CORS config to your teammate's actual frontend URL.
- Swap SQLite (`data/skilling_outcomes.db`) for Postgres/MySQL once you're past prototype scale — SQLAlchemy makes this a one-line change in `schema.py`'s `get_engine()`.

## Joining it with the frontend/backend your teammate owns

**See `HANDOFF_FOR_FRONTEND.md`** — give this file directly to whoever
builds the government dashboard. It has the real endpoint list, real
example responses, and the auth header format, ready to hand over as-is.

You are not merging codebases — you're connecting two systems over an API.
Nothing in your teammate's dashboard needs to import your Python, and nothing
here needs their frontend code.

```
Teammate's trainee dashboard (frontend + its own backend/DB)
        │
        │  ① teammate adds the fields listed in the blueprint's Section 2
        │     (consent_flag, placement capture, follow-up capture)
        │
        │  ② data reaches YOUR analytics DB one of two ways:
        │     - simplest for an SIH prototype: teammate's backend exports a
        │       CSV/JSON dump (matching your schema.py column names) on a
        │       schedule (e.g. nightly); you write a small script that reads
        │       it and inserts into data/skilling_outcomes.db
        │     - more "real": teammate's backend exposes its own API, and you
        │       write an ETL script that calls it and writes into your DB
        ▼
Your analytics DB (schema.py) — replaces generate_data.py's synthetic rows
        ▼
metrics.py / nlp_analysis.py / ml_models.py (unchanged either way)
        ▼
api.py (deployed, per above)
        ▼
Teammate's dashboard makes GET requests to your deployed API's endpoints
(e.g. `GET /api/metrics/placement-rate?group_by=course`) and renders the
JSON however their frontend already renders charts — they don't need
Python, pandas, or your DB at all, just your API's URL + the X-API-Key.
```

**The one conversation you actually need with your teammate:** agree on
the exact field names for the additions in Section 2 of the blueprint, and
how the data crosses from their system to yours (export file vs. their API).
Once that's fixed, your side (this repo) and their side can keep changing
independently — the API contract is the only thing that has to stay stable
between you.

## Next steps to connect to the real trainee dashboard (Section 9)

1. Agree the export/API contract with your teammate — field names and formats matching the "fields we need to add" list in the blueprint (consent flag, placement capture, follow-up capture).
2. Replace the synthetic ingestion (`generate_data.py`) with a real ETL step that reads from that export/API and writes into this same schema — nothing else needs to change.
3. Wrap `metrics.py` / `nlp_analysis.py` / `ml_models.py` functions behind a small REST API (FastAPI is a natural fit given your stack) for the government/provider dashboard to consume, instead of calling them directly from Streamlit.
