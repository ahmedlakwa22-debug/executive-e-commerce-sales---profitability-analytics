export interface RawSaleRow {
  orderDate: string;
  productName: string;
  category: string;
  region: string;
  quantity: number;
  sales: number;
  profit: number;
}

export type OrderTier =
  | 'Individual (1-2 items)'
  | 'Medium (3-5 items)'
  | 'Wholesale / Corporate (6-9 items)';
export type SalaryCycle =
  | 'Beginning of Month (1-10)'
  | 'Mid Month (11-20)'
  | 'End of Month (21-31)';
export type BCGQuadrant = 'Stars' | 'Cash Cows' | 'Question Marks' | 'Dogs';

export interface EnrichedSaleRow extends RawSaleRow {
  id: number;
  unitPrice: number;
  profitMarginPct: number;
  totalCost: number;
  unitCost: number;
  year: number;
  quarter: string;
  month: number;
  monthNameAr: string;
  yearMonth: string;
  dayOfWeek: number;
  dayNameAr: string;
  dayOfMonth: number;
  isWeekend: boolean;
  dayType: string;
  salaryCycle: SalaryCycle;
  orderTier: OrderTier;
}

export interface YearlyMetric {
  year: number;
  orders: number;
  quantity: number;
  sales: number;
  profit: number;
  totalCost: number;
  marginPct: number;
  salesYoYPct: number | null;
  profitYoYPct: number | null;
  ordersYoYPct: number | null;
  marginDiffBps: number | null;
}

export interface MonthlyMetric {
  year: number;
  month: number;
  yearMonth: string;
  monthNameAr: string;
  orders: number;
  sales: number;
  profit: number;
  marginPct: number;
  momSalesPct: number | null;
  momProfitPct: number | null;
}

export interface YoYMonthComparison {
  month: number;
  monthNameAr: string;
  sales2022: number;
  sales2023: number;
  sales2024: number;
  profit2022: number;
  profit2023: number;
  profit2024: number;
  yoy23vs22Pct: number | null;
  yoy24vs23Pct: number | null;
}

export interface DailySeriesPoint {
  date: string;
  sales: number;
  profit: number;
  orders: number;
  salesMA7: number;
  salesMA30: number;
  profitMA7: number;
  profitMA30: number;
}

export interface DecompositionPoint {
  date: string;
  observed: number;
  trend: number;
  seasonal: number;
  residual: number;
  isAnomaly: boolean;
  anomalyDirection: 'spike' | 'drop' | 'normal';
}

export interface DecompositionResult {
  points: DecompositionPoint[];
  anomalies: DecompositionPoint[];
  residualStd: number;
  threshold2Sigma: number;
}

export interface BCGProductItem {
  productName: string;
  category: string;
  orders: number;
  quantity: number;
  sales: number;
  profit: number;
  weightedMarginPct: number;
  avgUnitPrice: number;
  avgUnitCost: number;
  quadrant: BCGQuadrant;
}

export interface BCGResult {
  products: BCGProductItem[];
  salesThreshold: number;
  marginThreshold: number;
}

export interface MarginDistributionBox {
  label: string;
  subLabel?: string;
  count: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  weightedMargin: number;
}

export interface QuantityErosionPoint {
  quantity: number;
  orders: number;
  sales: number;
  profit: number;
  weightedMarginPct: number;
  meanMarginPct: number;
  avgUnitPrice: number;
}

export interface OrderTierSummary {
  tier: OrderTier;
  orders: number;
  sales: number;
  profit: number;
  weightedMarginPct: number;
  meanMarginPct: number;
  shareOfOrdersPct: number;
}

export interface MarginErosionResult {
  byQuantity: QuantityErosionPoint[];
  byTier: OrderTierSummary[];
  pearsonR: number;
  slopePerUnit: number;
  intercept: number;
  pValue: number;
  erosionDetected: boolean;
}

export interface UnitPriceAuditItem {
  productName: string;
  category: string;
  count: number;
  minUnitPrice: number;
  meanUnitPrice: number;
  medianUnitPrice: number;
  maxUnitPrice: number;
  avgUnitCost: number;
}

export interface UnitPriceAuditResult {
  allExactIntegers: boolean;
  globalMin: number;
  globalMax: number;
  globalMean: number;
  byProduct: UnitPriceAuditItem[];
}

