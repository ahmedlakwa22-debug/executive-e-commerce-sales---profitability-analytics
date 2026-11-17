"""
Sales & Profitability Analytics Dashboard - Plotly Dash (3 Pages)
=================================================================
Run:
    python python_analytics/dash_app.py
"""

from dash import Dash, dcc, html, Input, Output
import dash_bootstrap_components as dbc
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from analysis_engine import (
    load_and_enrich_data,
    compute_yoy_mom_growth,
    compute_moving_averages,
    compute_time_series_decomposition,
    compute_bcg_matrix,
    compute_margin_erosion,
    simulate_what_if_margin,
)

df = load_and_enrich_data()

app = Dash(__name__, external_stylesheets=[dbc.themes.FLATLY])
app.title = "Sales Intelligence Lab | Plotly Dash"

app.layout = dbc.Container(
    [
        html.Div(
            [
                html.H2("Sales & Profitability Intelligence Lab (Python Dash)", className="fw-bold mb-1"),
                html.P("Interactive 3-page dashboard built with Pandas and Statsmodels", className="text-muted"),
            ],
            className="my-3",
            style={"direction": "ltr"},
        ),
        dcc.Tabs(
            id="main-tabs",
            value="page-1",
            children=[
                dcc.Tab(label="1. Executive Summary", value="page-1"),
                dcc.Tab(label="2. Profitability Lab", value="page-2"),
                dcc.Tab(label="3. What-If Simulator", value="page-3"),
            ],
        ),
        html.Div(id="tab-content", className="mt-4", style={"direction": "ltr"}),
    ],
    fluid=True,
)


@app.callback(Output("tab-content", "children"), Input("main-tabs", "value"))
def render_page(tab_value: str):
    if tab_value == "page-1":
        growth = compute_yoy_mom_growth(df)
        daily = compute_moving_averages(df)
        decomp = compute_time_series_decomposition(daily)
        dec = decomp["decomposition"]

        reg_df = df.groupby("Region", as_index=False).agg(Sales=("Sales", "sum"), Profit=("Profit", "sum"))
        fig_reg = px.bar(reg_df, x="Region", y=["Sales", "Profit"], barmode="group", title="Regional Performance")

        fig_ma = go.Figure()
        fig_ma.add_trace(go.Scatter(x=daily["Order Date"], y=daily["Sales"], name="Daily", opacity=0.25))
        fig_ma.add_trace(go.Scatter(x=daily["Order Date"], y=daily["Sales_MA7"], name="7-Day MA"))
        fig_ma.add_trace(go.Scatter(x=daily["Order Date"], y=daily["Sales_MA30"], name="30-Day MA"))
        fig_ma.update_layout(title="Daily Sales Moving Averages")

        fig_dec = make_subplots(rows=3, cols=1, shared_xaxes=True, subplot_titles=("Trend", "Seasonal", "Residual"))
        fig_dec.add_trace(go.Scatter(x=dec["Order Date"], y=dec["Trend"], name="Trend"), row=1, col=1)
        fig_dec.add_trace(go.Scatter(x=dec["Order Date"], y=dec["Seasonal"], name="Seasonal"), row=2, col=1)
        fig_dec.add_trace(go.Scatter(x=dec["Order Date"], y=dec["Residual"], name="Residual"), row=3, col=1)
        fig_dec.update_layout(height=550, title="Time-Series Decomposition")

        return html.Div(
            [
                dbc.Row(
                    [
                        dbc.Col(dbc.Card(dbc.CardBody([html.H6("Total Sales"), html.H4(f"${df['Sales'].sum():,.0f}")])), width=3),
                        dbc.Col(dbc.Card(dbc.CardBody([html.H6("Net Profit"), html.H4(f"${df['Profit'].sum():,.0f}")])), width=3),
                        dbc.Col(dbc.Card(dbc.CardBody([html.H6("Profit Margin"), html.H4(f"{(df['Profit'].sum()/df['Sales'].sum())*100:.2f}%")])), width=3),
                        dbc.Col(dbc.Card(dbc.CardBody([html.H6("2024 YoY Growth"), html.H4(f"{growth['yearly'].iloc[-1]['Sales YoY %']:+.2f}%")])), width=3),
                    ],
                    className="mb-4",
                ),
                dcc.Graph(figure=fig_reg),
                dcc.Graph(figure=fig_ma),
                dcc.Graph(figure=fig_dec),
            ]
        )

    if tab_value == "page-2":
        bcg = compute_bcg_matrix(df)
        erosion = compute_margin_erosion(df)
        fig_bcg = px.scatter(
            bcg["products"], x="Sales", y="Profit Margin %", size="Quantity",
            color="BCG Quadrant", text="Product Name", title="BCG Matrix for 10 Products",
        )
        fig_bcg.add_vline(x=bcg["sales_threshold"], line_dash="dash")
        fig_bcg.add_hline(y=bcg["margin_threshold"], line_dash="dash")

        fig_box = px.box(df, x="Product Name", y="Profit Margin %", color="Region", title="Profit Margin Distribution by Product and Region")
        fig_ero = px.line(erosion["by_quantity"], x="Quantity", y="Weighted_Margin %", markers=True, title="Margin Erosion Analysis by Quantity")

        return html.Div([dcc.Graph(figure=fig_bcg), dcc.Graph(figure=fig_box), dcc.Graph(figure=fig_ero)])

    # Page 3: What-If Simulator
    return html.Div(
        [
            html.Label("Select Target Category:"),
            dcc.Dropdown(
                id="sim-category",
                options=[{"label": c, "value": c} for c in sorted(df["Category"].unique())],
                value="Office",
                clearable=False,
                className="mb-3",
            ),
            html.Label("Profit Margin Uplift %:"),
            dcc.Slider(id="sim-uplift", min=-5, max=10, step=0.5, value=2.0, marks={i: f"{i}%" for i in range(-5, 11, 1)}),
            html.Div(id="sim-output", className="mt-4"),
        ]
    )


@app.callback(
    Output("sim-output", "children"),
    [Input("sim-category", "value"), Input("sim-uplift", "value")],
)
def update_simulation(category: str, uplift: float):
    sim = simulate_what_if_margin(df, target_category=category, uplift_pct_points=uplift)
    return dbc.Alert(
        [
            html.H4(f"Annual Net Profit Increase: +${sim['incremental_annual_profit']:,.2f}"),
            html.P(
                f"Raising the margin for the {sim['target_category']} category from {sim['baseline_category_margin_pct']:.2f}% to "
                f"{sim['simulated_category_margin_pct']:.2f}% increases total annual profit to ${sim['simulated_annual_profit']:,.2f}."
            ),
        ],
        color="success" if uplift >= 0 else "danger",
    )


if __name__ == "__main__":
    app.run(debug=True, port=8050)