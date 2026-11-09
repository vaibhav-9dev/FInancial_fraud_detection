# FRAUDGUARD AI: Complete Deployment & Installation Guide

This guide covers deployment strategies for **FRAUDGUARD AI**, ranging from instant web hosting to full distributed multi-container cloud infrastructure.

---

## Deployment Architecture Overview

FRAUDGUARD AI is structured into four interoperable tiers:

1. **Frontend Presentation & Analytics Console**:
   - React 19, TypeScript, Tailwind CSS v4, Lucide Icons, responsive SVG telemetry charts.
   - Embeds client-side dual-ML scoring fallback and synthetic streaming generator for standalone zero-dependency operation.
   - Can be served via Nginx, Docker, Vercel, Netlify, Cloudflare Pages, AWS S3/CloudFront, or Google Cloud Run.

2. **Real-Time ML Inference & REST API** (`backend/`):
   - Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy.
   - Dual-ML Engine (Gradient Boosting Decision Trees + Isolation Forest).
   - Endpoints: `/predict`, `/ingest`, `/batch`, `/cases`, `/customers`, `/health`.

3. **High-Throughput Streaming Engine** (`streaming/`):
   - Apache Kafka 7.5 + Zookeeper.
   - Topics: `payment-transactions` and Dead-Letter Queue `payment-transactions-dlq`.
   - Streaming Consumer with duplicate suppression (idempotency key hashing).

4. **Persistence Tier**:
   - PostgreSQL 15 (Enterprise Production) or SQLite (Local zero-install fallback).
   - Relational schemas for transactions, alerts, customer profiles, cases, and immutable audit logs.

---

## Strategy 1: One-Command Full Stack (Docker Compose) - Recommended

Best for single-node cloud servers (AWS EC2, GCP Compute Engine, DigitalOcean Droplet, Hetzner, or local testing).

### Prerequisites
- Docker Engine v24.0+
- Docker Compose v2.20+
- Ports available: `3000` (Frontend), `8000` (FastAPI), `5432` (PostgreSQL), `9092` (Kafka)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/organization/RealTime-Fraud-Detection.git
cd RealTime-Fraud-Detection

# 2. Configure environment variables (optional overrides)
cp .env.example .env

# 3. Launch the complete containerized topology (PostgreSQL, Zookeeper, Kafka, FastAPI, Frontend)
docker-compose up -d --build

# 4. Verify all containers are healthy
docker-compose ps
```

### Services Port Map
| Container | Service | URL / Port | Healthcheck |
|---|---|---|---|
| `fraudguard-frontend` | React UI Console | `http://localhost:3000` | HTTP 200 |
| `fraudguard-backend` | FastAPI REST API | `http://localhost:8000` | `http://localhost:8000/health` |
| `fraudguard-postgres` | PostgreSQL Database | `localhost:5432` | `pg_isready` |
| `fraudguard-kafka` | Apache Kafka Broker | `localhost:9092` | Broker ping |
| `fraudguard-zookeeper` | Cluster Coordinator | `localhost:2181` | Quorum check |

---

## Strategy 2: Standalone Frontend Deployment (Static / Serverless)

If you only need to deploy the interactive dashboard console with client-side ML engine and synthetic streaming:

### Option A: Vercel / Netlify / Cloudflare Pages
1. Push your repository to GitHub or GitLab.
2. Link the repository in the Vercel/Netlify dashboard:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`
3. Deploy! The application will load and score transactions immediately.

### Option B: Dockerized Nginx
```bash
docker build -t fraudguard-frontend -f Dockerfile.frontend .
docker run -d -p 80:80 --name fraudguard-frontend fraudguard-frontend
```
Open `http://localhost` to view the production console.