export interface RegionSummary {
  region: string;
  regionAr: string;
  orders: number;
  quantity: number;
  sales: number;
  profit: number;
  weightedMarginPct: number;
  sharePct: number;
}

const MONTH_NAMES_AR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DAY_NAMES_AR = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const REGION_LABELS_AR: Record<string, string> = {
  West: 'West Region',
  East: 'East Region',
  South: 'South Region',
  North: 'North Region',
};

export const CATEGORY_LABELS_AR: Record<string, string> = {
  Electronics: 'Electronics',
  Accessories: 'Accessories',
  Office: 'Office',
};

export function parseAndEnrichCSV(csvText: string): EnrichedSaleRow[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const rows: EnrichedSaleRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 7) continue;

    const orderDate = parts[0].trim();
    const productName = parts[1].trim();
    const category = parts[2].trim();
    const region = parts[3].trim();
    const quantity = Number(parts[4]);
    const sales = Number(parts[5]);
    const profit = Number(parts[6]);

    const unitPrice = quantity > 0 ? sales / quantity : 0;
    const profitMarginPct = sales > 0 ? (profit / sales) * 100 : 0;
    const totalCost = sales - profit;
    const unitCost = quantity > 0 ? totalCost / quantity : 0;

    const [yStr, mStr, dStr] = orderDate.split('-');
    const year = Number(yStr);
    const month = Number(mStr);
    const dayOfMonth = Number(dStr);
    const dateObj = new Date(Date.UTC(year, month - 1, dayOfMonth));
    const dayOfWeek = dateObj.getUTCDay(); // 0=Sun .. 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const quarter = `Q${Math.ceil(month / 3)}`;
    const yearMonth = `${yStr}-${mStr}`;
    const salaryCycle: SalaryCycle =
      dayOfMonth <= 10
        ? 'Beginning of Month (1-10)'
        : dayOfMonth <= 20
          ? 'Mid Month (11-20)'
          : 'End of Month (21-31)';
    const orderTier: OrderTier =
      quantity <= 2
        ? 'Individual (1-2 items)'
        : quantity <= 5
          ? 'Medium (3-5 items)'
          : 'Wholesale / Corporate (6-9 items)';

    rows.push({
      id: i,
      orderDate,
      productName,
      category,
      region,
      quantity,
      sales,
      profit,
      unitPrice,
      profitMarginPct,
      totalCost,
      unitCost,
      year,
      quarter,
      month,
      monthNameAr: MONTH_NAMES_AR[month - 1] ?? mStr,
      yearMonth,
      dayOfWeek,
      dayNameAr: DAY_NAMES_AR[dayOfWeek] ?? '',
      dayOfMonth,
      isWeekend,
      dayType: isWeekend ? 'Weekend' : 'Weekday',
      salaryCycle,
      orderTier,
    });
  }

  return rows.sort((a, b) => a.orderDate.localeCompare(b.orderDate));
}

export function computeUnitPriceAudit(rows: EnrichedSaleRow[]): UnitPriceAuditResult {
  if (rows.length === 0) {
    return { allExactIntegers: true, globalMin: 0, globalMax: 0, globalMean: 0, byProduct: [] };
  }

  let allExactIntegers = true;
  let globalMin = Infinity;
  let globalMax = -Infinity;
  let sumUP = 0;

  const grouped = new Map<string, { category: string; ups: number[]; ucs: number[] }>();
  for (const r of rows) {
    if (Math.abs(r.unitPrice - Math.round(r.unitPrice)) > 1e-6) {
      allExactIntegers = false;
    }
    if (r.unitPrice < globalMin) globalMin = r.unitPrice;
    if (r.unitPrice > globalMax) globalMax = r.unitPrice;
    sumUP += r.unitPrice;

    let entry = grouped.get(r.productName);
    if (!entry) {
      entry = { category: r.category, ups: [], ucs: [] };
      grouped.set(r.productName, entry);
    }
    entry.ups.push(r.unitPrice);
    entry.ucs.push(r.unitCost);
  }

  const byProduct: UnitPriceAuditItem[] = [];
  for (const [productName, data] of grouped.entries()) {
    const sorted = [...data.ups].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianUnitPrice =
      sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    const meanUnitPrice = data.ups.reduce((acc, v) => acc + v, 0) / data.ups.length;
    const avgUnitCost = data.ucs.reduce((acc, v) => acc + v, 0) / data.ucs.length;

    byProduct.push({
      productName,
      category: data.category,
      count: data.ups.length,
      minUnitPrice: sorted[0],
      meanUnitPrice,
      medianUnitPrice,
      maxUnitPrice: sorted[sorted.length - 1],
      avgUnitCost,
    });
  }

  byProduct.sort((a, b) => b.meanUnitPrice - a.meanUnitPrice);

  return {
    allExactIntegers,
    globalMin,
    globalMax,
    globalMean: sumUP / rows.length,
    byProduct,
  };
}

