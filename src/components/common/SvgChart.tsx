import React, { useState } from 'react';

// ==========================================
// 1. Responsive Area / Line Chart
// ==========================================
export interface AreaPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export function AreaChart({
  data,
  height = 200,
  strokeColor = '#06b6d4', // cyan-500
  fillGradientId = 'cyanGrad',
  secondaryStroke = '#f43f5e', // rose-500
  valuePrefix = '',
  valueSuffix = '',
}: {
  data: AreaPoint[];
  height?: number;
  strokeColor?: string;
  fillGradientId?: string;
  secondaryStroke?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-slate-500">
        No stream telemetry available
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const width = 600; // SVG internal coordinate space

  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.value, d.secondaryValue || 0))) * 1.15;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(1, data.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - (d.value / maxValue) * innerHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;

  let secondaryPathD = '';
  if (data[0]?.secondaryValue !== undefined) {
    const secPoints = data.map((d, i) => {
      const x = padding.left + (i / Math.max(1, data.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - ((d.secondaryValue || 0) / maxValue) * innerHeight;
      return { x, y };
    });
    secondaryPathD = secPoints.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ minHeight: height }}
      >
        <defs>
          <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.28} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((pct, idx) => {
          const y = padding.top + innerHeight * (1 - pct);
          const gridVal = Math.round(maxValue * pct);
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#1e293b"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                fill="#64748b"
                fontSize={10}
                textAnchor="end"
                className="font-mono tabular-nums"
              >
                {gridVal}
              </text>
            </g>
          );
        })}

        {/* Filled Area */}
        <path d={areaD} fill={`url(#${fillGradientId})`} />

        {/* Primary Stroke Line */}
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth={2.2} strokeLinecap="round" />

        {/* Optional Secondary Stroke Line */}
        {secondaryPathD && (
          <path d={secondaryPathD} fill="none" stroke={secondaryStroke} strokeWidth={1.8} strokeDasharray="4 2" />
        )}

        {/* Interaction points */}
        {points.map((pt, i) => (
          <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoverIndex === i ? 5 : 2.5}
              fill={strokeColor}
              stroke="#0f172a"
              strokeWidth={2}
              className="cursor-pointer transition-all"
            />
          </g>
        ))}

        {/* X Axis Labels */}
        {points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 5)) === 0).map((pt, i) => (
          <text
            key={i}
            x={pt.x}
            y={height - 8}
            fill="#64748b"
            fontSize={10}
            textAnchor="middle"
            className="font-mono"
          >
            {pt.label}
          </text>
        ))}
      </svg>

      {/* Tooltip on hover */}
      {hoverIndex !== null && points[hoverIndex] && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 shadow-lg text-xs"
          style={{
            left: `${(points[hoverIndex].x / width) * 100}%`,
            top: `${Math.max(10, (points[hoverIndex].y / height) * 100 - 35)}%`,
          }}
        >
          <div className="text-slate-400 text-[10px] font-mono">{points[hoverIndex].label}</div>
          <div className="text-cyan-400 font-semibold font-mono tabular-nums">
            {valuePrefix}{points[hoverIndex].value.toLocaleString()}{valueSuffix}
          </div>
          {points[hoverIndex].secondaryValue !== undefined && (
            <div className="text-rose-400 text-[10px] font-mono tabular-nums">
              Fraud: {points[hoverIndex].secondaryValue}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. Responsive Bar Chart
// ==========================================
export interface BarItem {
  label: string;
  value: number;
  color?: string;
  secondaryValue?: number;
}

export function BarChart({
  data,
  height = 200,
  valueSuffix = '',
}: {
  data: BarItem[];
  height?: number;
  valueSuffix?: string;
}) {
  const maxVal = Math.max(1, ...data.map((d) => d.value)) * 1.15;

  return (
    <div style={{ minHeight: height }} className="flex flex-col justify-end w-full pt-4">
      <div className="flex items-end justify-between gap-3 h-44 px-2 border-b border-slate-800">
        {data.map((item, idx) => {
          const heightPct = Math.max(6, (item.value / maxVal) * 100);
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] font-mono text-cyan-300 pointer-events-none whitespace-nowrap z-20 shadow-md">
                {item.value.toLocaleString()}{valueSuffix}
              </div>

              {/* Bar */}
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full max-w-[48px] rounded-t transition-all ${
                  item.color || 'bg-cyan-500/80 group-hover:bg-cyan-400'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Bar Labels */}
      <div className="flex items-center justify-between gap-3 px-2 pt-2 text-[11px] text-slate-400 font-mono">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 text-center truncate">
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 3. ROC Curve Chart (TPR vs FPR with AUC)
// ==========================================
export function RocCurveChart({
  points,
  auc = 0.994,
  height = 240,
}: {
  points: { fpr: number; tpr: number }[];
  auc?: number;
  height?: number;
}) {
  const width = 400;
  const pad = 40;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const svgPoints = points.map((p) => {
    const x = pad + p.fpr * innerW;
    const y = pad + (1 - p.tpr) * innerH;
    return `${x},${y}`;
  });

  const polylineD = `M ${svgPoints.join(' L ')}`;
  const areaD = `${polylineD} L ${pad + innerW} ${pad + innerH} L ${pad} ${pad + innerH} Z`;

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-slate-400 font-medium">Receiver Operating Characteristic</span>
        <span className="text-cyan-400 font-mono font-semibold">AUC = {auc.toFixed(4)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((v, i) => (
          <g key={i}>
            <line
              x1={pad}
              y1={pad + innerH * (1 - v)}
              x2={pad + innerW}
              y2={pad + innerH * (1 - v)}
              stroke="#1e293b"
              strokeDasharray="2 2"
            />
            <text x={pad - 8} y={pad + innerH * (1 - v) + 3} fill="#64748b" fontSize={9} textAnchor="end" className="font-mono">
              {v.toFixed(2)}
            </text>
            <line
              x1={pad + innerW * v}
              y1={pad}
              x2={pad + innerW * v}
              y2={pad + innerH}
              stroke="#1e293b"
              strokeDasharray="2 2"
            />
            <text x={pad + innerW * v} y={pad + innerH + 16} fill="#64748b" fontSize={9} textAnchor="middle" className="font-mono">
              {v.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Random Guess Diagonal */}
        <line
          x1={pad}
          y1={pad + innerH}
          x2={pad + innerW}
          y2={pad}
          stroke="#475569"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />

        {/* Model ROC Area */}
        <path d={areaD} fill="rgba(6, 182, 212, 0.15)" />

        {/* Model ROC Curve */}
        <path d={polylineD} fill="none" stroke="#06b6d4" strokeWidth={2.5} strokeLinecap="round" />

        {/* Curve points */}
        {points.map((p, i) => {
          const cx = pad + p.fpr * innerW;
          const cy = pad + (1 - p.tpr) * innerH;
          return <circle key={i} cx={cx} cy={cy} r={3} fill="#22d3ee" stroke="#0f172a" strokeWidth={1} />;
        })}

        {/* Axis labels */}
        <text x={width / 2} y={height - 2} fill="#94a3b8" fontSize={10} textAnchor="middle">
          False Positive Rate (FPR)
        </text>
        <text
          x={12}
          y={height / 2}
          fill="#94a3b8"
          fontSize={10}
          textAnchor="middle"
          transform={`rotate(-90 12 ${height / 2})`}
        >
          True Positive Rate (TPR)
        </text>
      </svg>
    </div>
  );
}

// ==========================================
// 4. Precision-Recall Curve
// ==========================================
export function PrCurveChart({
  points,
  auc = 0.932,
  height = 240,
}: {
  points: { recall: number; precision: number }[];
  auc?: number;
  height?: number;
}) {
  const width = 400;
  const pad = 40;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const svgPoints = points.map((p) => {
    const x = pad + p.recall * innerW;
    const y = pad + (1 - p.precision) * innerH;
    return `${x},${y}`;
  });

  const polylineD = `M ${svgPoints.join(' L ')}`;
  const areaD = `${polylineD} L ${pad + innerW} ${pad + innerH} L ${pad} ${pad + innerH} Z`;

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-slate-400 font-medium">Precision-Recall Curve (PR-AUC)</span>
        <span className="text-emerald-400 font-mono font-semibold">AUC-PR = {auc.toFixed(4)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((v, i) => (
          <g key={i}>
            <line
              x1={pad}
              y1={pad + innerH * (1 - v)}
              x2={pad + innerW}
              y2={pad + innerH * (1 - v)}
              stroke="#1e293b"
              strokeDasharray="2 2"
            />
            <text x={pad - 8} y={pad + innerH * (1 - v) + 3} fill="#64748b" fontSize={9} textAnchor="end" className="font-mono">
              {v.toFixed(2)}
            </text>
            <line
              x1={pad + innerW * v}
              y1={pad}
              x2={pad + innerW * v}
              y2={pad + innerH}
              stroke="#1e293b"
              strokeDasharray="2 2"
            />
            <text x={pad + innerW * v} y={pad + innerH + 16} fill="#64748b" fontSize={9} textAnchor="middle" className="font-mono">
              {v.toFixed(2)}
            </text>
          </g>
        ))}

        {/* PR Area */}
        <path d={areaD} fill="rgba(16, 185, 129, 0.15)" />

        {/* PR Curve */}
        <path d={polylineD} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" />

        {/* Curve points */}
        {points.map((p, i) => {
          const cx = pad + p.recall * innerW;
          const cy = pad + (1 - p.precision) * innerH;
          return <circle key={i} cx={cx} cy={cy} r={3} fill="#34d399" stroke="#0f172a" strokeWidth={1} />;
        })}

        {/* Axis labels */}
        <text x={width / 2} y={height - 2} fill="#94a3b8" fontSize={10} textAnchor="middle">
          Recall (Fraud Detection Coverage)
        </text>
        <text
          x={12}
          y={height / 2}
          fill="#94a3b8"
          fontSize={10}
          textAnchor="middle"
          transform={`rotate(-90 12 ${height / 2})`}
        >
          Precision (Confidence)
        </text>
      </svg>
    </div>
  );
}

// ==========================================
// 5. Confusion Matrix Component
// ==========================================
export function ConfusionMatrix({
  tp,
  tn,
  fp,
  fn,
}: {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
}) {
  const total = tp + tn + fp + fn;
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  const fpr = fp / Math.max(1, fp + tn);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3 text-center font-mono">
        {/* True Negative */}
        <div className="bg-slate-900/90 border border-slate-800 rounded p-4">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">True Negatives (TN)</div>
          <div className="text-xl font-bold text-slate-200 tabular-nums">{tn.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-1">Legitimate payments approved correctly</div>
        </div>

        {/* False Positive */}
        <div className="bg-amber-950/20 border border-amber-800/40 rounded p-4">
          <div className="text-[11px] text-amber-400 uppercase tracking-wider mb-1">False Positives (FP)</div>
          <div className="text-xl font-bold text-amber-400 tabular-nums">{fp.toLocaleString()}</div>
          <div className="text-[10px] text-amber-500/80 mt-1">Normal payments flagged (False Alarms)</div>
        </div>

        {/* False Negative */}
        <div className="bg-rose-950/30 border border-rose-800/40 rounded p-4">
          <div className="text-[11px] text-rose-400 uppercase tracking-wider mb-1">False Negatives (FN)</div>
          <div className="text-xl font-bold text-rose-400 tabular-nums">{fn.toLocaleString()}</div>
          <div className="text-[10px] text-rose-400/80 mt-1">Undetected fraudulent leakages</div>
        </div>

        {/* True Positive */}
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded p-4">
          <div className="text-[11px] text-emerald-400 uppercase tracking-wider mb-1">True Positives (TP)</div>
          <div className="text-xl font-bold text-emerald-400 tabular-nums">{tp.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-400/80 mt-1">Confirmed fraud intercepted</div>
        </div>
      </div>

      {/* Key derived ratios */}
      <div className="grid grid-cols-3 gap-2 mt-4 text-xs font-mono">
        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
          <span className="text-slate-400">Precision: </span>
          <span className="text-cyan-300 font-semibold">{(precision * 100).toFixed(2)}%</span>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
          <span className="text-slate-400">Recall: </span>
          <span className="text-emerald-300 font-semibold">{(recall * 100).toFixed(2)}%</span>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
          <span className="text-slate-400">FPR: </span>
          <span className="text-amber-300 font-semibold">{(fpr * 100).toFixed(3)}%</span>
        </div>
      </div>
    </div>
  );
}
