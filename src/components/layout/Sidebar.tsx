import React from 'react';
import {
  LayoutDashboard,
  Radio,
  ReceiptText,
  AlertTriangle,
  BrainCircuit,
  Sliders,
  FileCode2,
  Users,
  Briefcase,
  Activity,
  History,
  Database,
} from 'lucide-react';

export type NavTabId =
  | 'overview'
  | 'live-monitoring'
  | 'alerts'
  | 'transactions'
  | 'customer-risk'
  | 'investigation-centre'
  | 'dataset-hub'
  | 'paysim-dataset'
  | 'ml-analytics'
  | 'system-health'
  | 'audit-logs'
  | 'settings'
  | 'code-docs';

interface SidebarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  pendingAlertsCount: number;
  openCasesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingAlertsCount,
  openCasesCount,
}) => {
  const primaryNavItems: { id: NavTabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'live-monitoring', label: 'Live Monitoring', icon: Radio },
    { id: 'alerts', label: 'Fraud Alerts', icon: AlertTriangle, badge: pendingAlertsCount },
    { id: 'transactions', label: 'Transaction Explorer', icon: ReceiptText },
    { id: 'customer-risk', label: 'Customer Risk', icon: Users },
    { id: 'investigation-centre', label: 'Investigation Centre', icon: Briefcase, badge: openCasesCount },
  ];

  const analyticsNavItems: { id: NavTabId; label: string; icon: React.ElementType }[] = [
    { id: 'dataset-hub', label: 'Dataset Ingestion Hub', icon: Database },
    { id: 'ml-analytics', label: 'ML Analytics', icon: BrainCircuit },
    { id: 'system-health', label: 'System Health & SLAs', icon: Activity },
    { id: 'audit-logs', label: 'Audit Logs', icon: History },
    { id: 'settings', label: 'Settings & Integrations', icon: Sliders },
    { id: 'code-docs', label: 'Backend Source & Docs', icon: FileCode2 },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Surveillance Desk Section */}
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
            Surveillance &amp; Triage
          </div>

          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Analytics & Governance Section */}
        <div className="space-y-1 pt-2 border-t border-slate-800/60">
          <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
            Intelligence &amp; Governance
          </div>

          {analyticsNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1 bg-slate-950/30">
        <div className="flex items-center justify-between">
          <span>Engine Release</span>
          <span className="text-slate-300">v2.5.0-prod</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Environment</span>
          <span className="text-emerald-400">Production Engine</span>
        </div>
        <div className="pt-1 text-[10px] text-slate-500 leading-tight">
          Financial Crime &amp; AML Risk Platform
        </div>
      </div>
    </aside>
  );
};
