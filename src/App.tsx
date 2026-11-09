import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTabId } from './components/layout/Sidebar';
import { TransactionDetailModal } from './components/modals/TransactionDetailModal';
import { InjectTransactionModal } from './components/modals/InjectTransactionModal';

import { OverviewPage } from './pages/OverviewPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AlertsPage } from './pages/AlertsPage';
import { CustomerRiskPage } from './pages/CustomerRiskPage';
import { InvestigationCentrePage } from './pages/InvestigationCentrePage';
import { DatasetHubPage } from './pages/DatasetHubPage';
import { MlAnalyticsPage } from './pages/MlAnalyticsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CodeAndDocsPage } from './pages/CodeAndDocsPage';

import { StorageService } from './services/storage';
import { StreamSimulator, StreamStatus, WebSocketStatus } from './services/streamSimulator';
import { NotificationService, WebsiteAlertNotification } from './services/notificationService';
import {
  Transaction,
  FraudAlert,
  OperationalMetrics,
  LatencyTelemetry,
  SystemConfig,
  AlertStatus,
  FraudCase,
  CaseStatus,
  CasePriority,
  CaseResolution,
  CustomerRiskProfile,
  AuditLogEntry,
  UserProfile,
  SystemHealthMetrics,
  ExternalAdapterStatus,
} from './types';

