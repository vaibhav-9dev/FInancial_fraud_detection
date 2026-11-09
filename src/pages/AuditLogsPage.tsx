import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  ShieldAlert,
  User,
  Sliders,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditLogsPageProps {
  logs: AuditLogEntry[];
}

export const AuditLogsPage: React.FC<AuditLogsPageProps> = ({ logs }) => {
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = logs.filter((log) => {
    if (categoryFilter !== 'ALL' && log.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        log.id.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.targetId.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleExportAuditCSV = () => {
    const headers = ['AuditID', 'TimestampUTC', 'Actor', 'ActorRole', 'Action', 'Category', 'TargetID', 'Details', 'IPAddress'];
    const rows = filtered.map((l) => [
      l.id,
      l.timestamp,
      l.actor,
      l.actorRole,
      l.action,
      l.category,
      l.targetId,
      `"${l.details.replace(/"/g, '""')}"`,
      l.ipAddress,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `fraudguard_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'TRANSACTION':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30';
      case 'ALERT':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/30';
      case 'CASE':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
      case 'MODEL':
        return 'text-indigo-400 bg-indigo-950/60 border-indigo-500/30';
      case 'CONFIG':
        return 'text-purple-400 bg-purple-950/60 border-purple-500/30';
      case 'AUTH':
        return 'text-blue-400 bg-blue-950/60 border-blue-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Immutable Audit Log &amp; Governance Trail</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete tamper-evident log of analyst investigations, rule changes, model deployments, and disposition sign-offs
          </p>
        </div>

        <button
          onClick={handleExportAuditCSV}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Event Categories</option>
            <option value="TRANSACTION">TRANSACTION Events</option>
            <option value="ALERT">ALERT Generation &amp; Triage</option>
            <option value="CASE">CASE Management Actions</option>
            <option value="MODEL">MODEL Version &amp; Pipeline</option>
            <option value="CONFIG">CONFIG Changes</option>
            <option value="AUTH">AUTH &amp; Session Switches</option>
          </select>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor, action, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Showing {filtered.length} Recorded Governance Events</span>
          <span>Compliance Standard: SOC-2 / PCI-DSS Audit Trail</span>
        </div>

        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-medium">Event ID</th>
                <th className="px-4 py-3 font-medium">Timestamp (UTC)</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Target ID</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No audit records found matching the current search parameters.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400">{entry.id}</td>
                    <td className="px-4 py-2.5 text-slate-400 tabular-nums">
                      {entry.timestamp.substring(0, 19).replace('T', ' ')}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-200">{entry.actor}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-[11px]">{entry.actorRole}</td>
                    <td className="px-4 py-2.5 text-cyan-300 font-semibold">{entry.action}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadge(entry.category)}`}>
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-amber-300 font-bold">{entry.targetId}</td>
                    <td className="px-4 py-2.5 text-slate-300 max-w-md truncate">{entry.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
