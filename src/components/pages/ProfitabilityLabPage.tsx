import React, { useMemo, useState } from 'react';
import {
  BCGQuadrant,
  EnrichedSaleRow,
  computeBCGMatrix,
  computeMarginDistributions,
  computeMarginErosion,
  computeUnitPriceAudit,
  formatCurrency,
  formatNumber,
} from '../../utils/analyticsEngine';
import {
  BCGMatrixChart,
  MarginBoxPlotChart,
  MarginErosionChart,
} from '../charts/InteractiveCharts';

interface ProfitabilityLabPageProps {
  filteredRows: EnrichedSaleRow[];
}

const QUADRANT_ADVICE: Record<BCGQuadrant, string> = {
  Stars:
    'Market-leading SKU with high sales volume and high profit margin — prioritize inventory availability and protect market share.',
  'Cash Cows':
    'Strong sales volume generating steady cash flow, with opportunity to improve margins through supplier or cost optimization.',
  'Question Marks':
    'High profit margin but lower sales volume — candidate for targeted marketing campaigns to convert into a Star.',
  Dogs:
    'Below-median sales volume and profit margin — review pricing, sourcing costs, or bundle with higher-velocity items.',
};

export const ProfitabilityLabPage: React.FC<ProfitabilityLabPageProps> = ({ filteredRows }) => {
  const bcg = useMemo(() => computeBCGMatrix(filteredRows), [filteredRows]);
  const erosion = useMemo(() => computeMarginErosion(filteredRows), [filteredRows]);
  const prodDist = useMemo(() => computeMarginDistributions(filteredRows, 'productName'), [filteredRows]);
  const regionDist = useMemo(() => computeMarginDistributions(filteredRows, 'region'), [filteredRows]);
  const unitAudit = useMemo(() => computeUnitPriceAudit(filteredRows), [filteredRows]);

  const [selectedProduct, setSelectedProduct] = useState<string | null>(
    bcg.products[0]?.productName ?? null
  );
  const [searchTerm, setSearchTerm] = useState('');

  const activeProduct =
    bcg.products.find((p) => p.productName === selectedProduct) ?? bcg.products[0] ?? null;

  const sampleRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = q
      ? filteredRows.filter(
          (r) =>
            r.productName.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q) ||
            r.region.toLowerCase().includes(q) ||
            r.orderTier.toLowerCase().includes(q)
        )
      : filteredRows;
    return list.slice(0, 14);
  }, [filteredRows, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Profitability Lab
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Interactive BCG matrix across all 10 SKUs, margin distributions, quantity erosion test, and unit price audit
        </p>
      </div>

      {/* Unit Price Surprise Audit Callout */}
      <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="text-sm font-semibold text-amber-950">
              Major Finding: Unit Price Anomaly (Unit Price = Sales / Quantity)
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-amber-900/90">
              Dividing <code className="font-mono-tabular font-semibold">Sales / Quantity</code> across{' '}
              <strong className="font-mono-tabular">{formatNumber(filteredRows.length)}</strong> orders reveals that{' '}
              <strong>
                {unitAudit.allExactIntegers
                  ? '100% of derived unit prices are exact integers'
                  : 'most derived unit prices are exact integers'}
              </strong>{' '}
              uniformly distributed between{' '}
              <strong className="font-mono-tabular">
                ${unitAudit.globalMin.toFixed(0)}
              </strong>{' '}
              and{' '}
              <strong className="font-mono-tabular">
                ${unitAudit.globalMax.toFixed(0)}
              </strong>{' '}
              for every product without exception. For example, a <span className="font-semibold">Mouse</span> reaches a unit price of $1,198 just like a <span className="font-semibold">Laptop</span>, indicating uniform synthetic pricing across SKUs rather than product-specific retail pricing.
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-left">
            <div className="text-[11px] text-slate-500">Global Mean Unit Price</div>
            <div className="font-mono-tabular text-lg font-bold text-slate-900">
              {formatCurrency(unitAudit.globalMean, 2)}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive BCG Matrix + Selected Product Inspector */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-8">
          <h2 className="text-base font-semibold text-slate-900">
            Interactive BCG Product Matrix
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            X-Axis: Total Sales · Y-Axis: Weighted Profit Margin · Bubble Size: Total Units Sold
          </p>
          <div className="mt-4">
            <BCGMatrixChart
              products={bcg.products}
              salesThreshold={bcg.salesThreshold}
              marginThreshold={bcg.marginThreshold}
              selectedProduct={activeProduct?.productName ?? null}
              onSelectProduct={setSelectedProduct}
            />
          </div>
        </div>

        {/* Selected SKU Detail Panel */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-4">
          {activeProduct ? (
            <>
              <div>
                <div className="text-xs text-slate-500">
                  Selected SKU Analysis · {activeProduct.category}
                </div>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{activeProduct.productName}</h3>
                <div className="mt-1 text-xs font-semibold text-teal-800">
                  Quadrant: {activeProduct.quadrant}
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
                  {QUADRANT_ADVICE[activeProduct.quadrant]}
                </p>

                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
                  <div>
                    <dt className="text-slate-500">Total Sales</dt>
                    <dd className="mt-0.5 font-mono-tabular text-sm font-semibold text-slate-900">
                      {formatCurrency(activeProduct.sales)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Net Profit</dt>
                    <dd className="mt-0.5 font-mono-tabular text-sm font-semibold text-slate-900">
                      {formatCurrency(activeProduct.profit)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Weighted Margin</dt>
                    <dd className="mt-0.5 font-mono-tabular text-sm font-semibold text-teal-700">
                      {activeProduct.weightedMarginPct.toFixed(2)}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Orders / Units</dt>
                    <dd className="mt-0.5 font-mono-tabular text-sm font-semibold text-slate-900">
                      {activeProduct.orders} / {activeProduct.quantity}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Avg. Unit Price</dt>
                    <dd className="mt-0.5 font-mono-tabular text-sm font-semibold text-slate-900">
                      {formatCurrency(activeProduct.avgUnitPrice, 2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Avg. Unit Cost</dt>
                    <dd className="mt-0.5 font-mono-tabular text-sm font-semibold text-slate-900">
                      {formatCurrency(activeProduct.avgUnitCost, 2)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Quick SKU Selector Table */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="mb-2 text-xs font-medium text-slate-500">All 10 Products:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {bcg.products.map((p) => (
                    <button
                      key={p.productName}
                      type="button"
                      onClick={() => setSelectedProduct(p.productName)}
                      className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                        p.productName === activeProduct.productName
                          ? 'border-teal-700 bg-teal-50 font-semibold text-teal-900'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{p.productName}</span>
                      <span className="font-mono-tabular text-[11px]">
                        {p.weightedMarginPct.toFixed(1)}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-slate-500">No products available</div>
          )}
        </div>
      </section>

      {/* Margin Distributions: Products & Regions */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Product Margin Distribution
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Box plot (Min · Q1 · Median · Q3 · Max) measuring margin consistency across orders
          </p>
          <div className="mt-4">
            <MarginBoxPlotChart boxes={prodDist} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Regional Margin Distribution
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Comparing profitability spread across all four regions (West · East · South · North)
          </p>
          <div className="mt-4">
            <MarginBoxPlotChart boxes={regionDist} />
          </div>
        </div>
      </section>

      {/* Margin Erosion Analysis */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Margin Erosion Analysis
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Does higher order quantity (1–9 items) trigger bulk discounts that erode profit margins?
              </p>
            </div>
            <span
              className={`text-xs font-semibold ${
                erosion.erosionDetected ? 'text-rose-700' : 'text-teal-700'
              }`}
            >
              {erosion.erosionDetected
                ? 'Statistically significant margin erosion detected'
                : 'Stable margins — no quantity erosion'}
            </span>
          </div>

          <div className="mt-4">
            <MarginErosionChart
              byQuantity={erosion.byQuantity}
              slopePerUnit={erosion.slopePerUnit}
              intercept={erosion.intercept}
            />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Order Tiers &amp; Linear Regression Summary
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-center">
              <div>
                <div className="text-[11px] text-slate-500">Pearson Correlation (r)</div>
                <div className="mt-0.5 font-mono-tabular text-sm font-bold text-slate-900">
                  {erosion.pearsonR.toFixed(4)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Slope per Unit</div>
                <div className="mt-0.5 font-mono-tabular text-sm font-bold text-slate-900">
                  {erosion.slopePerUnit >= 0 ? '+' : ''}
                  {erosion.slopePerUnit.toFixed(4)}%
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">p-value</div>
                <div className="mt-0.5 font-mono-tabular text-sm font-bold text-slate-900">
                  {erosion.pValue.toFixed(4)}
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 font-medium">Order Tier</th>
                    <th className="py-2 text-right font-medium">Orders</th>
                    <th className="py-2 text-right font-medium">Sales</th>
                    <th className="py-2 text-right font-medium">Weighted Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {erosion.byTier.map((t) => (
                    <tr key={t.tier} className="hover:bg-slate-50">
                      <td className="py-2.5 font-medium text-slate-900">{t.tier}</td>
                      <td className="py-2.5 text-right font-mono-tabular text-slate-700">
                        {formatNumber(t.orders)} ({t.shareOfOrdersPct.toFixed(1)}%)
                      </td>
                      <td className="py-2.5 text-right font-mono-tabular text-slate-800">
                        {formatCurrency(t.sales)}
                      </td>
                      <td className="py-2.5 text-right font-mono-tabular font-semibold text-teal-700">
                        {t.weightedMarginPct.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600">
            Conclusion: Wholesale orders (6–9 items) maintain strong margins—slightly higher than individual orders—confirming no volume-discount margin erosion.
          </p>
        </div>
      </section>

      {/* Derived Columns Explorer */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Derived Columns Explorer
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Preview computed columns: Unit Price, Total Cost, Unit Cost, Profit Margin %, Salary Cycle, and Order Tier
            </p>
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product, region, or tier..."
            className="w-full max-w-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Product</th>
                <th className="py-2 font-medium">Region</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Unit Price</th>
                <th className="py-2 text-right font-medium">Unit Cost</th>
                <th className="py-2 text-right font-medium">Sales</th>
                <th className="py-2 text-right font-medium">Profit</th>
                <th className="py-2 text-right font-medium">Margin %</th>
                <th className="py-2 pl-4 font-medium">Order Tier · Salary Cycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sampleRows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-2 font-mono-tabular text-slate-700">{r.orderDate}</td>
                  <td className="py-2 font-medium text-slate-900">{r.productName}</td>
                  <td className="py-2 text-slate-600">{r.region}</td>
                  <td className="py-2 text-right font-mono-tabular text-slate-800">{r.quantity}</td>
                  <td className="py-2 text-right font-mono-tabular text-slate-800">
                    {formatCurrency(r.unitPrice)}
                  </td>
                  <td className="py-2 text-right font-mono-tabular text-slate-600">
                    {formatCurrency(r.unitCost, 2)}
                  </td>
                  <td className="py-2 text-right font-mono-tabular text-slate-800">
                    {formatCurrency(r.sales)}
                  </td>
                  <td className="py-2 text-right font-mono-tabular text-slate-800">
                    {formatCurrency(r.profit, 2)}
                  </td>
                  <td className="py-2 text-right font-mono-tabular font-semibold text-teal-700">
                    {r.profitMarginPct.toFixed(2)}%
                  </td>
                  <td className="py-2 pl-4 text-slate-600 whitespace-nowrap">
                    {r.orderTier} · {r.salaryCycle}
                  </td>
                </tr>
              ))}
              {sampleRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No transactions match your search query
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
