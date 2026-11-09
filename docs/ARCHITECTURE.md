# System Architecture: FRAUDGUARD AI

## 1. High-Level Streaming & Scoring Topology

```
+-----------------------------------+
|  Transaction Stream Generator     | (PaySim Statistical Simulator)
+-----------------------------------+
                  |
                  v
+-----------------------------------+
|      Apache Kafka Producer        | (Topic: payment-transactions)
+-----------------------------------+
                  |
                  v  (Partitioned Broker, acks=1)
+-----------------------------------+
|      Apache Kafka Consumer        | (Consumer Group: fraud-scoring-workers)
+-----------------------------------+
                  |
                  v
+-----------------------------------+
|     Feature Engineering Engine    | (Zero Target Leakage)
|  - origDrainRatio                 |
|  - errorBalanceOrig / Dest        |
|  - isHighRiskType (TRANSFER/CASH) |
|  - amountDeviationFromMean        |
+-----------------------------------+
                  |
                  v
+-----------------------------------+
|     Dual-ML Inference Engine      |
|  [Model 1: Isolation Forest]      |  (Unsupervised Anomaly Depth)
|  [Model 2: Gradient Boosting]     |  (Supervised Calibrated Probabilities)
+-----------------------------------+
                  |
                  v
+-----------------------------------+
|    Fraud Decision Engine (v2)     |
|  - Score < 0.45  --> APPROVED     |
|  - 0.45 <= Score < 0.75 --> FLAG  |
|  - Score >= 0.75 --> BLOCKED      |
+-----------------------------------+
          /               \
         v                 v
+----------------+   +--------------------+
| SQLite / DB    |   | Fraud Alert Center |
| Persistence    |   | (Critical & High)  |
+----------------+   +--------------------+
         ^
         |
+-----------------------------------+
|       FastAPI REST Service        | (Port 8000 / Swagger UI)
+-----------------------------------+
         ^
         | (HTTP / REST & WebSocket)
+-----------------------------------+
|      React 19 Fintech Console     | (Port 3000)
+-----------------------------------+
```

## 2. Key Architecture Principles

1. **Sub-Millisecond Pipeline Budget**:
   Every stage—from feature derivation to tree traversal—is profiled using monotonic timers (`performance.now()` in browser, `time.perf_counter()` in Python), achieving total evaluation latency &lt;0.50 ms per payment.
2. **Horizontal Consumer Scalability**:
   Kafka topics can be partitioned across multiple consumer nodes with independent consumer group offsets.
3. **Decoupled Persistence**:
   Database inserts and audit logs are buffered asynchronously to ensure zero backpressure on payment gateway response times.
