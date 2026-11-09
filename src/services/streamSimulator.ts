import { evaluateTransaction, RawTransactionInput } from './mlEngine';
import { StorageService } from './storage';
import { Transaction } from '../types';
import { DatasetService, IngestedRecord } from './datasetService';

export type StreamStatus = 'IDLE' | 'RUNNING' | 'PAUSED';

export type WebSocketStatus = 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';

export interface InjectionPreset {
  name: string;
  category: 'ATTACK' | 'ANOMALY' | 'CONTROL';
  description: string;
  payload: RawTransactionInput;
}

export class StreamSimulator {
  private static instance: StreamSimulator;
  private status: StreamStatus = 'IDLE';
  private wsStatus: WebSocketStatus = 'CONNECTED';
  private timerId: number | null = null;
  private storage: StorageService;
  private listeners: Set<(tx: Transaction) => void> = new Set();
  private statusListeners: Set<(status: StreamStatus) => void> = new Set();
  private wsListeners: Set<(status: WebSocketStatus) => void> = new Set();

  // Real TPS measurement
  private txCountInCurrentSecond = 0;
  private lastTpsCheckTime = Date.now();
  private currentTPS = 0;

  private constructor() {
    this.storage = StorageService.getInstance();
  }

  public static getInstance(): StreamSimulator {
    if (!StreamSimulator.instance) {
      StreamSimulator.instance = new StreamSimulator();
    }
    return StreamSimulator.instance;
  }

  public getStatus(): StreamStatus {
    return this.status;
  }

  public getWebSocketStatus(): WebSocketStatus {
    return this.wsStatus;
  }

  public getCurrentTPS(): number {
    return this.currentTPS;
  }

