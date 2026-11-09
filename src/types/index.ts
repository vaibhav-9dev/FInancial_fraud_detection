export type TransactionType = 'PAYMENT' | 'TRANSFER' | 'CASH_OUT' | 'DEBIT' | 'CASH_IN';

export type DecisionState = 'APPROVED' | 'FLAGGED' | 'BLOCKED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AlertStatus = 'PENDING' | 'ACKNOWLEDGED' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'FALSE_POSITIVE';

export type UserRole = 'ADMIN' | 'FRAUD_ANALYST' | 'INVESTIGATOR' | 'READ_ONLY';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
}

export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_CUSTOMER' | 'CLOSED';

export type CasePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type CaseResolution = 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE_LEGITIMATE' | 'INCONCLUSIVE';

export interface InvestigationNote {
  id: string;
  author: string;
  authorRole: UserRole;
  timestamp: string;
  content: string;
}

export interface CaseEvidence {
  id: string;
  type: 'IP_GEO_MISMATCH' | 'VELOCITY_SPIKE' | 'DEVICE_FINGERPRINT' | 'BALANCE_DRAIN' | 'EXTERNAL_REPORT';
  description: string;
  confidence: number;
  addedAt: string;
}

export interface FraudCase {
  id: string;
  title: string;
  alertId?: string;
  transactionId: string;
  customerId: string;
  status: CaseStatus;
  priority: CasePriority;
  assignedTo: string;
  assignedRole: UserRole;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  resolution?: CaseResolution;
  closureReason?: string;
  notes: InvestigationNote[];
  evidence: CaseEvidence[];
  linkedTransactionIds: string[];
  totalExposedAmountUSD: number;
}

export interface CustomerRiskProfile {
  id: string; // e.g. "C10293840"
  pseudonymLabel: string;
  riskTier: RiskLevel;
  riskScore: number; // 0 - 100
  firstSeen: string;
  lastActive: string;
  totalTransactions: number;
  totalVolumeUSD: number;
  avgTransactionAmount: number;
  flaggedTransactionsCount: number;
  blockedTransactionsCount: number;
  primaryChannel: TransactionType;
  frequentBeneficiaries: { id: string; count: number; totalAmount: number }[];
  knownDevices: string[];
  knownIpAddresses: string[];
  knownLocations: string[];
  rollingVelocity: {
    txCount1m: number;
    txCount1h: number;
    txCount24h: number;
    volume1h: number;
    volume24h: number;
  };
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole;
  action: string;
  category: 'TRANSACTION' | 'ALERT' | 'CASE' | 'MODEL' | 'CONFIG' | 'AUTH' | 'INTEGRATION';
  targetId: string;
  details: string;
  ipAddress: string;
}

export interface Transaction {
  id: string; // e.g. "TX-892401"
  senderId: string; // e.g. "C12345678"
  receiverId: string; // e.g. "M98765432" or "C87654321"
  amount: number;
  currency: string; // "USD"
  type: TransactionType;
  timestamp: string; // ISO string
  unixTime: number; // ms
  step: number; // PaySim simulation hour step (1-744)
  
  // Data source label (Demo vs Production Gateway)
  isSimulatedDemo: boolean;
  idempotencyKey?: string;
  
  // Account Balances
  oldBalanceOrig: number;
  newBalanceOrig: number;
  oldBalanceDest: number;
  newBalanceDest: number;
  
  // Device & Behavioral context
  deviceId?: string;
  ipAddress?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  historicalTxCount24h?: number;
  historicalAvgAmount?: number;
  
  // Triggered Rule Matrix
  triggeredRules: string[];
  
  // Model Scoring Outputs
  isolationForestScore: number; // Anomaly score normalized 0.0 - 1.0 (unsupervised)
  gradientBoostingScore: number; // Fraud probability 0.0 - 1.0 (supervised)
  randomForestBaselineScore?: number; // Comparison baseline
  ensembleScore: number; // Blended calibrated risk score 0.0 - 1.0
  riskScore100: number; // 0 - 100 risk index
  riskLevel: RiskLevel;
  decision: DecisionState;
  
  // Explainability & Diagnostics
  decisionReason: string;
  featureContributions: {
    feature: string;
    label: string;
    value: number | string;
    impact: 'HIGH_FRAUD' | 'MODERATE_FRAUD' | 'NEUTRAL' | 'LEGITIMATE';
    scoreContribution: number;
  }[];
  
  // Latency Metrics (Actual monotonic performance measurements in milliseconds)
  latencyMs: {
    featureExtraction: number;
    isolationForestInference: number;
    gradientBoostingInference: number;
    decisionRules: number;
    dbPersistence: number;
    totalProcessing: number;
  };
}

