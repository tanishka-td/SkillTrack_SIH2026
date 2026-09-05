FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Build-time args let your host (Render/Railway) pass real Supabase
# credentials in at BUILD time so the image ships with real data baked in.
# Without them, it falls back to synthetic demo data automatically.
ARG SUPABASE_URL=""
ARG SUPABASE_SERVICE_KEY=""
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}

RUN python build_data.py

EXPOSE 8000
ENV ANALYTICS_API_KEY=""
ENV ANTHROPIC_API_KEY=""

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
