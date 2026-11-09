/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransactionType } from '../types';

export type DatasetSourceType = 'FILE_UPLOAD' | 'URL_LINK';

export interface ColumnMapping {
  amount: string;
  type: string;
  senderId: string;
  receiverId: string;
  oldBalanceOrig: string;
  newBalanceOrig: string;
  oldBalanceDest: string;
  newBalanceDest: string;
  isFraud: string;
  step: string;
}

export interface IngestedRecord {
  index: number;
  step: number;
  type: TransactionType;
  amount: number;
  senderId: string;
  receiverId: string;
  oldBalanceOrig: number;
  newBalanceOrig: number;
  oldBalanceDest: number;
  newBalanceDest: number;
  isFraud: number;
  isFlaggedFraud: number;
  raw: Record<string, any>;
}

export interface IngestedDataset {
  id: string;
  name: string;
  sourceType: DatasetSourceType;
  sourceUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  loadedAt: string;
  totalRows: number;
  columns: string[];
  columnMapping: ColumnMapping;
  fraudCount: number;
  legitimateCount: number;
  totalVolumeUSD: number;
  typesDistribution: Record<string, number>;
  records: IngestedRecord[];
}

const STORAGE_KEY = 'fraudguard_custom_dataset_v1';

export class DatasetService {
  private static instance: DatasetService;
  private activeDataset: IngestedDataset | null = null;
  private cursor = 0;
  private listeners: Set<(dataset: IngestedDataset | null) => void> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): DatasetService {
    if (!DatasetService.instance) {
      DatasetService.instance = new DatasetService();
    }
    return DatasetService.instance;
  }

  public subscribe(listener: (dataset: IngestedDataset | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.activeDataset);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.activeDataset));
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.activeDataset) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      // Store metadata and up to 2500 parsed records to fit localStorage safely
      const serializable = {
        ...this.activeDataset,
        records: this.activeDataset.records.slice(0, 2500),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (e) {
      console.warn('Dataset storage write warning (dataset may exceed localStorage quota):', e);
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.activeDataset = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Dataset storage load warning:', e);
      this.activeDataset = null;
    }
  }

  public getActiveDataset(): IngestedDataset | null {
    return this.activeDataset;
  }

  public hasDataset(): boolean {
    return this.activeDataset !== null && this.activeDataset.records.length > 0;
  }

  public clearDataset(): void {
    this.activeDataset = null;
    this.cursor = 0;
    this.saveToStorage();
    this.notify();
  }

  public getNextRecord(): IngestedRecord | null {
    if (!this.activeDataset || this.activeDataset.records.length === 0) {
      return null;
    }
    const record = this.activeDataset.records[this.cursor];
    this.cursor = (this.cursor + 1) % this.activeDataset.records.length;
    return record;
  }

  public resetCursor(): void {
    this.cursor = 0;
  }

  /**
   * Fast, RFC-4180 compliant CSV parser that supports quotes, multi-line values, and custom delimiters
   */
  public parseCsv(csvText: string, maxRows = 20000): { headers: string[]; rows: Record<string, string>[] } {
    const cleanText = csvText.replace(/^\uFEFF/, '').trim(); // Remove UTF-8 BOM
    if (!cleanText) return { headers: [], rows: [] };

    // Determine delimiter: check comma, semicolon, tab
    const firstLine = cleanText.split('\n', 1)[0];
    let delimiter = ',';
    if (firstLine.includes('\t') && !firstLine.includes(',')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    const lines: string[] = [];
    let curLine = '';
    let inQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"' || char === "'") {
        if (inQuotes && nextChar === char) {
          curLine += char;
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        if (curLine.trim()) {
          lines.push(curLine);
          if (lines.length > maxRows + 2) break; // limit to requested max
        }
        curLine = '';
      } else {
        curLine += char;
      }
    }
    if (curLine.trim()) lines.push(curLine);

    if (lines.length === 0) return { headers: [], rows: [] };

    // Parse header
    const headers = this.parseCsvRow(lines[0], delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const rows: Record<string, string>[] = [];

    for (let r = 1; r < lines.length && rows.length < maxRows; r++) {
      const values = this.parseCsvRow(lines[r], delimiter);
      if (values.length === 0 || (values.length === 1 && !values[0])) continue;

      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = (values[idx] ?? '').trim().replace(/^["']|["']$/g, '');
      });
      rows.push(rowObj);
    }

    return { headers, rows };
  }

  private parseCsvRow(rowStr: string, delimiter: string): string[] {
    const fields: string[] = [];
    let curField = '';
    let inQuotes = false;

    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      const nextChar = rowStr[i + 1];

      if (char === '"' || char === "'") {
        if (inQuotes && nextChar === char) {
          curField += char;
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        fields.push(curField);
        curField = '';
      } else {
        curField += char;
      }
    }
    fields.push(curField);
    return fields;
  }

  /**
   * JSON Parser supporting arrays of records or wrapper objects
   */
  public parseJson(jsonText: string): { headers: string[]; rows: Record<string, any>[] } {
    const cleanText = jsonText.replace(/^\uFEFF/, '').trim();
    let data = JSON.parse(cleanText);

    if (!Array.isArray(data)) {
      if (Array.isArray(data.data)) data = data.data;
      else if (Array.isArray(data.records)) data = data.records;
      else if (Array.isArray(data.transactions)) data = data.transactions;
      else if (Array.isArray(data.items)) data = data.items;
      else if (typeof data === 'object') data = [data];
      else throw new Error('JSON does not contain a recognizable list of transaction records.');
    }

    if (data.length === 0) return { headers: [], rows: [] };

    const headerSet = new Set<string>();
    data.slice(0, 100).forEach((item: Record<string, any>) => {
      Object.keys(item).forEach((k) => headerSet.add(k));
    });
    const headers = Array.from(headerSet);

    return { headers, rows: data };
  }

  /**
   * Automatically infer field mappings from common financial & Kaggle dataset schemas
   */
  public autoDetectColumnMapping(headers: string[]): ColumnMapping {
    const findMatch = (candidates: string[]): string => {
      const lowerHeaders = headers.map((h) => ({ original: h, lower: h.toLowerCase().replace(/[^a-z0-9]/g, '') }));
      for (const cand of candidates) {
        const cleanCand = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
        const exact = lowerHeaders.find((h) => h.lower === cleanCand);
        if (exact) return exact.original;
      }
      for (const cand of candidates) {
        const cleanCand = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
        const partial = lowerHeaders.find((h) => h.lower.includes(cleanCand) || cleanCand.includes(h.lower));
        if (partial) return partial.original;
      }
      return '';
    };

    return {
      amount: findMatch(['amount', 'amt', 'transactionamt', 'value', 'price', 'txamount', 'total']),
      type: findMatch(['type', 'channel', 'trans_type', 'transactiontype', 'category', 'payment_method', 'method']),
      senderId: findMatch(['nameorig', 'sender', 'senderid', 'source', 'origin', 'accountorig', 'customer', 'card_id', 'client_id', 'user_id']),
      receiverId: findMatch(['namedest', 'receiver', 'receiverid', 'target', 'dest', 'accountdest', 'merchant', 'beneficiary']),
      oldBalanceOrig: findMatch(['oldbalanceorg', 'oldbalanceorig', 'old_balance', 'balance_orig', 'orig_balance_before', 'balance']),
      newBalanceOrig: findMatch(['newbalanceorig', 'new_balance', 'balance_orig_after', 'orig_balance_after']),
      oldBalanceDest: findMatch(['oldbalancedest', 'dest_balance_before', 'balance_dest']),
      newBalanceDest: findMatch(['newbalancedest', 'dest_balance_after']),
      isFraud: findMatch(['isfraud', 'class', 'fraud', 'label', 'target', 'is_fraud', 'isflaggedfraud']),
      step: findMatch(['step', 'time', 'timestamp', 'hour', 'datetime', 'date', 'unix_time']),
    };
  }

  /**
   * Process parsed rows into standard IngestedRecords using the active column mapping
   */
  public processRawData(
    name: string,
    headers: string[],
    rawRows: Record<string, any>[],
    sourceType: DatasetSourceType,
    sourceUrl?: string,
    customMapping?: Partial<ColumnMapping>,
    fileSizeBytes?: number
  ): IngestedDataset {
    const mapping: ColumnMapping = {
      ...this.autoDetectColumnMapping(headers),
      ...customMapping,
    };

    let totalVolumeUSD = 0;
    let fraudCount = 0;
    let legitimateCount = 0;
    const typesDistribution: Record<string, number> = {};

    const records: IngestedRecord[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];

      // Parse Amount
      const rawAmt = mapping.amount ? row[mapping.amount] : row.amount;
      const parsedAmount = Math.abs(parseFloat(String(rawAmt).replace(/[$,]/g, ''))) || 100.0;
      totalVolumeUSD += parsedAmount;

      // Parse Type / Channel
      let rawType = mapping.type ? String(row[mapping.type] || '').toUpperCase().trim() : '';
      let type: TransactionType = 'PAYMENT';
      if (rawType.includes('TRANSFER')) type = 'TRANSFER';
      else if (rawType.includes('CASH_OUT') || rawType.includes('CASHOUT') || rawType.includes('WITHDRAW')) type = 'CASH_OUT';
      else if (rawType.includes('CASH_IN') || rawType.includes('CASHIN') || rawType.includes('DEPOSIT')) type = 'CASH_IN';
      else if (rawType.includes('DEBIT')) type = 'DEBIT';
      else if (rawType.includes('PAYMENT') || rawType.includes('RETAIL') || rawType.includes('POS')) type = 'PAYMENT';
      else if (rawType) type = (rawType as TransactionType);

      typesDistribution[type] = (typesDistribution[type] || 0) + 1;

      // Parse Identifiers
      const senderId = mapping.senderId && row[mapping.senderId] ? String(row[mapping.senderId]).trim() : `C${10000000 + i}`;
      const receiverId = mapping.receiverId && row[mapping.receiverId] ? String(row[mapping.receiverId]).trim() : `M${20000000 + i}`;

      // Parse Balances
      const oldBalanceOrig = mapping.oldBalanceOrig ? parseFloat(String(row[mapping.oldBalanceOrig]).replace(/[$,]/g, '')) || 0 : parsedAmount;
      const newBalanceOrig = mapping.newBalanceOrig ? parseFloat(String(row[mapping.newBalanceOrig]).replace(/[$,]/g, '')) || Math.max(0, oldBalanceOrig - parsedAmount) : Math.max(0, oldBalanceOrig - parsedAmount);
      const oldBalanceDest = mapping.oldBalanceDest ? parseFloat(String(row[mapping.oldBalanceDest]).replace(/[$,]/g, '')) || 0 : 0;
      const newBalanceDest = mapping.newBalanceDest ? parseFloat(String(row[mapping.newBalanceDest]).replace(/[$,]/g, '')) || (oldBalanceDest + parsedAmount) : (oldBalanceDest + parsedAmount);

      // Parse Fraud Ground Truth Label
      let isFraud = 0;
      if (mapping.isFraud && row[mapping.isFraud] !== undefined) {
        const val = String(row[mapping.isFraud]).trim().toLowerCase();
        if (val === '1' || val === 'true' || val === 'yes' || val === 'fraud' || val === 'bad') {
          isFraud = 1;
        }
      } else if (row.isFraud !== undefined || row.Class !== undefined) {
        const val = String(row.isFraud ?? row.Class).trim().toLowerCase();
        if (val === '1' || val === 'true') isFraud = 1;
      }

      if (isFraud === 1) fraudCount++;
      else legitimateCount++;

      // Parse Step / Timestamp
      const rawStep = mapping.step ? parseInt(String(row[mapping.step]), 10) : i + 1;
      const step = isNaN(rawStep) ? i + 1 : rawStep;

      records.push({
        index: i + 1,
        step,
        type,
        amount: parsedAmount,
        senderId,
        receiverId,
        oldBalanceOrig,
        newBalanceOrig,
        oldBalanceDest,
        newBalanceDest,
        isFraud,
        isFlaggedFraud: parsedAmount >= 200000 ? 1 : 0,
        raw: row,
      });
    }

    const dataset: IngestedDataset = {
      id: `DS-${Date.now()}`,
      name: name || 'Custom Ingested Dataset',
      sourceType,
      sourceUrl,
      fileName: sourceType === 'FILE_UPLOAD' ? name : undefined,
      fileSizeBytes,
      loadedAt: new Date().toISOString(),
      totalRows: records.length,
      columns: headers,
      columnMapping: mapping,
      fraudCount,
      legitimateCount,
      totalVolumeUSD: Math.round(totalVolumeUSD * 100) / 100,
      typesDistribution,
      records,
    };

    this.activeDataset = dataset;
    this.cursor = 0;
    this.saveToStorage();
    this.notify();

    return dataset;
  }

  /**
   * Ingest dataset from a local File object (.csv or .json)
   */
  public async ingestFromFile(file: File, customMapping?: Partial<ColumnMapping>): Promise<IngestedDataset> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          if (!content) {
            throw new Error('Selected file is empty.');
          }

          const isJson = file.name.endsWith('.json') || content.trim().startsWith('[') || content.trim().startsWith('{');
          if (isJson) {
            const { headers, rows } = this.parseJson(content);
            const dataset = this.processRawData(file.name, headers, rows, 'FILE_UPLOAD', undefined, customMapping, file.size);
            resolve(dataset);
          } else {
            const { headers, rows } = this.parseCsv(content, 25000);
            const dataset = this.processRawData(file.name, headers, rows, 'FILE_UPLOAD', undefined, customMapping, file.size);
            resolve(dataset);
          }
        } catch (err: any) {
          reject(new Error(`Failed to parse file "${file.name}": ${err.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file from disk.'));
      reader.readAsText(file);
    });
  }

  /**
   * Ingest dataset from any web URL or link (Kaggle dataset raw link, GitHub raw, S3, API)
   */
  public async ingestFromUrl(url: string, customMapping?: Partial<ColumnMapping>): Promise<IngestedDataset> {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      throw new Error('Please enter a valid dataset URL.');
    }

    let textContent = '';
    let datasetName = 'Remote Dataset';

    try {
      const urlObj = new URL(trimmedUrl);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').filter(Boolean).pop();
      if (filename) datasetName = filename;
    } catch {
      datasetName = 'URL Ingestion';
    }

    // Try direct fetch first, fallback to Vite /api/fetch-dataset proxy if CORS blocks it
    try {
      const directResponse = await fetch(trimmedUrl, {
        headers: { Accept: 'text/csv, application/json, text/plain, */*' },
      });
      if (directResponse.ok) {
        textContent = await directResponse.text();
      } else {
        throw new Error(`Direct fetch status: ${directResponse.status}`);
      }
    } catch {
      // CORS or network failure: proxy via local server proxy
      const proxyUrl = `/api/fetch-dataset?url=${encodeURIComponent(trimmedUrl)}`;
      const proxyResponse = await fetch(proxyUrl);
      if (!proxyResponse.ok) {
        const errJson = await proxyResponse.json().catch(() => ({ error: 'Proxy fetch failed' }));
        throw new Error(errJson.error || `Unable to fetch from ${trimmedUrl}. Status: ${proxyResponse.status}`);
      }
      textContent = await proxyResponse.text();
    }

    if (!textContent || !textContent.trim()) {
      throw new Error('The URL returned an empty response.');
    }

    // Detect format
    const isJson = trimmedUrl.endsWith('.json') || textContent.trim().startsWith('[') || textContent.trim().startsWith('{');

    if (isJson) {
      const { headers, rows } = this.parseJson(textContent);
      return this.processRawData(datasetName, headers, rows, 'URL_LINK', trimmedUrl, customMapping, textContent.length);
    } else {
      const { headers, rows } = this.parseCsv(textContent, 25000);
      return this.processRawData(datasetName, headers, rows, 'URL_LINK', trimmedUrl, customMapping, textContent.length);
    }
  }

  /**
   * Update column mapping on the active dataset without re-fetching
   */
  public updateMapping(newMapping: ColumnMapping): IngestedDataset | null {
    if (!this.activeDataset) return null;

    const rawRows = this.activeDataset.records.map((r) => r.raw);
    const updated = this.processRawData(
      this.activeDataset.name,
      this.activeDataset.columns,
      rawRows,
      this.activeDataset.sourceType,
      this.activeDataset.sourceUrl,
      newMapping,
      this.activeDataset.fileSizeBytes
    );
    return updated;
  }
}
