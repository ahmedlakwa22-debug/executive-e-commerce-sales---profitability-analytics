import React, { useMemo, useState } from 'react';
import {
  CATEGORY_LABELS_AR,
  EnrichedSaleRow,
  formatCurrency,
  formatNumber,
} from '../../utils/analyticsEngine';

interface WhatIfSimulatorPageProps {
  allRows: EnrichedSaleRow[];
}

export const WhatIfSimulatorPage: React.FC<WhatIfSimulatorPageProps> = ({ allRows }) => {
  const [scopeType, setScopeType] = useState<'category' | 'product'>('category');
  const [yearMode, setYearMode] = useState<'annual_avg' | '2024' | '2023' | '2022'>('annual_avg');
  const [upliftPct, setUpliftPct] = useState<number>(2.0);

  const scopedRows = useMemo(() => {
    if (yearMode === 'annual_avg') return allRows;
    const yr = Number(yearMode);
    return allRows.filter((r) => r.year === yr);
  }, [allRows, yearMode]);

  const numYears = useMemo(() => {
    const yrs = new Set(scopedRows.map((r) => r.year));
    return Math.max(1, yrs.size);
  }, [scopedRows]);

  const segments = useMemo(() => {
    const map = new Map<string, { sales: number; profit: number; orders: number }>();
    for (const r of scopedRows) {
      const key = scopeType === 'category' ? r.category : r.productName;
      const cur = map.get(key) ?? { sales: 0, profit: 0, orders: 0 };
      cur.sales += r.sales;
      cur.profit += r.profit;
      cur.orders += 1;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .map(([name, d]) => ({
        name,
        label: scopeType === 'category' ? (CATEGORY_LABELS_AR[name] ?? name) : name,
        sales: d.sales,
        profit: d.profit,
        orders: d.orders,
        marginPct: d.sales > 0 ? (d.profit / d.sales) * 100 : 0,
      }))
      .sort((a, b) => a.marginPct - b.marginPct);
  }, [scopedRows, scopeType]);

  const lowestMarginSegment = segments[0]?.name ?? '';
  const [selectedTarget, setSelectedTarget] = useState<string>('Office');

  const activeTargetName = segments.some((s) => s.name === selectedTarget)
    ? selectedTarget
    : lowestMarginSegment;

  const targetObj = segments.find((s) => s.name === activeTargetName) ?? segments[0];

  const totalSales = scopedRows.reduce((a, r) => a + r.sales, 0);
  const totalProfit = scopedRows.reduce((a, r) => a + r.profit, 0);
  const overallMarginBefore = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  const targetAnnualSales = targetObj ? targetObj.sales / numYears : 0;
  const targetAnnualProfitBefore = targetObj ? targetObj.profit / numYears : 0;
  const incrementalAnnualProfit = targetAnnualSales * (upliftPct / 100);
  const totalPeriodIncremental = incrementalAnnualProfit * numYears;

  const annualProfitBefore = totalProfit / numYears;
  const annualProfitAfter = annualProfitBefore + incrementalAnnualProfit;
  const overallMarginAfter =
    totalSales > 0 ? ((totalProfit + totalPeriodIncremental) / totalSales) * 100 : 0;

  const sensitivityLevels = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          What-If Profit Simulator
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Test how lifting the profit margin of the lowest-margin category or product impacts annual company net profit
        </p>
      </div>

      {/* Interactive Parameter Controls + Live Outcome */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Controls Panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <h2 className="text-base font-semibold text-slate-900">Scenario Parameters</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Defaulted to the lowest-margin segment ({lowestMarginSegment}) with a +2.0% margin uplift
          </p>

          <div className="mt-5 space-y-5">
            {/* Scope Toggle */}
            <div>
              <label className="block text-xs font-medium text-slate-700">Simulation Scope</label>
              <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setScopeType('category');
                    setSelectedTarget('Office');
                  }}
                  className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    scopeType === 'category'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  By Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScopeType('product');
                    setSelectedTarget('Tablet');
                  }}
                  className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    scopeType === 'product'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  By Product (SKU)
                </button>
              </div>
            </div>

            {/* Target Selector */}
            <div>
              <label htmlFor="target-select" className="block text-xs font-medium text-slate-700">
                Select Target {scopeType === 'category' ? 'Category' : 'Product'} (sorted lowest margin first)
              </label>
              <select
                id="target-select"
                value={activeTargetName}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              >
                {segments.map((s, idx) => (
                  <option key={s.name} value={s.name}>
                    {s.label} — {s.marginPct.toFixed(2)}% margin {idx === 0 ? '(Lowest)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Baseline Year */}
            <div>
              <label htmlFor="year-mode" className="block text-xs font-medium text-slate-700">
                Baseline Period for Annual Impact
              </label>
              <select
                id="year-mode"
                value={yearMode}
                onChange={(e) => setYearMode(e.target.value as typeof yearMode)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              >
                <option value="annual_avg">Annual Average (2022–2024)</option>
                <option value="2024">2024 Only</option>
                <option value="2023">2023 Only</option>
                <option value="2022">2022 Only</option>
              </select>
            </div>

            {/* Uplift Slider */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <label htmlFor="uplift-slider" className="text-xs font-medium text-slate-700">
                  Margin Uplift Adjustment
                </label>
                <span
                  className={`font-mono-tabular text-base font-bold ${
                    upliftPct >= 0 ? 'text-teal-700' : 'text-rose-700'
                  }`}
                >
                  {upliftPct >= 0 ? '+' : ''}
                  {upliftPct.toFixed(2)}%
                </span>
              </div>
              <input
                id="uplift-slider"
                type="range"
                min={-5}
                max={10}
                step={0.25}
                value={upliftPct}
                onChange={(e) => setUpliftPct(Number(e.target.value))}
                className="analytics-slider mt-3 w-full"
              />
              <div className="mt-1.5 flex justify-between font-mono-tabular text-[11px] text-slate-400">
                <span>-5.0%</span>
                <span>0%</span>
                <span>+2.0%</span>
                <span>+5.0%</span>
                <span>+10.0%</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 2, 3, 5].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setUpliftPct(preset)}
                    className={`whitespace-nowrap shrink-0 rounded-md border px-2.5 py-1 font-mono-tabular text-xs font-medium transition-colors ${
                      upliftPct === preset
                        ? 'border-teal-700 bg-teal-50 text-teal-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    +{preset}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Projected Financial Impact Panel */}
        <div className="flex flex-col justify-between gap-6 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Projected Impact · {targetObj?.label}
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <span
                className={`font-mono-tabular text-4xl font-bold tracking-tight ${
                  incrementalAnnualProfit >= 0 ? 'text-teal-700' : 'text-rose-700'
                }`}
              >
                {incrementalAnnualProfit >= 0 ? '+' : ''}
                {formatCurrency(incrementalAnnualProfit, 2)}
              </span>
              <span className="text-sm text-slate-600">in annual net profit</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Lifting <strong className="text-slate-900">{targetObj?.name}</strong> margin by{' '}
              <strong className="font-mono-tabular">
                {upliftPct >= 0 ? '+' : ''}
                {upliftPct.toFixed(2)}%
              </strong>{' '}
              (from{' '}
              <span className="font-mono-tabular">
                {targetObj?.marginPct.toFixed(2)}%
              </span>{' '}
              to{' '}
              <span className="font-mono-tabular">
                {((targetObj?.marginPct ?? 0) + upliftPct).toFixed(2)}%
              </span>
              ) on annual sales of{' '}
              <span className="font-mono-tabular">
                {formatCurrency(targetAnnualSales)}
              </span>
              .
            </p>

            {/* 3 Comparison Metrics */}
            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <div className="text-xs text-slate-500">Total Annual Profit (Before)</div>
                <div className="mt-1 font-mono-tabular text-lg font-bold text-slate-900">
                  {formatCurrency(annualProfitBefore)}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Company Margin: {overallMarginBefore.toFixed(2)}%
                </div>
              </div>

              <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4">
                <div className="text-xs text-teal-800">Total Annual Profit (After)</div>
                <div className="mt-1 font-mono-tabular text-lg font-bold text-teal-900">
                  {formatCurrency(annualProfitAfter)}
                </div>
                <div className="mt-1 text-[11px] text-teal-800">
                  Company Margin: {overallMarginAfter.toFixed(2)}% (
                  {overallMarginAfter - overallMarginBefore >= 0 ? '+' : ''}
                  {((overallMarginAfter - overallMarginBefore) * 100).toFixed(0)} bps)
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <div className="text-xs text-slate-500">
                  Cumulative Impact ({numYears} {numYears === 1 ? 'year' : 'years'})
                </div>
                <div className="mt-1 font-mono-tabular text-lg font-bold text-slate-900">
                  {totalPeriodIncremental >= 0 ? '+' : ''}
                  {formatCurrency(totalPeriodIncremental)}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {formatNumber(targetObj?.orders ?? 0)} targeted orders
                </div>
              </div>
            </div>
          </div>

          {/* Visual Bar Comparison (Target Segment Profit Before vs After) */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-semibold text-slate-700">
              {targetObj?.name} Annual Net Profit Comparison (Before vs. After)
            </h3>
            <div className="mt-3 space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Current Baseline ({targetObj?.marginPct.toFixed(2)}%)</span>
                  <span className="font-mono-tabular font-medium text-slate-900">
                    {formatCurrency(targetAnnualProfitBefore, 2)}
                  </span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-400 transition-all duration-200"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          5,
                          (targetAnnualProfitBefore /
                            Math.max(1, targetAnnualProfitBefore + Math.abs(incrementalAnnualProfit))) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-700">
                  <span>
                    Simulated Scenario ({((targetObj?.marginPct ?? 0) + upliftPct).toFixed(2)}%)
                  </span>
                  <span className="font-mono-tabular font-semibold text-teal-800">
                    {formatCurrency(targetAnnualProfitBefore + incrementalAnnualProfit, 2)}
                  </span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      upliftPct >= 0 ? 'bg-teal-700' : 'bg-rose-600'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          5,
                          ((targetAnnualProfitBefore + incrementalAnnualProfit) /
                            Math.max(1, targetAnnualProfitBefore + Math.abs(incrementalAnnualProfit))) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sensitivity Ladder + Segment Ranking Table */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <h2 className="text-base font-semibold text-slate-900">
            Sensitivity Ladder for {targetObj?.name}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Incremental annual net profit across +1% to +5% margin uplift steps
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 font-medium">Uplift Step</th>
                  <th className="py-2 text-right font-medium">New Margin</th>
                  <th className="py-2 text-right font-medium">Annual Profit Gain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono-tabular">
                {sensitivityLevels.map((lvl) => {
                  const inc = targetAnnualSales * (lvl / 100);
                  const isCurrent = Math.abs(upliftPct - lvl) < 0.01;
                  return (
                    <tr
                      key={lvl}
                      onClick={() => setUpliftPct(lvl)}
                      className={`cursor-pointer transition-colors ${
                        isCurrent ? 'bg-teal-50/70 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 text-slate-900">+{lvl.toFixed(1)}%</td>
                      <td className="py-2.5 text-right text-slate-700">
                        {((targetObj?.marginPct ?? 0) + lvl).toFixed(2)}%
                      </td>
                      <td className="py-2.5 text-right text-teal-700">
                        +{formatCurrency(inc, 2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <h2 className="text-base font-semibold text-slate-900">
            {scopeType === 'category' ? 'Categories' : 'Products'} Ranked by Profit Margin (Lowest to Highest)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Click any row to set it as the active simulation target
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 font-medium">{scopeType === 'category' ? 'Category' : 'Product'}</th>
                  <th className="py-2 text-right font-medium">Annual Sales</th>
                  <th className="py-2 text-right font-medium">Annual Profit</th>
                  <th className="py-2 text-right font-medium">Current Margin</th>
                  <th className="py-2 text-right font-medium">+2% Uplift / Yr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {segments.map((s) => {
                  const isSel = s.name === activeTargetName;
                  const annSales = s.sales / numYears;
                  const annProfit = s.profit / numYears;
                  return (
                    <tr
                      key={s.name}
                      onClick={() => setSelectedTarget(s.name)}
                      className={`cursor-pointer transition-colors ${
                        isSel ? 'bg-teal-50/60 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 text-slate-900">{s.label}</td>
                      <td className="py-2.5 text-right font-mono-tabular text-slate-700">
                        {formatCurrency(annSales)}
                      </td>
                      <td className="py-2.5 text-right font-mono-tabular text-slate-700">
                        {formatCurrency(annProfit)}
                      </td>
                      <td className="py-2.5 text-right font-mono-tabular text-slate-900">
                        {s.marginPct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 text-right font-mono-tabular text-teal-700">
                        +{formatCurrency(annSales * 0.02)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
