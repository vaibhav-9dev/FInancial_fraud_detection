import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  change?: string;
  isPositive?: boolean;
  accentColor?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  change,
  isPositive = true,
  accentColor = 'cyan',
}) => {
  const accentBorderMap = {
    cyan: 'hover:border-cyan-500/40',
    emerald: 'hover:border-emerald-500/40',
    amber: 'hover:border-amber-500/40',
    rose: 'hover:border-rose-500/40',
    slate: 'hover:border-slate-700',
  };

  const accentTextMap = {
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    slate: 'text-slate-300',
  };

  return (
    <div
      className={`bg-slate-900/90 border border-slate-800/90 rounded-lg p-5 transition-all duration-200 ${accentBorderMap[accentColor]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 tracking-wide">{title}</span>
        {Icon && (
          <div className="p-1.5 rounded bg-slate-800/80 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <div className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${accentTextMap[accentColor]}`}>
          {value}
        </div>
        {change && (
          <span
            className={`text-xs font-mono font-medium ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};