### Option C: Google Cloud Run (Frontend)
```bash
# Build and deploy directly to Cloud Run
gcloud builds submit --tag gcr.io/PROJECT_ID/fraudguard-frontend -f Dockerfile.frontend
gcloud run deploy fraudguard-frontend \
  --image gcr.io/PROJECT_ID/fraudguard-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Strategy 3: Cloud Native Enterprise Deployment (Kubernetes / AWS / GCP)

For high-availability, auto-scaling banking production setups:

### Topology
- **Managed Database**: AWS RDS PostgreSQL or GCP Cloud SQL (PostgreSQL 15+)
- **Managed Streaming**: Amazon MSK or Confluent Cloud (Kafka)
- **Container Orchestration**: AWS ECS (Fargate) / EKS or Google Kubernetes Engine (GKE) / Cloud Run
- **Frontend CDN**: AWS CloudFront + S3 or Cloudflare CDN

### Step-by-Step Production Configuration
1. **Provision PostgreSQL**:
   - Create database `fraudguard_db` with user `fraudguard_user`.
   - Update `DATABASE_URL=postgresql://fraudguard_user:<SECURE_PASSWORD>@<DB_HOST>:5432/fraudguard_db`.

2. **Provision Kafka**:
   - Create topics:
     - `payment-transactions` (Partitions: 6, Replication: 3)
     - `payment-transactions-dlq` (Partitions: 3, Replication: 3)
   - Set `KAFKA_BOOTSTRAP_SERVERS=<BROKER_HOST_1>:9092,<BROKER_HOST_2>:9092`.

3. **Deploy Backend Service**:
   ```bash
   docker build -t <REGISTRY>/fraudguard-backend:latest -f Dockerfile .
   docker push <REGISTRY>/fraudguard-backend:latest
   ```
   Set container environment variables:
   - `DATABASE_URL`
   - `KAFKA_BOOTSTRAP_SERVERS`
   - `JWT_SECRET`
   - `APP_URL`
   - `SMTP_*` / `TWILIO_*` / `TELEGRAM_*` (for incident dispatches)

4. **Deploy Frontend Service**:
   ```bash
   docker build -t <REGISTRY>/fraudguard-frontend:latest -f Dockerfile.frontend .
   docker push <REGISTRY>/fraudguard-frontend:latest
   ```

5. **Deploy Background Streaming Workers**:
   - Run worker containers executing:
     ```bash
     python streaming/consumer.py --broker $KAFKA_BOOTSTRAP_SERVERS --topic payment-transactions
     ```

---

## Strategy 4: Local Developer Workstation Setup

### 1. Frontend
```bash
npm install
npm run dev
# Running on http://localhost:3000
```

### 2. Python Backend & ML Training
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run model training on PaySim sample
python ml/trainer.py

# Launch FastAPI web server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Kafka Transaction Streaming
```bash
# Start synthetic ingestion stream at 10 transactions/second
python streaming/producer.py --broker localhost:9092 --topic payment-transactions --rate 10

# Start consumer with live ML risk scoring
python streaming/consumer.py --broker localhost:9092 --topic payment-transactions
```

---

## Environment Variables Reference

| Variable | Required | Default / Example | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes (Backend) | `postgresql://user:pass@localhost:5432/db` | Connection string for PostgreSQL / SQLite |
| `KAFKA_BOOTSTRAP_SERVERS` | Yes (Streaming) | `localhost:9092` | Kafka cluster broker address |
| `KAFKA_TOPIC` | No | `payment-transactions` | Ingestion event topic |
| `KAFKA_DLQ_TOPIC` | No | `payment-transactions-dlq` | Dead-Letter Queue topic |
| `JWT_SECRET` | Yes (Auth) | `super_secret_key` | Secret for signing RBAC tokens |
| `GEMINI_API_KEY` | Optional | `AIzaSy...` | Server-side Gemini AI features |
| `SMTP_HOST` | Optional | `smtp.sendgrid.net` | Fraud alert email notifications |
| `TELEGRAM_BOT_TOKEN` | Optional | `123456:ABC-DEF1234ghIkl` | Real-time Telegram alert dispatcher |
| `TWILIO_ACCOUNT_SID` | Optional | `AC...` | SMS dispatch for critical alerts |

---

## Verification & Smoke Testing

Verify the deployed stack with these health checks:

```bash
# 1. Check Backend Health
curl -s http://localhost:8000/health | jq .

# 2. Check Inference Scoring API
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "step": 1,
    "type": "TRANSFER",
    "amount": 950000.0,
    "oldbalanceOrg": 950000.0,
    "newbalanceOrig": 0.0,
    "oldbalanceDest": 0.0,
    "newbalanceDest": 0.0,
    "nameOrig": "C12345678",
    "nameDest": "C87654321"
  }' | jq .

# 3. Check Frontend HTTP Status
curl -I http://localhost:3000
```