  public subscribe(listener: (tx: Transaction) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeStatus(listener: (status: StreamStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public subscribeWebSocket(listener: (status: WebSocketStatus) => void): () => void {
    this.wsListeners.add(listener);
    listener(this.wsStatus);
    return () => this.wsListeners.delete(listener);
  }

  private notifyStatus() {
    this.statusListeners.forEach((fn) => fn(this.status));
  }

  private notifyWsStatus() {
    this.wsListeners.forEach((fn) => fn(this.wsStatus));
  }

  public simulateNetworkGlitch(): void {
    this.wsStatus = 'RECONNECTING';
    this.notifyWsStatus();
    setTimeout(() => {
      this.wsStatus = 'CONNECTED';
      this.notifyWsStatus();
    }, 1800);
  }

  public hasDataset(): boolean {
    return DatasetService.getInstance().hasDataset();
  }

  public start(): boolean {
    if (!this.hasDataset()) {
      return false;
    }
    if (this.status === 'RUNNING') return true;
    this.status = 'RUNNING';
    this.notifyStatus();
    this.scheduleNextTick();
    return true;
  }

  public pause(): void {
    if (this.status !== 'RUNNING') return;
    this.status = 'PAUSED';
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentTPS = 0;
    this.notifyStatus();
  }

  public stop(): void {
    this.status = 'IDLE';
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentTPS = 0;
    this.notifyStatus();
  }

  private scheduleNextTick() {
    if (this.status !== 'RUNNING') return;
    const config = this.storage.getConfig();
    const rate = Math.max(1, Math.min(20, config.generationRatePerSec || 2));
    const intervalMs = Math.round(1000 / rate);

    this.timerId = window.setTimeout(() => {
      this.generateAndProcessTransaction();
      this.scheduleNextTick();
    }, intervalMs);
  }

  private generateAndProcessTransaction() {
    const record = DatasetService.getInstance().getNextRecord();
    if (!record) {
      this.pause();
      return;
    }

    const input: RawTransactionInput = {
      amount: record.amount,
      type: record.type,
      oldBalanceOrig: record.oldBalanceOrig,
      newBalanceOrig: record.newBalanceOrig,
      oldBalanceDest: record.oldBalanceDest,
      newBalanceDest: record.newBalanceDest,
      step: record.step,
      senderId: record.senderId,
      receiverId: record.receiverId,
      historicalAvgAmount: Math.round(record.oldBalanceOrig * 0.35) || record.amount,
      isSimulatedDemo: false,
      location: record.type === 'PAYMENT' ? 'New York, US' : (record.isFraud ? 'Frankfurt, DE' : 'London, UK'),
    };

    this.processRawInput(input);
  }

  public injectDatasetRecord(record: IngestedRecord): Transaction {
    const input: RawTransactionInput = {
      amount: record.amount,
      type: record.type,
      oldBalanceOrig: record.oldBalanceOrig,
      newBalanceOrig: record.newBalanceOrig,
      oldBalanceDest: record.oldBalanceDest,
      newBalanceDest: record.newBalanceDest,
      step: record.step,
      senderId: record.senderId,
      receiverId: record.receiverId,
      historicalAvgAmount: Math.round(record.oldBalanceOrig * 0.35) || record.amount,
      isSimulatedDemo: false,
      location: record.isFraud ? 'Frankfurt, DE' : 'New York, US',
    };
    return this.processRawInput(input);
  }

  public injectTransaction(input: RawTransactionInput): Transaction {
    input.isSimulatedDemo = input.isSimulatedDemo ?? false;
    return this.processRawInput(input);
  }

  public injectBatchTransactions(inputs: RawTransactionInput[]): Transaction[] {
    return inputs.map((item) => {
      item.isSimulatedDemo = item.isSimulatedDemo ?? false;
      return this.processRawInput(item);
    });
  }

  private processRawInput(input: RawTransactionInput): Transaction {
    const config = this.storage.getConfig();
    const evaluatedTx = evaluateTransaction(input, config);

    this.storage.addTransaction(evaluatedTx);

    this.txCountInCurrentSecond++;
    const now = Date.now();
    if (now - this.lastTpsCheckTime >= 1000) {
      this.currentTPS = this.txCountInCurrentSecond;
      this.txCountInCurrentSecond = 0;
      this.lastTpsCheckTime = now;
    }

    this.listeners.forEach((listener) => {
      try {
        listener(evaluatedTx);
      } catch (e) {
        console.error('Error in transaction listener:', e);
      }
    });

    return evaluatedTx;
  }

  public getAvailablePresets(): InjectionPreset[] {
    return [
      {
        name: 'PaySim #3: $181.00 Ground Truth Account Drain',
        category: 'ATTACK',
        description: 'Authentic PaySim Step 1 Fraud (C1305486145 -> C553264065): Complete 100% origin balance liquidation to burner destination.',
        payload: {
          type: 'TRANSFER',
          amount: 181.00,
          oldBalanceOrig: 181.00,
          newBalanceOrig: 0.00,
          oldBalanceDest: 0.00,
          newBalanceDest: 0.00,
          step: 1,
          senderId: 'C1305486145',
          receiverId: 'C553264065',
          historicalAvgAmount: 181.00,
          location: 'Frankfurt, DE',
        },
      },
      {
        name: 'PaySim #17: $1,277,212.77 High-Value Siphon',
        category: 'ATTACK',
        description: 'Authentic PaySim Step 1 Fraud (C467632528 -> C716083600): Catastrophic $1.27M unauthorized balance drain to zero-balance receiver.',
        payload: {
          type: 'TRANSFER',
          amount: 1277212.77,
          oldBalanceOrig: 1277212.77,
          newBalanceOrig: 0.00,
          oldBalanceDest: 0.00,
          newBalanceDest: 0.00,
          step: 1,
          senderId: 'C467632528',
          receiverId: 'C716083600',
          historicalAvgAmount: 25000.00,
          location: 'Frankfurt, DE',
        },
      },
      {
        name: 'PaySim #32: $10,000,000.00 Flagged Catastrophic Fraud',
        category: 'ATTACK',
        description: 'Authentic PaySim Step 9 Fraud (C1900366749 -> C997089723): The historical $10M liquidation that triggered PaySim isFlaggedFraud.',
        payload: {
          type: 'TRANSFER',
          amount: 10000000.00,
          oldBalanceOrig: 10000000.00,
          newBalanceOrig: 0.00,
          oldBalanceDest: 0.00,
          newBalanceDest: 0.00,
          step: 9,
          senderId: 'C1900366749',
          receiverId: 'C997089723',
          historicalAvgAmount: 150000.00,
          location: 'Frankfurt, DE',
        },
      },
      {
        name: 'PaySim #23: $158,862.27 Step 4 Siphon',
        category: 'ATTACK',
        description: 'Authentic PaySim Step 4 Fraud (C1427829851 -> C43869769): High-volume origin balance drain.',
        payload: {
          type: 'TRANSFER',
          amount: 158862.27,
          oldBalanceOrig: 158862.27,
          newBalanceOrig: 0.00,
          oldBalanceDest: 0.00,
          newBalanceDest: 0.00,
          step: 4,
          senderId: 'C1427829851',
          receiverId: 'C43869769',
          historicalAvgAmount: 8500.00,
          location: 'London, UK',
        },
      },
      {
        name: 'PaySim #1: $9,839.64 Retail POS Payment (Control)',
        category: 'CONTROL',
        description: 'Authentic PaySim Step 1 Legitimate (C1231006815 -> M1979787155): Standard consumer checkout to verified merchant.',
        payload: {
          type: 'PAYMENT',
          amount: 9839.64,
          oldBalanceOrig: 170136.00,
          newBalanceOrig: 160296.36,
          oldBalanceDest: 0.00,
          newBalanceDest: 0.00,
          step: 1,
          senderId: 'C1231006815',
          receiverId: 'M1979787155',
          historicalAvgAmount: 10000.00,
          location: 'New York, US',
        },
      },
    ];
  }
}
