# Executive E-Commerce Sales & Profitability Analytics

An interactive full-stack analytics web application and Python data science suite built to analyze e-commerce sales performance, profit margins, time-series trends, and financial scenarios.

The platform combines a modern **React + TypeScript + Vite** interactive dashboard with a dedicated **Python (Pandas, Statsmodels, Streamlit, Plotly Dash)** analytics backend for deep statistical modeling and multi-environment execution.

---

## Key Features

### 1. Executive Summary (`ExecutiveSummaryPage`)
* **KPI Scorecards:** Tracks Total Sales, Net Profit, Weighted Net Profit Margin, and Order/Unit Volumes with Year-over-Year (YoY) deltas and Compound Annual Growth Rate (CAGR).
* **Interactive Regional Performance Map:** Spatial compass view (`North`, `West`, `East`, `South`) allowing instant dashboard filtering by region.
* **YoY & MoM Growth Analysis:** Interactive bar and divergence charts comparing 2022–2024 monthly performance and sequential Month-over-Month (MoM) growth rates.
* **Moving Averages (MA7 & MA30):** Smoothed daily sales trends comparing 7-day and 30-day rolling averages against raw daily revenue.
* **Time-Series Decomposition & Anomaly Detection:** Separates observed sales into **Trend**, **Weekly Seasonality**, and **Residuals**, highlighting statistical anomalies beyond $\pm 2\sigma$.
* **Behavioral Dimensions:** Compares Weekday vs. Weekend ordering behavior and Salary Cycle spending patterns.

### 2. Profitability Lab (`ProfitabilityLabPage`)
* **Interactive BCG Product Matrix:** Classifies the 10 core SKUs into *Stars*, *Cash Cows*, *Question Marks*, and *Dogs* based on median sales and weighted margin thresholds, complete with actionable strategic recommendations.
* **Margin Distribution Box Plots:** Visualizes `Min`, `Q1`, `Median`, `Q3`, and `Max` profit margins across all products and geographic regions.
* **Quantity Margin Erosion Analysis:** Evaluates whether bulk order quantities (`1–9 units`) erode profit margins using Pearson correlation ($r$), linear regression slope, and $p$-value significance testing.
* **Unit Price Audit & Derived Columns Explorer:** Audits derived unit prices (`Sales / Quantity`) and provides a searchable transaction table with calculated unit costs, profit margins, order tiers, and salary cycles.

### 3. What-If Profit Simulator (`WhatIfSimulatorPage`)
* **Margin Uplift Modeling:** Simulates the financial impact of adjusting profit margins (`-5%` to `+10%`) for specific product categories or individual SKUs.
* **Baseline Period Selection:** Models annual and cumulative multi-year profit impact using either the 2022–2024 annual average or specific individual years.
* **Sensitivity Ladder & Segment Ranking:** Displays incremental profit steps (`+1%` to `+5%`) and ranks all segments from lowest to highest margin
