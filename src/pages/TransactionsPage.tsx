import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Transaction } from '../types';

interface TransactionsPageProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  onSelectTransaction,
}) => {
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');
  const [minAmount, setMinAmount] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 25;

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    if (channelFilter !== 'ALL' && tx.type !== channelFilter) return false;
    if (decisionFilter !== 'ALL' && tx.decision !== decisionFilter) return false;
    if (minAmount && tx.amount < Number(minAmount)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        tx.id.toLowerCase().includes(q) ||
        tx.senderId.toLowerCase().includes(q) ||
        tx.receiverId.toLowerCase().includes(q) ||
        tx.decisionReason.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    const headers = [
      'TransactionID',
      'SenderID',
      'ReceiverID',
      'Type',
      'Amount',
      'OldBalanceOrig',
      'NewBalanceOrig',
      'OldBalanceDest',
      'NewBalanceDest',
      'EnsembleRiskScore',
      'Decision',
      'LatencyMs',
      'Timestamp',
    ];

    const rows = filtered.map((t) => [
      t.id,
      t.senderId,
      t.receiverId,
      t.type,
      t.amount,
      t.oldBalanceOrig,
      t.newBalanceOrig,
      t.oldBalanceDest,
      t.newBalanceDest,
      t.ensembleScore,
      t.decision,
      t.latencyMs.totalProcessing,
      t.timestamp,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fraudguard_transactions_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Transaction Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical payment logs, balance reconciliation and fraud decision audit trails
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Ledger (CSV)</span>
        </button>
      </div>

      {/* Filter and Query Strip */}
      <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Channel */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Channel / Type</label>
            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Channels</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="CASH_OUT">CASH_OUT</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="CASH_IN">CASH_IN</option>
              <option value="DEBIT">DEBIT</option>
            </select>
          </div>

          {/* Decision */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Decision Status</label>
            <select
              value={decisionFilter}
              onChange={(e) => {
                setDecisionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">APPROVED (Legitimate)</option>
              <option value="FLAGGED">FLAGGED (Review Required)</option>
              <option value="BLOCKED">BLOCKED (Intercepted)</option>
            </select>
          </div>

          {/* Min Amount */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Min Amount ($ USD)</label>
            <input
              type="number"
              placeholder="e.g. 10000"
              value={minAmount}
              onChange={(e) => {
                setMinAmount(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Text Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ID, account, reason..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
          <div>
            Showing <span className="text-slate-200 font-bold">{filtered.length}</span> matching entries of {transactions.length} total
          </div>
          <div>
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">Tx ID</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Sender</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Amount ($)</th>
                <th className="px-4 py-3 font-medium">Origin Balance</th>
                <th className="px-4 py-3 font-medium">Risk Score</th>
                <th className="px-4 py-3 font-medium">Decision</th>
                <th className="px-4 py-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-slate-400 text-xs">
                    <div className="max-w-md mx-auto space-y-2 font-sans">
                      <div className="text-sm font-semibold text-slate-300">0 Transactions Ingested</div>
                      <p className="text-xs text-slate-500">
                        {transactions.length === 0
                          ? 'The system has started with a clean slate. Start the live stream in Live Monitoring to ingest real-time transactions.'
                          : 'No transactions match the specified filter or search parameters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-cyan-300 font-semibold">{tx.id}</td>
                    <td className="px-4 py-3 text-slate-400 tabular-nums">
                      {tx.timestamp.substring(0, 19).replace('T', ' ')}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{tx.senderId}</td>
                    <td className="px-4 py-3 text-slate-400">{tx.receiverId}</td>
                    <td className="px-4 py-3 text-slate-200">{tx.type}</td>
                    <td className="px-4 py-3 text-slate-100 font-bold tabular-nums">
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-slate-400 tabular-nums">
                      ${tx.oldBalanceOrig.toLocaleString()} &rarr; ${tx.newBalanceOrig.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`tabular-nums font-bold ${
                          tx.ensembleScore >= 0.75
                            ? 'text-rose-400'
                            : tx.ensembleScore >= 0.45
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {(tx.ensembleScore * 100).toFixed(1)}%
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
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <div>
              Showing items {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(filtered.length, currentPage * pageSize)} of {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-slate-800 disabled:opacity-40 text-slate-300 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded bg-slate-800 disabled:opacity-40 text-slate-300 hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
