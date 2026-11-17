"""
E-Commerce Sales & Profitability Analytics Engine (Pandas + NumPy + Statsmodels)
==============================================================================
Implements the complete data engineering & analytical pipeline for:
    public/assets/aistudio/ecommerce_sales_data__2__6f7ed651.csv

Modules:
1. Feature Engineering (Unit Price, Profit Margin %, Total/Unit Cost, Temporal & Order Tiers)
2. Compound / YoY & MoM Growth Analysis (2022–2024)
3. 7-Day & 30-Day Moving Averages
4. Time-Series Decomposition (Trend, Seasonality, Residuals + Anomaly Detection)
5. BCG Product Matrix (Stars, Cash Cows, Question Marks, Dogs)
6. Margin Erosion Analysis (Quantity & Order Tier Discount Check)
7. What-If Profit Margin Uplift Simulator
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd
from scipy import stats
from statsmodels.tsa.seasonal import seasonal_decompose


DEFAULT_CSV_PATH = (
    Path(__file__).resolve().parent.parent
    / "public"
    / "assets"
    / "aistudio"
    / "ecommerce_sales_data__2__6f7ed651.csv"
)


def classify_order_tier(qty: int) -> str:
    if qty <= 2:
        return "Individual (1-2 items)"
    if qty <= 5:
        return "Medium (3–5 items)"
    return "Wholesale / Corporate (6–9 items)"


def classify_salary_cycle(day: int) -> str:
    if day <= 10:
        return "Beginning of Month (1-10)"
    if day <= 20:
        return "Mid Month (11-20)"
    return "End of Month (21-31)"


def load_and_enrich_data(csv_path: Path | str = DEFAULT_CSV_PATH) -> pd.DataFrame:
    """Load raw CSV and derive financial, temporal, behavioral, and tier columns."""
    df = pd.read_csv(csv_path)
    df["Order Date"] = pd.to_datetime(df["Order Date"])
    df = df.sort_values("Order Date").reset_index(drop=True)

    # 1. Financial Derived Columns
    df["Unit Price"] = df["Sales"] / df["Quantity"]
    df["Profit Margin %"] = (df["Profit"] / df["Sales"]) * 100.0
    df["Total Cost"] = df["Sales"] - df["Profit"]
    df["Unit Cost"] = df["Total Cost"] / df["Quantity"]

    # 2. Behavioral Temporal Dimensions
    df["Year"] = df["Order Date"].dt.year
    df["Quarter"] = "Q" + df["Order Date"].dt.quarter.astype(str)
    df["Month"] = df["Order Date"].dt.month
    df["Month Name"] = df["Order Date"].dt.strftime("%b")
    df["YearMonth"] = df["Order Date"].dt.to_period("M").astype(str)
    df["Day Name"] = df["Order Date"].dt.day_name()
    df["Day of Month"] = df["Order Date"].dt.day
    # Standard weekend classification (Saturday=5, Sunday=6)
    df["Is Weekend"] = df["Order Date"].dt.dayofweek >= 5
    df["Day Type"] = np.where(df["Is Weekend"], "Weekend", "Weekday")
    df["Salary Cycle"] = df["Day of Month"].apply(classify_salary_cycle)

    # 3. Order Size Tier
    df["Order Tier"] = df["Quantity"].apply(classify_order_tier)

    return df


def analyze_unit_price_anomaly(df: pd.DataFrame) -> Dict[str, Any]:
    """Uncovers the Unit Price uniformity anomaly across all 10 SKUs."""
    is_exact_int = np.all(np.isclose(df["Unit Price"], np.round(df["Unit Price"])))
    by_product = (
        df.groupby("Product Name")["Unit Price"]
        .agg(["count", "min", "mean", "median", "max", "std"])
        .round(2)
        .reset_index()
    )
    return {
        "all_unit_prices_are_integers": bool(is_exact_int),
        "global_min_unit_price": float(df["Unit Price"].min()),
        "global_max_unit_price": float(df["Unit Price"].max()),
        "global_mean_unit_price": float(df["Unit Price"].mean()),
        "by_product": by_product,
    }


def compute_yoy_mom_growth(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
    """Compute annual KPIs, CAGR, and monthly YoY & MoM growth rates."""
    yearly = (
        df.groupby("Year")
        .agg(
            Orders=("Order Date", "count"),
            Quantity=("Quantity", "sum"),
            Sales=("Sales", "sum"),
            Profit=("Profit", "sum"),
            Total_Cost=("Total Cost", "sum"),
        )
        .reset_index()
    )
    yearly["Profit Margin %"] = (yearly["Profit"] / yearly["Sales"]) * 100.0
    yearly["Sales YoY %"] = yearly["Sales"].pct_change() * 100.0
    yearly["Profit YoY %"] = yearly["Profit"].pct_change() * 100.0
    yearly["Orders YoY %"] = yearly["Orders"].pct_change() * 100.0

    # Monthly series with MoM and YoY (2023 vs 2022, 2024 vs 2023)
    monthly = (
        df.groupby(["Year", "Month", "YearMonth"])
        .agg(Sales=("Sales", "sum"), Profit=("Profit", "sum"), Orders=("Order Date", "count"))
        .reset_index()
        .sort_values(["Year", "Month"])
    )
    monthly["MoM Sales %"] = monthly["Sales"].pct_change() * 100.0
    monthly["MoM Profit %"] = monthly["Profit"].pct_change() * 100.0

    pivot_sales = monthly.pivot(index="Month", columns="Year", values="Sales")
    pivot_profit = monthly.pivot(index="Month", columns="Year", values="Profit")

    yoy_monthly = pd.DataFrame(index=pivot_sales.index)
    for yr in [2022, 2023, 2024]:
        if yr in pivot_sales.columns:
            yoy_monthly[f"Sales_{yr}"] = pivot_sales[yr]
            yoy_monthly[f"Profit_{yr}"] = pivot_profit[yr]
    if 2022 in pivot_sales.columns and 2023 in pivot_sales.columns:
        yoy_monthly["YoY_2023_vs_2022_%"] = ((pivot_sales[2023] - pivot_sales[2022]) / pivot_sales[2022]) * 100.0
    if 2023 in pivot_sales.columns and 2024 in pivot_sales.columns:
        yoy_monthly["YoY_2024_vs_2023_%"] = ((pivot_sales[2024] - pivot_sales[2023]) / pivot_sales[2023]) * 100.0

    return {
        "yearly": yearly,
        "monthly": monthly,
        "yoy_monthly": yoy_monthly.reset_index(),
    }


def compute_moving_averages(df: pd.DataFrame) -> pd.DataFrame:
    """Resample to daily frequency and compute 7-Day and 30-Day Moving Averages."""
    full_idx = pd.date_range(df["Order Date"].min(), df["Order Date"].max(), freq="D")
    daily = (
        df.groupby("Order Date")
        .agg(Sales=("Sales", "sum"), Profit=("Profit", "sum"), Orders=("Order Date", "count"))
        .reindex(full_idx, fill_value=0.0)
        .rename_axis("Order Date")
        .reset_index()
    )
    daily["Sales_MA7"] = daily["Sales"].rolling(window=7, min_periods=1).mean()
    daily["Sales_MA30"] = daily["Sales"].rolling(window=30, min_periods=1).mean()
    daily["Profit_MA7"] = daily["Profit"].rolling(window=7, min_periods=1).mean()
    daily["Profit_MA30"] = daily["Profit"].rolling(window=30, min_periods=1).mean()
    return daily


def compute_time_series_decomposition(
    daily_df: pd.DataFrame, period: int = 7, model: str = "additive"
) -> Dict[str, Any]:
    """
    Decompose daily Sales into Trend, Seasonal, and Residual components using statsmodels.
    Flags non-seasonal anomaly days where |Residual| > 2 * std(Residual).
    """
    series = daily_df.set_index("Order Date")["Sales"]
    decomp = seasonal_decompose(series, model=model, period=period, extrapolate_trend="freq")

    result_df = pd.DataFrame(
        {
            "Order Date": series.index,
            "Observed": decomp.observed.values,
            "Trend": decomp.trend.values,
            "Seasonal": decomp.seasonal.values,
            "Residual": decomp.resid.values,
        }
    )
    resid_std = float(result_df["Residual"].std(ddof=1))
    resid_mean = float(result_df["Residual"].mean())
    threshold = 2.0 * resid_std

    result_df["Is_Anomaly"] = np.abs(result_df["Residual"] - resid_mean) > threshold
    result_df["Anomaly_Type"] = np.where(
        result_df["Residual"] - resid_mean > threshold,
        "Positive Non-Seasonal Spike",
        np.where(result_df["Residual"] - resid_mean < -threshold, "Sudden Drop", "Normal"),
    )

    anomalies = result_df[result_df["Is_Anomaly"]].sort_values("Residual", ascending=False)
    return {
        "decomposition": result_df,
        "anomalies": anomalies,
        "residual_std": resid_std,
        "threshold_2sigma": threshold,
    }


def compute_bcg_matrix(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Classify the 10 products into the 4 BCG quadrants based on:
      - X-axis: Total Sales Volume (USD)
      - Y-axis: Weighted Profit Margin % = (Total Profit / Total Sales) * 100
    """
    prod = (
        df.groupby(["Product Name", "Category"])
        .agg(
            Orders=("Order Date", "count"),
            Quantity=("Quantity", "sum"),
            Sales=("Sales", "sum"),
            Profit=("Profit", "sum"),
            Avg_Unit_Price=("Unit Price", "mean"),
        )
        .reset_index()
    )
    prod["Profit Margin %"] = (prod["Profit"] / prod["Sales"]) * 100.0

    sales_threshold = float(prod["Sales"].median())
    margin_threshold = float(prod["Profit Margin %"].median())

    def _quadrant(row: pd.Series) -> str:
        high_sales = row["Sales"] >= sales_threshold
        high_margin = row["Profit Margin %"] >= margin_threshold
        if high_sales and high_margin:
            return "Stars"
        if high_sales and not high_margin:
            return "Cash Cows"
        if not high_sales and high_margin:
            return "Question Marks"
        return "Dogs"

    prod["BCG Quadrant"] = prod.apply(_quadrant, axis=1)
    return {
        "products": prod.sort_values("Sales", ascending=False),
        "sales_threshold": sales_threshold,
        "margin_threshold": margin_threshold,
    }