export function computeGrowthAnalytics(rows: EnrichedSaleRow[]): {
  yearly: YearlyMetric[];
  monthly: MonthlyMetric[];
  yoyComparison: YoYMonthComparison[];
  cagrSalesPct: number | null;
  cagrProfitPct: number | null;
} {
  const yearMap = new Map<number, { orders: number; qty: number; sales: number; profit: number; cost: number }>();
  const ymMap = new Map<string, { year: number; month: number; orders: number; sales: number; profit: number }>();

  for (const r of rows) {
    const y = yearMap.get(r.year) ?? { orders: 0, qty: 0, sales: 0, profit: 0, cost: 0 };
    y.orders += 1;
    y.qty += r.quantity;
    y.sales += r.sales;
    y.profit += r.profit;
    y.cost += r.totalCost;
    yearMap.set(r.year, y);

    const m = ymMap.get(r.yearMonth) ?? {
      year: r.year,
      month: r.month,
      orders: 0,
      sales: 0,
      profit: 0,
    };
    m.orders += 1;
    m.sales += r.sales;
    m.profit += r.profit;
    ymMap.set(r.yearMonth, m);
  }

  const yearsSorted = Array.from(yearMap.keys()).sort((a, b) => a - b);
  const yearly: YearlyMetric[] = yearsSorted.map((yr, idx) => {
    const cur = yearMap.get(yr)!;
    const marginPct = cur.sales > 0 ? (cur.profit / cur.sales) * 100 : 0;
    const prev = idx > 0 ? yearMap.get(yearsSorted[idx - 1])! : null;
    const prevMargin = prev && prev.sales > 0 ? (prev.profit / prev.sales) * 100 : null;

    return {
      year: yr,
      orders: cur.orders,
      quantity: cur.qty,
      sales: cur.sales,
      profit: cur.profit,
      totalCost: cur.cost,
      marginPct,
      salesYoYPct: prev && prev.sales > 0 ? ((cur.sales - prev.sales) / prev.sales) * 100 : null,
      profitYoYPct: prev && prev.profit > 0 ? ((cur.profit - prev.profit) / prev.profit) * 100 : null,
      ordersYoYPct: prev && prev.orders > 0 ? ((cur.orders - prev.orders) / prev.orders) * 100 : null,
      marginDiffBps: prevMargin !== null ? (marginPct - prevMargin) * 100 : null,
    };
  });

  let cagrSalesPct: number | null = null;
  let cagrProfitPct: number | null = null;
  if (yearly.length >= 2) {
    const first = yearly[0];
    const last = yearly[yearly.length - 1];
    const n = last.year - first.year;
    if (n > 0 && first.sales > 0 && first.profit > 0) {
      cagrSalesPct = (Math.pow(last.sales / first.sales, 1 / n) - 1) * 100;
      cagrProfitPct = (Math.pow(last.profit / first.profit, 1 / n) - 1) * 100;
    }
  }

  const ymSorted = Array.from(ymMap.keys()).sort();
  const monthly: MonthlyMetric[] = ymSorted.map((ym, idx) => {
    const cur = ymMap.get(ym)!;
    const prev = idx > 0 ? ymMap.get(ymSorted[idx - 1])! : null;
    return {
      year: cur.year,
      month: cur.month,
      yearMonth: ym,
      monthNameAr: MONTH_NAMES_AR[cur.month - 1] ?? ym,
      orders: cur.orders,
      sales: cur.sales,
      profit: cur.profit,
      marginPct: cur.sales > 0 ? (cur.profit / cur.sales) * 100 : 0,
      momSalesPct: prev && prev.sales > 0 ? ((cur.sales - prev.sales) / prev.sales) * 100 : null,
      momProfitPct: prev && prev.profit > 0 ? ((cur.profit - prev.profit) / prev.profit) * 100 : null,
    };
  });

  const yoyComparison: YoYMonthComparison[] = [];
  for (let m = 1; m <= 12; m++) {
    const mStr = String(m).padStart(2, '0');
    const s22 = ymMap.get(`2022-${mStr}`)?.sales ?? 0;
    const s23 = ymMap.get(`2023-${mStr}`)?.sales ?? 0;
    const s24 = ymMap.get(`2024-${mStr}`)?.sales ?? 0;
    const p22 = ymMap.get(`2022-${mStr}`)?.profit ?? 0;
    const p23 = ymMap.get(`2023-${mStr}`)?.profit ?? 0;
    const p24 = ymMap.get(`2024-${mStr}`)?.profit ?? 0;

    yoyComparison.push({
      month: m,
      monthNameAr: MONTH_NAMES_AR[m - 1],
      sales2022: s22,
      sales2023: s23,
      sales2024: s24,
      profit2022: p22,
      profit2023: p23,
      profit2024: p24,
      yoy23vs22Pct: s22 > 0 && s23 > 0 ? ((s23 - s22) / s22) * 100 : null,
      yoy24vs23Pct: s23 > 0 && s24 > 0 ? ((s24 - s23) / s23) * 100 : null,
    });
  }

  return { yearly, monthly, yoyComparison, cagrSalesPct, cagrProfitPct };
}

