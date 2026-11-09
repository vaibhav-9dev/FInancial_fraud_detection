import React, { useState } from 'react';
import {
  BrainCircuit,
  Database,
  Layers,
  ShieldCheck,
  Binary,
  GitBranch,
  Info,
  CheckCircle2,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { OFFLINE_PAYSIM_BENCHMARK } from '../services/storage';

export const MlAnalyticsPage: React.FC = () => {
  const [activeModelTab, setActiveModelTab] = useState<'GRADIENT_BOOSTING' | 'RANDOM_FOREST' | 'ISOLATION_FOREST' | 'FEATURE_ENGINEERING'>('GRADIENT_BOOSTING');

  const benchmark = OFFLINE_PAYSIM_BENCHMARK;

  return (
    <div className="space-y-6 select-none">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Machine Learning Architecture, Models &amp; Benchmarks</h1>
        <p className="text-xs text-slate-400 mt-1">
          Dual-engine supervised GBDT, Random Forest baseline, and unsupervised Isolation Forest trained on PaySim transaction logs
        </p>
      </div>

      {/* Model Selection Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg max-w-2xl font-mono text-xs">
        <button
          onClick={() => setActiveModelTab('GRADIENT_BOOSTING')}
          className={`flex-1 py-1.5 px-3 rounded font-medium transition-colors ${
            activeModelTab === 'GRADIENT_BOOSTING'
              ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Model 1: Gradient Boosting (GBDT)
        </button>
        <button
          onClick={() => setActiveModelTab('RANDOM_FOREST')}
          className={`flex-1 py-1.5 px-3 rounded font-medium transition-colors ${
            activeModelTab === 'RANDOM_FOREST'
              ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Model 2: Random Forest (Baseline)
        </button>
        <button
          onClick={() => setActiveModelTab('ISOLATION_FOREST')}
          className={`flex-1 py-1.5 px-3 rounded font-medium transition-colors ${
            activeModelTab === 'ISOLATION_FOREST'
              ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Model 3: Isolation Forest
        </button>
        <button
          onClick={() => setActiveModelTab('FEATURE_ENGINEERING')}
          className={`flex-1 py-1.5 px-3 rounded font-medium transition-colors ${
            activeModelTab === 'FEATURE_ENGINEERING'
              ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Feature Pipeline &amp; Safeguards
        </button>
      </div>

      {/* Content depending on active tab */}
      {activeModelTab === 'GRADIENT_BOOSTING' && (
        <div className="space-y-5">
          <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <BrainCircuit className="w-4 h-4" />
              <span>Supervised Gradient Boosting Decision Trees (Scikit-Learn GBDT / HistGradientBoosting)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The Gradient Boosting Classifier fits pseudo-residuals of previous trees iteratively via gradient descent on binary log-loss. It incorporates class re-weighting (<code className="text-cyan-300 font-mono">scale_pos_weight = 769.2</code>) to compensate for the extreme 0.13% fraud prior, generating well-calibrated fraud probabilities between 0.0 and 1.0.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs pt-2">
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Objective Loss</div>
                <div className="text-slate-200 font-bold mt-0.5">Binary Cross-Entropy</div>
                <div className="text-[10px] text-cyan-400 mt-1">L2 Regularized (lambda = 1.5)</div>
              </div>
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Class Imbalance Weight</div>
                <div className="text-slate-200 font-bold mt-0.5">scale_pos_weight: 769.2</div>
                <div className="text-[10px] text-emerald-400 mt-1">Addresses 0.13% prior</div>
              </div>
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Tree Topology</div>
                <div className="text-slate-200 font-bold mt-0.5">150 Estimators, Max Depth 6</div>
                <div className="text-[10px] text-slate-400 mt-1">Learning Rate eta = 0.05</div>
              </div>
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Holdout PR-AUC</div>
                <div className="text-emerald-400 font-bold mt-0.5">0.9318 PR-AUC</div>
                <div className="text-[10px] text-slate-400 mt-1">ROC-AUC: 0.9942</div>
              </div>
            </div>
          </div>

          {/* Feature Importance Table */}
          <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-3">
              PaySim GBDT Feature Importance (Gini Impurity Reduction)
            </div>

            <div className="space-y-3">
              {benchmark.featureImportance.map((feat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-200 font-semibold">{feat.feature}</span>
                    <span className="text-cyan-400 font-bold tabular-nums">
                      {(feat.importance * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all"
                      style={{ width: `${feat.importance * 100 * 2.5}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400">{feat.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeModelTab === 'RANDOM_FOREST' && (
        <div className="space-y-5">
          <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <GitBranch className="w-4 h-4" />
              <span>Comparison Baseline: Random Forest Bagging Ensemble</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Random Forest constructs an ensemble of 100 de-correlated decision trees using bootstrap aggregation (bagging) and random feature subspace selection. It serves as an offline performance benchmark against the sequential gradient boosting architecture.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs pt-2">
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Ensemble Paradigm</div>
                <div className="text-slate-200 font-bold mt-0.5">Parallel Bagging (100 Trees)</div>
                <div className="text-[10px] text-indigo-400 mt-1">Bootstrapped resamples</div>
              </div>
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Holdout Recall</div>
                <div className="text-emerald-400 font-bold mt-0.5">84.20% Recall</div>
                <div className="text-[10px] text-slate-400 mt-1">Precision: 91.50%</div>
              </div>
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Comparison vs GBDT</div>
                <div className="text-amber-400 font-bold mt-0.5">Higher Memory / Slower</div>
                <div className="text-[10px] text-slate-400 mt-1">0.42 ms vs 0.18 ms GBDT</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModelTab === 'ISOLATION_FOREST' && (
        <div className="space-y-5">
          <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Unsupervised Isolation Forest (Zero-Day Anomaly Detection)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The Isolation Forest operates completely independent of historical fraud labels. It isolates anomalous transactions by randomly partitioning feature values across 100 recursive isolation trees. Shorter path length indicates an extreme anomaly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs pt-2">
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Path Length Principle</div>
                <div className="text-slate-200 font-bold mt-0.5">s(x, n) = 2^(-E(h(x)) / c(n))</div>
                <div className="text-[10px] text-amber-400 mt-1">Shorter path depth = Anomaly</div>
              </div>
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Label Independence</div>
                <div className="text-slate-200 font-bold mt-0.5">100% Unsupervised</div>
                <div className="text-[10px] text-emerald-400 mt-1">Zero reliance on ground truth tags</div>
              </div>
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-slate-500 text-[10px]">Ensemble Size</div>
                <div className="text-slate-200 font-bold mt-0.5">100 Isolation Trees</div>
                <div className="text-[10px] text-slate-400 mt-1">Subsample size: 256 per tree</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModelTab === 'FEATURE_ENGINEERING' && (
        <div className="space-y-5">
          <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict Data Integrity &amp; Leakage Prevention Safeguards</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="p-3.5 rounded bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Target Leakage Elimination</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Neither <code className="text-cyan-300 font-mono">isFraud</code> nor PaySim's simulated rule heuristic <code className="text-cyan-300 font-mono">isFlaggedFraud</code> are ever permitted in feature vectors. Models strictly predict from behavioural attributes observable at ingestion time.
                </p>
              </div>

              <div className="p-3.5 rounded bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chronological Train/Test Split</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Random k-fold CV creates temporal data leakage. We enforce strict chronological partitioning: transactions from PaySim steps 1 to 550 comprise the training set, while steps 551 to 744 form the out-of-time evaluation test holdout.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-3">
              Domain-Engineered Behavioural Feature Set
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/60 text-slate-400 text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Feature Name</th>
                    <th className="px-4 py-2.5">Formula / Definition</th>
                    <th className="px-4 py-2.5">Financial Fraud Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300">
                  <tr>
                    <td className="px-4 py-2.5 text-cyan-300 font-semibold">origDrainRatio</td>
                    <td className="px-4 py-2.5 text-slate-400">amount / (oldBalanceOrig + 1)</td>
                    <td className="px-4 py-2.5 text-slate-400">Detects account liquidation where adversary drains &gt;95% of available funds.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-cyan-300 font-semibold">errorBalanceOrig</td>
                    <td className="px-4 py-2.5 text-slate-400">|newBalanceOrig - (oldBalanceOrig - amount)|</td>
                    <td className="px-4 py-2.5 text-slate-400">Identifies accounting discrepancies between expected debit and recorded ledger.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-cyan-300 font-semibold">isHighRiskType</td>
                    <td className="px-4 py-2.5 text-slate-400">type in ['TRANSFER', 'CASH_OUT'] ? 1 : 0</td>
                    <td className="px-4 py-2.5 text-slate-400">99.87% of PaySim money-laundering cascades utilize Transfer to Cash-Out pairs.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-cyan-300 font-semibold">destZeroBalance</td>
                    <td className="px-4 py-2.5 text-slate-400">oldDest == 0 &amp;&amp; newDest == 0</td>
                    <td className="px-4 py-2.5 text-slate-400">Detects burner and synthetic merchant accounts created specifically to absorb illicit funds.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-cyan-300 font-semibold">amountDeviation</td>
                    <td className="px-4 py-2.5 text-slate-400">amount / historicalAvgAmount</td>
                    <td className="px-4 py-2.5 text-slate-400">Measures sudden velocity deviations relative to individual cardholder historical averages.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
