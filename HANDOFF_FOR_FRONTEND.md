# Analytics API — Handoff for the Government Dashboard

This is everything you need to wire the government dashboard's charts to
real analytics data. You don't need Python, pandas, or database access —
just fetch from these URLs like any other REST API.

## Base URL

```
https://<your-render-service-name>.onrender.com
```
(Tanishka will fill in the real URL once deployed — placeholder until then.)

## Auth

Every request needs this header:
```
X-API-Key: <the key Tanishka gives you>
```
Without it, requests return `401 Unauthorized`.

## A note on freshness

Data updates when Tanishka redeploys the API (manual, on request) — it is
**not** live-syncing every second. If a number looks stale, ask her to
redeploy rather than assuming the endpoint is broken.

## Endpoints

All are `GET` requests, all return JSON.

| Endpoint | Purpose | Query params |
|---|---|---|
| `/health` | Check the API is up | — |
| `/api/metrics/placement-rate` | Placement rate | `group_by=course\|district\|provider` (optional) |
| `/api/metrics/retention` | Retention + attrition rate | `month=3\|6\|12` (default 6) |
| `/api/metrics/wage-growth` | Average wage growth % | `group_by=course` (default) |
| `/api/metrics/relevance` | Training-job relevance score | `group_by=course\|provider\|district` |
| `/api/metrics/composite-score` | Ranked course/provider performance score | — |
| `/api/metrics/skill-gap` | Skills demanded but not taught | — |
| `/api/metrics/impact-index` | Single overall programme impact number | — |
| `/api/reasons/non-placement` | Ranked non-placement reasons | — |
| `/api/reasons/attrition` | Ranked attrition reasons | — |
| `/api/insights` | Auto-generated plain-language insights per course | — |
| `/api/ml/anomalies` | Cohorts flagged as statistical outliers | `z_threshold` (default 1.0) |
| `/api/ml/placement-prediction-demo` | ⚠️ illustrative only, see caveat below | — |
| `/api/ml/attrition-prediction-demo` | ⚠️ illustrative only, see caveat below | — |

## Real example responses

**`GET /api/metrics/placement-rate?group_by=course`**
```json
[
  { "group_key": "Customer Support & CRM", "completed": 125, "placed": 104, "placement_rate_pct": 83.2 },
  { "group_key": "Data Entry & Basic IT", "completed": 124, "placed": 97, "placement_rate_pct": 78.2 }
]
```

**`GET /api/metrics/impact-index`**
```json
{ "overall_impact_index": 0.598 }
```

**`GET /api/insights`**
```json
{
  "insights": [
    "**Customer Support & CRM**: placement rate is strong at 83.2%. Training-job relevance is healthy (0.67). Average wage growth post-placement is 10.4%. The leading reason for non-placement is 'Wage offered too low' — worth addressing directly with employer partners or in counselling."
  ]
}
```

**`GET /api/ml/anomalies`**
```json
[]
```
(Empty array is normal — it means no cohort currently looks statistically unusual. Don't render this as an error state.)

## ⚠️ Important: the two `-demo` ML endpoints

`placement-prediction-demo` and `attrition-prediction-demo` return a working
result, but it comes with a `"note"` field explicitly saying it's
illustrative, not a real accuracy claim. **Please display that note text
somewhere near the number if you show these at all** — don't present the
AUC/F1 numbers as "the system predicts X% accurately." If you're not sure
whether to include these two on the dashboard at all, ask Tanishka — they're
optional/lower priority compared to everything else on this list.

## Example fetch (JavaScript)

```js
const res = await fetch("https://<api-url>/api/metrics/placement-rate?group_by=course", {
  headers: { "X-API-Key": "<the key>" }
});
const data = await res.json();
```

## What NOT to expect from this API

- No individual trainee names, contact info, or any per-person data — everything here is aggregated by design (consent-based system).
- No real-time push updates — it's pull-based, refreshed on redeploy.
- No write endpoints — this API is read-only; the trainee dashboard's own Supabase connection is where data gets written.
