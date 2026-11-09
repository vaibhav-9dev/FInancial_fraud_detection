# FRAUDGUARD AI: Real-Time Payment Fraud Detection System

An enterprise-grade, real-time financial transaction monitoring and investigation platform designed to detect fraudulent payments, intercept account takeovers, and quantify transaction risk while strictly minimizing false positives.

Built with a dual machine learning engine (**Gradient Boosting Decision Trees** + **Isolation Forest**), a Random Forest comparison baseline, sub-millisecond monotonic latency telemetry, Apache Kafka streaming pipelines with Dead-Letter Queues (DLQ) and idempotency keys, dual PostgreSQL/SQLite persistence, a complete Special Investigations Unit (SIU) case management workflow, pseudonymous customer risk profiling, multi-channel notification dispatchers (SMTP, Telegram, Twilio SMS), and an enterprise React/Tailwind analytics console.

---

## 1. Executive Summary & Capabilities

- **Real-Time Payment Ingestion**: Continuous event stream processing simulating high-velocity payment transactions (PaySim schema) via REST, Kafka, and WebSockets.
- **Dual-ML & Baseline Architecture**:
  - **Supervised Model**: Gradient Boosting Classifier (GBDT) producing calibrated fraud probabilities.
  - **Baseline Model**: Random Forest baseline comparison classifier.
  - **Unsupervised Model**: Isolation Forest anomaly scoring computing tree path depths `s(x, n) = 2^(-E(h(x)) / c(n))` to isolate novel zero-day attack patterns without labels.
  - **Hybrid Ensemble & Calibrated 0–100 Risk Score**: Blended decision engine (70% GBDT + 30% Isolation Forest) outputting three configurable decision states: **APPROVED**, **FLAGGED**, and **BLOCKED**.
- **Special Investigations Unit (SIU) Case Management**:
  - Case progression through `OPEN`, `IN_PROGRESS`, `CLOSED`, and `ESCALATED_LEGAL`.
  - Dispositions: `CONFIRMED_FRAUD`, `FALSE_POSITIVE_LEGITIMATE`, `INCONCLUSIVE`.
  - Time-stamped notes thread, evidence attachments, and downloadable audit dossiers.
- **Customer Risk & Behavioral Intelligence**:
  - Pseudonymous customer profiles (`C10293840`) with risk tiers (`LOW`, `MEDIUM`, `HIGH`).
  - Rolling velocity meters across 1-minute, 1-hour, and 24-hour observation windows.
  - Device fingerprints, IP addresses, and frequent beneficiary graphs.
- **Instant Multi-Channel Alert Dispatch**:
  - In-app audible and visual alert center with deduplication & cooldown windows.
  - Browser Push notifications, SMTP Email, Telegram Bot, and Twilio SMS adapters.
- **Audit Logging & RBAC Governance**:
  - Tamper-evident governance audit trail with CSV export capability.
  - 4 distinct role personas: `ADMIN`, `FRAUD_ANALYST`, `INVESTIGATOR`, `READ_ONLY`.
- **Rigorous Anti-Leakage Discipline**:
  - Zero target leakage: neither `isFraud` nor heuristic `isFlaggedFraud` are ever accessible to feature transformers.
  - Strict chronological train/test splitting (Train: Steps 1–550; Holdout: Steps 551–744).
  - Explicit separation between offline ground-truth benchmark metrics and live unlabelled streaming telemetry.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Custom Responsive SVG Charts |
| **Backend API** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn, SQLAlchemy (PostgreSQL / SQLite) |
| **Machine Learning** | Scikit-Learn, NumPy, Pandas, Isolation Forest, Gradient Boosting, Random Forest, Joblib |
| **Streaming** | Apache Kafka, Zookeeper, Dead-Letter Queue (DLQ), Idempotency Keys |
| **Infrastructure** | Docker, Docker Compose (PostgreSQL, Kafka, Zookeeper, FastAPI) |
| **Testing** | Pytest, FastAPI TestClient, TypeScript strict verification |

---

