# Machine Learning Methodology & Anti-Leakage Specification

## 1. Feature Engineering & Mathematical Transformations

To expose fraud signatures without target leakage, we engineer domain-specific behavioural features:

1. **Origin Balance Drain Ratio (`origDrainRatio`)**:
   $$\text{origDrainRatio} = \frac{\text{amount}}{\text{oldbalanceOrg} + 1.0}$$
   A value near 1.0 indicates total liquidation of the account, a defining hallmark of account takeover.

2. **Accounting Discrepancy Features (`errorBalanceOrig` & `errorBalanceDest`)**:
   $$\text{errorBalanceOrig} = |\text{newbalanceOrig} - (\text{oldbalanceOrg} - \text{amount})|$$
   $$\text{errorBalanceDest} = |\text{newbalanceDest} - (\text{oldbalanceDest} + \text{amount})|$$
   In fraud transactions, destination balances often remain static at zero or fail to increment naturally.

3. **High-Risk Channel Indicator (`isHighRiskType`)**:
   Binary flag for `TRANSFER` or `CASH_OUT`.

4. **Velocity Deviation Ratio (`amountDeviation`)**:
   Ratio of transaction magnitude against the cardholder's 24-hour moving baseline.

---

## 2. Anti-Leakage Rules

- **Zero Target Leakage**: Neither `isFraud` nor `isFlaggedFraud` are ever provided to models.
- **Strict Chronological Train/Test Partitioning**:
  - `Train Set`: Transactions with $\text{step} \le 550$ (simulating historical data up to day 22).
  - `Holdout Test Set`: Transactions with $\text{step} > 550$ (out-of-time evaluation across days 23–31).
  - This strictly prevents future-data lookahead and cross-validation leakage.

---

## 3. Algorithm Specifications

### Model 1: Isolation Forest (Unsupervised)
- Detects anomalies in feature space by constructing random recursive partitioning trees.
- Anomaly score function:
  $$s(x, n) = 2^{-\frac{E(h(x))}{c(n)}}$$
  where $E(h(x))$ is average path length across 100 trees and $c(n)$ is average path length of unsuccessful search in a BST.

### Model 2: Gradient Boosting Decision Trees (Supervised)
- Fits an ensemble of shallow decision trees ($\text{depth}=5$, $\eta=0.05$) to the negative gradient of the log-loss function.
- Class weighting: $\text{scale\_pos\_weight} \approx 769.2$ compensates for extreme 0.13% class imbalance.
- Calibrated fraud probability output via logistic sigmoid.

### Hybrid Ensemble:
$$\text{Risk Score} = 0.70 \times P_{\text{GBDT}}(\text{Fraud}) + 0.30 \times S_{\text{IsolationForest}}$$
Decision Rule Engine:
- $\text{Risk} < 0.45 \longrightarrow \textbf{APPROVED}$
- $0.45 \le \text{Risk} < 0.75 \longrightarrow \textbf{FLAGGED}$
- $\text{Risk} \ge 0.75 \longrightarrow \textbf{BLOCKED}$