export default function App() {
  const storage = StorageService.getInstance();
  const simulator = StreamSimulator.getInstance();

  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [streamStatus, setStreamStatus] = useState<StreamStatus>(simulator.getStatus());
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>(simulator.getWebSocketStatus());
  const [currentTPS, setCurrentTPS] = useState<number>(0);

  const [transactions, setTransactions] = useState<Transaction[]>(() => storage.getTransactions({ limit: 150 }).transactions);
  const [alerts, setAlerts] = useState<FraudAlert[]>(() => storage.getAlerts());
  const [cases, setCases] = useState<FraudCase[]>(() => storage.getCases());
  const [customers, setCustomers] = useState<CustomerRiskProfile[]>(() => storage.getCustomers());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => storage.getAuditLogs());
  const [metrics, setMetrics] = useState<OperationalMetrics>(() => storage.getMetrics());
  const [telemetry, setTelemetry] = useState<LatencyTelemetry>(() => storage.getLatencyTelemetry(0));
  const [config, setConfig] = useState<SystemConfig>(() => storage.getConfig());
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => storage.getCurrentUser());
  const [health, setHealth] = useState<SystemHealthMetrics>(() => storage.getSystemHealth());
  const [adapters, setAdapters] = useState<ExternalAdapterStatus[]>(() => storage.getExternalAdapters());

  // Modal states
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isInjectModalOpen, setIsInjectModalOpen] = useState<boolean>(false);
  const [activeToasts, setActiveToasts] = useState<WebsiteAlertNotification[]>([]);

  // Sync state whenever transactions are added or updated
  const refreshState = () => {
    setTransactions(storage.getTransactions({ limit: 200 }).transactions);
    setAlerts(storage.getAlerts());
    setCases(storage.getCases());
    setCustomers(storage.getCustomers());
    setAuditLogs(storage.getAuditLogs());
    setMetrics(storage.getMetrics());
    setTelemetry(storage.getLatencyTelemetry(simulator.getCurrentTPS()));
    setHealth(storage.getSystemHealth());
    setAdapters(storage.getExternalAdapters());
  };

  useEffect(() => {
    // Subscribe to simulator transaction feed
    const unsubscribeTx = simulator.subscribe((_newTx) => {
      refreshState();
      setCurrentTPS(simulator.getCurrentTPS());
    });

    // Subscribe to simulator stream status
    const unsubscribeStatus = simulator.subscribeStatus((status) => {
      setStreamStatus(status);
      refreshState();
    });

    // Subscribe to WebSocket status
    const unsubscribeWs = simulator.subscribeWebSocket((status) => {
      setWsStatus(status);
    });

    // Subscribe to real-time website alert notifications
    const unsubscribeNotifications = NotificationService.getInstance().subscribe((notif) => {
      setActiveToasts((prev) => [notif, ...prev.slice(0, 2)]);
      setTimeout(() => {
        setActiveToasts((prev) => prev.filter((t) => t.id !== notif.id));
      }, 7000);
    });

    // Auto-refresh interval for clock & telemetry
    const interval = setInterval(() => {
      setCurrentTPS(simulator.getCurrentTPS());
      setTelemetry(storage.getLatencyTelemetry(simulator.getCurrentTPS()));
      setHealth(storage.getSystemHealth());
    }, 1000);

    return () => {
      unsubscribeTx();
      unsubscribeStatus();
      unsubscribeWs();
      unsubscribeNotifications();
      clearInterval(interval);
    };
  }, []);

  const handleUpdateConfig = (newConfig: Partial<SystemConfig>) => {
    const updated = storage.updateConfig(newConfig);
    setConfig(updated);
    refreshState();
  };

  const handleUpdateAlertStatus = (alertId: string, status: AlertStatus, notes?: string) => {
    storage.updateAlertStatus(alertId, status, notes);
    refreshState();
  };

  const handleCreateCaseFromAlert = (alertId: string) => {
    const newCase = storage.createCaseFromAlert(alertId);
    refreshState();
    if (newCase) {
      setActiveTab('investigation-centre');
    }
  };

  const handleCreateManualCase = (title: string, priority: CasePriority) => {
    storage.createCase(title, priority);
    refreshState();
  };

  const handleUpdateCaseStatus = (
    caseId: string,
    status: CaseStatus,
    resolution?: CaseResolution,
    reason?: string
  ) => {
    storage.updateCaseStatus(caseId, status, resolution, reason);
    refreshState();
  };

  const handleAddCaseNote = (caseId: string, note: string) => {
    storage.addCaseNote(caseId, note);
    refreshState();
  };

  const handlePingAdapter = (adapterId: string) => {
    storage.pingAdapter(adapterId);
    refreshState();
  };

  const handleSwitchUser = (user: UserProfile) => {
    storage.setCurrentUser(user);
    setCurrentUser(user);
    refreshState();
  };

  const handleResetDatabase = () => {
    storage.clearAllData();
    refreshState();
  };

  const handleClearHistory = () => {
    storage.clearAllData();
    refreshState();
  };

  const handleSelectTransactionById = (txId: string) => {
    const tx = storage.getTransactionById(txId);
    if (tx) {
      setSelectedTransaction(tx);
    }
  };

  const pendingAlertsCount = alerts.filter((a) => a.status === 'PENDING').length;
  const openCasesCount = cases.filter((c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        streamStatus={streamStatus}
        wsStatus={wsStatus}
        currentTPS={currentTPS}
        unreadAlerts={alerts.filter((a) => a.status === 'PENDING')}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenAlerts={() => setActiveTab('alerts')}
        onSelectAlert={(alt) => {
          setSelectedTransaction(alt.transaction);
        }}
        systemMode={config.streamingEngine === 'KAFKA_LOCAL_BRIDGE' ? 'FASTAPI' : 'INTERNAL'}
        onSimulateReconnect={() => {
          simulator.simulateNetworkGlitch();
        }}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingAlertsCount={pendingAlertsCount}
          openCasesCount={openCasesCount}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/60">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewPage
                metrics={metrics}
                recentTransactions={transactions}
                onSelectTransaction={setSelectedTransaction}
                onOpenInjectModal={() => setIsInjectModalOpen(true)}
                onNavigateToLive={() => setActiveTab('live-monitoring')}
                onNavigateToCases={() => setActiveTab('investigation-centre')}
                onNavigateToDatasetHub={() => setActiveTab('dataset-hub')}
              />
            )}

            {activeTab === 'live-monitoring' && (
              <LiveMonitoringPage
                streamStatus={streamStatus}
                wsStatus={wsStatus}
                currentTPS={currentTPS}
                transactions={transactions}
                config={config}
                onUpdateConfig={handleUpdateConfig}
                onSelectTransaction={setSelectedTransaction}
                onOpenInjectModal={() => setIsInjectModalOpen(true)}
                onClearHistory={handleClearHistory}
                onSimulateGlitch={() => simulator.simulateNetworkGlitch()}
                onNavigateToDatasetHub={() => setActiveTab('dataset-hub')}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsPage
                transactions={transactions}
                onSelectTransaction={setSelectedTransaction}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsPage
                alerts={alerts}
                onUpdateAlertStatus={handleUpdateAlertStatus}
                onSelectTransaction={setSelectedTransaction}
                onCreateCaseFromAlert={handleCreateCaseFromAlert}
              />
            )}

            {activeTab === 'customer-risk' && (
              <CustomerRiskPage
                customers={customers}
                transactions={transactions}
                onSelectTransaction={setSelectedTransaction}
              />
            )}

            {activeTab === 'investigation-centre' && (
              <InvestigationCentrePage
                cases={cases}
                currentUser={currentUser}
                streamStatus={streamStatus}
                onStartStream={() => {
                  simulator.start();
                  refreshState();
                }}
                onNavigateToLive={() => setActiveTab('live-monitoring')}
                onCreateCase={handleCreateManualCase}
                onUpdateStatus={handleUpdateCaseStatus}
                onAddNote={handleAddCaseNote}
                onSelectTransactionId={handleSelectTransactionById}
              />
            )}

            {(activeTab === 'dataset-hub' || activeTab === 'paysim-dataset') && (
              <DatasetHubPage onNavigateToLive={() => setActiveTab('live-monitoring')} />
            )}

            {activeTab === 'ml-analytics' && <MlAnalyticsPage />}

            {activeTab === 'system-health' && (
              <SystemHealthPage
                health={health}
                adapters={adapters}
                latency={telemetry}
                onPingAdapter={handlePingAdapter}
              />
            )}

            {activeTab === 'audit-logs' && <AuditLogsPage logs={auditLogs} />}

            {activeTab === 'settings' && (
              <SettingsPage
                config={config}
                onUpdateConfig={handleUpdateConfig}
                onResetDatabase={handleResetDatabase}
              />
            )}

            {activeTab === 'code-docs' && <CodeAndDocsPage />}
          </div>
        </main>
      </div>

      {/* Transaction Diagnostics Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onCreateCaseFromTx={(txId) => {
          const matchingAlert = alerts.find((a) => a.transactionId === txId);
          if (matchingAlert) {
            handleCreateCaseFromAlert(matchingAlert.id);
          } else {
            handleCreateManualCase(`Investigation for Tx ${txId}`, 'HIGH');
            setActiveTab('investigation-centre');
          }
          setSelectedTransaction(null);
        }}
        onNavigateToCustomer={(_custId) => {
          setActiveTab('customer-risk');
          setSelectedTransaction(null);
        }}
      />

      {/* Fraud Attack Injection Modal */}
      <InjectTransactionModal
        isOpen={isInjectModalOpen}
        onClose={() => setIsInjectModalOpen(false)}
        onInjected={(tx) => {
          refreshState();
          setSelectedTransaction(tx);
        }}
      />

      {/* Website Live Alert Notifications Toast Stack */}
      {activeToasts.length > 0 && (
        <div className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-auto select-none">
          {activeToasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-3.5 rounded-lg border shadow-2xl backdrop-blur-md flex flex-col gap-1.5 transition-all ${
                toast.severity === 'CRITICAL'
                  ? 'bg-rose-950/95 border-rose-500/80 text-rose-100 ring-1 ring-rose-500/30'
                  : 'bg-amber-950/95 border-amber-500/80 text-amber-100 ring-1 ring-amber-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono tracking-wide flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${toast.severity === 'CRITICAL' ? 'bg-rose-400 animate-ping' : 'bg-amber-400'}`} />
                  {toast.title}
                </span>
                <button
                  onClick={() => setActiveToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-slate-400 hover:text-white text-xs px-1 font-mono transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] opacity-90 font-mono leading-relaxed">{toast.message}</p>
              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] font-mono">
                <span className="text-slate-400">{new Date(toast.timestamp).toLocaleTimeString()}</span>
                <button
                  onClick={() => {
                    setActiveTab('investigation-centre');
                    setActiveToasts((prev) => prev.filter((t) => t.id !== toast.id));
                  }}
                  className="font-bold underline text-cyan-300 hover:text-cyan-200 transition-colors"
                >
                  View in Investigation Centre &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