## 3. Local Execution & Quickstart Guide

### Option A: Web Applet (Embedded Simulator)
The hosted web application runs an interactive real-time Dual-ML engine and simulator out of the box with zero setup required.
1. Access the web interface.
2. In the top bar or sidebar, navigate to **Live Monitoring** and toggle **Start Stream**.
3. Use **Inject Attack** to test adversarial fraud signatures (e.g., Account Takeover, Impossible Travel).
4. Review generated alerts in **Fraud Alerts** or escalate suspicious accounts directly to the **Investigation Centre**.

---

### Option B: Full Distributed Stack (Docker Compose + Python 3.11 + Kafka)

#### Linux / macOS (bash)
```bash
# 1. Clone repository & start full Docker infrastructure (Postgres, Kafka, Zookeeper)
git clone https://github.com/organization/RealTime-Fraud-Detection.git
cd RealTime-Fraud-Detection
docker-compose up -d postgres zookeeper kafka

# 2. Setup Python environment
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Train models & launch FastAPI backend
python ml/trainer.py
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 4. In separate terminals, launch Kafka consumer & synthetic producer
python ../streaming/consumer.py
python ../streaming/producer.py --rate 5
```

#### Windows (PowerShell)
```powershell
# 1. Start full Docker infrastructure
docker-compose up -d postgres zookeeper kafka

# 2. Create and activate virtual environment
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 3. Train models and launch FastAPI server
python ml\trainer.py
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 4. In separate PowerShell windows, launch consumer & producer
python ..\streaming\consumer.py
python ..\streaming\producer.py --rate 5
```

---

## 4. Running Automated Tests

Run the backend Pytest suite to verify API endpoints, idempotency duplicate prevention, batch ingestion, and ML pipelines:

```bash
cd RealTime-Fraud-Detection
pytest tests/ -v
```

---

## 5. Repository Layout

```
RealTime-Fraud-Detection/
|-- backend/
|   |-- api/routes.py            # FastAPI endpoints (ingest, batch, cases, customers, health)
|   |-- database/database.py     # SQLAlchemy dual PostgreSQL / SQLite connector
|   |-- database/models.py       # Transaction, Alert, Customer, Case, Evidence, and Audit ORM tables
|   |-- ml/feature_engineering.py# Zero-leakage PaySim feature transformer
|   |-- ml/trainer.py            # GBDT and Isolation Forest training pipeline
|   |-- schemas/transaction.py   # Pydantic request & response validation schemas
|   |-- main.py                  # FastAPI app entrypoint with CORS & routes
|   |-- requirements.txt         # Python dependencies
|-- streaming/
|   |-- producer.py              # Apache Kafka transaction producer
|   |-- consumer.py              # Apache Kafka consumer with DLQ & Idempotency key tracking
|   |-- transaction_generator.py # Synthetic PaySim stream generator
|-- src/
|   |-- components/              # SvgChart, MetricCard, Modals, Navbar, Sidebar
|   |-- pages/                   # 10 core fintech views + Code/Docs viewer
|   |-- services/                # mlEngine, streamSimulator, storage (Customer & Case persistence)
|   |-- types/                   # Strict TypeScript contracts (Customer, Case, Health, RBAC)
|   |-- App.tsx                  # Root application router & state synchronization
|-- tests/
|   |-- test_api.py              # Pytest API integration tests (idempotency, cases, batch)
|   |-- test_ml.py               # ML feature engineering & isolation depth tests
|-- docker-compose.yml           # Multi-container orchestration (PostgreSQL, Kafka, Zookeeper, FastAPI)
|-- Dockerfile                   # Python 3.11 backend container image
|-- PROJECT_STATUS.md            # Comprehensive project phase milestone audit
|-- README.md                    # System documentation and instructions
```

---

## 6. License & Academic Attribution
Developed for academic engineering submission. Built on the Kaggle PaySim Synthetic Financial Dataset (`ealaxi/paysim1`).
All transactions processed within the hosted preview are simulated. No live bank accounts or payment gateways are accessed.
