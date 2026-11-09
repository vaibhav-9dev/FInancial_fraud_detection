import React, { useEffect, useState, useRef } from 'react';
import {
  ShieldCheck,
  Activity,
  Bell,
  Radio,
  CheckCircle2,
  AlertTriangle,
  User,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  Shield,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { StreamStatus, WebSocketStatus } from '../../services/streamSimulator';
import { UserProfile, FraudAlert } from '../../types';
import { DEFAULT_USERS } from '../../services/storage';

interface NavbarProps {
  streamStatus: StreamStatus;
  wsStatus: WebSocketStatus;
  currentTPS: number;
  unreadAlerts: FraudAlert[];
  currentUser: UserProfile;
  onSwitchUser: (user: UserProfile) => void;
  onOpenAlerts: () => void;
  onSelectAlert: (alert: FraudAlert) => void;
  systemMode: 'INTERNAL' | 'FASTAPI';
  onSimulateReconnect: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  streamStatus,
  wsStatus,
  currentTPS,
  unreadAlerts,
  currentUser,
  onSwitchUser,
  onOpenAlerts,
  onSelectAlert,
  systemMode,
  onSimulateReconnect,
}) => {
  const [timeString, setTimeString] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAlertMenuOpen, setIsAlertMenuOpen] = useState(false);
  const [browserNotificationAllowed, setBrowserNotificationAllowed] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const alertMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }) +
          ' ' +
          now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }) +
          ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setBrowserNotificationAllowed(true);
    }
  }, []);

  const requestBrowserNotification = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setBrowserNotificationAllowed(true);
        new Notification('FRAUDGUARD AI Security Alerts Active', {
          body: 'Browser push notifications enabled for high-severity fraud alerts.',
        });
      }
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (alertMenuRef.current && !alertMenuRef.current.contains(e.target as Node)) {
        setIsAlertMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 px-6 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-6 shrink-0 select-none z-30">
      {/* Zone 1: Wordmark & Architecture Mode */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-wider text-slate-100 whitespace-nowrap">
              FRAUDGUARD<span className="text-cyan-400">.AI</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 font-semibold">
              PRODUCTION ENGINE
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono tracking-wide">
            Financial Crimes &amp; Fraud Surveillance Platform
          </span>
        </div>
      </div>

      {/* Zone 2: Live Engine Telemetry & WebSockets */}
      <div className="hidden lg:flex items-center gap-5 text-xs font-mono">
        {/* Engine Status */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Engine:</span>
          <span className="text-emerald-400 font-semibold">Dual-ML Ready</span>
        </div>

        {/* WebSocket Connection Status */}
        <div
          onClick={onSimulateReconnect}
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
          title="Click to test WebSocket reconnect behavior"
        >
          <Radio
            className={`w-3.5 h-3.5 ${
              wsStatus === 'CONNECTED'
                ? 'text-cyan-400 animate-pulse'
                : wsStatus === 'RECONNECTING'
                ? 'text-amber-400 animate-spin'
                : 'text-rose-400'
            }`}
          />
          <span className="text-slate-400">WS:</span>
          <span
            className={`font-semibold ${
              wsStatus === 'CONNECTED'
                ? 'text-cyan-300'
                : wsStatus === 'RECONNECTING'
                ? 'text-amber-300'
                : 'text-rose-400'
            }`}
          >
            {wsStatus}
          </span>
          {streamStatus === 'RUNNING' && (
            <span className="text-slate-400 tabular-nums">({currentTPS} TPS)</span>
          )}
        </div>

        {/* Pipeline Ingestion Mode */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>Adapter:</span>
          <span className="text-slate-200 font-medium">
            {systemMode === 'FASTAPI' ? 'Kafka / FastAPI Bridge' : 'Production Client Engine'}
          </span>
        </div>

        {/* Live Monotonic Clock */}
        <div className="flex items-center gap-1.5 text-slate-400 tabular-nums">
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          <span>{timeString}</span>
        </div>
      </div>

      {/* Zone 3: Actions & RBAC User Switcher */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Browser Website Notifications Button */}
        <button
          onClick={requestBrowserNotification}
          title={
            browserNotificationAllowed
              ? 'Website & browser notifications active for risk alerts'
              : 'Click to enable real-time browser push notifications'
          }
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-md border transition-colors ${
            browserNotificationAllowed
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:text-cyan-300'
          }`}
        >
          {browserNotificationAllowed ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Notifications: ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
              <span>Enable Notifications</span>
            </>
          )}
        </button>

        {/* Alerts Flyout Button */}
        <div className="relative" ref={alertMenuRef}>
          <button
            onClick={() => setIsAlertMenuOpen(!isAlertMenuOpen)}
            className="relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Alerts</span>
            {unreadAlerts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white font-mono text-[10px] font-bold">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {isAlertMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-2 z-50 text-xs font-mono">
              <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-200">Recent Alerts ({unreadAlerts.length})</span>
                <button
                  onClick={onOpenAlerts}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                {unreadAlerts.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    No pending unacknowledged alerts.
                  </div>
                ) : (
                  unreadAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        onSelectAlert(alert);
                        setIsAlertMenuOpen(false);
                      }}
                      className="p-3 hover:bg-slate-800/70 cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300">{alert.transactionId}</span>
                        <span
                          className={`text-[10px] font-bold ${
                            alert.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 line-clamp-1">{alert.primaryReason}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>${alert.amount.toLocaleString()}</span>
                        <span>Score: {alert.riskScore100}/100</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-3 py-2 border-t border-slate-800 flex items-center justify-between bg-slate-950/40 text-[10px]">
                <span className="text-slate-400">Browser Push:</span>
                <button
                  onClick={requestBrowserNotification}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                    browserNotificationAllowed
                      ? 'text-emerald-400 bg-emerald-950/50'
                      : 'text-cyan-400 hover:underline'
                  }`}
                >
                  {browserNotificationAllowed ? (
                    <>
                      <Volume2 className="w-3 h-3" /> Enabled
                    </>
                  ) : (
                    'Enable Push'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RBAC User Switcher Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-semibold text-slate-200 leading-tight truncate max-w-[110px]">
                {currentUser.name}
              </div>
              <div className="text-[9px] font-mono text-cyan-400 leading-tight">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-2 z-50 text-xs">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono text-slate-400">
                Switch Security Role (RBAC):
              </div>
              {DEFAULT_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSwitchUser(user);
                    setIsUserMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    currentUser.id === user.id ? 'bg-cyan-950/40 text-cyan-300' : 'text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{user.department}</div>
                  </div>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {user.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
