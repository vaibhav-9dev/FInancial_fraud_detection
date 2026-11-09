import uuid
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "engine" in data

def test_predict_legitimate_payment():
    payload = {
        "step": 24,
        "type": "PAYMENT",
        "amount": 34.50,
        "oldbalanceOrg": 850.00,
        "newbalanceOrig": 815.50,
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0,
        "nameOrig": "C1029384",
        "nameDest": "M9823412"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "APPROVED"
    assert data["risk_level"] == "LOW"
    assert data["fraud_probability"] < 0.20
    assert "latency_ms" in data

def test_predict_critical_fraud():
    payload = {
        "step": 110,
        "type": "TRANSFER",
        "amount": 450000.00,
        "oldbalanceOrg": 450000.00,
        "newbalanceOrig": 0.00,
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0,
        "nameOrig": "C5544332",
        "nameDest": "C9988776"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "BLOCKED"
    assert data["risk_level"] == "HIGH"
    assert data["fraud_probability"] >= 0.75

def test_idempotency_duplicate_prevention():
    idemp_key = f"IDEMP-TEST-{uuid.uuid4().hex[:8]}"
    payload = {
        "step": 45,
        "type": "PAYMENT",
        "amount": 125.00,
        "oldbalanceOrg": 1200.00,
        "newbalanceOrig": 1075.00,
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0,
        "nameOrig": "C7788990",
        "nameDest": "M1122334",
        "idempotency_key": idemp_key
    }
    # First submission
    resp1 = client.post("/transactions", json=payload)
    assert resp1.status_code == 200
    d1 = resp1.json()
    assert d1["is_duplicate"] is False

    # Second submission with same idempotency key
    resp2 = client.post("/transactions", json=payload)
    assert resp2.status_code == 200
    d2 = resp2.json()
    assert d2["is_duplicate"] is True
    assert d2["transaction_id"] == d1["transaction_id"]

def test_batch_transactions_ingestion():
    batch_payload = {
        "transactions": [
            {
                "step": 12,
                "type": "PAYMENT",
                "amount": 45.00,
                "oldbalanceOrg": 500.0,
                "newbalanceOrig": 455.0,
                "oldbalanceDest": 0.0,
                "newbalanceDest": 0.0,
            },
            {
                "step": 12,
                "type": "TRANSFER",
                "amount": 280000.00,
                "oldbalanceOrg": 280000.0,
                "newbalanceOrig": 0.0,
                "oldbalanceDest": 0.0,
                "newbalanceDest": 0.0,
            }
        ]
    }
    response = client.post("/transactions/batch", json=batch_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["processed_count"] == 2
    assert len(data["results"]) == 2
    assert data["results"][1]["decision"] == "BLOCKED"

def test_case_lifecycle():
    # 1. Create a transaction first
    tx_resp = client.post("/predict", json={
        "step": 90,
        "type": "TRANSFER",
        "amount": 320000.0,
        "oldbalanceOrg": 320000.0,
        "newbalanceOrig": 0.0,
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0,
        "nameOrig": "C9900112"
    })
    tx_id = tx_resp.json()["transaction_id"]

    # 2. Open an investigation case
    case_resp = client.post("/cases", json={
        "title": "Suspected ATO and Account Drain",
        "priority": "CRITICAL",
        "transaction_id": tx_id,
        "customer_id": "C9900112",
        "initial_note": "Cardholder reported phone SIM swap earlier this morning."
    })
    assert case_resp.status_code == 200
    case_data = case_resp.json()
    case_id = case_data["id"]
    assert case_data["status"] == "OPEN"

    # 3. Add note
    note_resp = client.post(f"/cases/{case_id}/notes", json={
        "author": "Elena Rostova",
        "author_role": "INVESTIGATOR",
        "content": "Out of band phone verification failed. Fraud confirmed."
    })
    assert note_resp.status_code == 200

    # 4. Update status to CLOSED with resolution CONFIRMED_FRAUD
    update_resp = client.patch(f"/cases/{case_id}", json={
        "status": "CLOSED",
        "resolution": "CONFIRMED_FRAUD",
        "closure_reason": "SIM swap corroborated by telecom carrier."
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "CLOSED"
    assert update_resp.json()["resolution"] == "CONFIRMED_FRAUD"

def test_system_health_endpoint():
    response = client.get("/system/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "uptime_seconds" in data

def test_paysim_dataset_endpoint():
    response = client.get("/dataset/paysim?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "dataset_name" in data
    assert "total_records" in data
    assert len(data["items"]) <= 10
    assert data["items"][0]["nameOrig"].startswith("C")

