import React from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Briefcase,
  Users,
  MapPin,
  Smartphone,
  Shield,
} from 'lucide-react';
import { Transaction } from '../../types';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onCreateCaseFromTx?: (txId: string) => void;
  onNavigateToCustomer?: (customerId: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onCreateCaseFromTx,
  onNavigateToCustomer,
}) => {
  if (!transaction) return null;

  const getDecisionBadge = () => {
    switch (transaction.decision) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400">
            <CheckCircle className="w-4 h-4" /> APPROVED
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-400">
            <AlertTriangle className="w-4 h-4" /> FLAGGED FOR REVIEW
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-rose-400">
            <ShieldAlert className="w-4 h-4" /> BLOCKED (SIMULATED INTERCEPTION)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-700/90 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold font-mono text-slate-100">{transaction.id}</div>
            <span className="text-slate-600">·</span>
            <div>{getDecisionBadge()}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-xs text-slate-300">
          {/* Top Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-950/60 border border-slate-800 font-mono">
            <div>
              <div className="text-slate-500 text-[11px]">Amount</div>
              <div className="text-lg font-bold text-cyan-400 tabular-nums">
                ${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Channel</div>
              <div className="text-sm font-semibold text-slate-200">{transaction.type}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Composite Risk Score</div>
              <div
                className={`text-lg font-bold tabular-nums ${
                  transaction.riskScore100 >= 75
                    ? 'text-rose-400'
                    : transaction.riskScore100 >= 45
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {transaction.riskScore100}/100
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[11px]">Processing Latency</div>
              <div className="text-sm font-bold text-slate-200 tabular-nums">
                {transaction.latencyMs.totalProcessing.toFixed(3)} ms
              </div>
            </div>
          </div>

          {/* Account Balances Matrix */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
              PaySim Balance Transition Analysis
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Origin Account */}
              <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Customer (Origin)</span>
                  <div className="flex items-center gap-1.5 font-mono text-cyan-300 font-bold">
                    <span>{transaction.senderId}</span>
                    {onNavigateToCustomer && (
                      <button
                        onClick={() => {
                          onNavigateToCustomer(transaction.senderId);
                          onClose();
                        }}
                        className="text-[10px] text-cyan-400 hover:underline inline-flex items-center gap-0.5 ml-1"
                      >
                        <Users className="w-3 h-3" /> Profile
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between font-mono py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Old Balance:</span>
                  <span className="tabular-nums">${transaction.oldBalanceOrig.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-mono py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">New Balance:</span>
                  <span className="tabular-nums">${transaction.newBalanceOrig.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-mono pt-2 text-[11px]">
                  <span className="text-slate-500">Effective Debit:</span>
                  <span className="text-rose-400 font-bold tabular-nums">
                    -${(transaction.oldBalanceOrig - transaction.newBalanceOrig).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Destination Account */}
              <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Recipient (Destination)</span>
                  <span className="font-mono text-cyan-300 font-bold">{transaction.receiverId}</span>
                </div>
                <div className="flex items-center justify-between font-mono py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Old Balance:</span>
                  <span className="tabular-nums">${transaction.oldBalanceDest.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-mono py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">New Balance:</span>
                  <span className="tabular-nums">${transaction.newBalanceDest.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-mono pt-2 text-[11px]">
                  <span className="text-slate-500">Effective Inflow:</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    +${(transaction.newBalanceDest - transaction.oldBalanceDest).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Triggered Rule Matrix */}
          {transaction.triggeredRules && transaction.triggeredRules.length > 0 && (
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                Triggered Rule Matrix Signals
              </div>
              <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-900/40 space-y-1.5 font-mono text-xs">
                {transaction.triggeredRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Model ML Evaluation */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
              Model Diagnostic Outputs
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-200">Gradient Boosting</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {(transaction.gradientBoostingScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">Supervised calibrated fraud probability.</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-200">Random Forest</span>
                  <span className="font-mono text-indigo-400 font-bold">
                    {transaction.randomForestBaselineScore ? (transaction.randomForestBaselineScore * 100).toFixed(1) + '%' : 'N/A'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">Supervised 50-tree bagging baseline.</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-200">Isolation Forest</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {(transaction.isolationForestScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">Unsupervised geometric anomaly score.</div>
              </div>
            </div>
          </div>

          {/* Decision Reason & Feature Explanations (XAI) */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
              Explainable AI (XAI) Rationale
            </div>
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="text-xs text-slate-300 font-medium pb-2 border-b border-slate-800">
                <span className="text-slate-400">Decision Rationale: </span>
                {transaction.decisionReason}
              </div>

              <div className="space-y-1.5">
                {transaction.featureContributions.map((fc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800/80 font-mono text-xs"
                  >
                    <div>
                      <span className="text-slate-300 font-semibold">{fc.label}</span>
                      <span className="text-slate-500 ml-2">({fc.value})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold ${
                          fc.impact === 'HIGH_FRAUD'
                            ? 'text-rose-400'
                            : fc.impact === 'MODERATE_FRAUD'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {fc.impact}
                      </span>
                      <span
                        className={`tabular-nums font-bold ${
                          fc.scoreContribution > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {fc.scoreContribution > 0 ? `+${fc.scoreContribution}` : fc.scoreContribution}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monotonic Execution Telemetry */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
              Monotonic Microsecond Latency Breakdown
            </div>
            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Feature Extraction</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">
                  {transaction.latencyMs.featureExtraction.toFixed(3)} ms
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Model Inference</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">
                  {(
                    transaction.latencyMs.isolationForestInference +
                    transaction.latencyMs.gradientBoostingInference
                  ).toFixed(3)}{' '}
                  ms
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">Decision Engine</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">
                  {transaction.latencyMs.decisionRules.toFixed(3)} ms
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">DB Persistence</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">
                  {transaction.latencyMs.dbPersistence.toFixed(3)} ms
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Idempotency Key: {transaction.idempotencyKey || 'N/A'}
          </div>

          <div className="flex items-center gap-2">
            {onCreateCaseFromTx && transaction.decision !== 'APPROVED' && (
              <button
                onClick={() => {
                  onCreateCaseFromTx(transaction.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Escalate to SIU Case</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
