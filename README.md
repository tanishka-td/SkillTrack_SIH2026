SkillTrack — SIH 2026

An analytics-driven skilling platform for understanding learner outcomes, identifying skill gaps, and supporting data-informed learning decisions.

(Might change afterards)

📌 Overview

SkillTrack is a Smart India Hackathon 2026 project focused on using data analytics, machine learning, and natural language processing to understand learner performance and skilling outcomes.

The platform processes learner and skilling data to generate meaningful insights such as performance trends, skill gaps, outcome metrics, and analytical recommendations.

The project is designed as a modular system where the frontend, backend/API, data layer, and analytics/ML components work together to provide an interactive experience for users.

🎯 Problem Statement

Modern skilling platforms generate large amounts of learner data, but raw data alone does not provide clear answers about whether learners are progressing effectively.

There is a need for a system that can:

Analyze learner and skilling outcomes
Identify patterns and trends in performance
Detect potential skill gaps
Provide meaningful metrics and insights
Use machine learning to support outcome analysis
Process textual feedback or related information using NLP
Present the resulting insights through an accessible interface

SkillTrack aims to address this problem by combining data engineering, analytics, machine learning, and NLP into a single platform.

Note: The exact wording and requirements of the official SIH problem statement should be added here once the team's finalized SIH problem statement is available.

🚀 Key Features
📊 Analytics
Learner and skilling outcome analysis
Performance metrics
Aggregated statistics
Trend and outcome analysis
🤖 Machine Learning
ML-based analysis of skilling data
Prediction/analysis of learner outcomes
Data-driven identification of patterns
🧠 Natural Language Processing
Analysis of textual learner-related information
Keyword/rule-based NLP analysis
Extensible architecture for future LLM-based analysis
🔄 Data Pipeline
Supabase integration for data retrieval
ETL pipeline for processing data
Local database generation
Synthetic-data fallback for demonstration/development
🔌 Backend API

The backend exposes analytical functionality through a FastAPI service so that the frontend can communicate with the analytics system independently.

🏗️ System Architecture
                    ┌─────────────────────┐
                    │      Frontend       │
                    │   Web Application   │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │     FastAPI         │
                    │    Backend/API      │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │  Analytics  │  │     ML      │  │     NLP     │
       │   Metrics   │  │   Models    │  │  Analysis   │
       └─────────────┘  └─────────────┘  └─────────────┘
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   Data / Database   │
                    │      Supabase       │
                    └─────────────────────┘