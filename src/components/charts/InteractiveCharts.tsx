import React, { useMemo, useState } from 'react';
import {
  BCGProductItem,
  BCGQuadrant,
  DailySeriesPoint,
  DecompositionPoint,
  MarginDistributionBox,
  MonthlyMetric,
  QuantityErosionPoint,
  YoYMonthComparison,
  formatCurrency,
} from '../../utils/analyticsEngine';

// -----------------------------------------------------------------------------
// 1. YoY & MoM Monthly Comparison Chart
// -----------------------------------------------------------------------------
interface YoYMonthlyChartProps {
  yoyComparison: YoYMonthComparison[];
  monthlySeries: MonthlyMetric[];
  mode: 'yoy' | 'mom';
}

export const YoYMonthlyChart: React.FC<YoYMonthlyChartProps> = ({
  yoyComparison,
  monthlySeries,
  mode,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 880;
  const height = 310;
  const pad = { top: 24, right: 20, bottom: 42, left: 68 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  if (mode === 'yoy') {
    const maxVal = Math.max(
      1,
      ...yoyComparison.flatMap((d) => [d.sales2022, d.sales2023, d.sales2024])
    );
    const yTicks = 4;
    const bandW = plotW / Math.max(1, yoyComparison.length);
    const barW = Math.min(16, (bandW - 14) / 3);

    const hovered = hoverIdx !== null ? yoyComparison[hoverIdx] : null;

    return (
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Gridlines */}
          {Array.from({ length: yTicks + 1 }).map((_, idx) => {
            const val = (maxVal / yTicks) * idx;
            const y = pad.top + plotH - (val / maxVal) * plotH;
            return (
              <g key={idx}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                />
                <text
                  x={pad.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[11px] font-mono-tabular"
                >
                  ${Math.round(val / 1000)}k
                </text>
              </g>
            );
          })}

          {/* Bars per Month */}
          {yoyComparison.map((d, i) => {
            const cx = pad.left + i * bandW + bandW / 2;
            const groupW = barW * 3 + 4;
            const xStart = cx - groupW / 2;
            const h22 = (d.sales2022 / maxVal) * plotH;
            const h23 = (d.sales2023 / maxVal) * plotH;
            const h24 = (d.sales2024 / maxVal) * plotH;

            return (
              <g
                key={d.month}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={pad.left + i * bandW}
                  y={pad.top}
                  width={bandW}
                  height={plotH}
                  fill={hoverIdx === i ? 'rgba(241,245,249,0.75)' : 'transparent'}
                />
                <rect
                  x={xStart}
                  y={pad.top + plotH - h22}
                  width={barW}
                  height={h22}
                  rx={2}
                  fill="#94a3b8"
                />
                <rect
                  x={xStart + barW + 2}
                  y={pad.top + plotH - h23}
                  width={barW}
                  height={h23}
                  rx={2}
                  fill="#0f766e"
                />
                <rect
                  x={xStart + (barW + 2) * 2}
                  y={pad.top + plotH - h24}
                  width={barW}
                  height={h24}
                  rx={2}
                  fill="#2563eb"
                />
                <text
                  x={cx}
                  y={height - 14}
                  textAnchor="middle"
                  className="fill-slate-600 text-[11px]"
                >
                  {d.monthNameAr}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend & Hover Strip */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-slate-400" /> 2022
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-teal-700" /> 2023
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-blue-600" /> 2024
            </span>
          </div>
          {hovered ? (
            <div className="flex flex-wrap items-center gap-4 font-mono-tabular text-slate-800">
              <span className="font-sans font-semibold">{hovered.monthNameAr}:</span>
              <span>2022: {formatCurrency(hovered.sales2022)}</span>
              <span>
                2023: {formatCurrency(hovered.sales2023)}{' '}
                {hovered.yoy23vs22Pct !== null && (
                  <span className={hovered.yoy23vs22Pct >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    ({hovered.yoy23vs22Pct >= 0 ? '+' : ''}
                    {hovered.yoy23vs22Pct.toFixed(1)}%)
                  </span>
                )}
              </span>
              <span>
                2024: {formatCurrency(hovered.sales2024)}{' '}
                {hovered.yoy24vs23Pct !== null && (
                  <span className={hovered.yoy24vs23Pct >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    ({hovered.yoy24vs23Pct >= 0 ? '+' : ''}
                    {hovered.yoy24vs23Pct.toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
          ) : (
            <span className="text-slate-400">Hover over any month to view YoY growth comparison</span>
          )}
        </div>
      </div>
    );
  }

  // MoM Growth mode across the 36 months
  const momPoints = monthlySeries.filter((m) => m.momSalesPct !== null);
  const absMax = Math.max(25, ...momPoints.map((m) => Math.abs(m.momSalesPct ?? 0)));
  const zeroY = pad.top + plotH / 2;
  const bandW = plotW / Math.max(1, monthlySeries.length);
  const hoveredMom = hoverIdx !== null ? monthlySeries[hoverIdx] : null;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {[-absMax, -absMax / 2, 0, absMax / 2, absMax].map((v, idx) => {
          const y = zeroY - (v / absMax) * (plotH / 2);
          return (
            <g key={idx}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke={v === 0 ? '#94a3b8' : '#e2e8f0'}
                strokeDasharray={v === 0 ? undefined : '3 3'}
              />
              <text
                x={pad.left - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-500 text-[11px] font-mono-tabular"
              >
                {v > 0 ? `+${Math.round(v)}%` : `${Math.round(v)}%`}
              </text>
            </g>
          );
        })}

        {monthlySeries.map((m, i) => {
          const val = m.momSalesPct ?? 0;
          const barH = Math.abs(val / absMax) * (plotH / 2);
          const x = pad.left + i * bandW + 2;
          const w = Math.max(4, bandW - 4);
          const y = val >= 0 ? zeroY - barH : zeroY;
          return (
            <g
              key={m.yearMonth}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={Math.max(2, barH)}
                rx={2}
                fill={m.momSalesPct === null ? '#cbd5e1' : val >= 0 ? '#0f766e' : '#dc2626'}
                opacity={hoverIdx === i ? 1 : 0.85}
              />
              {i % 6 === 0 && (
                <text
                  x={x + w / 2}
                  y={height - 14}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] font-mono-tabular"
                >
                  {m.yearMonth}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <div className="flex items-center gap-5">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-teal-700" /> Positive Monthly Growth (+MoM)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-red-600" /> Monthly Decline (-MoM)
          </span>
        </div>
        {hoveredMom ? (
          <div className="flex items-center gap-4 font-mono-tabular text-slate-800">
            <span>{hoveredMom.yearMonth}</span>
            <span>Sales: {formatCurrency(hoveredMom.sales)}</span>
            <span>
              MoM Change:{' '}
              {hoveredMom.momSalesPct !== null ? (
                <span className={hoveredMom.momSalesPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {hoveredMom.momSalesPct >= 0 ? '+' : ''}
                  {hoveredMom.momSalesPct.toFixed(1)}%
                </span>
              ) : (
                '—'
              )}
            </span>
          </div>
        ) : (
          <span className="text-slate-400">Hover over bars to view sequential monthly growth rate</span>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// 2. 7-Day & 30-Day Moving Averages Chart
// -----------------------------------------------------------------------------
interface MovingAverageChartProps {
  daily: DailySeriesPoint[];
  showRawDaily: boolean;
}

export const MovingAverageChart: React.FC<MovingAverageChartProps> = ({ daily, showRawDaily }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 920;
  const height = 300;
  const pad = { top: 20, right: 16, bottom: 38, left: 64 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const { maxY, ma7Path, ma30Path, rawPath, xLabels } = useMemo(() => {
    if (daily.length === 0) {
      return { maxY: 1, ma7Path: '', ma30Path: '', rawPath: '', xLabels: [] as { idx: number; label: string }[] };
    }
    const maxVal = showRawDaily
      ? Math.max(1, ...daily.map((d) => d.sales))
      : Math.max(1, ...daily.map((d) => Math.max(d.salesMA7, d.salesMA30)));

    const xOf = (i: number) => pad.left + (i / Math.max(1, daily.length - 1)) * plotW;
    const yOf = (v: number) => pad.top + plotH - (v / maxVal) * plotH;

    const toPath = (accessor: (d: DailySeriesPoint) => number) =>
      daily
        .map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(accessor(d)).toFixed(1)}`)
        .join(' ');

    const labels: { idx: number; label: string }[] = [];
    const seenYM = new Set<string>();
    daily.forEach((d, i) => {
      const ym = d.date.slice(0, 7);
      if ((ym.endsWith('-01') || ym.endsWith('-07')) && !seenYM.has(ym)) {
        seenYM.add(ym);
        labels.push({ idx: i, label: ym });
      }
    });

    return {
      maxY: maxVal,
      ma7Path: toPath((d) => d.salesMA7),
      ma30Path: toPath((d) => d.salesMA30),
      rawPath: showRawDaily ? toPath((d) => d.sales) : '',
      xLabels: labels,
    };
  }, [daily, showRawDaily, plotW, plotH, pad.left, pad.top]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (daily.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const ratio = (relX - pad.left) / plotW;
    if (ratio < 0 || ratio > 1) {
      setHoverIdx(null);
      return;
    }
    setHoverIdx(Math.min(daily.length - 1, Math.max(0, Math.round(ratio * (daily.length - 1)))));
  };

  const hovered = hoverIdx !== null ? daily[hoverIdx] : null;
  const hoverX =
    hoverIdx !== null && daily.length > 1
      ? pad.left + (hoverIdx / (daily.length - 1)) * plotW
      : null;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
          const val = maxY * t;
          const y = pad.top + plotH - t * plotH;
          return (
            <g key={idx}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
              />
              <text
                x={pad.left - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-500 text-[11px] font-mono-tabular"
              >
                ${Math.round(val / 1000)}k
              </text>
            </g>
          );
        })}

        {xLabels.map((lbl) => {
          const x = pad.left + (lbl.idx / Math.max(1, daily.length - 1)) * plotW;
          return (
            <text
              key={lbl.label}
              x={x}
              y={height - 12}
              textAnchor="middle"
              className="fill-slate-500 text-[10px] font-mono-tabular"
            >
              {lbl.label}
            </text>
          );
        })}

        {showRawDaily && rawPath && (
          <path d={rawPath} fill="none" stroke="#cbd5e1" strokeWidth={1} opacity={0.8} />
        )}
        <path d={ma7Path} fill="none" stroke="#2563eb" strokeWidth={1.75} opacity={0.85} />
        <path d={ma30Path} fill="none" stroke="#0f766e" strokeWidth={2.75} />

        {hoverX !== null && hovered && (
          <g>
            <line
              x1={hoverX}
              x2={hoverX}
              y1={pad.top}
              y2={pad.top + plotH}
              stroke="#475569"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={hoverX}
              cy={pad.top + plotH - (hovered.salesMA30 / maxY) * plotH}
              r={4.5}
              fill="#0f766e"
              stroke="#fff"
              strokeWidth={1.5}
            />
            <circle
              cx={hoverX}
              cy={pad.top + plotH - (hovered.salesMA7 / maxY) * plotH}
              r={4}
              fill="#2563eb"
              stroke="#fff"
              strokeWidth={1.5}
            />
          </g>
        )}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-5">
          {showRawDaily && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-slate-300" /> Daily Sales
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-blue-600" /> 7-Day Moving Average (MA7)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-4 bg-teal-700" /> 30-Day Moving Average (MA30)
          </span>
        </div>
        {hovered ? (
          <div className="flex flex-wrap items-center gap-4 font-mono-tabular text-slate-800">
            <span>{hovered.date}</span>
            <span>Day: {formatCurrency(hovered.sales)}</span>
            <span className="text-blue-700">MA7: {formatCurrency(hovered.salesMA7)}</span>
            <span className="text-teal-700">MA30: {formatCurrency(hovered.salesMA30)}</span>
          </div>
        ) : (
          <span className="text-slate-400">Hover over the time series to compare MA7 and MA30</span>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// 3. Time-Series Decomposition Stacked Chart (Trend / Seasonal / Residual)
// -----------------------------------------------------------------------------
interface DecompositionChartProps {
  points: DecompositionPoint[];
  threshold2Sigma: number;
}

export const DecompositionChart: React.FC<DecompositionChartProps> = ({
  points,
  threshold2Sigma,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 920;
  const panelH = 128;
  const gapY = 26;
  const totalH = panelH * 3 + gapY * 2 + 28;
  const padL = 64;
  const padR = 16;
  const plotW = width - padL - padR;

  const computed = useMemo(() => {
    if (points.length === 0) return null;

    const buildPanel = (
      values: number[],
      topY: number,
      fixedSymmetric = false
    ): { path: string; minV: number; maxV: number; yOf: (v: number) => number } => {
      let minV = Math.min(...values);
      let maxV = Math.max(...values);
      if (fixedSymmetric) {
        const abs = Math.max(Math.abs(minV), Math.abs(maxV), threshold2Sigma * 1.1, 1);
        minV = -abs;
        maxV = abs;
      }
      if (maxV - minV < 1e-6) {
        minV -= 1;
        maxV += 1;
      }
      const xOf = (i: number) => padL + (i / Math.max(1, points.length - 1)) * plotW;
      const yOf = (v: number) => topY + panelH - ((v - minV) / (maxV - minV)) * panelH;
      const path = values
        .map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`)
        .join(' ');
      return { path, minV, maxV, yOf };
    };

    const pTrend = buildPanel(
      points.map((p) => p.trend),
      18
    );
    const pSeasonal = buildPanel(
      points.map((p) => p.seasonal),
      18 + panelH + gapY,
      true
    );
    const pResid = buildPanel(
      points.map((p) => p.residual),
      18 + (panelH + gapY) * 2,
      true
    );

    return { pTrend, pSeasonal, pResid };
  }, [points, threshold2Sigma, plotW]);

  if (!computed || points.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Insufficient time points to perform seasonal decomposition.
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const ratio = (relX - padL) / plotW;
    if (ratio < 0 || ratio > 1) {
      setHoverIdx(null);
      return;
    }
    setHoverIdx(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
  };

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;
  const hoverX =
    hoverIdx !== null ? padL + (hoverIdx / Math.max(1, points.length - 1)) * plotW : null;

  const panels = [
    {
      title: '1. Trend',
      topY: 18,
      data: computed.pTrend,
      color: '#0f766e',
      isResid: false,
    },
    {
      title: '2. Weekly Seasonality',
      topY: 18 + panelH + gapY,
      data: computed.pSeasonal,
      color: '#2563eb',
      isResid: false,
    },
    {
      title: '3. Residuals & ±2σ Anomalies',
      topY: 18 + (panelH + gapY) * 2,
      data: computed.pResid,
      color: '#64748b',
      isResid: true,
    },
  ];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${totalH}`}
        className="w-full h-auto overflow-visible select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {panels.map((p) => (
          <g key={p.title}>
            <text x={padL} y={p.topY - 5} className="fill-slate-700 text-[11px] font-semibold">
              {p.title}
            </text>
            <rect
              x={padL}
              y={p.topY}
              width={plotW}
              height={panelH}
              fill="#f8fafc"
              stroke="#e2e8f0"
              rx={4}
            />
            {p.isResid && (
              <>
                <line
                  x1={padL}
                  x2={padL + plotW}
                  y1={p.data.yOf(threshold2Sigma)}
                  y2={p.data.yOf(threshold2Sigma)}
                  stroke="#dc2626"
                  strokeDasharray="4 3"
                  opacity={0.6}
                />
                <line
                  x1={padL}
                  x2={padL + plotW}
                  y1={p.data.yOf(-threshold2Sigma)}
                  y2={p.data.yOf(-threshold2Sigma)}
                  stroke="#d97706"
                  strokeDasharray="4 3"
                  opacity={0.6}
                />
              </>
            )}
            <text
              x={padL - 8}
              y={p.topY + 12}
              textAnchor="end"
              className="fill-slate-400 text-[10px] font-mono-tabular"
            >
              ${Math.round(p.data.maxV / 1000)}k
            </text>
            <text
              x={padL - 8}
              y={p.topY + panelH - 4}
              textAnchor="end"
              className="fill-slate-400 text-[10px] font-mono-tabular"
            >
              ${Math.round(p.data.minV / 1000)}k
            </text>
            <path d={p.data.path} fill="none" stroke={p.color} strokeWidth={p.isResid ? 1.15 : 1.75} />

            {p.isResid &&
              points.map((pt, i) => {
                if (!pt.isAnomaly) return null;
                const cx = padL + (i / Math.max(1, points.length - 1)) * plotW;
                const cy = p.data.yOf(pt.residual);
                return (
                  <circle
                    key={pt.date}
                    cx={cx}
                    cy={cy}
                    r={3.5}
                    fill={pt.anomalyDirection === 'spike' ? '#dc2626' : '#d97706'}
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                );
              })}
          </g>
        ))}

        {hoverX !== null && (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={18}
            y2={18 + panelH * 3 + gapY * 2}
            stroke="#334155"
            strokeDasharray="3 3"
          />
        )}
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <div className="flex items-center gap-5">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600" /> Non-Seasonal Spike (+2σ)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-600" /> Sudden Drop (-2σ)
          </span>
        </div>
        {hovered ? (
          <div className="flex flex-wrap items-center gap-4 font-mono-tabular text-slate-800">
            <span>{hovered.date}</span>
            <span>Trend: {formatCurrency(hovered.trend)}</span>
            <span>Seasonal: {formatCurrency(hovered.seasonal)}</span>
            <span
              className={
                hovered.isAnomaly
                  ? hovered.anomalyDirection === 'spike'
                    ? 'font-semibold text-red-700'
                    : 'font-semibold text-amber-700'
                  : ''
              }
            >
              Residual: {formatCurrency(hovered.residual)}
            </span>
          </div>
        ) : (
          <span className="text-slate-400">
            Statistical anomaly threshold (±2σ): {formatCurrency(threshold2Sigma)}
          </span>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// 4. BCG Matrix Interactive Scatter Chart
// -----------------------------------------------------------------------------
interface BCGMatrixChartProps {
  products: BCGProductItem[];
  salesThreshold: number;
  marginThreshold: number;
  selectedProduct: string | null;
  onSelectProduct: (name: string) => void;
}

const QUADRANT_COLORS: Record<BCGQuadrant, string> = {
  'Stars': '#0f766e',
  'Cash Cows': '#2563eb',
  'Question Marks': '#d97706',
  'Dogs': '#dc2626',
};

export const BCGMatrixChart: React.FC<BCGMatrixChartProps> = ({
  products,
  salesThreshold,
  marginThreshold,
  selectedProduct,
  onSelectProduct,
}) => {
  const [hovered, setHovered] = useState<BCGProductItem | null>(null);

  const width = 760;
  const height = 400;
  const pad = { top: 34, right: 28, bottom: 48, left: 68 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const salesArr = products.map((p) => p.sales);
  const marginArr = products.map((p) => p.weightedMarginPct);
  const minS = Math.min(...salesArr) * 0.94;
  const maxS = Math.max(...salesArr) * 1.05;
  const minM = Math.min(...marginArr) - 0.6;
  const maxM = Math.max(...marginArr) + 0.6;
  const maxQ = Math.max(1, ...products.map((p) => p.quantity));

  const xOf = (s: number) => pad.left + ((s - minS) / Math.max(1, maxS - minS)) * plotW;
  const yOf = (m: number) => pad.top + plotH - ((m - minM) / Math.max(0.1, maxM - minM)) * plotH;

  const threshX = xOf(salesThreshold);
  const threshY = yOf(marginThreshold);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Quadrant background tints */}
        <rect
          x={threshX}
          y={pad.top}
          width={pad.left + plotW - threshX}
          height={threshY - pad.top}
          fill="rgba(15, 118, 110, 0.05)"
        />
        <rect
          x={pad.left}
          y={pad.top}
          width={threshX - pad.left}
          height={threshY - pad.top}
          fill="rgba(217, 119, 6, 0.05)"
        />
        <rect
          x={threshX}
          y={threshY}
          width={pad.left + plotW - threshX}
          height={pad.top + plotH - threshY}
          fill="rgba(37, 99, 235, 0.04)"
        />
        <rect
          x={pad.left}
          y={threshY}
          width={threshX - pad.left}
          height={pad.top + plotH - threshY}
          fill="rgba(220, 38, 38, 0.04)"
        />

        {/* Quadrant corner titles */}
        <text x={pad.left + plotW - 10} y={pad.top + 18} textAnchor="end" className="fill-teal-800 text-[11px] font-semibold">
          Stars
        </text>
        <text x={pad.left + 10} y={pad.top + 18} textAnchor="start" className="fill-amber-800 text-[11px] font-semibold">
          Question Marks
        </text>
        <text x={pad.left + plotW - 10} y={pad.top + plotH - 10} textAnchor="end" className="fill-blue-800 text-[11px] font-semibold">
          Cash Cows
        </text>
        <text x={pad.left + 10} y={pad.top + plotH - 10} textAnchor="start" className="fill-red-800 text-[11px] font-semibold">
          Dogs
        </text>

        {/* Outer border & Median Crosshairs */}
        <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="none" stroke="#cbd5e1" />
        <line x1={threshX} x2={threshX} y1={pad.top} y2={pad.top + plotH} stroke="#64748b" strokeDasharray="4 4" />
        <line x1={pad.left} x2={pad.left + plotW} y1={threshY} y2={threshY} stroke="#64748b" strokeDasharray="4 4" />

        {/* Axis ticks */}
        {[0, 0.5, 1].map((t) => {
          const sv = minS + (maxS - minS) * t;
          const mv = minM + (maxM - minM) * t;
          return (
            <g key={t}>
              <text
                x={xOf(sv)}
                y={height - 18}
                textAnchor="middle"
                className="fill-slate-500 text-[11px] font-mono-tabular"
              >
                ${Math.round(sv / 1000)}k
              </text>
              <text
                x={pad.left - 10}
                y={yOf(mv) + 4}
                textAnchor="end"
                className="fill-slate-500 text-[11px] font-mono-tabular"
              >
                {mv.toFixed(1)}%
              </text>
            </g>
          );
        })}

        <text x={pad.left + plotW / 2} y={height - 2} textAnchor="middle" className="fill-slate-600 text-[11px]">
          Total Sales (USD)
        </text>

        {/* Bubbles */}
        {products.map((p) => {
          const cx = xOf(p.sales);
          const cy = yOf(p.weightedMarginPct);
          const r = 10 + (p.quantity / maxQ) * 10;
          const isSelected = selectedProduct === p.productName;
          const color = QUADRANT_COLORS[p.quadrant];
          return (
            <g
              key={p.productName}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectProduct(p.productName)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={color}
                fillOpacity={isSelected ? 0.9 : 0.72}
                stroke={isSelected ? '#0f172a' : '#ffffff'}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
              <text
                x={cx}
                y={cy - r - 6}
                textAnchor="middle"
                className="fill-slate-800 text-[11px] font-semibold"
              >
                {p.productName}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <span>
          Median Threshold: Sales{' '}
          <strong className="font-mono-tabular text-slate-800">{formatCurrency(salesThreshold)}</strong>
          {' · '}
          Margin{' '}
          <strong className="font-mono-tabular text-slate-800">{marginThreshold.toFixed(2)}%</strong>
        </span>
        {hovered ? (
          <span className="font-mono-tabular text-slate-900">
            {hovered.productName}: {formatCurrency(hovered.sales)} | {hovered.weightedMarginPct.toFixed(2)}% |{' '}
            {hovered.quantity} units
          </span>
        ) : (
          <span className="text-slate-400">Click any product to view details and matrix recommendation</span>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// 5. Box-Plot Distribution Chart (Products & Regions)
// -----------------------------------------------------------------------------
interface MarginBoxPlotChartProps {
  boxes: MarginDistributionBox[];
}

export const MarginBoxPlotChart: React.FC<MarginBoxPlotChartProps> = ({ boxes }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 560;
  const height = 280;
  const pad = { top: 20, right: 16, bottom: 52, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const minVal = 0;
  const maxVal = 35;
  const yOf = (v: number) => pad.top + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;
  const bandW = plotW / Math.max(1, boxes.length);
  const boxW = Math.min(34, bandW * 0.52);

  const hovered = hoverIdx !== null ? boxes[hoverIdx] : null;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {[5, 10, 15, 20, 25, 30].map((v) => {
          const y = yOf(v);
          return (
            <g key={v}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-mono-tabular">
                {v}%
              </text>
            </g>
          );
        })}

        {boxes.map((b, i) => {
          const cx = pad.left + i * bandW + bandW / 2;
          const yMin = yOf(b.min);
          const yQ1 = yOf(b.q1);
          const yMed = yOf(b.median);
          const yQ3 = yOf(b.q3);
          const yMax = yOf(b.max);

          return (
            <g
              key={b.label}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer"
            >
              <rect
                x={pad.left + i * bandW}
                y={pad.top}
                width={bandW}
                height={plotH}
                fill={hoverIdx === i ? 'rgba(241,245,249,0.75)' : 'transparent'}
              />
              {/* Whisker */}
              <line x1={cx} x2={cx} y1={yMax} y2={yMin} stroke="#64748b" strokeWidth={1.25} />
              <line x1={cx - 6} x2={cx + 6} y1={yMax} y2={yMax} stroke="#64748b" strokeWidth={1.25} />
              <line x1={cx - 6} x2={cx + 6} y1={yMin} y2={yMin} stroke="#64748b" strokeWidth={1.25} />
              {/* IQR Box */}
              <rect
                x={cx - boxW / 2}
                y={yQ3}
                width={boxW}
                height={Math.max(2, yQ1 - yQ3)}
                rx={2}
                fill={hoverIdx === i ? '#0f766e' : '#ccfbf1'}
                stroke="#0f766e"
                strokeWidth={1.5}
              />
              {/* Median Line */}
              <line
                x1={cx - boxW / 2}
                x2={cx + boxW / 2}
                y1={yMed}
                y2={yMed}
                stroke={hoverIdx === i ? '#ffffff' : '#0f172a'}
                strokeWidth={2}
              />
              <text
                x={cx}
                y={height - 20}
                textAnchor="middle"
                transform={boxes.length > 5 ? `rotate(-25 ${cx} ${height - 20})` : undefined}
                className="fill-slate-700 text-[10px] font-medium"
              >
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
        {hovered ? (
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono-tabular text-slate-800">
            <span className="font-sans font-semibold">{hovered.label}</span>
            <span>Min: {hovered.min.toFixed(1)}%</span>
            <span>Q1: {hovered.q1.toFixed(1)}%</span>
            <span className="text-teal-700 font-semibold">Median: {hovered.median.toFixed(2)}%</span>
            <span>Q3: {hovered.q3.toFixed(1)}%</span>
            <span>Max: {hovered.max.toFixed(1)}%</span>
          </div>
        ) : (
          <span className="text-slate-400">Hover to view quartiles (Q1 · Median · Q3) and range</span>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// 6. Margin Erosion Chart (Quantity 1..9 vs Weighted Margin + Linear Fit)
// -----------------------------------------------------------------------------
interface MarginErosionChartProps {
  byQuantity: QuantityErosionPoint[];
  slopePerUnit: number;
  intercept: number;
}

export const MarginErosionChart: React.FC<MarginErosionChartProps> = ({
  byQuantity,
  slopePerUnit,
  intercept,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 620;
  const height = 260;
  const pad = { top: 24, right: 24, bottom: 40, left: 54 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const minY = 14;
  const maxY = 20;
  const xOf = (q: number) => pad.left + ((q - 1) / 8) * plotW;
  const yOf = (m: number) => pad.top + plotH - ((m - minY) / (maxY - minY)) * plotH;

  const weightedPath = byQuantity
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(d.quantity).toFixed(1)},${yOf(d.weightedMarginPct).toFixed(1)}`)
    .join(' ');
  const meanPath = byQuantity
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(d.quantity).toFixed(1)},${yOf(d.meanMarginPct).toFixed(1)}`)
    .join(' ');

  const regY1 = intercept + slopePerUnit * 1;
  const regY9 = intercept + slopePerUnit * 9;
  const hovered = hoverIdx !== null ? byQuantity[hoverIdx] : null;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {[14, 15, 16, 17, 18, 19, 20].map((v) => {
          const y = yOf(v);
          return (
            <g key={v}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-mono-tabular">
                {v}%
              </text>
            </g>
          );
        })}

        {/* Linear Regression Trendline */}
        <line
          x1={xOf(1)}
          x2={xOf(9)}
          y1={yOf(regY1)}
          y2={yOf(regY9)}
          stroke="#64748b"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />

        <path d={meanPath} fill="none" stroke="#2563eb" strokeWidth={1.75} strokeDasharray="2 2" />
        <path d={weightedPath} fill="none" stroke="#0f766e" strokeWidth={2.5} />

        {byQuantity.map((d, i) => {
          const cx = xOf(d.quantity);
          const cy = yOf(d.weightedMarginPct);
          return (
            <g
              key={d.quantity}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer"
            >
              <circle cx={cx} cy={cy} r={hoverIdx === i ? 6 : 4.5} fill="#0f766e" stroke="#fff" strokeWidth={1.5} />
              <text x={cx} y={height - 14} textAnchor="middle" className="fill-slate-600 text-[11px] font-mono-tabular">
                {d.quantity}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-teal-700" /> Weighted Margin
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-blue-600" /> Mean Margin
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t border-dashed border-slate-500" /> Linear Trendline
          </span>
        </div>
        {hovered ? (
          <span className="font-mono-tabular text-slate-900">
            Quantity {hovered.quantity}: {hovered.weightedMarginPct.toFixed(2)}% ({hovered.orders} orders)
          </span>
        ) : (
          <span className="text-slate-400">Order item quantity (1 to 9)</span>
        )}
      </div>
    </div>
  );
};