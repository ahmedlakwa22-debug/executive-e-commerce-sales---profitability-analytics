import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Code2,
  FlaskConical,
  Menu,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  CATEGORY_LABELS_AR,
  EnrichedSaleRow,
  REGION_LABELS_AR,
  formatNumber,
  parseAndEnrichCSV,
} from './utils/analyticsEngine';
import { ExecutiveSummaryPage } from './components/pages/ExecutiveSummaryPage';
import { ProfitabilityLabPage } from './components/pages/ProfitabilityLabPage';
import { WhatIfSimulatorPage } from './components/pages/WhatIfSimulatorPage';
import { PythonCodeModal } from './components/PythonCodeModal';

type PageId = 'executive' | 'profitability' | 'simulator';

const NAV_ITEMS: { id: PageId; title: string; subtitle: string; icon: React.FC<{ className?: string }> }[] = [
  {
    id: 'executive',
    title: 'Executive Summary',
    subtitle: 'Regions, growth, time-series',
    icon: BarChart3,
  },
  {
    id: 'profitability',
    title: 'Profitability Lab',
    subtitle: 'BCG matrix, erosion, unit price',
    icon: FlaskConical,
  },
  {
    id: 'simulator',
    title: 'What-If Simulator',
    subtitle: 'Test margin uplift scenarios',
    icon: SlidersHorizontal,
  },
];

const CSV_URL = '/assets/aistudio/ecommerce_sales_data__2__6f7ed651.csv';

export default function App() {
  const [rows, setRows] = useState<EnrichedSaleRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activePage, setActivePage] = useState<PageId>('executive');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [pythonModalOpen, setPythonModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    async function loadCsv() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch(CSV_URL);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const text = await res.text();
        const enriched = parseAndEnrichCSV(text);
        if (!cancelled) {
          setRows(enriched);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Failed to load sales data CSV file.'
          );
          setLoading(false);
        }
      }
    }
    loadCsv();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (yearFilter !== 'ALL' && String(r.year) !== yearFilter) return false;
      if (regionFilter !== 'ALL' && r.region !== regionFilter) return false;
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
      return true;
    });
  }, [rows, yearFilter, regionFilter, categoryFilter]);

  const hasActiveFilters =
    yearFilter !== 'ALL' || regionFilter !== 'ALL' || categoryFilter !== 'ALL';

  const resetFilters = () => {
    setYearFilter('ALL');
    setRegionFilter('ALL');
    setCategoryFilter('ALL');
  };

  const activeNav = NAV_ITEMS.find((item) => item.id === activePage) ?? NAV_ITEMS[0];

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white px-4 py-5">
      <div className="space-y-6">
        {/* Brand Title */}
        <div className="flex items-center justify-between px-2">
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Sales Intelligence Lab
          </span>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 3 Pages Navigation */}
        <nav className="space-y-1" aria-label="Dashboard pages">
          <div className="px-2 pb-1 text-[11px] font-medium text-slate-400">Analytical Pages</div>
          {NAV_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActivePage(item.id);
                  setMobileNavOpen(false);
                }}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 ring-1 ring-teal-200/80'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    isActive ? 'text-teal-700' : 'text-slate-400'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {idx + 1}. {item.title}
                  </div>
                  <div className="truncate text-[11px] text-slate-500">{item.subtitle}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Global Analytical Filters */}
        <div className="space-y-3 border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-medium text-slate-500">Data Filters</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:text-teal-800"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div>
            <label htmlFor="filter-year" className="block px-1 text-xs text-slate-600">
              Year
            </label>
            <select
              id="filter-year"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Years (2022–2024)</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-region" className="block px-1 text-xs text-slate-600">
              Region
            </label>
            <select
              id="filter-region"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Regions</option>
              {Object.entries(REGION_LABELS_AR).map(([key]) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-category" className="block px-1 text-xs text-slate-600">
              Category
            </label>
            <select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {Object.entries(CATEGORY_LABELS_AR).map(([key]) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quiet Dataset Summary Footer */}
      <div className="border-t border-slate-200 px-2 pt-4 text-xs text-slate-500">
        <div className="font-medium text-slate-700">Active Dataset Scope</div>
        <div className="mt-1 font-mono-tabular">
          {formatNumber(filteredRows.length)} of {formatNumber(rows.length)} orders
        </div>
        <div className="mt-0.5">10 products · 3 categories · 4 regions</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
          <div className="sticky top-0 h-screen overflow-y-auto">{SidebarContent}</div>
        </aside>

        {/* Mobile Drawer Sidebar */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-950/40"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="relative z-10 w-72 max-w-[85vw] border-r border-slate-200 bg-white">
              {SidebarContent}
            </aside>
          </div>
        )}

        {/* Main Content Viewport */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Bar (3-zone contract) */}
          <header className="sticky top-0 z-30 flex items-center justify-between gap-8 border-b border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur-xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 truncate text-sm">
                <span className="font-semibold text-slate-900 whitespace-nowrap">Sales Analytics</span>
                <span className="text-slate-300">/</span>
                <span className="truncate font-medium text-teal-800">{activeNav.title}</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap shrink-0">
              <span>{formatNumber(filteredRows.length)} orders</span>
              <span aria-hidden="true">·</span>
              <span>2022–2024</span>
              <span aria-hidden="true">·</span>
              <span>Python Pandas / Streamlit</span>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setPythonModalOpen(true)}
                className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>View Python Code</span>
              </button>
            </div>
          </header>

          {/* Main Workspace */}
          <main className="mx-auto w-full max-w-[1280px] flex-1 p-6">
            {loading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[1, 2, 3, 4].map((k) => (
                    <div
                      key={k}
                      className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white p-5"
                    />
                  ))}
                </div>
                <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white p-6" />
              </div>
            ) : errorMsg ? (
              <div className="rounded-xl border border-rose-200 bg-white p-8 text-center">
                <h2 className="text-base font-semibold text-rose-800">Failed to read data file</h2>
                <p className="mt-1 text-sm text-slate-600">{errorMsg}</p>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                <h2 className="text-base font-semibold text-slate-900">
                  No orders match the selected filters
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Try resetting the year, region, or category filters to view results.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>
            ) : (
              <>
                {activePage === 'executive' && (
                  <ExecutiveSummaryPage
                    filteredRows={filteredRows}
                    selectedRegion={regionFilter}
                    onSelectRegion={setRegionFilter}
                  />
                )}
                {activePage === 'profitability' && (
                  <ProfitabilityLabPage filteredRows={filteredRows} />
                )}
                {activePage === 'simulator' && <WhatIfSimulatorPage allRows={rows} />}
              </>
            )}
          </main>
        </div>
      </div>

      <PythonCodeModal isOpen={pythonModalOpen} onClose={() => setPythonModalOpen(false)} />
    </div>
  );
}