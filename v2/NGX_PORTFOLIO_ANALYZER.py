
import os
import json
import re
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
import datetime
from matplotlib.patches import FancyBboxPatch
from matplotlib.ticker import FuncFormatter
from dotenv import load_dotenv

from google.oauth2 import service_account
from googleapiclient.discovery import build

# ── Config ───────────────────────────────────────────────────────────────────
load_dotenv()

SPREADSHEET_ID = os.getenv("SPREADSHEET_ID", "1kkZt2s-c1EmDXsoArth5IwwLRwxEEqW9XaoEcnPACpY")
SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

SHEET_NGX     = "NGX_Portfolio"
SHEET_NGX_SEC = "NGX Sector Allocation"

now = datetime.datetime.now()
formatted_date = now.strftime("%m_%d_%Y")
OUTPUT_FILE = f'./v2/outputs/NGX_Portfolio_Dashboard_{formatted_date}.png'


# ── Auth ──────────────────────────────────────────────────────────────────────
def get_credentials():
    json_str  = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON_STR")
    json_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if json_str:
        return service_account.Credentials.from_service_account_info(
            json.loads(json_str), scopes=SCOPES)
    elif json_file:
        return service_account.Credentials.from_service_account_file(
            json_file, scopes=SCOPES)
    raise EnvironmentError(
        "No Google credentials found.\n"
        "Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_JSON_STR in your .env"
    )


# ── Sheets helpers ────────────────────────────────────────────────────────────
def get_sheet_values(service, sheet_name):
    """Fetch all values from a named sheet tab."""
    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=SPREADSHEET_ID, range=f"'{sheet_name}'")
        .execute()
    )
    return result.get("values", [])


def values_to_df(values, header_row=0):
    """Convert raw Sheets API list-of-lists to DataFrame, padding short rows."""
    if not values:
        raise ValueError("No data returned from sheet.")
    headers = values[header_row]
    rows    = values[header_row + 1:]
    padded  = [r + [""] * (len(headers) - len(r)) for r in rows]
    return pd.DataFrame(padded, columns=headers)


def _clean_number(val):
    """Strip currency symbols, commas, whitespace; return float or 0.0.
    
    The Google Sheets API always returns cell values as strings, even for
    numbers. Cells may also contain commas (e.g. "1,431,000") or currency
    prefixes (e.g. "N1,431,000") depending on sheet formatting, which causes
    pd.to_numeric to silently return NaN and later crash matplotlib.
    """
    if val is None or str(val).strip() == "":
        return 0.0
    cleaned = re.sub(r"[^\d.\-]", "", str(val))   # keep digits, dot, minus only
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def coerce_numeric(df, cols):
    """Robustly convert columns to float, handling any string formatting."""
    for c in cols:
        if c in df.columns:
            df[c] = df[c].apply(_clean_number)
    return df


# ── Data loading ──────────────────────────────────────────────────────────────
def load_data(service):
    # ── NGX_Portfolio ──
    raw = get_sheet_values(service, SHEET_NGX)
    header_idx = next(
        i for i, row in enumerate(raw) if row and row[0] == "Stock Name"
    )
    ngx_df = values_to_df(raw, header_row=header_idx)
    ngx_df = ngx_df[ngx_df["Stock Name"].str.strip() != ""].copy()

    num_cols_ngx = [
        "Shares Bought", "Avg Cost", "Current Price",
        "Sold Units", "Sold Price", "Remaining Shares",
        "Remaining Cost", "Current Equity",
        "Realized P/L", "Unrealized P/L", "Total P/L",
        "% Return (Unrealized)", "Sale Comm",
        "Cash Received From Sale", "Original Total Cost",
    ]
    ngx_df = coerce_numeric(ngx_df, num_cols_ngx)

    df_active = ngx_df[ngx_df["Remaining Shares"] > 0].copy()
    # % Return (Unrealized) is stored as a decimal (0.50 = 50%) -> convert
    df_active["Return Pct"] = df_active["% Return (Unrealized)"]

    # ── NGX Sector Allocation ──
    sec_raw = get_sheet_values(service, SHEET_NGX_SEC)
    sec_df  = values_to_df(sec_raw, header_row=0)
    sec_df  = coerce_numeric(sec_df, ["Equity", "% of Portfolio", "Gain (N)", "Gain (%)", "Count"])

    # Also try the unicode column name in case the sheet uses it
    if "Gain (N)" not in sec_df.columns and "Gain (\u20a6)" in sec_df.columns:
        sec_df = coerce_numeric(sec_df, ["Gain (\u20a6)"])
        sec_df.rename(columns={"Gain (\u20a6)": "Gain (N)"}, inplace=True)

    # Drop rows where Equity is zero/NaN — prevents pie chart NaN crash
    sec_df = sec_df[sec_df["Equity"] > 0].copy()
    sec_df["Gain_pct_display"] = sec_df["Gain (%)"]

    return df_active, sec_df