export function computeDailyMovingAverages(rows: EnrichedSaleRow[]): DailySeriesPoint[] {
  if (rows.length === 0) return [];

  const dailyAgg = new Map<string, { sales: number; profit: number; orders: number }>();
  let minDate = rows[0].orderDate;
  let maxDate = rows[0].orderDate;

  for (const r of rows) {
    if (r.orderDate < minDate) minDate = r.orderDate;
    if (r.orderDate > maxDate) maxDate = r.orderDate;
    const cur = dailyAgg.get(r.orderDate) ?? { sales: 0, profit: 0, orders: 0 };
    cur.sales += r.sales;
    cur.profit += r.profit;
    cur.orders += 1;
    dailyAgg.set(r.orderDate, cur);
  }

  // Generate continuous daily calendar index
  const [y1, m1, d1] = minDate.split('-').map(Number);
  const [y2, m2, d2] = maxDate.split('-').map(Number);
  const startMs = Date.UTC(y1, m1 - 1, d1);
  const endMs = Date.UTC(y2, m2 - 1, d2);
  const dayMs = 86_400_000;

  const rawPoints: { date: string; sales: number; profit: number; orders: number }[] = [];
  for (let ms = startMs; ms <= endMs; ms += dayMs) {
    const dt = new Date(ms);
    const iso = dt.toISOString().slice(0, 10);
    const hit = dailyAgg.get(iso);
    rawPoints.push({
      date: iso,
      sales: hit ? hit.sales : 0,
      profit: hit ? hit.profit : 0,
      orders: hit ? hit.orders : 0,
    });
  }

  // Prefix sums for O(N) rolling 7-day & 30-day moving averages
  const n = rawPoints.length;
  const prefSales = new Float64Array(n + 1);
  const prefProfit = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    prefSales[i + 1] = prefSales[i] + rawPoints[i].sales;
    prefProfit[i + 1] = prefProfit[i] + rawPoints[i].profit;
  }

  return rawPoints.map((pt, i) => {
    const w7Start = Math.max(0, i - 6);
    const w30Start = Math.max(0, i - 29);
    const len7 = i - w7Start + 1;
    const len30 = i - w30Start + 1;

    return {
      date: pt.date,
      sales: pt.sales,
      profit: pt.profit,
      orders: pt.orders,
      salesMA7: (prefSales[i + 1] - prefSales[w7Start]) / len7,
      salesMA30: (prefSales[i + 1] - prefSales[w30Start]) / len30,
      profitMA7: (prefProfit[i + 1] - prefProfit[w7Start]) / len7,
      profitMA30: (prefProfit[i + 1] - prefProfit[w30Start]) / len30,
    };
  });
}

