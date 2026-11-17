"""
Sales & Profitability Analytics Dashboard - Streamlit (3 Pages)
===============================================================
Run:
    streamlit run python_analytics/streamlit_app.py
"""

import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from analysis_engine import (
    load_and_enrich_data,
    analyze_unit_price_anomaly,
    compute_yoy_mom_growth,
    compute_moving_averages,
    compute_time_series_decomposition,
    compute_bcg_matrix,
    compute_margin_erosion,
    simulate_what_if_margin,
)

st.set_page_config(
    page_title="Sales Intelligence Lab | Python Analytics",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Support LTR direction
st.markdown(
    """
    <style>
        .stApp { direction: ltr; text-align: left; }
        div[data-testid="stMetricValue"] { font-family: 'IBM Plex Mono', monospace; }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_data
def get_data():
    return load_and_enrich_data()


df_raw = get_data()

# Sidebar for navigation and filters
with st.sidebar:
    st.title("Sales Intelligence Lab")
    page = st.radio(
        "Select Page",
        [
            "1. Executive Summary",
            "2. Profitability Lab",
            "3. What-If Simulator",
        ],
    )
    st.divider()
    years_sel = st.multiselect("Years", sorted(df_raw["Year"].unique()), default=sorted(df_raw["Year"].unique()))
    regions_sel = st.multiselect("Regions", sorted(df_raw["Region"].unique()), default=sorted(df_raw["Region"].unique()))
    cats_sel = st.multiselect("Categories", sorted(df_raw["Category"].unique()), default=sorted(df_raw["Category"].unique()))

df = df_raw[
    df_raw["Year"].isin(years_sel)
    & df_raw["Region"].isin(regions_sel)
    & df_raw["Category"].isin(cats_sel)
].copy()

if df.empty:
    st.warning("No data matches the selected filters.")
    st.stop()

# ==============================================================================
# Page 1: Executive Summary
# ==============================================================================
if page.startswith("1."):
    st.header("Executive Summary — Performance & Time Series")

    growth = compute_yoy_mom_growth(df)
    yearly = growth["yearly"]
    latest = yearly.iloc[-1]

    col1, col2, col3, col4 = st.columns(4)
    col1.metric(
        "Total Sales",
        f"${df['Sales'].sum():,.0f}",
        f"{latest['Sales YoY %']:+.2f}% YoY" if len(yearly) > 1 else None,
    )
    col2.metric(
        "Net Profit",
        f"${df['Profit'].sum():,.0f}",
        f"{latest['Profit YoY %']:+.2f}% YoY" if len(yearly) > 1 else None,
    )
    col3.metric(
        "Weighted Profit Margin",
        f"{(df['Profit'].sum() / df['Sales'].sum()) * 100:.2f}%",
    )
    col4.metric(
        "Orders / Units",
        f"{len(df):,} / {df['Quantity'].sum():,}",
    )

    st.subheader("Regional Performance")
    reg_df = (
        df.groupby("Region")
        .agg(Sales=("Sales", "sum"), Profit=("Profit", "sum"), Orders=("Order Date", "count"))
        .reset_index()
    )
    reg_df["Margin %"] = (reg_df["Profit"] / reg_df["Sales"]) * 100
    fig_reg = px.bar(
        reg_df.sort_values("Sales", ascending=False),
        x="Region",
        y=["Sales", "Profit"],
        barmode="group",
        text_auto=".2s",
        title="Sales and Net Profit by Region",
    )
    st.plotly_chart(fig_reg, use_container_width=True)

    st.subheader("Moving Averages (7-Day & 30-Day Moving Averages)")
    daily = compute_moving_averages(df)
    fig_ma = go.Figure()
    fig_ma.add_trace(go.Scatter(x=daily["Order Date"], y=daily["Sales"], name="Daily Sales", opacity=0.25))
    fig_ma.add_trace(go.Scatter(x=daily["Order Date"], y=daily["Sales_MA7"], name="7-Day MA", line=dict(width=2)))
    fig_ma.add_trace(go.Scatter(x=daily["Order Date"], y=daily["Sales_MA30"], name="30-Day MA", line=dict(width=3)))
    fig_ma.update_layout(title="Daily Sales Smoothing and Trend Discovery")
    st.plotly_chart(fig_ma, use_container_width=True)

    st.subheader("Time-Series Decomposition & Anomalies")
    decomp_res = compute_time_series_decomposition(daily)
    dec = decomp_res["decomposition"]
    fig_dec = make_subplots(rows=3, cols=1, shared_xaxes=True, subplot_titles=("Trend", "Seasonality", "Residuals"))
    fig_dec.add_trace(go.Scatter(x=dec["Order Date"], y=dec["Trend"], name="Trend"), row=1, col=1)
    fig_dec.add_trace(go.Scatter(x=dec["Order Date"], y=dec["Seasonal"], name="Seasonal"), row=2, col=1)
    fig_dec.add_trace(go.Scatter(x=dec["Order Date"], y=dec["Residual"], name="Residual"), row=3, col=1)
    anoms = decomp_res["anomalies"]
    fig_dec.add_trace(
        go.Scatter(x=anoms["Order Date"], y=anoms["Residual"], mode="markers", name="Non-Seasonal Spike (>2σ)", marker=dict(color="red", size=7)),
        row=3,
        col=1,
    )
    fig_dec.update_layout(height=620)
    st.plotly_chart(fig_dec, use_container_width=True)

# ==============================================================================
# Page 2: Profitability Lab
# ==============================================================================
elif page.startswith("2."):
    st.header("Profitability Lab — BCG Matrix, Margin Erosion & Unit Price Anomaly")

    anomaly_info = analyze_unit_price_anomaly(df)
    st.info(
        f"Unit Price Surprise: All unit prices ({len(df):,} rows) are exact integers ranging between "
        f"${anomaly_info['global_min_unit_price']:,.0f} and ${anomaly_info['global_max_unit_price']:,.0f} across all 10 products!"
    )

    bcg = compute_bcg_matrix(df)
    bcg_df = bcg["products"]
    fig_bcg = px.scatter(
        bcg_df,
        x="Sales",
        y="Profit Margin %",
        size="Quantity",
        color="BCG Quadrant",
        text="Product Name",
        hover_data=["Category", "Profit", "Orders"],
        title="Interactive BCG Product Matrix",
    )
    fig_bcg.add_vline(x=bcg["sales_threshold"], line_dash="dash", line_color="gray")
    fig_bcg.add_hline(y=bcg["margin_threshold"], line_dash="dash", line_color="gray")
    fig_bcg.update_traces(textposition="top center")
    st.plotly_chart(fig_bcg, use_container_width=True)

    c1, c2 = st.columns(2)
    with c1:
        fig_box_prod = px.box(
            df, x="Product Name", y="Profit Margin %", color="Category",
            title="Profit Margin Distribution by Product"
        )
        st.plotly_chart(fig_box_prod, use_container_width=True)
    with c2:
        fig_box_reg = px.box(
            df, x="Region", y="Profit Margin %", color="Region",
            title="Profit Margin Distribution by Region"
        )
        st.plotly_chart(fig_box_reg, use_container_width=True)

    st.subheader("Margin Erosion Check")
    erosion = compute_margin_erosion(df)
    fig_ero = px.line(
        erosion["by_quantity"],
        x="Quantity",
        y=["Weighted_Margin %", "Mean_Margin"],
        markers=True,
        title=f"Margin by Quantity (Slope = {erosion['slope_per_unit']:+.4f}% per unit | p = {erosion['p_value']:.4f})",
    )
    st.plotly_chart(fig_ero, use_container_width=True)

# ==============================================================================
# Page 3: What-If Simulator
# ==============================================================================
else:
    st.header("What-If Simulator — Profit Margin Uplift Testing")
    cats_sorted = (
        df.groupby("Category")
        .apply(lambda g: (g["Profit"].sum() / g["Sales"].sum()) * 100)
        .sort_values()
        .index.tolist()
    )
    col_a, col_b = st.columns(2)
    with col_a:
        target_cat = st.selectbox("Target Category (Default: Lowest Margin)", cats_sorted, index=0)
    with col_b:
        uplift = st.slider("Profit Margin Uplift (%)", min_value=-5.0, max_value=10.0, value=2.0, step=0.25)

    sim = simulate_what_if_margin(df, target_category=target_cat, uplift_pct_points=uplift)

    m1, m2, m3 = st.columns(3)
    m1.metric("Expected Annual Net Profit Increase", f"+${sim['incremental_annual_profit']:,.2f}")
    m2.metric("Annual Net Profit After Optimization", f"${sim['simulated_annual_profit']:,.2f}", f"from ${sim['baseline_annual_profit']:,.2f}")
    m3.metric("Overall Company Profit Margin", f"{sim['overall_margin_after_pct']:.2f}%", f"{sim['overall_margin_after_pct'] - sim['overall_margin_before_pct']:+.2f} pp")

    st.dataframe(sim["category_breakdown"], use_container_width=True)