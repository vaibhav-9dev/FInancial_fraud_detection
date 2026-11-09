import pytest
import numpy as np
from backend.ml.feature_engineering import PaySimFeatureEngineer

def test_feature_engineering_no_target_leakage():
    raw_input = {
        "step": 48,
        "type": "TRANSFER",
        "amount": 250000.0,
        "nameOrig": "C123456",
        "oldbalanceOrg": 250000.0,
        "newbalanceOrig": 0.0,
        "nameDest": "C987654",
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0,
        "isFraud": 1,  # Should be ignored completely
        "isFlaggedFraud": 1  # Should be ignored completely
    }

    features = PaySimFeatureEngineer.transform_single(raw_input)

    # Assert no target labels leaked into feature dict
    assert "isFraud" not in features
    assert "isFlaggedFraud" not in features
    assert features["orig_drain_ratio"] >= 0.99
    assert features["is_high_risk_type"] == 1.0
    assert features["error_balance_orig"] == 0.0
    assert features["dest_zero_balance"] == 1.0

def test_feature_engineering_payment_safety():
    raw_input = {
        "step": 12,
        "type": "PAYMENT",
        "amount": 45.0,
        "oldbalanceOrg": 1200.0,
        "newbalanceOrig": 1155.0,
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0
    }

    features = PaySimFeatureEngineer.transform_single(raw_input)
    assert features["is_high_risk_type"] == 0.0
    assert features["orig_drain_ratio"] < 0.10
    assert features["error_balance_orig"] == 0.0
