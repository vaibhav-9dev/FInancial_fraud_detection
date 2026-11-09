"""
SQLAlchemy database models for FRAUDGUARD AI
Supports PostgreSQL and SQLite dual deployment.
"""

from sqlalchemy import Column, Integer, Float, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class TransactionModel(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    idempotency_key = Column(String, unique=True, nullable=True, index=True)
    step = Column(Integer, default=1)
    type = Column(String, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    name_orig = Column(String, index=True)
    oldbalance_org = Column(Float)
    newbalance_orig = Column(Float)
    name_dest = Column(String, index=True)
    oldbalance_dest = Column(Float)
    newbalance_dest = Column(Float)
    
    # Device, Network & Geo Signals
    device_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    location = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Model scores & predictions
    gradient_boosting_score = Column(Float)
    random_forest_baseline_score = Column(Float, default=0.0)
    isolation_forest_score = Column(Float)
    ensemble_score = Column(Float)
    risk_score_100 = Column(Integer, default=0)
    decision = Column(String, index=True)  # APPROVED, FLAGGED, BLOCKED
    risk_level = Column(String, index=True)  # LOW, MEDIUM, HIGH
    rationale = Column(Text)
    triggered_rules = Column(Text, default="")
    
    # Latency tracking (monotonic milliseconds)
    feature_latency_ms = Column(Float)
    inference_latency_ms = Column(Float)
    rules_latency_ms = Column(Float)
    total_latency_ms = Column(Float)
    
    is_simulated_demo = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class FraudAlertModel(Base):
    __tablename__ = "fraud_alerts"

    id = Column(String, primary_key=True, index=True)
    transaction_id = Column(String, index=True)
    amount = Column(Float)
    currency = Column(String, default="USD")
    risk_score = Column(Float)
    risk_score_100 = Column(Integer, default=0)
    severity = Column(String, index=True)  # CRITICAL, HIGH, MEDIUM
    status = Column(String, default="PENDING", index=True)  # PENDING, UNDER_REVIEW, RESOLVED, FALSE_POSITIVE
    primary_reason = Column(Text)
    model_responsible = Column(String)
    suggested_action = Column(Text, nullable=True)
    case_id = Column(String, nullable=True, index=True)
    assigned_analyst = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)


class CustomerModel(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, index=True)
    pseudonym_label = Column(String)
    risk_tier = Column(String, default="LOW", index=True)  # LOW, MEDIUM, HIGH
    risk_score = Column(Integer, default=0)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    total_transactions = Column(Integer, default=0)
    total_volume_usd = Column(Float, default=0.0)
    avg_transaction_amount = Column(Float, default=0.0)
    flagged_transactions_count = Column(Integer, default=0)
    blocked_transactions_count = Column(Integer, default=0)
    primary_channel = Column(String, default="PAYMENT")
    
    # Velocity meters (rolling)
    tx_count_1m = Column(Integer, default=0)
    tx_count_1h = Column(Integer, default=0)
    tx_count_24h = Column(Integer, default=0)
    volume_1h = Column(Float, default=0.0)
    volume_24h = Column(Float, default=0.0)
    
    # JSON / Comma-separated strings for SQLite/Postgres compatibility
    known_devices = Column(Text, default="")
    known_ip_addresses = Column(Text, default="")
    known_locations = Column(Text, default="")
    notes = Column(Text, nullable=True)


class CaseModel(Base):
    __tablename__ = "fraud_cases"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    alert_id = Column(String, nullable=True, index=True)
    transaction_id = Column(String, nullable=False, index=True)
    customer_id = Column(String, nullable=False, index=True)
    status = Column(String, default="OPEN", index=True)  # OPEN, IN_PROGRESS, CLOSED, ESCALATED_LEGAL
    priority = Column(String, default="HIGH", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    assigned_to = Column(String, default="Unassigned")
    assigned_role = Column(String, default="FRAUD_ANALYST")
    resolution = Column(String, nullable=True)  # CONFIRMED_FRAUD, FALSE_POSITIVE_LEGITIMATE, INCONCLUSIVE
    closure_reason = Column(Text, nullable=True)
    total_exposed_amount_usd = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    notes = relationship("CaseNoteModel", back_populates="case", cascade="all, delete-orphan")
    evidence = relationship("CaseEvidenceModel", back_populates="case", cascade="all, delete-orphan")


class CaseNoteModel(Base):
    __tablename__ = "case_notes"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("fraud_cases.id"), nullable=False, index=True)
    author = Column(String, nullable=False)
    author_role = Column(String, default="FRAUD_ANALYST")
    timestamp = Column(DateTime, default=datetime.utcnow)
    content = Column(Text, nullable=False)

    case = relationship("CaseModel", back_populates="notes")


class CaseEvidenceModel(Base):
    __tablename__ = "case_evidence"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("fraud_cases.id"), nullable=False, index=True)
    evidence_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    confidence = Column(Float, default=1.0)
    added_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("CaseModel", back_populates="evidence")


class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    actor = Column(String, nullable=False)
    actor_role = Column(String, default="FRAUD_ANALYST")
    action = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)  # TRANSACTION, ALERT, CASE, MODEL, CONFIG, AUTH, INTEGRATION
    target_id = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    ip_address = Column(String, default="127.0.0.1")


class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    role = Column(String, default="FRAUD_ANALYST")  # ADMIN, FRAUD_ANALYST, INVESTIGATOR, READ_ONLY
    department = Column(String)
    password_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SystemConfigModel(Base):
    __tablename__ = "system_config"

    key = Column(String, primary_key=True)
    value = Column(String)