export interface FraudAlert {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  timestamp: string;
  riskScore: number; // 0.0 - 1.0
  riskScore100: number; // 0 - 100
  severity: AlertSeverity;
  status: AlertStatus;
  primaryReason: string;
  triggeredRules: string[];
  modelResponsible: 'Gradient Boosting' | 'Isolation Forest' | 'Random Forest' | 'Rule Engine' | 'Dual ML Ensemble';
  suggestedAction: string;
  assignedAnalyst?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  caseId?: string;
  transaction: Transaction;
}

export interface OperationalMetrics {
  totalTransactions: number;
  legitimateCount: number;
  fraudulentCount: number; // Known confirmed or flagged high-risk
  flaggedCount: number;
  blockedCount: number;
  totalVolumeUSD: number;
  blockedVolumeUSD: number;
  flaggedVolumeUSD: number;
  confirmedFraudValueUSD: number;
  confirmedFraudCasesCount: number;
  avgRiskScore: number;
  falsePositiveRate: number;
  currentProcessingLatencyMs: number;
  lastUpdated: string;
}

export interface LatencyTelemetry {
  sampleCount: number;
  avgLatencyMs: number;
  medianLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  maxLatencyMs: number;
  currentTPS: number;
  peakTPS: number;
  breakdown: {
    featureExtractionAvg: number;
    modelInferenceAvg: number;
    rulesEngineAvg: number;
    dbWriteAvg: number;
  };
  recentHistory: {
    timestamp: string;
    latencyMs: number;
    tps: number;
  }[];
}

export interface ModelValidationMetrics {
  modelName: string;
  version: string;
  datasetName: string;
  sampleSize: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  aucRoc: number;
  aucPr: number;
  confusionMatrix: {
    truePositives: number;
    trueNegatives: number;
    falsePositives: number;
    falseNegatives: number;
  };
  rocCurve: { fpr: number; tpr: number }[];
  prCurve: { recall: number; precision: number }[];
  featureImportance: { feature: string; importance: number; description: string }[];
  comparisonModels?: {
    name: string;
    type: 'SUPERVISED_GBDT' | 'BASELINE_RANDOM_FOREST' | 'UNSUPERVISED_IFOREST';
    precision: number;
    recall: number;
    f1Score: number;
    aucRoc: number;
    latencyMs: number;
  }[];
}

export interface ExternalAdapterStatus {
  id: string;
  name: string;
  type: 'PAYMENT_GATEWAY' | 'MERCHANT_API' | 'KAFKA' | 'SMTP_EMAIL' | 'TELEGRAM_BOT' | 'SMS_TWILIO' | 'IP_REPUTATION' | 'GEOLOCATION';
  status: 'CONNECTED' | 'DISCONNECTED' | 'SANDBOX_MOCK' | 'ERROR';
  lastPing?: string;
  lastRequest?: string;
  lastError?: string;
  configSummary: string;
  isConfigured: boolean;
}

export interface SystemHealthMetrics {
  apiUptimeSeconds: number;
  kafkaBrokerStatus: 'ONLINE' | 'STANDBY_SIMULATED' | 'OFFLINE';
  databaseStatus: 'HEALTHY_POSTGRES' | 'HEALTHY_SQLITE';
  modelLoadingStatus: 'LOADED_READY' | 'RE-INITIALIZING';
  queueDepth: number;
  dlqDeadLetterCount: number;
  errorRatePercent: number;
  throughputTPS: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
}

export interface NotificationSettings {
  enableInApp: boolean;
  enableBrowserPush: boolean;
  enableEmail: boolean;
  smtpServer: string;
  smtpPort: number;
  smtpRecipient: string;
  enableTelegram: boolean;
  telegramChatId: string;
  enableSms: boolean;
  smsRecipientPhone: string;
  alertCooldownMinutes: number; // Alert deduplication window
  minSeverityForExternalPush: AlertSeverity;
}

export interface SystemConfig {
  flagThreshold: number; // e.g. 0.45
  blockThreshold: number; // e.g. 0.75
  anomalySensitivity: number; // e.g. 0.60
  activeModel: 'ENSEMBLE' | 'GRADIENT_BOOSTING' | 'ISOLATION_FOREST' | 'RANDOM_FOREST_BASELINE';
  generationRatePerSec: number; // 1 to 20
  streamingEngine: 'INTERNAL_WEBSOCKET' | 'KAFKA_LOCAL_BRIDGE';
  kafkaBrokerUrl: string;
  kafkaTopic: string;
  backendApiUrl: string;
  autoResolveLowAlerts: boolean;
  refreshIntervalMs: number;
  notifications: NotificationSettings;
  dataRetentionDays: number;
  enableSimulatedActionBlockedPayments: boolean; // default true for demo safe execution
}
