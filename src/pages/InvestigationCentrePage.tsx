import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  Send,
  Download,
  FileText,
  Paperclip,
  Check,
  X,
  ExternalLink,
  Play,
  Radio,
} from 'lucide-react';
import {
  FraudCase,
  CaseStatus,
  CasePriority,
  CaseResolution,
  UserProfile,
  Transaction,
} from '../types';
import { StreamStatus } from '../services/streamSimulator';

interface InvestigationCentrePageProps {
  cases: FraudCase[];
  currentUser: UserProfile;
  streamStatus?: StreamStatus;
  onStartStream?: () => void;
  onNavigateToLive?: () => void;
  onCreateCase: (title: string, priority: CasePriority) => void;
  onUpdateStatus: (caseId: string, status: CaseStatus, resolution?: CaseResolution, reason?: string) => void;
  onAddNote: (caseId: string, note: string) => void;
  onSelectTransactionId: (txId: string) => void;
}

export const InvestigationCentrePage: React.FC<InvestigationCentrePageProps> = ({
  cases,
  currentUser,
  streamStatus = 'IDLE',
  onStartStream,
  onNavigateToLive,
  onCreateCase,
  onUpdateStatus,
  onAddNote,
  onSelectTransactionId,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');
  const [noteInput, setNoteInput] = useState<string>('');
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState<boolean>(false);
  const [newCaseTitle, setNewCaseTitle] = useState<string>('');
  const [newCasePriority, setNewCasePriority] = useState<CasePriority>('HIGH');

  // Close Case modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);
  const [closureDisposition, setClosureDisposition] = useState<CaseResolution>('CONFIRMED_FRAUD');
  const [closureReason, setClosureReason] = useState<string>('Evidence of unauthorized account takeover verified with cardholder.');

  const filtered = cases.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.customerId.toLowerCase().includes(q) ||
        c.assignedTo.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const selectedCase = cases.find((c) => c.id === selectedCustomerId()) || filtered[0];

  function selectedCustomerId() {
    return selectedCaseId || cases[0]?.id || '';
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || !selectedCase) return;
    onAddNote(selectedCase.id, noteInput);
    setNoteInput('');
  };

  const handleCreateCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle.trim()) return;
    onCreateCase(newCaseTitle, newCasePriority);
    setNewCaseTitle('');
    setIsNewCaseModalOpen(false);
  };

  const handleCloseCaseSubmit = () => {
    if (!selectedCase) return;
    onUpdateStatus(selectedCase.id, 'CLOSED', closureDisposition, closureReason);
    setIsCloseModalOpen(false);
  };

  const handleExportCaseCSV = () => {
    if (!selectedCase) return;
    const content = [
      `CASE REPORT - ${selectedCase.id}`,
      `Title: ${selectedCase.title}`,
      `Status: ${selectedCase.status}`,
      `Priority: ${selectedCase.priority}`,
      `Customer ID: ${selectedCase.customerId}`,
      `Assigned Investigator: ${selectedCase.assignedTo} (${selectedCase.assignedRole})`,
      `Created At: ${selectedCase.createdAt}`,
      `Resolution: ${selectedCase.resolution || 'PENDING'}`,
      `Closure Reason: ${selectedCase.closureReason || 'N/A'}`,
      `Exposed Amount: $${selectedCase.totalExposedAmountUSD}`,
      '\n--- NOTES ---',
      ...selectedCase.notes.map((n) => `[${n.timestamp}] ${n.author} (${n.authorRole}): ${n.content}`),
      '\n--- EVIDENCE ---',
      ...selectedCase.evidence.map((e) => `[${e.type}] ${e.description} (Confidence: ${e.confidence})`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `case_report_${selectedCase.id}_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Fraud Investigation Case Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Special Investigations Unit (SIU) case queue, evidence gathering, investigator assignments and audit disposition
          </p>
        </div>

        <button
          onClick={() => setIsNewCaseModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Investigation Case</span>
        </button>
      </div>

      {/* Stream surveillance & case generation status banner */}
      {cases.length === 0 && (
        <div
          className={`p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono ${
            streamStatus === 'RUNNING'
              ? 'bg-cyan-950/30 border-cyan-500/40'
              : 'bg-amber-950/20 border-amber-500/30'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded mt-0.5 ${
                streamStatus === 'RUNNING' ? 'bg-cyan-950 text-cyan-400' : 'bg-amber-950 text-amber-400'
              }`}
            >
              {streamStatus === 'RUNNING' ? (
                <Radio className="w-5 h-5 animate-pulse" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">
                {streamStatus === 'RUNNING'
                  ? 'Active Surveillance Running — Awaiting High-Risk Events'
                  : 'No Investigations Docketed — Live Stream Inactive'}
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5 max-w-2xl">
                {streamStatus === 'RUNNING'
                  ? 'Real-time payment transactions are streaming through the ML engine. Any transaction evaluated as FLAGGED or BLOCKED will automatically be converted into an active SIU case dossier here.'
                  : 'Investigation cases are strictly generated from live payment surveillance or manual escalation. Start the live stream in Live Monitoring to begin detecting risk events and automatically populating this Investigation Centre.'}
              </p>
            </div>
          </div>

          {streamStatus !== 'RUNNING' && (onStartStream || onNavigateToLive) && (
            <button
              onClick={() => {
                if (onStartStream) onStartStream();
                if (onNavigateToLive) onNavigateToLive();
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-colors whitespace-nowrap shadow-sm shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Live Stream</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Case Queue */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Case Queue ({filtered.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Active Docket</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search cases, ID, investigator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="PENDING_CUSTOMER">PENDING CUSTOMER</option>
                <option value="CLOSED">CLOSED</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs bg-slate-900/60 border border-slate-800 rounded-lg space-y-2">
                <Briefcase className="w-5 h-5 mx-auto text-slate-600 mb-1" />
                <div className="text-slate-300 font-semibold">0 Cases In Docket</div>
                <p className="text-[11px] text-slate-500 font-sans max-w-xs mx-auto">
                  {streamStatus === 'RUNNING'
                    ? 'Monitoring continuous payment events. Risk events will appear here automatically.'
                    : 'No investigations without starting the live stream. Start the stream in Live Monitoring.'}
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedCase?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCaseId(item.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-cyan-300">{item.id}</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          item.priority === 'CRITICAL'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                            : item.priority === 'HIGH'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-slate-200 line-clamp-2 mb-2">{item.title}</div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>Status: <strong className="text-slate-300">{item.status}</strong></span>
                      <span>Assigned: {item.assignedTo.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Selected Case Workspace */}
        {selectedCase ? (
          <div className="lg:col-span-2 space-y-5">
            {/* Case Dossier Header */}
            <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-cyan-400">{selectedCase.id}</span>
                    <span className="text-slate-600">·</span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        selectedCase.status === 'CLOSED'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : selectedCase.status === 'IN_PROGRESS'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {selectedCase.status}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-100 mt-1">{selectedCase.title}</h2>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Customer: <span className="text-cyan-300">{selectedCase.customerId}</span> · Assigned: <span className="text-slate-200">{selectedCase.assignedTo} ({selectedCase.assignedRole})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleExportCaseCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export Dossier</span>
                  </button>

                  {selectedCase.status !== 'CLOSED' && (
                    <button
                      onClick={() => setIsCloseModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Conclude Case</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status workflow triggers */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-slate-500 text-[11px]">Workflow Phase:</span>
                {selectedCase.status === 'OPEN' && (
                  <button
                    onClick={() => onUpdateStatus(selectedCase.id, 'IN_PROGRESS')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
                  >
                    &rarr; Move to In Progress
                  </button>
                )}
                {selectedCase.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => onUpdateStatus(selectedCase.id, 'PENDING_CUSTOMER')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
                  >
                    &rarr; Request Customer Identity Callback
                  </button>
                )}
                {selectedCase.status === 'PENDING_CUSTOMER' && (
                  <button
                    onClick={() => onUpdateStatus(selectedCase.id, 'IN_PROGRESS')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
                  >
                    &rarr; Response Received (Resume SIU Analysis)
                  </button>
                )}
                {selectedCase.status === 'CLOSED' && (
                  <div className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Disposition: {selectedCase.resolution}</span>
                  </div>
                )}
              </div>

              {/* Metrics & Linked Transactions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Total Exposed Amount</div>
                  <div className="text-base font-bold text-rose-400 mt-0.5 tabular-nums">
                    ${selectedCase.totalExposedAmountUSD.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Linked Transactions</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {selectedCase.linkedTransactionIds.map((id) => (
                      <button
                        key={id}
                        onClick={() => onSelectTransactionId(id)}
                        className="text-cyan-400 hover:underline font-bold text-xs"
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Case Priority</div>
                  <div className="text-base font-bold text-slate-200 mt-0.5">
                    {selectedCase.priority} SEVERITY
                  </div>
                </div>
              </div>

              {/* Evidence Registry */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Documented Forensic Evidence</span>
                </div>
                <div className="space-y-1.5">
                  {selectedCase.evidence.map((evd) => (
                    <div
                      key={evd.id}
                      className="p-3 rounded bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="text-amber-400 font-bold">[{evd.type}]</span>{' '}
                        <span className="text-slate-200">{evd.description}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Confidence: {(evd.confidence * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Investigation Notes & Timeline */}
            <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                Investigator Action Log &amp; Case Notes
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto">
                {selectedCase.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded bg-slate-950/70 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-cyan-300 font-bold">
                        {note.author} <span className="text-slate-500">({note.authorRole})</span>
                      </span>
                      <span className="text-slate-500 tabular-nums">
                        {note.timestamp.substring(0, 19).replace('T', ' ')} UTC
                      </span>
                    </div>
                    <div className="text-slate-300 leading-relaxed text-[12px]">{note.content}</div>
                  </div>
                ))}
              </div>

              {/* Add Note Form */}
              {selectedCase.status !== 'CLOSED' && (
                <form onSubmit={handleAddNote} className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    placeholder="Enter investigation update or interview finding..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-colors shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 fill-current" />
                    <span>Post Note</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center text-slate-400 font-mono text-xs bg-slate-900/60 border border-slate-800 rounded-lg space-y-3 flex flex-col items-center justify-center min-h-[420px]">
            <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
              <Briefcase className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-200 font-sans">No Investigation Dossier Selected</div>
            <p className="text-xs text-slate-500 font-sans max-w-md">
              {cases.length === 0
                ? 'No active investigations in queue. Start the live stream in Live Monitoring to ingest real-time transactions; suspicious transactions will automatically be moved here for SIU investigation.'
                : 'Select an investigation case from the docket on the left to inspect multi-model scoring, feature contributions, and audit disposition.'}
            </p>
            {streamStatus !== 'RUNNING' && (onStartStream || onNavigateToLive) && (
              <button
                onClick={() => {
                  if (onStartStream) onStartStream();
                  if (onNavigateToLive) onNavigateToLive();
                }}
                className="mt-2 flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Live Stream</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal: New Investigation Case */}
      {isNewCaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 font-mono">Create Investigation Case</h3>
              <button onClick={() => setIsNewCaseModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCaseSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Case Title</label>
                <input
                  type="text"
                  placeholder="e.g. Account Takeover on C10293840"
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Priority Level</label>
                <select
                  value={newCasePriority}
                  onChange={(e) => setNewCasePriority(e.target.value as CasePriority)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="CRITICAL">CRITICAL (Immediate Action)</option>
                  <option value="HIGH">HIGH Priority</option>
                  <option value="MEDIUM">MEDIUM Priority</option>
                  <option value="LOW">LOW Priority</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCaseModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-colors"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Conclude & Close Case */}
      {isCloseModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 font-mono">Conclude Investigation: {selectedCase.id}</h3>
              <button onClick={() => setIsCloseModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Final Disposition</label>
                <select
                  value={closureDisposition}
                  onChange={(e) => setClosureDisposition(e.target.value as CaseResolution)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="CONFIRMED_FRAUD">CONFIRMED FRAUD (Report to Financial Intelligence Unit)</option>
                  <option value="FALSE_POSITIVE_LEGITIMATE">FALSE POSITIVE (Verified Genuine Cardholder Activity)</option>
                  <option value="INCONCLUSIVE">INCONCLUSIVE (Unverified / Insufficient Evidence)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reason for Closure &amp; Audit Rationale</label>
                <textarea
                  rows={3}
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCloseCaseSubmit}
                  className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors"
                >
                  Submit Final Disposition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
