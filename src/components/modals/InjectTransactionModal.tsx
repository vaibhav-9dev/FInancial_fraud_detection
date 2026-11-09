import React, { useState } from 'react';
import { X, Zap, ShieldAlert, Sparkles, CheckCircle2, Globe, Clock, RefreshCw } from 'lucide-react';
import { StreamSimulator, InjectionPreset } from '../../services/streamSimulator';
import { Transaction, TransactionType } from '../../types';

interface InjectTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjected: (tx: Transaction) => void;
}

export const InjectTransactionModal: React.FC<InjectTransactionModalProps> = ({
  isOpen,
  onClose,
  onInjected,
}) => {
  const simulator = StreamSimulator.getInstance();
  const presets = simulator.getAvailablePresets();

  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [senderId, setSenderId] = useState<string>(presets[0]?.payload.senderId || 'C1305486145');
  const [receiverId, setReceiverId] = useState<string>(presets[0]?.payload.receiverId || 'C553264065');
  const [type, setType] = useState<TransactionType>(presets[0]?.payload.type || 'TRANSFER');
  const [amount, setAmount] = useState<number>(presets[0]?.payload.amount || 181.0);
  const [oldBalanceOrig, setOldBalanceOrig] = useState<number>(presets[0]?.payload.oldBalanceOrig || 181.0);
  const [newBalanceOrig, setNewBalanceOrig] = useState<number>(presets[0]?.payload.newBalanceOrig || 0);
  const [oldBalanceDest, setOldBalanceDest] = useState<number>(presets[0]?.payload.oldBalanceDest || 0);
  const [newBalanceDest, setNewBalanceDest] = useState<number>(presets[0]?.payload.newBalanceDest || 0);
  const [location, setLocation] = useState<string>(presets[0]?.payload.location || 'Frankfurt, DE');
  const [lastKnownLocation, setLastKnownLocation] = useState<string>('');
  const [step, setStep] = useState<number>(presets[0]?.payload.step || 1);
  const [lastResult, setLastResult] = useState<Transaction | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const p = presets[index].payload;
    setType(p.type);
    setAmount(p.amount);
    setOldBalanceOrig(p.oldBalanceOrig);
    setNewBalanceOrig(p.newBalanceOrig);
    setOldBalanceDest(p.oldBalanceDest);
    setNewBalanceDest(p.newBalanceDest);
    if (p.senderId) setSenderId(p.senderId);
    if (p.receiverId) setReceiverId(p.receiverId);
    setLocation(p.location || 'New York, US');
    setLastKnownLocation(p.lastKnownLocation || '');
    if (p.step) setStep(p.step);
  };

  const handleExecuteInjection = () => {
    const tx = simulator.injectTransaction({
      type,
      amount,
      oldBalanceOrig,
      newBalanceOrig,
      oldBalanceDest,
      newBalanceDest,
      step,
      senderId,
      receiverId,
      location,
      lastKnownLocation,
      isSimulatedDemo: false,
    });
    setLastResult(tx);
    onInjected(tx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-rose-950/60 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100">Inject Scenario / Adversarial Attack</div>
              <div className="text-[11px] text-slate-400">
                Simulate targeted fraud attacks or impossible travel vectors into the live detection pipeline
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300 font-mono">
          {/* Preset Selector */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-2">
              Select Preset Attack Pattern or Control Scenario
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(idx)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    selectedPresetIndex === idx
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-200">{preset.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        preset.category === 'ATTACK'
                          ? 'bg-rose-950/80 text-rose-300'
                          : preset.category === 'ANOMALY'
                          ? 'bg-amber-950/80 text-amber-300'
                          : 'bg-emerald-950/80 text-emerald-300'
                      }`}
                    >
                      {preset.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-2">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Transaction Channel</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="TRANSFER">TRANSFER (High Risk Channel)</option>
                  <option value="CASH_OUT">CASH_OUT (High Risk Channel)</option>
                  <option value="PAYMENT">PAYMENT (Standard POS)</option>
                  <option value="CASH_IN">CASH_IN (Deposit)</option>
                  <option value="DEBIT">DEBIT (Direct Debit)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Amount ($ USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Origin Old Balance ($)</label>
                <input
                  type="number"
                  value={oldBalanceOrig}
                  onChange={(e) => setOldBalanceOrig(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Origin New Balance ($)</label>
                <input
                  type="number"
                  value={newBalanceOrig}
                  onChange={(e) => setNewBalanceOrig(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Destination Old Balance ($)</label>
                <input
                  type="number"
                  value={oldBalanceDest}
                  onChange={(e) => setOldBalanceDest(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Destination New Balance ($)</label>
                <input
                  type="number"
                  value={newBalanceDest}
                  onChange={(e) => setNewBalanceDest(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 tabular-nums"
                />
              </div>
            </div>

            {/* Geolocation / Travel Jump */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Originating Geolocation</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Singapore, SG"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Last Known Location (Travel Jump)</label>
                <input
                  type="text"
                  value={lastKnownLocation}
                  onChange={(e) => setLastKnownLocation(e.target.value)}
                  placeholder="e.g. New York, US"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Real-time result banner after injection */}
          {lastResult && (
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-700/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-cyan-300 font-bold">{lastResult.id} Evaluated</span>
                <span
                  className={`text-xs font-bold ${
                    lastResult.decision === 'BLOCKED'
                      ? 'text-rose-400'
                      : lastResult.decision === 'FLAGGED'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  DECISION: {lastResult.decision} ({lastResult.riskScore100}/100)
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Probability: <span className="text-slate-200">{(lastResult.gradientBoostingScore * 100).toFixed(1)}%</span> · Latency: <span className="text-slate-200">{lastResult.latencyMs.totalProcessing.toFixed(3)}ms</span>
              </div>
              <div className="text-[11px] text-slate-400 italic">
                {lastResult.decisionReason}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Simulated Action Mode active (Safe non-destructive execution)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            >
              Done
            </button>
            <button
              onClick={handleExecuteInjection}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-colors shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Inject Scenario</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
