# FastAPI REST API Specification

Base URL: `http://localhost:8000/api/v1` (or root `/`)

Interactive Swagger UI: `http://localhost:8000/docs`
ReDoc Specification: `http://localhost:8000/redoc`

---

## 1. Endpoints Overview

### `GET /health`
Returns system operational health, model statuses, and database connection.

### `POST /predict`
Evaluates a single payment transaction in real time against the Dual-ML pipeline.

**Request Body (JSON)**:
```json
{
  "step": 48,
  "type": "TRANSFER",
  "amount": 250000.00,
  "nameOrig": "C12345678",
  "oldbalanceOrg": 250000.00,
  "newbalanceOrig": 0.00,
  "nameDest": "C98765432",
  "oldbalanceDest": 0.00,
  "newbalanceDest": 0.00
}
```

**Response Body (JSON)**:
```json
{
  "transaction_id": "TX-A8F291",
  "decision": "BLOCKED",
  "risk_level": "HIGH",
  "fraud_probability": 0.9421,
  "anomaly_score": 0.8810,
  "ensemble_score": 0.9238,
  "rationale": "Exceeded critical threshold (92.4% >= 75%). Account liquidation signature.",
  "feature_contributions": [
    {
      "feature": "orig_drain_ratio",
      "label": "Liquidation Ratio",
      "value": "100.0%",
      "impact": "HIGH_FRAUD",
      "score_contribution": 0.32
    }
  ],
  "latency_ms": {
    "feature_extraction": 0.082,
    "model_inference": 0.174,
    "decision_rules": 0.051,
    "total_processing": 0.412
  }
}
```

### `GET /transactions`
Queries historical transactions with optional filtering parameters:
- `limit` (int, default: 50)
- `offset` (int, default: 0)
- `type` (string, e.g. `TRANSFER`, `PAYMENT`)
- `decision` (string: `APPROVED`, `FLAGGED`, `BLOCKED`)

### `GET /transactions/{transaction_id}`
Returns full feature vectors and latency profiles for a specific transaction ID.

### `GET /alerts`
Retrieves triaged fraud alerts filtered by `severity` (`CRITICAL`, `HIGH`, `MEDIUM`).

### `GET /metrics`
Returns aggregate operational metrics including total volume, intercepted amounts, and fraud ratios.

### `GET /model/performance`
Returns offline holdout validation metrics (accuracy, precision, recall, F1, AUC-ROC).