/**
 * Classical additive seasonal decomposition (matching statsmodels seasonal_decompose)
 * Period = 7 days on daily series to capture weekly seasonality and isolate non-seasonal spikes.
 */
export function computeTimeSeriesDecomposition(
  daily: DailySeriesPoint[],
  period = 7
): DecompositionResult {
  const n = daily.length;
  if (n < period * 2) {
    return { points: [], anomalies: [], residualStd: 0, threshold2Sigma: 0 };
  }

  const observed = daily.map((d) => d.sales);
  const half = Math.floor(period / 2);

  // 1. Centered moving average trend (extrapolated linearly/nearest at edges)
  const trend = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(n - 1, i + half);
    let sum = 0;
    let cnt = 0;
    for (let j = start; j <= end; j++) {
      sum += observed[j];
      cnt++;
    }
    trend[i] = sum / cnt;
  }

  // Smooth trend slightly with 21-day window for cleaner macroeconomic signal
  const smoothTrend = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - 10);
    const end = Math.min(n - 1, i + 10);
    let sum = 0;
    for (let j = start; j <= end; j++) sum += trend[j];
    smoothTrend[i] = sum / (end - start + 1);
  }

  // 2. Detrended series -> average per seasonal slot (period = 7)
  const slotSums = new Array<number>(period).fill(0);
  const slotCounts = new Array<number>(period).fill(0);
  for (let i = 0; i < n; i++) {
    const slot = i % period;
    slotSums[slot] += observed[i] - smoothTrend[i];
    slotCounts[slot] += 1;
  }
  const slotAvg = slotSums.map((s, idx) => (slotCounts[idx] > 0 ? s / slotCounts[idx] : 0));
  const meanSeasonal = slotAvg.reduce((a, b) => a + b, 0) / period;
  const centeredSeasonal = slotAvg.map((v) => v - meanSeasonal);

  const seasonal = daily.map((_, i) => centeredSeasonal[i % period]);
  const residual = daily.map((_, i) => observed[i] - smoothTrend[i] - seasonal[i]);

  const meanRes = residual.reduce((a, b) => a + b, 0) / n;
  const variance = residual.reduce((acc, v) => acc + (v - meanRes) ** 2, 0) / Math.max(1, n - 1);
  const residualStd = Math.sqrt(variance);
  const threshold2Sigma = 2.0 * residualStd;

  const points: DecompositionPoint[] = daily.map((pt, i) => {
    const diff = residual[i] - meanRes;
    const isAnomaly = Math.abs(diff) > threshold2Sigma;
    return {
      date: pt.date,
      observed: observed[i],
      trend: smoothTrend[i],
      seasonal: seasonal[i],
      residual: residual[i],
      isAnomaly,
      anomalyDirection: !isAnomaly ? 'normal' : diff > 0 ? 'spike' : 'drop',
    };
  });

  const anomalies = points
    .filter((p) => p.isAnomaly)
    .sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual));

  return { points, anomalies, residualStd, threshold2Sigma };
}