# ── Squarify (no external dep) ────────────────────────────────────────────────
def squarify(values, x, y, w, h, pad=0.004):
    if not values:
        return []
    total = sum(values)
    rects = []

    def layout(vals, x, y, w, h):
        if not vals:
            return
        if len(vals) == 1:
            rects.append((x + pad, y + pad, w - 2 * pad, h - 2 * pad, vals[0]))
            return
        cut, best, row_sum = 1, float("inf"), 0
        for i, v in enumerate(vals):
            row_sum += v
            if w >= h:
                sw  = w * row_sum / total
                asp = max(sw / (h * v / row_sum), (h * v / row_sum) / sw) if v > 0 else float("inf")
            else:
                sh  = h * row_sum / total
                asp = max(sh / (w * v / row_sum), (w * v / row_sum) / sh) if v > 0 else float("inf")
            if asp < best:
                best = asp; cut = i + 1
            else:
                break
        group, rest, g_sum = vals[:cut], vals[cut:], sum(vals[:cut])
        if w >= h:
            gw, gy = w * g_sum / total, y
            for v in group:
                gh = h * v / g_sum
                rects.append((x + pad, gy + pad, gw - 2 * pad, gh - 2 * pad, v))
                gy += gh
            if rest:
                layout(rest, x + gw, y, w - gw, h)
        else:
            gh, gx = h * g_sum / total, x
            for v in group:
                gw2 = w * v / g_sum
                rects.append((gx + pad, y + pad, gw2 - 2 * pad, gh - 2 * pad, v))
                gx += gw2
            if rest:
                layout(rest, x, y + gh, w, h - gh)

    layout(sorted(values, reverse=True), x, y, w, h)
    return rects


# ── Theme ─────────────────────────────────────────────────────────────────────
BG, PANEL = "#0f1117", "#1a1d2e"
GREEN, RED, GOLD, WHITE, GREY, ACCENT = "#00d084", "#ff4757", "#ffd700", "#e8eaf0", "#6b7280", "#4f8ef7"
SECTOR_COLORS = {
    "Healthcare": "#00c2a8", "Telecom": "#4f8ef7", "Agro": "#7ec850",
    "Energy": "#ff9f43", "Construction": "#a29bfe", "Insurance": "#fd79a8",
    "Manufacturing": "#fdcb6e", "Banking": "#6c5ce7", "Consumer": "#b2bec3",
}


def naira(x, pos=None):
    ax = abs(x)
    if ax >= 1_000_000: return f"N{x/1e6:.1f}M"
    if ax >= 1_000:     return f"N{x/1e3:.0f}K"
    return f"N{x:.0f}"


