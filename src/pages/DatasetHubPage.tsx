/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Database,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Play,
  RotateCcw,
  Sliders,
  Search,
  ExternalLink,
  Download,
  Trash2,
  Table,
  Info,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  DatasetService,
  IngestedDataset,
  ColumnMapping,
} from '../services/datasetService';
import { StreamSimulator } from '../services/streamSimulator';

interface DatasetHubPageProps {
  onNavigateToLive: () => void;
}

export const DatasetHubPage: React.FC<DatasetHubPageProps> = ({ onNavigateToLive }) => {
  const datasetService = DatasetService.getInstance();
  const simulator = StreamSimulator.getInstance();

  const [activeDataset, setActiveDataset] = useState<IngestedDataset | null>(() =>
    datasetService.getActiveDataset()
  );
  const [ingestMode, setIngestMode] = useState<'LINK' | 'FILE'>('LINK');

  // URL Ingestion State
  const [urlInput, setUrlInput] = useState<string>('');
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);

  // Schema Mapping State
  const [isMappingOpen, setIsMappingOpen] = useState<boolean>(false);
  const [editableMapping, setEditableMapping] = useState<ColumnMapping>({
    amount: '',
    type: '',
    senderId: '',
    receiverId: '',
    oldBalanceOrig: '',
    newBalanceOrig: '',
    oldBalanceDest: '',
    newBalanceDest: '',
    isFraud: '',
    step: '',
  });

  // Table Preview State
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [previewPage, setPreviewPage] = useState<number>(1);
  const pageSize = 20;

  useEffect(() => {
    return datasetService.subscribe((ds) => {
      setActiveDataset(ds);
      if (ds) {
        setEditableMapping(ds.columnMapping);
      }
    });
  }, []);

  // Quick Preset Sample Links for testing
  const presetLinks = [
    {
      name: 'Kaggle PaySim Sample (Direct Mirror)',
      url: 'https://raw.githubusercontent.com/ealaxi/paysim/master/sample_transactions.csv',
      description: 'Mobile money synthetic transfers with balance liquidations and ground-truth fraud.',
    },
    {
      name: 'Credit Card Anomaly Benchmark (Sample)',
      url: 'https://raw.githubusercontent.com/numenta/NAB/master/data/realKnownCause/ambient_temperature_system_failure.csv',
      description: 'Continuous metric anomaly stream suitable for unsupervised Isolation Forest.',
    },
  ];

  const handleFetchUrl = async (targetUrl?: string) => {
    const urlToFetch = targetUrl || urlInput;
    if (!urlToFetch.trim()) {
      setUrlError('Please enter or select a valid dataset URL.');
      return;
    }
    setUrlError(null);
    setIsLoadingUrl(true);

    try {
      await datasetService.ingestFromUrl(urlToFetch);
      setUrlInput('');
      setIsLoadingUrl(false);
    } catch (err: any) {
      setUrlError(err.message || 'Failed to fetch dataset from link.');
      setIsLoadingUrl(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setFileError(null);
    setIsLoadingFile(true);
    try {
      await datasetService.ingestFromFile(file);
      setIsLoadingFile(false);
    } catch (err: any) {
      setFileError(err.message || 'Failed to parse file.');
      setIsLoadingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApplyMapping = () => {
    if (!activeDataset) return;
    datasetService.updateMapping(editableMapping);
    setIsMappingOpen(false);
  };

  const handleClearDataset = () => {
    if (window.confirm('Remove active dataset? The live surveillance stream will stop until a new dataset is added.')) {
      simulator.stop();
      datasetService.clearDataset();
    }
  };

  const handleStartLiveStreamWithDataset = () => {
    if (!activeDataset) return;
    simulator.start();
    onNavigateToLive();
  };

  const handleExportNormalizedJson = () => {
    if (!activeDataset) return;
    const blob = new Blob([JSON.stringify(activeDataset.records, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraudguard_normalized_${activeDataset.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Preview filtering
  const previewRows = activeDataset ? activeDataset.records : [];
  const filteredPreview = previewRows.filter((r) => {
    if (!previewSearch.trim()) return true;
    const q = previewSearch.toLowerCase().trim();
    return (
      r.senderId.toLowerCase().includes(q) ||
      r.receiverId.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      String(r.amount).includes(q)
    );
  });
  const paginatedPreview = filteredPreview.slice(
    (previewPage - 1) * pageSize,
    previewPage * pageSize
  );
  const totalPreviewPages = Math.max(1, Math.ceil(filteredPreview.length / pageSize));

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Dataset Ingestion &amp; Management Hub
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-semibold">
              DYNAMIC INGESTION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Ingest custom fraud detection datasets via direct web links or local file upload (CSV / JSON).
            The surveillance engine automatically extracts features, maps transaction schemas, and feeds real-time detection models.
          </p>
        </div>

        {activeDataset && (
          <button
            onClick={handleStartLiveStreamWithDataset}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded transition-colors shadow-sm self-start sm:self-auto shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Live Surveillance With This Dataset</span>
          </button>
        )}
      </div>

      {/* Ingestion Methods Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        {/* Sub-tabs for Ingestion Source */}
        <div className="px-5 pt-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-mono">
            <button
              onClick={() => setIngestMode('LINK')}
              className={`pb-3 border-b-2 font-bold flex items-center gap-2 transition-colors ${
                ingestMode === 'LINK'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>1. Ingest via Dataset Link / URL</span>
            </button>

            <button
              onClick={() => setIngestMode('FILE')}
              className={`pb-3 border-b-2 font-bold flex items-center gap-2 transition-colors ${
                ingestMode === 'FILE'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>2. Ingest via File Upload (CSV / JSON)</span>
            </button>
          </div>

          {activeDataset && (
            <span className="text-[11px] font-mono text-emerald-400 hidden sm:flex items-center gap-1.5 pb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active Dataset: {activeDataset.name}</span>
            </span>
          )}
        </div>

        {/* Tab 1: Ingest via Link */}
        {ingestMode === 'LINK' && (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-200 mb-1.5">
                Remote Dataset URL / Link
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setUrlError(null);
                    }}
                    placeholder="https://example.com/transactions.csv (or Kaggle raw dataset link / GitHub raw URL)"
                    className="w-full bg-slate-950 border border-slate-700 rounded pl-9 pr-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  onClick={() => handleFetchUrl()}
                  disabled={isLoadingUrl}
                  className="px-5 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded transition-colors whitespace-nowrap shadow-sm flex items-center justify-center gap-1.5 font-mono"
                >
                  {isLoadingUrl ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching &amp; Parsing...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Fetch &amp; Ingest Dataset</span>
                    </>
                  )}
                </button>
              </div>

              {urlError && (
                <div className="mt-2.5 p-3 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2 font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <div className="font-bold">Ingestion Failed</div>
                    <div className="text-[11px] opacity-90 mt-0.5">{urlError}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Testing Presets */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="text-xs font-mono text-slate-400 font-semibold flex items-center justify-between">
                <span>Quick Test Presets (Instant Cloud Ingestion)</span>
                <span className="text-[10px] text-slate-500 font-normal">Click to load benchmark data directly</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {presetLinks.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setUrlInput(preset.url);
                      handleFetchUrl(preset.url);
                    }}
                    className="p-3.5 rounded bg-slate-950/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-950 cursor-pointer transition-all space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {preset.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">{preset.description}</p>
                    <div className="text-[10px] font-mono text-slate-500 truncate">{preset.url}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kaggle Direct Download Tip */}
            <div className="p-3.5 rounded bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-300 font-sans flex items-start gap-2.5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-cyan-300">Testing with Kaggle Datasets:</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Kaggle web pages (e.g. <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded font-mono">kaggle.com/datasets/...</code>) require user authentication to download full multi-gigabyte archives. You can either paste a direct raw CSV URL from a public repository, or download the dataset from Kaggle to your local machine and switch to the <strong>File Upload</strong> tab above to load it with zero network friction.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Ingest via File Upload */}
        {ingestMode === 'FILE' && (
          <div className="p-6 space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/30'
                  : 'border-slate-700/80 bg-slate-950/40 hover:border-cyan-500/50 hover:bg-slate-950/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .json, text/csv, application/json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-200">
                  {isLoadingFile ? 'Parsing dataset file...' : 'Drop your dataset file here, or click to browse'}
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Supports .csv and .json transaction tables (up to 25,000 streaming records)
                </p>
              </div>
            </div>

            {fileError && (
              <div className="p-3 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <div className="font-bold">File Parse Error</div>
                  <div className="text-[11px] opacity-90 mt-0.5">{fileError}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Dataset Inspection & Analytics */}
      {activeDataset ? (
        <div className="space-y-5">
          {/* Dataset Status Banner */}
          <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-100 font-mono">
                      {activeDataset.name}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      ACTIVE SOURCE
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Source: <span className="text-slate-300">{activeDataset.sourceType}</span> · Ingested:{' '}
                    <span className="text-slate-300">
                      {new Date(activeDataset.loadedAt).toLocaleTimeString()}
                    </span>
                    {activeDataset.sourceUrl && (
                      <span className="text-slate-500 truncate max-w-xs ml-2">
                        ({activeDataset.sourceUrl})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsMappingOpen(!isMappingOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Configure Column Mapping</span>
                </button>

                <button
                  onClick={handleExportNormalizedJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export JSON</span>
                </button>

                <button
                  onClick={handleClearDataset}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Dataset</span>
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
              <div className="p-3.5 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Rows Loaded</div>
                <div className="text-xl font-bold text-cyan-400 mt-1 tabular-nums">
                  {activeDataset.totalRows.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Available for live stream</div>
              </div>

              <div className="p-3.5 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Ground Truth Fraud</div>
                <div className="text-xl font-bold text-rose-400 mt-1 tabular-nums">
                  {activeDataset.fraudCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {activeDataset.totalRows > 0
                    ? `${((activeDataset.fraudCount / activeDataset.totalRows) * 100).toFixed(2)}% rate`
                    : '0%'}
                </div>
              </div>

              <div className="p-3.5 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Volume (USD)</div>
                <div className="text-xl font-bold text-emerald-400 mt-1 tabular-nums">
                  ${activeDataset.totalVolumeUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Monetary sum</div>
              </div>

              <div className="p-3.5 rounded bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Schema Columns</div>
                <div className="text-xl font-bold text-slate-200 mt-1 tabular-nums">
                  {activeDataset.columns.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Detected fields</div>
              </div>
            </div>

            {/* Column Mapping Modal / Dropdown */}
            {isMappingOpen && (
              <div className="p-5 rounded-lg bg-slate-950 border border-slate-700 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <span className="font-bold text-slate-200">Schema &amp; Column Mapping Configuration</span>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                      Assign which column in your dataset corresponds to standard financial attributes.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsMappingOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'amount', label: 'Amount ($) *', required: true },
                    { key: 'type', label: 'Transaction Type / Channel', required: false },
                    { key: 'senderId', label: 'Sender / Origin Account', required: false },
                    { key: 'receiverId', label: 'Recipient / Dest Account', required: false },
                    { key: 'oldBalanceOrig', label: 'Origin Balance Before', required: false },
                    { key: 'newBalanceOrig', label: 'Origin Balance After', required: false },
                    { key: 'oldBalanceDest', label: 'Dest Balance Before', required: false },
                    { key: 'newBalanceDest', label: 'Dest Balance After', required: false },
                    { key: 'isFraud', label: 'Ground Truth Fraud Label', required: false },
                    { key: 'step', label: 'Step / Timestamp Index', required: false },
                  ].map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-[11px] text-slate-400 block">
                        {field.label}
                      </label>
                      <select
                        value={editableMapping[field.key as keyof ColumnMapping] || ''}
                        onChange={(e) =>
                          setEditableMapping({
                            ...editableMapping,
                            [field.key]: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                      >
                        <option value="">-- Unmapped / Auto --</option>
                        {activeDataset.columns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setIsMappingOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyMapping}
                    className="px-4 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-colors"
                  >
                    Apply New Mapping
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dataset Records Preview Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden font-mono">
            <div className="px-5 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-slate-200">
                  Dataset Records Preview ({filteredPreview.length} matching)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={(e) => {
                      setPreviewSearch(e.target.value);
                      setPreviewPage(1);
                    }}
                    placeholder="Search sender, recipient, type..."
                    className="bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <button
                    disabled={previewPage <= 1}
                    onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-0.5 rounded bg-slate-800 disabled:opacity-40"
                  >
                    &larr;
                  </button>
                  <span>
                    {previewPage} / {totalPreviewPages}
                  </span>
                  <button
                    disabled={previewPage >= totalPreviewPages}
                    onClick={() => setPreviewPage((p) => Math.min(totalPreviewPages, p + 1))}
                    className="px-2 py-0.5 rounded bg-slate-800 disabled:opacity-40"
                  >
                    &rarr;
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 text-[11px] border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Sender (Origin)</th>
                    <th className="px-4 py-2.5">Recipient (Dest)</th>
                    <th className="px-4 py-2.5">Channel</th>
                    <th className="px-4 py-2.5">Amount ($)</th>
                    <th className="px-4 py-2.5">Orig Balance &rarr; New</th>
                    <th className="px-4 py-2.5">Ground Truth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedPreview.map((rec) => (
                    <tr key={rec.index} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5 text-slate-500 font-mono">{rec.index}</td>
                      <td className="px-4 py-2.5 text-cyan-300 font-mono">{rec.senderId}</td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono">{rec.receiverId}</td>
                      <td className="px-4 py-2.5 text-slate-300 font-mono">{rec.type}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-100 font-mono tabular-nums">
                        ${rec.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono tabular-nums text-[11px]">
                        ${rec.oldBalanceOrig.toLocaleString()} &rarr; ${rec.newBalanceOrig.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        {rec.isFraud === 1 ? (
                          <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                            FRAUD (isFraud=1)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                            Legitimate (0)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-lg space-y-3 font-mono flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
            <Database className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-slate-200 font-sans">
            No Active Ingestion Dataset Loaded
          </div>
          <p className="text-xs text-slate-500 font-sans max-w-md">
            Insert a dataset link or upload a local CSV/JSON file using the tabs above. Once loaded, the records will power the real-time simulation engine and risk detection models.
          </p>
        </div>
      )}
    </div>
  );
};
