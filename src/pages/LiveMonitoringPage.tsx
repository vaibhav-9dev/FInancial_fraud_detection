import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Zap,
  Filter,
  Search,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Trash2,
  Radio,
  Layers,
  Database,
} from 'lucide-react';
import { StreamSimulator, StreamStatus, WebSocketStatus } from '../services/streamSimulator';
import { Transaction, TransactionType, DecisionState, SystemConfig } from '../types';
import { DatasetService, IngestedDataset } from '../services/datasetService';

interface LiveMonitoringPageProps {
  streamStatus: StreamStatus;
  wsStatus: WebSocketStatus;
  currentTPS: number;
  transactions: Transaction[];
  config: SystemConfig;
  onUpdateConfig: (newConfig: Partial<SystemConfig>) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenInjectModal: () => void;
  onClearHistory: () => void;
  onSimulateGlitch: () => void;
  onNavigateToDatasetHub?: () => void;
}

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({
  streamStatus,
  wsStatus,
  currentTPS,
  transactions,
  config,
  onUpdateConfig,
  onSelectTransaction,
  onOpenInjectModal,
  onClearHistory,
  onSimulateGlitch,
  onNavigateToDatasetHub,
}) => {
  const simulator = StreamSimulator.getInstance();
  const [activeDataset, setActiveDataset] = useState<IngestedDataset | null>(() =>
    DatasetService.getInstance().getActiveDataset()
  );

  useEffect(() => {
    return DatasetService.getInstance().subscribe((ds) => setActiveDataset(ds));
  }, []);

  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rateSlider, setRateSlider] = useState<number>(config.generationRatePerSec);

  const handleStart = () => {
    const started = simulator.start();
    if (!started && onNavigateToDatasetHub) {
      if (window.confirm('No dataset loaded. Would you like to open the Dataset Hub to upload a file or insert a dataset link?')) {
        onNavigateToDatasetHub();
      }
    }
  };
  const handlePause = () => simulator.pause();
  const handleStop = () => simulator.stop();

  const handleRateChange = (newRate: number) => {
    setRateSlider(newRate);
    onUpdateConfig({ generationRatePerSec: newRate });
  };

  const handleInjectBatch = () => {
    if (!activeDataset || activeDataset.records.length === 0) {
      if (onNavigateToDatasetHub) {
        onNavigateToDatasetHub();
      }
      return;
    }
    const sampleBatch = activeDataset.records.slice(0, 5).map((r) => ({
      type: r.type,
      amount: r.amount,
      oldBalanceOrig: r.oldBalanceOrig,
      newBalanceOrig: r.newBalanceOrig,
      oldBalanceDest: r.oldBalanceDest,
      newBalanceDest: r.newBalanceDest,
      step: r.step,
      senderId: r.senderId,
      receiverId: r.receiverId,
      historicalAvgAmount: Math.round(r.oldBalanceOrig * 0.4) || r.amount,
      isSimulatedDemo: false,
      location: r.isFraud ? 'Frankfurt, DE' : 'New York, US',
    }));
    simulator.injectBatchTransactions(sampleBatch);
  };

  const filtered = transactions.filter((tx) => {
    if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;
    if (decisionFilter !== 'ALL' && tx.decision !== decisionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        tx.id.toLowerCase().includes(q) ||
        tx.senderId.toLowerCase().includes(q) ||
        tx.receiverId.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 select-none">
      {/* Stream Engine Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-lg bg-slate-900/90 border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Live Transaction Surveillance
            </h1>
            <span
              className={`font-mono text-xs px-2 py-0.5 rounded font-semibold ${
                streamStatus === 'RUNNING'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                  : streamStatus === 'PAUSED'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              STREAM: {streamStatus}
            </span>
            {activeDataset ? (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-semibold">
                DATASET: {activeDataset.name} ({activeDataset.totalRows.toLocaleString()} rows)
              </span>
            ) : (
              <button
                onClick={onNavigateToDatasetHub}
                className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60 transition-colors font-semibold"
              >
                NO DATASET LOADED &rarr; Add File / Link
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Kafka &amp; WebSocket ingestion pipeline with continuous feature derivation and multi-model inference
          </p>
        </div>

        {/* Primary Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {streamStatus === 'RUNNING' ? (
            <button
              onClick={handlePause}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 rounded transition-colors shadow-sm"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause Stream</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Stream</span>
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={streamStatus === 'IDLE'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded border border-slate-700 transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleInjectBatch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 rounded transition-colors"
            title="Simulate POST /api/v1/transactions/batch"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ingest PaySim Batch (5x)</span>
          </button>

          <button
            onClick={onOpenInjectModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Inject Attack</span>
          </button>

          <button
            onClick={onClearHistory}
            className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            title="Clear transaction history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stream Velocity & WebSocket State Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 font-mono text-xs">
        {/* Rate slider */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400">Stream Velocity</span>
            <span className="text-cyan-300 font-bold tabular-nums">{rateSlider} tx/sec</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={rateSlider}
            onChange={(e) => handleRateChange(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* Real-time throughput */}
        <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800">
          <span className="text-slate-400">Ingestion Throughput:</span>
          <span className="text-cyan-400 font-bold text-sm tabular-nums">{currentTPS} TPS</span>
        </div>

        {/* WebSocket health indicator */}
        <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5">
            <Radio className={`w-3.5 h-3.5 ${wsStatus === 'CONNECTED' ? 'text-cyan-400' : 'text-amber-400 animate-spin'}`} />
            <span className="text-slate-400">WebSocket:</span>
          </div>
          <button
            onClick={onSimulateGlitch}
            className="text-[11px] font-bold text-slate-200 hover:text-cyan-300 underline"
            title="Click to test reconnection recovery"
          >
            {wsStatus} (Test)
          </button>
        </div>

        {/* Decision thresholds */}
        <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800">
          <span className="text-slate-400">Action Rules:</span>
          <span className="text-slate-300 font-bold">
            Flag: {(config.flagThreshold * 100).toFixed(0)} · Block: {(config.blockThreshold * 100).toFixed(0)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Channel */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Channels</option>
              <option value="TRANSFER">TRANSFER (High Risk)</option>
              <option value="CASH_OUT">CASH_OUT (High Risk)</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="CASH_IN">CASH_IN</option>
              <option value="DEBIT">DEBIT</option>
            </select>
          </div>

          {/* Decision */}
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Decisions</option>
            <option value="APPROVED">APPROVED (Clean)</option>
            <option value="FLAGGED">FLAGGED (Review Required)</option>
            <option value="BLOCKED">BLOCKED (Intercepted)</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, sender, receiver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Live Stream Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden font-mono">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Displaying {filtered.length} Live Payment Events</span>
          <span className="text-cyan-400/90 font-semibold text-[11px]">[STREAM ENGINE READY]</span>
        </div>

        <div className="overflow-x-auto max-h-[560px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 text-[11px] border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-medium">Tx ID</th>
                <th className="px-4 py-3 font-medium">Customer (Origin)</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Amount ($)</th>
                <th className="px-4 py-3 font-medium">Balance Drain</th>
                <th className="px-4 py-3 font-medium">Risk Score</th>
                <th className="px-4 py-3 font-medium">Latency</th>
                <th className="px-4 py-3 font-medium">Decision</th>
                <th className="px-4 py-3 font-medium text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-slate-400 text-xs">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="text-sm font-semibold text-slate-300">No Transactions Ingested Yet</div>
                      <p className="text-xs text-slate-500">
                        Start the live stream above to begin ingesting transactions. High-risk transactions will automatically populate the Investigation Centre.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 text-cyan-300 font-semibold">{tx.id}</td>
                    <td className="px-4 py-2.5 text-slate-400">{tx.senderId}</td>
                    <td className="px-4 py-2.5 text-slate-400">{tx.receiverId}</td>
                    <td className="px-4 py-2.5 text-slate-300">{tx.type}</td>
                    <td className="px-4 py-2.5 text-slate-200 font-bold tabular-nums">
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 tabular-nums">
                      {tx.oldBalanceOrig > 0
                        ? `${((tx.amount / tx.oldBalanceOrig) * 100).toFixed(0)}%`
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`tabular-nums font-bold ${
                          tx.riskScore100 >= config.blockThreshold * 100
                            ? 'text-rose-400'
                            : tx.riskScore100 >= config.flagThreshold * 100
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {tx.riskScore100}/100
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 tabular-nums">
                      {tx.latencyMs.totalProcessing.toFixed(2)} ms
                    </td>
                    <td className="px-4 py-2.5">
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
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(tx);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                        title="View Full Diagnostics"
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
      </div>
    </div>
  );
};
