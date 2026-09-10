FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ARG SUPABASE_URL=""
ARG SUPABASE_SERVICE_KEY=""

ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}

RUN mkdir -p data

# Build the database using the scripts inside database/
RUN cd database && python build_data.py && cp -r data/* ../data/

EXPOSE 8000

ENV ANALYTICS_API_KEY=""
ENV GEMINI_API_KEY=""

CMD ["uvicorn", "api.api:app", "--host", "0.0.0.0", "--port", "8000"]