function medianOf(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function computeBCGMatrix(rows: EnrichedSaleRow[]): BCGResult {
  const map = new Map<
    string,
    { category: string; orders: number; qty: number; sales: number; profit: number; cost: number }
  >();

  for (const r of rows) {
    const cur = map.get(r.productName) ?? {
      category: r.category,
      orders: 0,
      qty: 0,
      sales: 0,
      profit: 0,
      cost: 0,
    };
    cur.orders += 1;
    cur.qty += r.quantity;
    cur.sales += r.sales;
    cur.profit += r.profit;
    cur.cost += r.totalCost;
    map.set(r.productName, cur);
  }

  const rawItems = Array.from(map.entries()).map(([productName, d]) => ({
    productName,
    category: d.category,
    orders: d.orders,
    quantity: d.qty,
    sales: d.sales,
    profit: d.profit,
    weightedMarginPct: d.sales > 0 ? (d.profit / d.sales) * 100 : 0,
    avgUnitPrice: d.qty > 0 ? d.sales / d.qty : 0,
    avgUnitCost: d.qty > 0 ? d.cost / d.qty : 0,
  }));

  const sortedSales = rawItems.map((p) => p.sales).sort((a, b) => a - b);
  const sortedMargins = rawItems.map((p) => p.weightedMarginPct).sort((a, b) => a - b);
  const salesThreshold = medianOf(sortedSales);
  const marginThreshold = medianOf(sortedMargins);

  const products: BCGProductItem[] = rawItems
    .map((p) => {
      const highSales = p.sales >= salesThreshold;
      const highMargin = p.weightedMarginPct >= marginThreshold;
      const quadrant: BCGQuadrant =
        highSales && highMargin
          ? 'Stars'
          : highSales && !highMargin
            ? 'Cash Cows'
            : !highSales && highMargin
              ? 'Question Marks'
              : 'Dogs';
      return { ...p, quadrant };
    })
    .sort((a, b) => b.sales - a.sales);

  return { products, salesThreshold, marginThreshold };
}

export function computeMarginErosion(rows: EnrichedSaleRow[]): MarginErosionResult {
  const qtyMap = new Map<
    number,
    { orders: number; sales: number; profit: number; margins: number[]; unitPrices: number[] }
  >();
  const tierMap = new Map<
    OrderTier,
    { orders: number; sales: number; profit: number; margins: number[] }
  >();

  for (const r of rows) {
    const q = qtyMap.get(r.quantity) ?? {
      orders: 0,
      sales: 0,
      profit: 0,
      margins: [],
      unitPrices: [],
    };
    q.orders += 1;
    q.sales += r.sales;
    q.profit += r.profit;
    q.margins.push(r.profitMarginPct);
    q.unitPrices.push(r.unitPrice);
    qtyMap.set(r.quantity, q);

    const t = tierMap.get(r.orderTier) ?? { orders: 0, sales: 0, profit: 0, margins: [] };
    t.orders += 1;
    t.sales += r.sales;
    t.profit += r.profit;
    t.margins.push(r.profitMarginPct);
    tierMap.set(r.orderTier, t);
  }

  const byQuantity: QuantityErosionPoint[] = Array.from(qtyMap.keys())
    .sort((a, b) => a - b)
    .map((quantity) => {
      const d = qtyMap.get(quantity)!;
      return {
        quantity,
        orders: d.orders,
        sales: d.sales,
        profit: d.profit,
        weightedMarginPct: d.sales > 0 ? (d.profit / d.sales) * 100 : 0,
        meanMarginPct: d.margins.reduce((a, b) => a + b, 0) / d.margins.length,
        avgUnitPrice: d.unitPrices.reduce((a, b) => a + b, 0) / d.unitPrices.length,
      };
    });

  const orderedTiers: OrderTier[] = [
    'Individual (1-2 items)',
    'Medium (3-5 items)',
    'Wholesale / Corporate (6-9 items)',
  ];
  const byTier: OrderTierSummary[] = orderedTiers
    .filter((t) => tierMap.has(t))
    .map((tier) => {
      const d = tierMap.get(tier)!;
      return {
        tier,
        orders: d.orders,
        sales: d.sales,
        profit: d.profit,
        weightedMarginPct: d.sales > 0 ? (d.profit / d.sales) * 100 : 0,
        meanMarginPct: d.margins.reduce((a, b) => a + b, 0) / d.margins.length,
        shareOfOrdersPct: rows.length > 0 ? (d.orders / rows.length) * 100 : 0,
      };
    });

  // Linear regression of Profit Margin % against Quantity
  const n = rows.length;
  if (n < 3) {
    return {
      byQuantity,
      byTier,
      pearsonR: 0,
      slopePerUnit: 0,
      intercept: 0,
      pValue: 1,
      erosionDetected: false,
    };
  }

  let sumX = 0;
  let sumY = 0;
  for (const r of rows) {
    sumX += r.quantity;
    sumY += r.profitMarginPct;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const r of rows) {
    const dx = r.quantity - meanX;
    const dy = r.profitMarginPct - meanY;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }

  const slopePerUnit = sxx > 0 ? sxy / sxx : 0;
  const intercept = meanY - slopePerUnit * meanX;
  const pearsonR = sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;

  // Approximate two-tailed p-value from t = r * sqrt((n-2)/(1-r^2)) using normal CDF for large n
  const denom = Math.max(1e-12, 1 - pearsonR * pearsonR);
  const tStat = Math.abs(pearsonR) * Math.sqrt((n - 2) / denom);
  // Complementary error function approximation for normal tail
  const z = tStat / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const erfc =
    t *
    (0.254829592 +
      t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) *
    Math.exp(-z * z);
  const pValue = Math.min(1, Math.max(0, erfc));

  return {
    byQuantity,
    byTier,
    pearsonR,
    slopePerUnit,
    intercept,
    pValue,
    erosionDetected: slopePerUnit < 0 && pValue < 0.05,
  };
}

export function computeMarginDistributions(
  rows: EnrichedSaleRow[],
  groupBy: 'productName' | 'region'
): MarginDistributionBox[] {
  const map = new Map<string, { subLabel?: string; margins: number[]; sales: number; profit: number }>();

  for (const r of rows) {
    const key = groupBy === 'productName' ? r.productName : r.region;
    const cur = map.get(key) ?? {
      subLabel: groupBy === 'productName' ? r.category : REGION_LABELS_AR[r.region],
      margins: [],
      sales: 0,
      profit: 0,
    };
    cur.margins.push(r.profitMarginPct);
    cur.sales += r.sales;
    cur.profit += r.profit;
    map.set(key, cur);
  }

  const boxes: MarginDistributionBox[] = [];
  for (const [label, d] of map.entries()) {
    const sorted = [...d.margins].sort((a, b) => a - b);
    const n = sorted.length;
    const quantile = (q: number) => {
      const pos = (n - 1) * q;
      const base = Math.floor(pos);
      const rest = pos - base;
      return sorted[base + 1] !== undefined
        ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
        : sorted[base];
    };
    boxes.push({
      label,
      subLabel: d.subLabel,
      count: n,
      min: sorted[0],
      q1: quantile(0.25),
      median: quantile(0.5),
      q3: quantile(0.75),
      max: sorted[n - 1],
      mean: d.margins.reduce((a, b) => a + b, 0) / n,
      weightedMargin: d.sales > 0 ? (d.profit / d.sales) * 100 : 0,
    });
  }

  return boxes.sort((a, b) => b.weightedMargin - a.weightedMargin);
}

export function computeRegionSummaries(rows: EnrichedSaleRow[]): RegionSummary[] {
  const totalSales = rows.reduce((acc, r) => acc + r.sales, 0);
  const map = new Map<string, { orders: number; qty: number; sales: number; profit: number }>();

  for (const r of rows) {
    const cur = map.get(r.region) ?? { orders: 0, qty: 0, sales: 0, profit: 0 };
    cur.orders += 1;
    cur.qty += r.quantity;
    cur.sales += r.sales;
    cur.profit += r.profit;
    map.set(r.region, cur);
  }

  return Array.from(map.entries())
    .map(([region, d]) => ({
      region,
      regionAr: REGION_LABELS_AR[region] ?? region,
      orders: d.orders,
      quantity: d.qty,
      sales: d.sales,
      profit: d.profit,
      weightedMarginPct: d.sales > 0 ? (d.profit / d.sales) * 100 : 0,
      sharePct: totalSales > 0 ? (d.sales / totalSales) * 100 : 0,
    }))
    .sort((a, b) => b.sales - a.sales);
}

export function computeBehavioralInsights(rows: EnrichedSaleRow[]) {
  const weekendRows = rows.filter((r) => r.isWeekend);
  const weekdayRows = rows.filter((r) => !r.isWeekend);

  const summarize = (arr: EnrichedSaleRow[]) => {
    const sales = arr.reduce((a, r) => a + r.sales, 0);
    const profit = arr.reduce((a, r) => a + r.profit, 0);
    return {
      orders: arr.length,
      sales,
      profit,
      avgOrderSales: arr.length > 0 ? sales / arr.length : 0,
      weightedMarginPct: sales > 0 ? (profit / sales) * 100 : 0,
    };
  };

  const cycles: SalaryCycle[] = [
    'Beginning of Month (1-10)',
    'Mid Month (11-20)',
    'End of Month (21-31)',
  ];
  const salaryCycles = cycles.map((cycle) => {
    const sub = rows.filter((r) => r.salaryCycle === cycle);
    return { cycle, ...summarize(sub) };
  });

  return {
    weekend: summarize(weekendRows),
    weekday: summarize(weekdayRows),
    salaryCycles,
  };
}

export function formatCurrency(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
