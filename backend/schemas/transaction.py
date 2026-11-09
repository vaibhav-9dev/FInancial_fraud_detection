from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class TransactionBase(BaseModel):
    step: int = Field(default=1, description="PaySim chronological hour step (1-744)")
    type: str = Field(..., description="Transaction channel: PAYMENT, TRANSFER, CASH_OUT, DEBIT, CASH_IN")
    amount: float = Field(..., gt=0, description="Transaction monetary value in USD")
    nameOrig: Optional[str] = Field(default=None, description="Sender cardholder/customer ID (e.g. C12345)")
    oldbalanceOrg: float = Field(..., ge=0, description="Origin balance prior to transaction")
    newbalanceOrig: float = Field(..., ge=0, description="Origin balance after transaction")
    nameDest: Optional[str] = Field(default=None, description="Recipient account or merchant ID (e.g. M12345 or C12345)")
    oldbalanceDest: float = Field(..., ge=0, description="Recipient balance prior to transaction")
    newbalanceDest: float = Field(..., ge=0, description="Recipient balance after transaction")
    
    # Security & Context attributes
    idempotency_key: Optional[str] = Field(default=None, description="Unique client key for duplicate prevention")
    deviceId: Optional[str] = Field(default=None, description="Device fingerprint token")
    ipAddress: Optional[str] = Field(default=None, description="Originating client IP address")
    location: Optional[str] = Field(default=None, description="City, Country location string")
    latitude: Optional[float] = Field(default=None)
    longitude: Optional[float] = Field(default=None)

class TransactionCreate(TransactionBase):
    pass

class TransactionBatchCreate(BaseModel):
    transactions: List[TransactionCreate]

class FeatureContribution(BaseModel):
    feature: str
    label: str
    value: Any
    impact: str
    score_contribution: float

class PredictionResponse(BaseModel):
    transaction_id: str
    idempotency_key: Optional[str] = None
    is_duplicate: bool = False
    decision: str  # APPROVED, FLAGGED, BLOCKED
    risk_level: str  # LOW, MEDIUM, HIGH
    fraud_probability: float  # Calibrated GBDT probability [0.0, 1.0]
    anomaly_score: float  # Unsupervised Isolation Forest score [0.0, 1.0]
    random_forest_baseline_score: float = 0.0
    ensemble_score: float  # Blended decision score
    risk_score_100: int  # Normalized 0-100 integer
    rationale: str
    triggered_rules: List[str] = []
    feature_contributions: List[FeatureContribution]
    latency_ms: Dict[str, float]

class BatchPredictionResponse(BaseModel):
    processed_count: int
    duplicates_detected: int
    flagged_count: int
    blocked_count: int
    results: List[PredictionResponse]
    batch_latency_ms: float

class FraudAlertSchema(BaseModel):
    id: str
    transaction_id: str
    amount: float
    currency: str = "USD"
    timestamp: str
    risk_score: float
    risk_score_100: int
    severity: str
    status: str
    primary_reason: str
    model_responsible: str
    suggested_action: Optional[str] = None
    case_id: Optional[str] = None

class CaseCreateSchema(BaseModel):
    title: str
    priority: str = "HIGH"
    transaction_id: str
    customer_id: str
    alert_id: Optional[str] = None
    initial_note: Optional[str] = None

class CaseUpdateStatusSchema(BaseModel):
    status: str  # OPEN, IN_PROGRESS, CLOSED
    resolution: Optional[str] = None  # CONFIRMED_FRAUD, FALSE_POSITIVE_LEGITIMATE, INCONCLUSIVE
    closure_reason: Optional[str] = None

class CaseNoteCreateSchema(BaseModel):
    author: str
    author_role: str = "FRAUD_ANALYST"
    content: str

class SystemHealthSchema(BaseModel):
    status: str
    uptime_seconds: int
    database: str
    kafka_broker: str
    model_status: str
    total_transactions_ingested: int
    dead_letter_queue_count: int
