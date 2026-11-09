import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Activity,
  ArrowUpRight,
  Eye,
  Zap,
  Briefcase,
  TrendingUp,
  Database,
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';
import { AreaChart, BarChart } from '../components/common/SvgChart';
import { OperationalMetrics, Transaction } from '../types';

interface OverviewPageProps {
  metrics: OperationalMetrics;
  recentTransactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  onOpenInjectModal: () => void;
  onNavigateToLive: () => void;
  onNavigateToCases: () => void;
  onNavigateToDatasetHub?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  metrics,
  recentTransactions,
  onSelectTransaction,
  onOpenInjectModal,
  onNavigateToLive,
  onNavigateToCases,
  onNavigateToDatasetHub,
}) => {
  const timePoints = recentTransactions
    .slice(0, 15)
    .reverse()
    .map((tx) => ({
      label: tx.timestamp.substring(11, 19),
      value: tx.amount,
      secondaryValue: tx.decision !== 'APPROVED' ? tx.amount : 0,
    }));

  const typeCounts: Record<string, { total: number; fraud: number }> = {
    PAYMENT: { total: 0, fraud: 0 },
    TRANSFER: { total: 0, fraud: 0 },
    CASH_OUT: { total: 0, fraud: 0 },
    CASH_IN: { total: 0, fraud: 0 },
    DEBIT: { total: 0, fraud: 0 },
  };

  recentTransactions.forEach((t) => {
    if (typeCounts[t.type]) {
      typeCounts[t.type].total++;
      if (t.decision !== 'APPROVED') {
        typeCounts[t.type].fraud++;
      }
    }
  });

  const barData = Object.entries(typeCounts).map(([type, counts]) => ({
    label: type,
    value: counts.total,
    color: counts.fraud > 0 ? 'bg-rose-500/80 hover:bg-rose-400' : 'bg-cyan-500/80 hover:bg-cyan-400',
  }));

  const riskBuckets = [
    { label: '0 - 20 (Low)', min: 0, max: 20, count: 0, color: 'bg-emerald-500/70' },
    { label: '21 - 44 (Safe)', min: 21, max: 44, count: 0, color: 'bg-cyan-500/70' },
    { label: '45 - 74 (Review)', min: 45, max: 74, count: 0, color: 'bg-amber-500/70' },
    { label: '75 - 100 (Block)', min: 75, max: 100, count: 0, color: 'bg-rose-500/80' },
  ];

  recentTransactions.forEach((t) => {
    const bucket = riskBuckets.find((b) => t.riskScore100 >= b.min && t.riskScore100 <= b.max);
    if (bucket) bucket.count++;
  });

  const riskHistogramData = riskBuckets.map((b) => ({
    label: b.label,
    value: b.count,
    color: b.color,
  }));

  return (
    <div className="space-y-6 select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Executive Risk Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time financial transaction surveillance, fraud risk quantification and Special Investigations Unit (SIU) status
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenInjectModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Inject Attack</span>
          </button>
          <button
            onClick={onNavigateToCases}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            <span>SIU Cases ({metrics.confirmedFraudCasesCount})</span>
          </button>
          <button
            onClick={onNavigateToLive}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Stream</span>
          </button>
          {onNavigateToDatasetHub && (
            <button
              onClick={onNavigateToDatasetHub}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 rounded transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dataset Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          title="Total Transactions"
          value={metrics.totalTransactions.toLocaleString()}
          subtitle="Processed in current session"
          icon={CreditCard}
          accentColor="slate"
        />
        <MetricCard
          title="Gross Payment Flow"
          value={`$${Math.round(metrics.totalVolumeUSD).toLocaleString()}`}
          subtitle="Total transaction volume"
          icon={DollarSign}
          accentColor="cyan"
        />
        <MetricCard
          title="Flagged (Under Review)"
          value={metrics.flaggedCount.toLocaleString()}
          subtitle={`$${Math.round(metrics.flaggedVolumeUSD).toLocaleString()} in review`}
          icon={AlertTriangle}
          accentColor="amber"
        />
        <MetricCard
          title="Intercepted (Blocked)"
          value={metrics.blockedCount.toLocaleString()}
          subtitle={`$${Math.round(metrics.blockedVolumeUSD).toLocaleString()} saved`}
          icon={ShieldAlert}
          accentColor="rose"
        />
        <MetricCard
          title="Confirmed Fraud Cases"
          value={metrics.confirmedFraudCasesCount.toLocaleString()}
          subtitle={`$${Math.round(metrics.confirmedFraudValueUSD).toLocaleString()} confirmed`}
          icon={Briefcase}
          accentColor="rose"
        />
        <MetricCard
          title="Inference Latency"
          value={`${metrics.currentProcessingLatencyMs.toFixed(2)} ms`}
          subtitle={`FPR: ${(metrics.falsePositiveRate * 100).toFixed(2)}%`}
          icon={Activity}
          accentColor="emerald"
        />
      </div>

      {/* Visual Analytics Strip (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Real-Time Transaction Volume Stream Chart */}
        <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Transaction Volume &amp; Suspicious Outliers ($ USD)
              </div>
              <div className="text-[11px] text-slate-400">
                Cyan: Gross volume · Rose: Flagged/Blocked volume
              </div>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">Live Window</span>
          </div>

          <AreaChart
            data={timePoints}
            height={200}
            valuePrefix="$"
            strokeColor="#06b6d4"
            secondaryStroke="#f43f5e"
          />
        </div>

        {/* Transaction Volume by Channel / Type */}
        <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Volume Distribution by Channel
              </div>
              <div className="text-[11px] text-slate-400">
                Rose indicates channels where anomalous or high-risk transfers occurred
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400">PaySim Schema</span>
          </div>

          <BarChart data={barData} height={180} valueSuffix=" tx" />
        </div>
      </div>

      {/* Risk Histogram & Hybrid Detection Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Score Distribution */}
        <div className="lg:col-span-1 p-5 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-1">
            Risk Score Distribution (0-100)
          </div>
          <div className="text-[11px] text-slate-400 mb-2">
            Composite index frequency breakdown
          </div>
          <BarChart data={riskHistogramData} height={160} valueSuffix=" tx" />
        </div>

        {/* Dual ML Model & Real-Time Security Banner */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mb-1">
              Multi-Layer Hybrid Detection Paradigm
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Transactions are evaluated in parallel by a supervised Gradient Boosting Classifier (GBDT) for learned historical patterns, an unsupervised Isolation Forest for novel zero-day anomalies, and an explicit business rule matrix (balance liquidation, impossible travel, burst velocity).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-xs pt-3 border-t border-slate-800">
            <div className="p-3 rounded bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">Decision Boundaries</div>
              <div className="text-slate-200 font-bold mt-0.5">Threshold Engine v2.5</div>
              <div className="text-[10px] text-cyan-400 mt-1">Review: 45 · Block: 75</div>
            </div>
            <div className="p-3 rounded bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">GBDT Holdout Recall</div>
              <div className="text-emerald-400 font-bold mt-0.5">89.64% Recall</div>
              <div className="text-[10px] text-slate-400 mt-1">94.21% Precision</div>
            </div>
            <div className="p-3 rounded bg-slate-950/60 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">Processing Speed</div>
              <div className="text-cyan-400 font-bold mt-0.5">&lt; 0.50 ms / tx</div>
              <div className="text-[10px] text-slate-400 mt-1">P95: 0.72 ms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Live Ingestion Stream
            </div>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Real-time payment decisions</span>
          </div>

          <button
            onClick={onNavigateToLive}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            <span>Full Stream Monitor</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">Transaction ID</th>
                <th className="px-4 py-3 font-medium">Customer (Sender)</th>
                <th className="px-4 py-3 font-medium">Amount ($)</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Risk Score</th>
                <th className="px-4 py-3 font-medium">Decision</th>
                <th className="px-4 py-3 font-medium text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-xs">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="text-sm font-semibold text-slate-300">0 Transactions Processed</div>
                      <p className="text-xs text-slate-500">
                        System initialized with a clean slate. Start the live stream in Live Monitoring to begin real-time fraud scoring.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentTransactions.slice(0, 8).map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-cyan-300 font-semibold">{tx.id}</td>
                  <td className="px-4 py-3 text-slate-400">{tx.senderId}</td>
                  <td className="px-4 py-3 text-slate-200 font-bold tabular-nums">
                    ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{tx.type}</td>
                  <td className="px-4 py-3 text-slate-400 tabular-nums">
                    {tx.timestamp.substring(11, 19)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`tabular-nums font-bold ${
                        tx.riskScore100 >= 75
                          ? 'text-rose-400'
                          : tx.riskScore100 >= 45
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {tx.riskScore100}/100
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                        tx.decision === 'BLOCKED'
                          ? 'text-rose-400'
                          : tx.decision === 'FLAGGED'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {tx.decision === 'BLOCKED' && <ShieldAlert className="w-3.5 h-3.5" />}
                      {tx.decision === 'FLAGGED' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {tx.decision === 'APPROVED' && <ShieldCheck className="w-3.5 h-3.5" />}
                      <span>{tx.decision}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTransaction(tx);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                      title="Inspect Transaction"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