def compute_margin_erosion(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Test whether larger order quantities lead to discounts that erode profit margins,
    or whether margins remain constant across quantities 1..9 and Order Tiers.
    """
    by_qty = (
        df.groupby("Quantity")
        .agg(
            Orders=("Order Date", "count"),
            Sales=("Sales", "sum"),
            Profit=("Profit", "sum"),
            Mean_Margin=("Profit Margin %", "mean"),
            Median_Margin=("Profit Margin %", "median"),
            Std_Margin=("Profit Margin %", "std"),
            Avg_Unit_Price=("Unit Price", "mean"),
        )
        .reset_index()
    )
    by_qty["Weighted_Margin %"] = (by_qty["Profit"] / by_qty["Sales"]) * 100.0

    by_tier = (
        df.groupby("Order Tier")
        .agg(
            Orders=("Order Date", "count"),
            Sales=("Sales", "sum"),
            Profit=("Profit", "sum"),
            Mean_Margin=("Profit Margin %", "mean"),
            Avg_Unit_Price=("Unit Price", "mean"),
        )
        .reset_index()
    )
    by_tier["Weighted_Margin %"] = (by_tier["Profit"] / by_tier["Sales"]) * 100.0

    slope, intercept, r_value, p_value, std_err = stats.linregress(
        df["Quantity"], df["Profit Margin %"]
    )
    return {
        "by_quantity": by_qty,
        "by_tier": by_tier,
        "pearson_r": float(r_value),
        "p_value": float(p_value),
        "slope_per_unit": float(slope),
        "erosion_detected": bool(slope < 0 and p_value < 0.05),
    }


def simulate_what_if_margin(
    df: pd.DataFrame,
    target_category: Optional[str] = None,
    uplift_pct_points: float = 2.0,
    year_filter: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Simulate raising profit margin by `uplift_pct_points` (e.g. +2.0%) on the lowest-margin
    category (or specified category) and calculate annual net profit impact.
    """
    scoped = df if year_filter is None else df[df["Year"] == year_filter]
    cat_summary = (
        scoped.groupby("Category")
        .agg(Sales=("Sales", "sum"), Profit=("Profit", "sum"), Orders=("Order Date", "count"))
        .reset_index()
    )
    cat_summary["Margin %"] = (cat_summary["Profit"] / cat_summary["Sales"]) * 100.0
    cat_summary = cat_summary.sort_values("Margin %")

    chosen_cat = target_category or str(cat_summary.iloc[0]["Category"])
    row = cat_summary[cat_summary["Category"] == chosen_cat].iloc[0]

    num_years = scoped["Year"].nunique() or 1
    cat_sales_total = float(row["Sales"])
    cat_profit_total = float(row["Profit"])
    total_sales_all = float(scoped["Sales"].sum())
    total_profit_all = float(scoped["Profit"].sum())

    incremental_profit_total = cat_sales_total * (uplift_pct_points / 100.0)
    incremental_profit_annual = incremental_profit_total / num_years

    return {
        "target_category": chosen_cat,
        "uplift_pct_points": uplift_pct_points,
        "num_years": num_years,
        "baseline_category_margin_pct": float(row["Margin %"]),
        "simulated_category_margin_pct": float(row["Margin %"]) + uplift_pct_points,
        "baseline_annual_profit": total_profit_all / num_years,
        "incremental_annual_profit": incremental_profit_annual,
        "simulated_annual_profit": (total_profit_all / num_years) + incremental_profit_annual,
        "total_period_incremental_profit": incremental_profit_total,
        "overall_margin_before_pct": (total_profit_all / total_sales_all) * 100.0,
        "overall_margin_after_pct": ((total_profit_all + incremental_profit_total) / total_sales_all) * 100.0,
        "category_breakdown": cat_summary,
    }


if __name__ == "__main__":
    df_enriched = load_and_enrich_data()
    anomaly_info = analyze_unit_price_anomaly(df_enriched)
    growth = compute_yoy_mom_growth(df_enriched)
    daily = compute_moving_averages(df_enriched)
    decomp = compute_time_series_decomposition(daily)
    bcg = compute_bcg_matrix(df_enriched)
    erosion = compute_margin_erosion(df_enriched)
    sim = simulate_what_if_margin(df_enriched, uplift_pct_points=2.0)

    print("=== 1. Unit Price Surprise ===")
    print(f"All integer prices: {anomaly_info['all_unit_prices_are_integers']}")
    print(f"Global range: ${anomaly_info['global_min_unit_price']:.0f} - ${anomaly_info['global_max_unit_price']:.0f}")
    print("\n=== 2. Yearly Summary ===")
    print(growth["yearly"].to_string(index=False))
    print("\n=== 4. Top 5 Non-Seasonal Spike Days ===")
    print(decomp["anomalies"].head(5)[["Order Date", "Observed", "Trend", "Residual"]].to_string(index=False))
    print("\n=== 5. BCG Matrix ===")
    print(bcg["products"][["Product Name", "Category", "Sales", "Profit Margin %", "BCG Quadrant"]].to_string(index=False))
    print("\n=== 6. Margin Erosion ===")
    print(f"Slope: {erosion['slope_per_unit']:.4f}% per unit | p-value: {erosion['p_value']:.4f} | Erosion detected: {erosion['erosion_detected']}")
    print("\n=== 7. What-If (+2% on Lowest-Margin Category) ===")
    print(f"Target: {sim['target_category']} | +${sim['incremental_annual_profit']:,.2f} / year")