import React, { useMemo, useState } from 'react';
import {
  EnrichedSaleRow,
  computeBehavioralInsights,
  computeDailyMovingAverages,
  computeGrowthAnalytics,
  computeRegionSummaries,
  computeTimeSeriesDecomposition,
  formatCurrency,
  formatNumber,
} from '../../utils/analyticsEngine';
import {
  DecompositionChart,
  MovingAverageChart,
  YoYMonthlyChart,
} from '../charts/InteractiveCharts';

interface ExecutiveSummaryPageProps {
  filteredRows: EnrichedSaleRow[];
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
}

export const ExecutiveSummaryPage: React.FC<ExecutiveSummaryPageProps> = ({
  filteredRows,
  selectedRegion,
  onSelectRegion,
}) => {
  const [growthMode, setGrowthMode] = useState<'yoy' | 'mom'>('yoy');
  const [showRawDaily, setShowRawDaily] = useState<boolean>(true);

  const growth = useMemo(() => computeGrowthAnalytics(filteredRows), [filteredRows]);
  const regions = useMemo(() => computeRegionSummaries(filteredRows), [filteredRows]);
  const behavioral = useMemo(() => computeBehavioralInsights(filteredRows), [filteredRows]);
  const daily = useMemo(() => computeDailyMovingAverages(filteredRows), [filteredRows]);
  const decomp = useMemo(() => computeTimeSeriesDecomposition(daily, 7), [daily]);

  const totalSales = filteredRows.reduce((a, r) => a + r.sales, 0);
  const totalProfit = filteredRows.reduce((a, r) => a + r.profit, 0);
  const totalQty = filteredRows.reduce((a, r) => a + r.quantity, 0);
  const weightedMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  // Latest year YoY reference
  const latestYear = growth.yearly[growth.yearly.length - 1];
  const prevYear = growth.yearly.length >= 2 ? growth.yearly[growth.yearly.length - 2] : null;

  const regionCompass: Record<string, { label: string; posClass: string }> = {
    North: { label: 'North', posClass: 'md:col-start-2 md:row-start-1' },
    West: { label: 'West', posClass: 'md:col-start-1 md:row-start-2' },
    East: { label: 'East', posClass: 'md:col-start-3 md:row-start-2' },
    South: { label: 'South', posClass: 'md:col-start-2 md:row-start-3' },
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Executive Summary
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Annual KPIs, regional performance map, moving averages, and time-series decomposition
          </p>
        </div>
        <div className="text-xs text-slate-500">
          {growth.cagrSalesPct !== null ? (
            <span>
              Sales Compound Annual Growth Rate (CAGR):{' '}
              <strong className="font-mono-tabular text-slate-900">
                {growth.cagrSalesPct >= 0 ? '+' : ''}
                {growth.cagrSalesPct.toFixed(2)}%
              </strong>
            </span>
          ) : (
            <span>Single-year view selected</span>
          )}
        </div>
      </div>

      {/* 4 KPI Strip */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Total Sales</div>
          <div className="mt-2 font-mono-tabular text-2xl font-bold text-slate-900">
            {formatCurrency(totalSales)}
          </div>
          <div className="mt-2 text-xs text-slate-600">
            {latestYear?.salesYoYPct !== null && latestYear ? (
              <span>
                {latestYear.year} vs {prevYear?.year}:{' '}
                <strong
                  className={`font-mono-tabular ${
                    latestYear.salesYoYPct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {latestYear.salesYoYPct >= 0 ? '+' : ''}
                  {latestYear.salesYoYPct.toFixed(2)}% YoY
                </strong>
              </span>
            ) : (
              <span>Total for selected period</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Net Profit</div>
          <div className="mt-2 font-mono-tabular text-2xl font-bold text-slate-900">
            {formatCurrency(totalProfit)}
          </div>
          <div className="mt-2 text-xs text-slate-600">
            {latestYear?.profitYoYPct !== null && latestYear ? (
              <span>
                {latestYear.year} vs {prevYear?.year}:{' '}
                <strong
                  className={`font-mono-tabular ${
                    latestYear.profitYoYPct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {latestYear.profitYoYPct >= 0 ? '+' : ''}
                  {latestYear.profitYoYPct.toFixed(2)}% YoY
                </strong>
              </span>
            ) : (
              <span>Total Cost: {formatCurrency(totalSales - totalProfit)}</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Weighted Net Profit Margin</div>
          <div className="mt-2 font-mono-tabular text-2xl font-bold text-slate-900">
            {weightedMargin.toFixed(2)}%
          </div>
          <div className="mt-2 text-xs text-slate-600">
            {latestYear?.marginDiffBps !== null && latestYear ? (
              <span>
                YoY Change:{' '}
                <strong
                  className={`font-mono-tabular ${
                    latestYear.marginDiffBps >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {latestYear.marginDiffBps >= 0 ? '+' : ''}
                  {Math.round(latestYear.marginDiffBps)} bps
                </strong>
              </span>
            ) : (
              <span>Revenue-weighted profit margin</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Orders &amp; Units Sold</div>
          <div className="mt-2 font-mono-tabular text-2xl font-bold text-slate-900">
            {formatNumber(filteredRows.length)} / {formatNumber(totalQty)}
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Avg. Order Value:{' '}
            <strong className="font-mono-tabular text-slate-800">
              {formatCurrency(filteredRows.length > 0 ? totalSales / filteredRows.length : 0)}
            </strong>
          </div>
        </div>
      </section>

      {/* Yearly Performance Summary Strip + Regional Spatial Map */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Regional Spatial Performance Map */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Regional Performance Map
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Click any region to filter the dashboard, or click &quot;Show All Regions&quot; to reset
              </p>
            </div>
            {selectedRegion !== 'ALL' && (
              <button
                type="button"
                onClick={() => onSelectRegion('ALL')}
                className="whitespace-nowrap shrink-0 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Show All Regions
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3 md:grid-rows-3">
            {/* Center compass hub */}
            <div className="hidden md:flex md:col-start-2 md:row-start-2 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-3 text-center">
              <span className="text-xs font-medium text-slate-500">Network Total</span>
              <span className="mt-1 font-mono-tabular text-sm font-bold text-slate-900">
                {formatCurrency(totalSales)}
              </span>
              <span className="mt-0.5 text-[11px] text-slate-500">4 operating regions</span>
            </div>

            {(['North', 'West', 'East', 'South'] as const).map((regKey) => {
              const item = regions.find((r) => r.region === regKey);
              const meta = regionCompass[regKey];
              const isSelected = selectedRegion === regKey;
              const maxRegSales = Math.max(1, ...regions.map((r) => r.sales));
              const intensity = item ? item.sales / maxRegSales : 0;

              return (
                <button
                  key={regKey}
                  type="button"
                  onClick={() => onSelectRegion(isSelected ? 'ALL' : regKey)}
                  className={`${meta.posClass} flex flex-col justify-between rounded-lg border p-3.5 text-left transition-colors ${
                    isSelected
                      ? 'border-teal-700 bg-teal-50/60'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">{meta.label}</span>
                    <span className="font-mono-tabular text-[11px] text-slate-500">
                      {item ? `${item.sharePct.toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                  <div className="mt-2 font-mono-tabular text-base font-bold text-slate-900">
                    {item ? formatCurrency(item.sales) : '$0'}
                  </div>
                  <div className="mt-1 flex w-full items-center justify-between text-[11px] text-slate-600">
                    <span>Profit: {item ? formatCurrency(item.profit) : '$0'}</span>
                    <span className="font-mono-tabular text-teal-800">
                      {item ? `${item.weightedMarginPct.toFixed(2)}%` : '—'}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-teal-700"
                      style={{ width: `${Math.round(intensity * 100)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Yearly YoY Table & Behavioral Dimensions */}
        <div className="flex flex-col justify-between gap-6 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Annual Comparative Performance (2022–2024)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Evaluating organic growth vs. 2024 margin compression
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 font-medium">Year</th>
                    <th className="py-2 text-right font-medium">Sales</th>
                    <th className="py-2 text-right font-medium">YoY Growth</th>
                    <th className="py-2 text-right font-medium">Profit</th>
                    <th className="py-2 text-right font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono-tabular">
                  {growth.yearly.map((y) => (
                    <tr key={y.year} className="hover:bg-slate-50">
                      <td className="py-2.5 font-semibold text-slate-900">{y.year}</td>
                      <td className="py-2.5 text-right text-slate-800">
                        {formatCurrency(y.sales)}
                      </td>
                      <td
                        className={`py-2.5 text-right font-medium ${
                          y.salesYoYPct === null
                            ? 'text-slate-400'
                            : y.salesYoYPct >= 0
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                        }`}
                      >
                        {y.salesYoYPct === null
                          ? '—'
                          : `${y.salesYoYPct >= 0 ? '+' : ''}${y.salesYoYPct.toFixed(2)}%`}
                      </td>
                      <td className="py-2.5 text-right text-slate-800">
                        {formatCurrency(y.profit)}
                      </td>
                      <td className="py-2.5 text-right text-slate-700">
                        {y.marginPct.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Behavioral Split: Weekend vs Weekday & Salary Cycle */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-semibold text-slate-700">
              Behavioral Time Dimensions (Weekends &amp; Salary Cycles)
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="text-slate-500">Weekend</div>
                <div className="mt-1 font-mono-tabular text-sm font-semibold text-slate-900">
                  {formatCurrency(behavioral.weekend.avgOrderSales)} / order
                </div>
                <div className="mt-0.5 text-[11px] text-slate-600">
                  {formatNumber(behavioral.weekend.orders)} orders · Margin{' '}
                  {behavioral.weekend.weightedMarginPct.toFixed(2)}%
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="text-slate-500">Weekday</div>
                <div className="mt-1 font-mono-tabular text-sm font-semibold text-slate-900">
                  {formatCurrency(behavioral.weekday.avgOrderSales)} / order
                </div>
                <div className="mt-0.5 text-[11px] text-slate-600">
                  {formatNumber(behavioral.weekday.orders)} orders · Margin{' '}
                  {behavioral.weekday.weightedMarginPct.toFixed(2)}%
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              {behavioral.salaryCycles.map((sc) => (
                <div key={sc.cycle} className="rounded-md border border-slate-200 px-2.5 py-2">
                  <div className="truncate font-medium text-slate-600" title={sc.cycle}>
                    {sc.cycle}
                  </div>
                  <div className="mt-0.5 font-mono-tabular font-semibold text-slate-900">
                    {formatCurrency(sc.sales)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* YoY & MoM Growth Chart */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              YoY &amp; MoM Growth Analysis
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Comparing each month in 2023 and 2024 against the prior year to separate organic growth from random spikes
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setGrowthMode('yoy')}
              className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                growthMode === 'yoy'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Year-over-Year (YoY)
            </button>
            <button
              type="button"
              onClick={() => setGrowthMode('mom')}
              className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                growthMode === 'mom'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month-over-Month (MoM)
            </button>
          </div>
        </div>

        <div className="mt-5">
          <YoYMonthlyChart
            yoyComparison={growth.yoyComparison}
            monthlySeries={growth.monthly}
            mode={growthMode}
          />
        </div>
      </section>

      {/* 7-Day & 30-Day Moving Averages */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              7-Day &amp; 30-Day Moving Averages
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Smoothing daily volatility across a continuous calendar index to reveal the underlying market trend
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRawDaily((prev) => !prev)}
            className="whitespace-nowrap shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {showRawDaily ? 'Hide Raw Daily Sales' : 'Show Raw Daily Sales'}
          </button>
        </div>

        <div className="mt-5">
          <MovingAverageChart daily={daily} showRawDaily={showRawDaily} />
        </div>
      </section>

      {/* Time-Series Decomposition + Anomaly Table */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Time-Series Decomposition
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Separating Trend, weekly Seasonality, and Residuals to isolate non-seasonal spikes and drops
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Detected Anomalies (&gt;2σ):{' '}
            <strong className="font-mono-tabular text-rose-700">{decomp.anomalies.length}</strong>{' '}
            days
          </span>
        </div>

        <div className="mt-5">
          <DecompositionChart points={decomp.points} threshold2Sigma={decomp.threshold2Sigma} />
        </div>

        {decomp.anomalies.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Top Non-Seasonal Spike Days
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 text-right font-medium">Observed Sales</th>
                    <th className="py-2 text-right font-medium">Trend</th>
                    <th className="py-2 text-right font-medium">Seasonal Effect</th>
                    <th className="py-2 text-right font-medium">Residual</th>
                    <th className="py-2 pl-4 font-medium">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {decomp.anomalies.slice(0, 8).map((a) => (
                    <tr key={a.date} className="hover:bg-slate-50">
                      <td className="py-2 font-mono-tabular font-medium text-slate-900">{a.date}</td>
                      <td className="py-2 text-right font-mono-tabular text-slate-800">
                        {formatCurrency(a.observed)}
                      </td>
                      <td className="py-2 text-right font-mono-tabular text-slate-600">
                        {formatCurrency(a.trend)}
                      </td>
                      <td className="py-2 text-right font-mono-tabular text-slate-600">
                        {formatCurrency(a.seasonal)}
                      </td>
                      <td
                        className={`py-2 text-right font-mono-tabular font-semibold ${
                          a.residual >= 0 ? 'text-rose-700' : 'text-amber-700'
                        }`}
                      >
                        {a.residual >= 0 ? '+' : ''}
                        {formatCurrency(a.residual)}
                      </td>
                      <td className="py-2 pl-4 text-slate-700">
                        {a.anomalyDirection === 'spike' ? 'Non-Seasonal Positive Spike' : 'Sudden Drop'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