# ── Chart ─────────────────────────────────────────────────────────────────────
def build_chart(df_active, sec_df, last_update=""):
    df_active    = df_active.sort_values("Return Pct", ascending=False).copy()
    total_equity = df_active["Current Equity"].sum()
    total_cost   = df_active["Remaining Cost"].sum()
    total_gain   = total_equity - total_cost
    overall_ret  = (total_gain / total_cost * 100) if total_cost else 0

    fig = plt.figure(figsize=(24, 18), facecolor=BG)
    gs  = gridspec.GridSpec(3, 3, figure=fig, hspace=0.50, wspace=0.36,
                             left=0.05, right=0.97, top=0.88, bottom=0.05)

    ax_pie  = fig.add_subplot(gs[0, 0])
    ax_bar  = fig.add_subplot(gs[0, 1:])
    ax_ret  = fig.add_subplot(gs[1, :2])
    ax_sret = fig.add_subplot(gs[1, 2])
    ax_tree = fig.add_subplot(gs[2, :])

    for ax in fig.get_axes():
        ax.set_facecolor(PANEL)
        for sp in ax.spines.values():
            sp.set_color("#2d3048")

    # KPI banner
    subtitle = f"As at {last_update}" if last_update else "Live from Google Sheets"
    fig.text(0.5, 0.965, "NGX PORTFOLIO DASHBOARD", ha="center",
             fontsize=24, fontweight="bold", color=WHITE, fontfamily="monospace")
    fig.text(0.5, 0.935, subtitle, ha="center", fontsize=11, color=GREY)

    kpis = [
        ("TOTAL EQUITY",     f"N{total_equity/1e6:.2f}M", GOLD),
        ("TOTAL COST",       f"N{total_cost/1e6:.2f}M",   WHITE),
        ("TOTAL GAIN",       f"N{total_gain/1e6:.2f}M",   GREEN if total_gain >= 0 else RED),
        ("OVERALL RETURN",   f"{overall_ret:+.1f}%",       GREEN if overall_ret >= 0 else RED),
        ("ACTIVE POSITIONS", str(len(df_active)),           ACCENT),
    ]
    for i, (lbl, val, col) in enumerate(kpis):
        kx = np.linspace(0.10, 0.90, 5)[i]
        fig.text(kx, 0.918, lbl, ha="center", fontsize=8,  color=GREY, fontweight="bold")
        fig.text(kx, 0.898, val, ha="center", fontsize=15, color=col,  fontweight="bold")

    # 1. Sector donut
    s_s  = sec_df[sec_df["Equity"] > 0].sort_values("Equity", ascending=False)
    cpie = [SECTOR_COLORS.get(str(s).strip(), ACCENT) for s in s_s["Sector"]]
    _, _, autotexts = ax_pie.pie(
        s_s["Equity"].values, labels=None, autopct="%1.1f%%",
        colors=cpie, startangle=90, pctdistance=0.78,
        wedgeprops=dict(width=0.62, edgecolor=PANEL, linewidth=2),
    )
    for at in autotexts:
        at.set_fontsize(7); at.set_color(BG); at.set_fontweight("bold")
    ax_pie.set_title("Sector Allocation", color=WHITE, fontsize=11, fontweight="bold", pad=8)
    legend_patches = [
        mpatches.Patch(color=SECTOR_COLORS.get(str(s).strip(), ACCENT), label=str(s).strip())
        for s in s_s["Sector"]
    ]
    ax_pie.legend(handles=legend_patches, loc="lower center", bbox_to_anchor=(0.5, -0.20),
                  ncol=3, fontsize=7, frameon=False, labelcolor=WHITE)

    # 2. Equity bar
    df_eq = df_active.sort_values("Current Equity")
    bc    = [SECTOR_COLORS.get(str(s).strip(), ACCENT) for s in df_eq["Sector"]]
    bars  = ax_bar.barh(df_eq["Ticker"], df_eq["Current Equity"],
                        color=bc, edgecolor="none", height=0.65)
    for bar, val in zip(bars, df_eq["Current Equity"]):
        ax_bar.text(bar.get_width() + total_equity * 0.006,
                    bar.get_y() + bar.get_height() / 2,
                    naira(val), va="center", fontsize=8, color=WHITE)
    ax_bar.set_title("Portfolio Equity by Stock", color=WHITE, fontsize=11, fontweight="bold", pad=8)
    ax_bar.xaxis.set_major_formatter(FuncFormatter(naira))
    ax_bar.tick_params(colors=GREY, labelsize=8)
    ax_bar.set_xlim(0, df_eq["Current Equity"].max() * 1.20)
    for sp in ax_bar.spines.values(): sp.set_visible(False)

    # 3. Return % diverging bar
    df_r = df_active.sort_values("Return Pct")
    rc   = [GREEN if x >= 0 else RED for x in df_r["Return Pct"]]
    ax_ret.barh(df_r["Ticker"], df_r["Return Pct"], color=rc, edgecolor="none", height=0.65)
    ax_ret.axvline(0, color=GREY, lw=1.0)
    for i, v in enumerate(df_r["Return Pct"]):
        off = 1.5 if v >= 0 else -1.5
        ha  = "left" if v >= 0 else "right"
        ax_ret.text(v + off, i, f"{v:+.1f}%", va="center", ha=ha, fontsize=7.5, color=WHITE)
    ax_ret.set_title("Unrealized Return % per Stock", color=WHITE, fontsize=11, fontweight="bold", pad=8)
    ax_ret.xaxis.set_major_formatter(FuncFormatter(lambda x, p: f"{x:+.0f}%"))
    ax_ret.tick_params(colors=GREY, labelsize=8)
    for sp in ax_ret.spines.values(): sp.set_visible(False)

    # 4. Sector gain %
    s_g  = sec_df.sort_values("Gain_pct_display")
    sg_c = [GREEN if x >= 0 else RED for x in s_g["Gain_pct_display"]]
    ax_sret.barh(s_g["Sector"], s_g["Gain_pct_display"], color=sg_c, edgecolor="none", height=0.65)
    ax_sret.axvline(0, color=GREY, lw=1.0)
    for i, v in enumerate(s_g["Gain_pct_display"]):
        off = 1.5 if v >= 0 else -1.5
        ha  = "left" if v >= 0 else "right"
        ax_sret.text(v + off, i, f"{v:+.1f}%", va="center", ha=ha, fontsize=7.5, color=WHITE)
    ax_sret.set_title("Gain % by Sector", color=WHITE, fontsize=11, fontweight="bold", pad=8)
    ax_sret.xaxis.set_major_formatter(FuncFormatter(lambda x, p: f"{x:+.0f}%"))
    ax_sret.tick_params(colors=GREY, labelsize=8)
    for sp in ax_sret.spines.values(): sp.set_visible(False)

    # 5. Treemap
    ax_tree.set_xlim(0, 1); ax_tree.set_ylim(0, 1); ax_tree.axis("off")
    ax_tree.set_title("Portfolio Treemap  (size = Equity  |  color = Return %)",
                       color=WHITE, fontsize=11, fontweight="bold", pad=8)

    df_tm      = df_active.sort_values("Current Equity", ascending=False).reset_index(drop=True)
    vals       = df_tm["Current Equity"].tolist()
    rets       = df_tm["Return Pct"].tolist()
    tickers    = df_tm["Ticker"].tolist()
    total_v    = sum(vals)
    norm_v     = [v / total_v for v in vals]
    rects      = squarify(norm_v, 0, 0, 1, 1)
    sorted_idx = np.argsort(vals)[::-1]
    norm_c     = plt.Normalize(vmin=-30, vmax=130)
    cmap       = plt.cm.RdYlGn

    for i, (rx, ry, rw, rh, _) in enumerate(rects):
        orig_i = sorted_idx[i]
        ret    = rets[orig_i]; ticker = tickers[orig_i]; eq = vals[orig_i]
        patch  = FancyBboxPatch((rx, ry), rw, rh, boxstyle="round,pad=0.003",
                                 facecolor=cmap(norm_c(ret)), edgecolor=BG, linewidth=1.8)
        ax_tree.add_patch(patch)
        if rw > 0.04 and rh > 0.035:
            fs_t = max(7, min(13, int(rw * 70)))
            fs_r = max(6, min(10, int(rw * 55)))
            ax_tree.text(rx + rw / 2, ry + rh * 0.60, ticker,
                         ha="center", va="center", fontsize=fs_t, fontweight="bold", color="white")
            ax_tree.text(rx + rw / 2, ry + rh * 0.30, f"{ret:+.1f}%",
                         ha="center", va="center", fontsize=fs_r, color="white", alpha=0.9)
            ax_tree.text(rx + rw / 2, ry + rh * 0.08, naira(eq),
                         ha="center", va="center", fontsize=max(5, fs_r - 1), color="white", alpha=0.7)

    sm = plt.cm.ScalarMappable(cmap=cmap, norm=norm_c)
    sm.set_array([])
    cbar = fig.colorbar(sm, ax=ax_tree, orientation="horizontal",
                        fraction=0.025, pad=0.01, aspect=50)
    cbar.set_label("Return %", color=GREY, fontsize=8)
    cbar.ax.tick_params(colors=GREY, labelsize=7)
    cbar.outline.set_visible(False)

    plt.savefig(OUTPUT_FILE, dpi=150, bbox_inches="tight", facecolor=BG)
    print(f"Dashboard saved -> {OUTPUT_FILE}")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("Authenticating with Google Sheets API...")
    creds   = get_credentials()
    service = build("sheets", "v4", credentials=creds)

    print("Fetching portfolio data from Google Sheets...")
    df_active, sec_df = load_data(service)
    print(f"   -> {len(df_active)} active positions loaded")
    print(f"   -> {len(sec_df)} sectors loaded")

    # Sanity-check print to catch any remaining parse issues
    print("\n-- Sample active positions --")
    print(df_active[["Stock Name", "Ticker", "Current Equity", "Return Pct"]].head(5).to_string(index=False))
    print("\n-- Sector summary --")
    print(sec_df[["Sector", "Equity", "Gain_pct_display"]].to_string(index=False))

    print("\nBuilding chart...")
    build_chart(df_active, sec_df)


if __name__ == "__main__":
    main()