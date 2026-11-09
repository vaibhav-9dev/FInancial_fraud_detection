import React, { useState } from 'react';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  CreditCard,
  Smartphone,
  Globe,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { CustomerRiskProfile, Transaction } from '../types';

interface CustomerRiskPageProps {
  customers: CustomerRiskProfile[];
  onSelectTransaction: (tx: Transaction) => void;
  transactions: Transaction[];
}

export const CustomerRiskPage: React.FC<CustomerRiskPageProps> = ({
  customers,
  onSelectTransaction,
  transactions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');

  const filtered = customers.filter((c) => {
    if (tierFilter !== 'ALL' && c.riskTier !== tierFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match = c.id.toLowerCase().includes(q) || c.pseudonymLabel.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || filtered[0];

  const customerTransactions = transactions.filter(
    (t) => selectedCustomer && (t.senderId === selectedCustomer.id || t.receiverId === selectedCustomer.id)
  );

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Customer Risk Profiles &amp; Velocity Intelligence</h1>
        <p className="text-xs text-slate-400 mt-1">
          Pseudonymous behavioral profiles, multi-window velocity tracking, device fingerprints and beneficiary networks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Directory */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Customer Directory ({filtered.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Pseudonymized</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-500 text-[11px]">Filter Tier:</span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Tiers</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filtered.map((customer) => {
              const isSelected = selectedCustomer?.id === customer.id;
              return (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomerId(customer.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-200">{customer.id}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        customer.riskTier === 'HIGH'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                          : customer.riskTier === 'MEDIUM'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {customer.riskScore}/100
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{customer.pseudonymLabel}</div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2">
                    <span>{customer.totalTransactions} transactions</span>
                    <span>${customer.totalVolumeUSD.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Detailed Customer Risk Dossier */}
        {selectedCustomer ? (
          <div className="lg:col-span-2 space-y-5">
            {/* Customer Summary Card */}
            <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold font-mono text-slate-100">{selectedCustomer.id}</h2>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs text-slate-400">{selectedCustomer.pseudonymLabel}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    First Observed: {selectedCustomer.firstSeen.substring(0, 10)} · Active: {selectedCustomer.lastActive.substring(11, 19)} UTC
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Composite Risk</div>
                    <div
                      className={`text-xl font-bold tabular-nums ${
                        selectedCustomer.riskScore >= 75
                          ? 'text-rose-400'
                          : selectedCustomer.riskScore >= 45
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {selectedCustomer.riskScore}/100
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Total Volume</div>
                  <div className="text-base font-bold text-cyan-400 mt-0.5 tabular-nums">
                    ${selectedCustomer.totalVolumeUSD.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Average Tx Size</div>
                  <div className="text-base font-bold text-slate-200 mt-0.5 tabular-nums">
                    ${selectedCustomer.avgTransactionAmount.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Flagged / Blocked</div>
                  <div className="text-base font-bold text-rose-400 mt-0.5 tabular-nums">
                    {selectedCustomer.flaggedTransactionsCount} / {selectedCustomer.blockedTransactionsCount}
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Preferred Channel</div>
                  <div className="text-base font-bold text-slate-200 mt-0.5">
                    {selectedCustomer.primaryChannel}
                  </div>
                </div>
              </div>

              {/* Rolling Velocity Meters */}
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rolling Time-Window Velocity Tracking</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded bg-slate-950/40 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">1-Minute Velocity</div>
                    <div className="text-sm font-bold text-slate-200 mt-1">
                      {selectedCustomer.rollingVelocity.txCount1m} tx / min
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Burst threshold: 5/min</div>
                  </div>
                  <div className="p-3 rounded bg-slate-950/40 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">1-Hour Velocity</div>
                    <div className="text-sm font-bold text-cyan-300 mt-1">
                      {selectedCustomer.rollingVelocity.txCount1h} tx (${selectedCustomer.rollingVelocity.volume1h.toLocaleString()})
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Rolling 60m accumulation</div>
                  </div>
                  <div className="p-3 rounded bg-slate-950/40 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">24-Hour Velocity</div>
                    <div className="text-sm font-bold text-slate-200 mt-1">
                      {selectedCustomer.rollingVelocity.txCount24h} tx (${selectedCustomer.rollingVelocity.volume24h.toLocaleString()})
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Daily quota headroom</div>
                  </div>
                </div>
              </div>

              {/* Devices, IPs & Beneficiary Graph */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Frequent Beneficiaries */}
                <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Frequent Beneficiary Destinations
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {selectedCustomer.frequentBeneficiaries.length === 0 ? (
                      <div className="text-slate-500 text-[11px]">No recurring beneficiaries recorded.</div>
                    ) : (
                      selectedCustomer.frequentBeneficiaries.map((ben, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800/80">
                          <span className="text-slate-300 font-bold">{ben.id}</span>
                          <span className="text-slate-400 text-[11px]">
                            {ben.count} tx (${ben.totalAmount.toLocaleString()})
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Device & Location History */}
                <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Known Devices &amp; Geolocation Signatures
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-slate-500">Devices:</span>
                      <span className="text-slate-200 truncate">{selectedCustomer.knownDevices.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-slate-500">Locations:</span>
                      <span className="text-slate-200 truncate">{selectedCustomer.knownLocations.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-slate-500">IPs:</span>
                      <span className="text-slate-200 truncate">{selectedCustomer.knownIpAddresses.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Transactions Ledger */}
            <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                  Activity Feed for {selectedCustomer.id}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Showing {customerTransactions.length} related transactions
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2">Tx ID</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Recipient</th>
                      <th className="px-3 py-2">Risk</th>
                      <th className="px-3 py-2">Decision</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {customerTransactions.slice(0, 8).map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-3 py-2 text-cyan-300 font-bold">{tx.id}</td>
                        <td className="px-3 py-2 text-slate-300">{tx.type}</td>
                        <td className="px-3 py-2 text-slate-100 font-bold tabular-nums">
                          ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-slate-400">{tx.receiverId}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`font-bold tabular-nums ${
                              tx.riskScore100 >= 75 ? 'text-rose-400' : tx.riskScore100 >= 45 ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {tx.riskScore100}/100
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`font-semibold text-[10px] ${
                              tx.decision === 'BLOCKED' ? 'text-rose-400' : tx.decision === 'FLAGGED' ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {tx.decision}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => onSelectTransaction(tx)}
                            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
                            title="Inspect Transaction"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center text-slate-500 font-mono text-xs bg-slate-900/60 border border-slate-800 rounded-lg">
            Select a pseudonymous customer profile from the left column to view risk and velocity intelligence.
          </div>
        )}
      </div>
    </div>
  );
};
