import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Search,
  Check,
  UserCheck,
  Briefcase,
  ThumbsDown,
  X,
} from 'lucide-react';
import { FraudAlert, AlertSeverity, AlertStatus, Transaction } from '../types';

interface AlertsPageProps {
  alerts: FraudAlert[];
  onUpdateAlertStatus: (alertId: string, status: AlertStatus, notes?: string) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onCreateCaseFromAlert: (alertId: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  onUpdateAlertStatus,
  onSelectTransaction,
  onCreateCaseFromAlert,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'PENDING').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH' && a.status === 'PENDING').length;
  const underReviewCount = alerts.filter((a) => a.status === 'UNDER_REVIEW' || a.status === 'ACKNOWLEDGED').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  const filtered = alerts.filter((alert) => {
    if (severityFilter !== 'ALL' && alert.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && alert.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        alert.id.toLowerCase().includes(q) ||
        alert.transactionId.toLowerCase().includes(q) ||
        alert.primaryReason.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Fraud Alert Operations &amp; Triage Center</h1>
        <p className="text-xs text-slate-400 mt-1">
          Investigate anomalous payment alerts, triage machine learning signals, and escalate to Special Investigations Unit (SIU) cases
        </p>
      </div>

      {/* Alert Status KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Critical Unresolved</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
            {criticalCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Blocked by High-Risk Policy</div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>High Risk Pending</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
            {highCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting Tier-2 Triage</div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>In Triage / Review</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
            {underReviewCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Acknowledged by Analysts</div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Resolved / Cleared</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {resolvedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Disposition Recorded</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL (&gt;75% Risk)</option>
              <option value="HIGH">HIGH (45% - 75%)</option>
              <option value="MEDIUM">MEDIUM Risk</option>
              <option value="LOW">LOW Risk</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="FALSE_POSITIVE">FALSE POSITIVE</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts by reason, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      {/* Alert Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400 text-xs font-mono space-y-2">
            <div className="text-slate-300 font-semibold font-sans text-sm">0 Active Alerts</div>
            <p className="text-xs text-slate-500 font-sans max-w-md mx-auto">
              {alerts.length === 0
                ? 'No alerts generated yet. Start the live stream in Live Monitoring to ingest transactions; flagged and blocked transactions will automatically trigger alerts here.'
                : 'No alerts found matching the current filter criteria.'}
            </p>
          </div>
        ) : (
          filtered.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg bg-slate-900/90 border transition-all ${
                alert.severity === 'CRITICAL'
                  ? 'border-rose-900/40 hover:border-rose-500/50'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-xs font-bold text-slate-100">{alert.id}</div>
                  <span className="text-slate-600">·</span>
                  <div className="font-mono text-xs text-cyan-300 font-bold">{alert.transactionId}</div>
                  <span className="text-slate-600">·</span>
                  <span
                    className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                        : alert.severity === 'HIGH'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {alert.severity} SEVERITY
                  </span>
                  {alert.caseId && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                      Linked: {alert.caseId}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-400">Risk Score:</span>
                  <span
                    className={`font-bold tabular-nums ${
                      alert.riskScore100 >= 75
                        ? 'text-rose-400'
                        : alert.riskScore100 >= 45
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {alert.riskScore100}/100
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 tabular-nums">
                    {alert.timestamp.substring(0, 19).replace('T', ' ')}
                  </span>
                </div>
              </div>

              {/* Alert Content Description */}
              <div className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-slate-200 font-medium">
                    {alert.primaryReason}
                  </div>
                  {alert.suggestedAction && (
                    <div className="text-[11px] text-amber-400/90 font-mono">
                      Suggested Action: {alert.suggestedAction}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                    <span>Model: {alert.modelResponsible}</span>
                    <span>·</span>
                    <span>Amount: ${alert.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span>·</span>
                    <span>Status: <span className="text-slate-300 font-bold">{alert.status}</span></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectTransaction(alert.transaction)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View Tx</span>
                  </button>

                  {alert.status === 'PENDING' && (
                    <button
                      onClick={() => onUpdateAlertStatus(alert.id, 'ACKNOWLEDGED')}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 rounded transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  )}

                  {!alert.caseId && alert.status !== 'RESOLVED' && (
                    <button
                      onClick={() => onCreateCaseFromAlert(alert.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-colors shadow-sm"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Create SIU Case</span>
                    </button>
                  )}

                  {alert.status !== 'FALSE_POSITIVE' && alert.status !== 'RESOLVED' && (
                    <button
                      onClick={() => onUpdateAlertStatus(alert.id, 'FALSE_POSITIVE', 'Verified genuine cardholder transaction')}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                      title="Mark as False Alarm / Benign"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>False Alarm</span>
                    </button>
                  )}

                  {alert.status !== 'RESOLVED' && (
                    <button
                      onClick={() => onUpdateAlertStatus(alert.id, 'RESOLVED', 'Reviewed by senior risk analyst')}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 rounded transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Resolve</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
