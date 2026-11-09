import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Radio,
  RotateCcw,
  Save,
  CheckCircle2,
  Trash2,
  Bell,
  Mail,
  Send,
  Smartphone,
  Clock,
  Database,
  Lock,
  Layers,
  UserCheck,
} from 'lucide-react';
import { SystemConfig, AlertSeverity } from '../types';
import { DEFAULT_CONFIG } from '../services/storage';

interface SettingsPageProps {
  config: SystemConfig;
  onUpdateConfig: (newConfig: Partial<SystemConfig>) => void;
  onResetDatabase: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  config,
  onUpdateConfig,
  onResetDatabase,
}) => {
  const [formData, setFormData] = useState<SystemConfig>({ ...config });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    setFormData({ ...DEFAULT_CONFIG });
    onUpdateConfig(DEFAULT_CONFIG);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl select-none">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">System, Notifications &amp; Governance Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Tune real-time decision boundaries, configure multi-channel dispatch adapters, and manage enterprise security policies
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Risk Thresholds Card */}
        <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Fraud Decision Engine Boundaries</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300">Flag Threshold (Medium Risk)</label>
                <span className="text-amber-400 font-bold">{(formData.flagThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.10}
                max={0.60}
                step={0.01}
                value={formData.flagThreshold}
                onChange={(e) => setFormData({ ...formData, flagThreshold: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Transactions scoring at or above this threshold trigger Tier-2 review alerts.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300">Block Threshold (Critical Risk)</label>
                <span className="text-rose-400 font-bold">{(formData.blockThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.50}
                max={0.95}
                step={0.01}
                value={formData.blockThreshold}
                onChange={(e) => setFormData({ ...formData, blockThreshold: Number(e.target.value) })}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Transactions exceeding this score are immediately intercepted and declined.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <label className="block text-xs font-mono text-slate-300 mb-2">Active Prediction Algorithm</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'ENSEMBLE', label: 'Dual-ML Ensemble (Recommended)', desc: '70% GBDT + 30% Isolation Forest' },
                { id: 'GRADIENT_BOOSTING', label: 'Gradient Boosting Only', desc: 'Supervised Calibrated Probabilities' },
                { id: 'ISOLATION_FOREST', label: 'Isolation Forest Only', desc: 'Unsupervised Anomaly Path Depths' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, activeModel: m.id as any })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    formData.activeModel === m.id
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold mb-1">{m.label}</div>
                  <div className="text-[10px] text-slate-500">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-200">Safe Interception & Out-of-Band Notification</div>
              <div className="text-[11px] text-slate-500">
                Dispatch verified customer notification and merchant decline code without touching external clearing rails
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableSimulatedActionBlockedPayments}
                onChange={(e) => setFormData({ ...formData, enableSimulatedActionBlockedPayments: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>
        </div>

        {/* Multi-Channel Alerts & Notifications */}
        <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>Instant Alert &amp; External Dispatch Channels</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Cooldown: {formData.notifications.alertCooldownMinutes}m deduplication
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* SMTP Email Dispatch */}
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>SMTP Email Dispatch</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifications.enableEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notifications: { ...formData.notifications, enableEmail: e.target.checked },
                    })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-400">SMTP Server Host &amp; Port</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={formData.notifications.smtpServer}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifications: { ...formData.notifications, smtpServer: e.target.value },
                        })
                      }
                      placeholder="smtp.internal.domain"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs"
                    />
                    <input
                      type="number"
                      value={formData.notifications.smtpPort}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifications: { ...formData.notifications, smtpPort: Number(e.target.value) },
                        })
                      }
                      className="w-16 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs tabular-nums"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Alert Distribution List</label>
                  <input
                    type="email"
                    value={formData.notifications.smtpRecipient}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, smtpRecipient: e.target.value },
                      })
                    }
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Telegram Dispatch */}
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>Telegram Bot Webhook</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifications.enableTelegram}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notifications: { ...formData.notifications, enableTelegram: e.target.checked },
                    })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-400">Bot Channel / Chat ID</label>
                  <input
                    type="text"
                    value={formData.notifications.telegramChatId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, telegramChatId: e.target.value },
                      })
                    }
                    placeholder="@fraudguard_security_bot"
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Sends structured JSON payloads with transaction risk factors and direct triage links.
                </p>
              </div>
            </div>

            {/* Twilio SMS Dispatch */}
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Twilio SMS Gateway</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifications.enableSms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notifications: { ...formData.notifications, enableSms: e.target.checked },
                    })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-400">On-Call Officer Phone Number</label>
                  <input
                    type="tel"
                    value={formData.notifications.smsRecipientPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, smsRecipientPhone: e.target.value },
                      })
                    }
                    placeholder="+1-555-019-2834"
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Reserved for CRITICAL severity events where high-value drain exceeds $100,000.
                </p>
              </div>
            </div>

            {/* Alert Cooldown & Threshold */}
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Alert Cooldown &amp; Minimum Severity</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Account Deduplication Window</span>
                    <span className="text-cyan-300 font-bold">{formData.notifications.alertCooldownMinutes} minutes</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={60}
                    value={formData.notifications.alertCooldownMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          alertCooldownMinutes: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Minimum External Dispatch Severity</label>
                  <select
                    value={formData.notifications.minSeverityForExternalPush}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          minSeverityForExternalPush: e.target.value as AlertSeverity,
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs"
                  >
                    <option value="CRITICAL">CRITICAL Only (Blocks &gt; $100K)</option>
                    <option value="HIGH">HIGH &amp; CRITICAL</option>
                    <option value="MEDIUM">MEDIUM, HIGH &amp; CRITICAL</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Streaming & Ingestion Card */}
        <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Streaming Pipeline &amp; Ingestion</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Streaming Engine Mode</label>
              <select
                value={formData.streamingEngine}
                onChange={(e) => setFormData({ ...formData, streamingEngine: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="INTERNAL_WEBSOCKET">Internal High-Precision Stream Simulator</option>
                <option value="KAFKA_LOCAL_BRIDGE">Kafka Local Bridge (localhost:9092)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Generation Velocity (tx/sec)</label>
              <input
                type="number"
                min={1}
                max={20}
                value={formData.generationRatePerSec}
                onChange={(e) => setFormData({ ...formData, generationRatePerSec: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2">
            <div>
              <label className="block text-slate-400 mb-1">Kafka Broker Address</label>
              <input
                type="text"
                value={formData.kafkaBrokerUrl}
                onChange={(e) => setFormData({ ...formData, kafkaBrokerUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Backend FastAPI URL</label>
              <input
                type="text"
                value={formData.backendApiUrl}
                onChange={(e) => setFormData({ ...formData, backendApiUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Governance, Retention & RBAC Matrix */}
        <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Governance, Retention &amp; Access Control</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Audit &amp; Telemetry Retention</label>
              <select
                value={formData.dataRetentionDays}
                onChange={(e) => setFormData({ ...formData, dataRetentionDays: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value={30}>30 Days (Development / Testing)</option>
                <option value={60}>60 Days (Standard Audit)</option>
                <option value={90}>90 Days (PCI-DSS Minimum)</option>
                <option value={180}>180 Days (SOC-2 Compliance)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Auto-Resolve Low Risk Alerts</label>
              <select
                value={formData.autoResolveLowAlerts ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, autoResolveLowAlerts: e.target.value === 'true' })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="false">Manual Review Only (Zero Silent Dismissals)</option>
                <option value="true">Auto-Resolve Low Alerts after 72 Hours</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <div className="text-[11px] font-semibold text-slate-300 font-mono mb-2 uppercase tracking-wider">
              Role-Based Access Control (RBAC) Entitlements Reference
            </div>
            <div className="border border-slate-800 rounded overflow-hidden text-[11px] font-mono">
              <div className="grid grid-cols-4 bg-slate-950/80 px-3 py-2 text-slate-400 border-b border-slate-800">
                <span>Role</span>
                <span>Surveillance &amp; Triage</span>
                <span>Case Adjudication</span>
                <span>System &amp; ML Config</span>
              </div>
              <div className="grid grid-cols-4 px-3 py-2 text-slate-300 border-b border-slate-800/40 bg-slate-900/30">
                <span className="text-cyan-400 font-bold">ADMIN</span>
                <span>Full Read/Write</span>
                <span>Full Disposition</span>
                <span className="text-emerald-400">Full Access</span>
              </div>
              <div className="grid grid-cols-4 px-3 py-2 text-slate-300 border-b border-slate-800/40 bg-slate-900/30">
                <span className="text-amber-400 font-bold">FRAUD_ANALYST</span>
                <span>Full Real-Time</span>
                <span>Create &amp; Note Cases</span>
                <span className="text-slate-500">Read-Only</span>
              </div>
              <div className="grid grid-cols-4 px-3 py-2 text-slate-300 border-b border-slate-800/40 bg-slate-900/30">
                <span className="text-purple-400 font-bold">INVESTIGATOR</span>
                <span>Full History</span>
                <span className="text-emerald-400">Close &amp; Disposition</span>
                <span className="text-slate-500">No Access</span>
              </div>
              <div className="grid grid-cols-4 px-3 py-2 text-slate-300 bg-slate-900/30">
                <span className="text-slate-400 font-bold">READ_ONLY</span>
                <span>Viewer Only</span>
                <span>Viewer Only</span>
                <span className="text-slate-500">No Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons and Reset Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuration saved successfully</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset local transaction history, cases, and alerts?')) {
                onResetDatabase();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Database</span>
          </button>
        </div>
      </form>
    </div>
  );
};
