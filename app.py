"""
Streamlit analytics dashboard — the "government/provider dashboard" from
Section 9 of the blueprint. Consumes the metrics/NLP/ML layers, which in
production would sit behind the Results API rather than being called directly.

Run: streamlit run app.py
"""
import streamlit as st
import pandas as pd
import plotly.express as px

from schema import get_engine
import metrics as m
import nlp_analysis as nlp
import ml_models as ml

st.set_page_config(page_title="Skilling Outcomes Analytics", layout="wide")
engine = get_engine("data/skilling_outcomes.db")

st.title("Skilling Outcomes & Impact Measurement — Analytics Dashboard")
st.caption("Running on synthetic data. See sidebar for what's demo-only vs production-ready.")

with st.sidebar:
    st.header("About this build")
    st.markdown(
        "- **Metrics** (placement, retention, wage, relevance): real formulas, valid on real data too.\n"
        "- **NLP** (reason classification, insights): keyword-rule demo standing in for an LLM call.\n"
        "- **ML prediction** (placement/attrition): pipeline works, but accuracy numbers are "
        "**illustrative only** — synthetic data can't prove real-world predictive power.\n"
        "- **Anomaly detection**: statistically valid now, on any dataset."
    )
    impact = m.overall_impact_index(engine)
    st.metric("Overall Programme Impact Index", impact)

tab1, tab2, tab3, tab4, tab5 = st.tabs(
    ["Placement & Employment", "Wages & Retention", "Course/Provider Performance",
     "Reasons & Skill Gaps", "AI Insights & ML (demo)"]
)

with tab1:
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Placement rate by course")
        pr = m.placement_rate(engine, "course")
        fig = px.bar(pr, x="group_key", y="placement_rate_pct", labels={"group_key": "Course"})
        st.plotly_chart(fig, width="stretch", key="chart_placement_rate_course")
    with col2:
        st.subheader("Employment type distribution")
        dist = m.employment_type_distribution(engine)
        fig = px.pie(dist, names="placement_type", values="n")
        st.plotly_chart(fig, width="stretch", key="chart_employment_type_dist")

    st.subheader("Placement rate by district")
    pr_d = m.placement_rate(engine, "district")
    fig = px.bar(pr_d, x="group_key", y="placement_rate_pct", labels={"group_key": "District"})
    st.plotly_chart(fig, width="stretch", key="chart_placement_rate_district")

    st.subheader("Time to placement (days) by course")
    st.dataframe(m.time_to_placement(engine), width="stretch")

with tab2:
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Wage growth % by course")
        wg = m.wage_growth(engine, "course")
        fig = px.bar(wg, x="course_name", y="wage_growth_pct")
        st.plotly_chart(fig, width="stretch", key="chart_wage_growth")
    with col2:
        st.subheader("Retention / Attrition")
        month = st.select_slider("Month mark", options=[3, 6, 12], value=6)
        ret = m.retention_rate(engine, month)
        att = m.attrition_rate(engine, month)
        c1, c2 = st.columns(2)
        ret_display = f"{ret['retention_rate_pct']}%" if ret['retention_rate_pct'] is not None else "N/A (no employment history yet)"
        att_display = f"{att['attrition_rate_pct']}%" if att['attrition_rate_pct'] is not None else "N/A (no employment history yet)"
        c1.metric(f"Retention @ {month}mo", ret_display)
        c2.metric(f"Attrition @ {month}mo", att_display)

with tab3:
    st.subheader("Composite course performance score")
    st.caption("Score = 0.35×placement + 0.30×retention + 0.20×wage growth + 0.15×training-job relevance (normalized)")
    comp = m.course_provider_composite_score(engine)
    fig = px.bar(comp, x="group_key", y="composite_score", color="composite_score",
                 color_continuous_scale="RdYlGn")
    st.plotly_chart(fig, width="stretch", key="chart_composite_score")
    st.dataframe(comp, width="stretch")

    st.subheader("Training-job relevance by provider")
    rel_p = m.training_job_relevance(engine, "provider")
    fig = px.bar(rel_p, x="provider_name", y="relevance_score")
    fig.update_layout(xaxis_tickangle=-45)
    st.plotly_chart(fig, width="stretch", key="chart_relevance_by_provider")

with tab4:
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Non-placement reasons")
        npr = m.non_placement_reasons(engine)
        fig = px.bar(npr, x="reason_label", y="n")
        fig.update_layout(xaxis_tickangle=-30)
        st.plotly_chart(fig, width="stretch", key="chart_non_placement_reasons")
    with col2:
        st.subheader("Attrition reasons")
        ar = m.attrition_reasons(engine)
        fig = px.bar(ar, x="reason_label", y="n")
        fig.update_layout(xaxis_tickangle=-30)
        st.plotly_chart(fig, width="stretch", key="chart_attrition_reasons")

    st.subheader("Skill gap: demanded but not taught")
    gap = m.skill_gap(engine)
    if not gap.empty:
        st.dataframe(gap, width="stretch")
    else:
        st.info("No skill gaps detected in current data.")

with tab5:
    st.subheader("Auto-generated insights (template-based demo of LLM narrative)")
    for insight in nlp.generate_all_insights(engine):
        st.markdown(f"- {insight}")

    st.divider()
    st.subheader("Anomaly detection (statistically valid now)")
    anomalies = ml.detect_cohort_anomalies(engine, z_threshold=1.0)
    if not anomalies.empty:
        st.dataframe(anomalies, width="stretch")
    else:
        st.info("No cohorts exceeded the anomaly threshold in this dataset.")

    st.divider()
    st.subheader("⚠️ Predictive ML — illustrative pipeline only")
    st.warning("These numbers demonstrate the pipeline runs end-to-end. They are "
               "NOT evidence of real-world predictive accuracy — synthetic data "
               "cannot prove that. Re-run this exact code once real historical data exists.")
    c1, c2 = st.columns(2)
    with c1:
        st.write("**Placement prediction**")
        st.json(ml.placement_prediction_demo(engine))
    with c2:
        st.write("**Attrition prediction**")
        st.json(ml.attrition_prediction_demo(engine))
