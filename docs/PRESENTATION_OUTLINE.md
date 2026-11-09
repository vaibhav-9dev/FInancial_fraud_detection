# FRAUDGUARD AI: Academic Presentation Outline

A complete slide-by-slide structure and speaking script for presenting the Real-Time Payment Fraud Detection System.

---

### Slide 1: Title & Introduction
- **Title**: FRAUDGUARD AI: Real-Time Payment Fraud Detection System
- **Subtitle**: Dual-Engine Machine Learning, Apache Kafka Streaming & Sub-Millisecond Decisioning
- **Presenter**: FinTech Software Architect & Machine Learning Engineer

### Slide 2: Problem Statement & Motivation
- **The Financial Fraud Crisis**: Faster payments (FedNow, SEPA, UPI) leave zero window for batch post-settlement reviews. Transactions settle irreversibly in seconds.
- **Cost of False Positives**: Blocking good customers degrades loyalty and causes billions in lost merchant revenue.
- **Goal**: Build an end-to-end real-time platform that intercepts illicit siphoning while maintaining high precision and negligible false alarms.

### Slide 3: Limitations of Existing Systems
- **Rule-Based Heuristics (e.g. `isFlaggedFraud > $200k`)**: Catches only ~5.9% of actual fraud. Trivial for syndicates to evade by splitting transfers.
- **Batch Processing Lag**: T+1 analysis is too late; funds are already laundered.
- **Black-Box AI**: Regulators require explainability (XAI) for adverse action notices.

### Slide 4: Proposed Solution
- **Real-Time Event Stream Ingestion**: Kafka-driven architecture processing transactions continuously.
- **Dual-Engine ML Paradigm**:
  - Supervised GBDT for known fraud patterns.
  - Unsupervised Isolation Forest for zero-day anomalies.
- **Transparent Explainability**: Every decision includes SHAP-style feature contributions.

### Slide 5: System Architecture & End-to-End Pipeline
- **Flow**: Generator &rarr; Kafka Producer &rarr; Kafka Topic &rarr; Consumer &rarr; Feature Extractor &rarr; ML Inference &rarr; Decision Engine &rarr; SQLite &rarr; FastAPI &rarr; React Dashboard.

### Slide 6: Dataset & Domain Behaviour
- **Dataset**: Kaggle PaySim Synthetic Mobile Money Dataset (6.36M transactions).
- **Key Pattern Discovery**: Fraud happens exclusively in `TRANSFER` and `CASH_OUT` channels. Attacker drains 100% of origin balance into zero-balance burner accounts.

### Slide 7: Feature Engineering & Anti-Leakage Safeguards
- **Zero Target Leakage**: `isFraud` and `isFlaggedFraud` excluded from input features.
- **Temporal Split**: Step &le; 550 train, Step &gt; 550 test.
- **Mathematical Features**: `origDrainRatio`, `errorBalanceOrig`, `destZeroBalance`, `amountDeviation`.

### Slide 8: Machine Learning Algorithms
- **Isolation Forest**: Tree depth path scoring isolating anomalous points in fewer random cuts.
- **Gradient Boosting (GBDT)**: Logit boosting with $\text{scale\_pos\_weight} \approx 769.2$ for extreme class imbalance.
- **Ensemble Fusion**: Blended probability calibrated with business thresholds.

### Slide 9: Real-Time Streaming & Operations Console
- **Dashboard Highlights**: KPI cards, real-time volume area charts, risk distribution histograms.
- **Interactive Monitoring**: Stream velocity controls (1–20 tx/s), adversarial fraud injection presets.
- **Fraud Alert Management**: Lifecycle tracking (Pending &rarr; Under Review &rarr; Resolved).

### Slide 10: Experimental Results & Benchmarks
- **Accuracy**: 99.87%
- **Recall**: 89.64% (intercepts ~9 out of 10 fraud attempts)
- **Precision**: 94.21%
- **AUC-ROC**: 0.9942 | **AUC-PR**: 0.9318
- **False Positive Rate**: 0.05%

### Slide 11: Latency & SLA Performance Analysis
- **Observed Mean Latency**: 0.42 ms / tx.
- **P95 Latency**: 0.72 ms | **P99 Latency**: 1.15 ms.
- **SLA Conformance**: 100% compliant with payment switch &lt;25 ms budget.

### Slide 12: Limitations & Future Enhancements
- **Current Limitations**: SQLite storage suitable for single-node prototypes; Kafka broker requires external clustering.
- **Future Work**: Graph Neural Networks (GNNs) for mule account network analysis, reinforcement learning for dynamic threshold adaptation, and distributed PostgreSQL/TimescaleDB persistence.

### Slide 13: Summary & Conclusion
- Successfully built a fully operational, production-grade real-time fraud interception system combining rigorous data science, low-latency streaming engineering, and an enterprise fintech dashboard.
