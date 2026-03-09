
import os, json, re
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
import datetime
from matplotlib.patches import FancyBboxPatch, Wedge
from matplotlib.ticker import FuncFormatter
from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build

load_dotenv()

SPREADSHEET_ID = os.getenv("SPREADSHEET_ID", "1kkZt2s-c1EmDXsoArth5IwwLRwxEEqW9XaoEcnPACpY")
USDNGN         = float(os.getenv("USDNGN", "1580"))
SCOPES         = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

now = datetime.datetime.now()
formatted_date = now.strftime("%m_%d_%Y")
OUTPUT_FILE = f'./v2/outputs/NGX_Advanced_Analytics{formatted_date}.png'

SHEET_NGX      = "NGX_Portfolio"
SHEET_US       = "US_Portfolio"


# ── Auth ──────────────────────────────────────────────────────────────────────
def get_credentials():
    json_str  = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON_STR")
    json_file = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if json_str:
        return service_account.Credentials.from_service_account_info(json.loads(json_str), scopes=SCOPES)
    elif json_file:
        return service_account.Credentials.from_service_account_file(json_file, scopes=SCOPES)
    raise EnvironmentError("Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_JSON_STR in .env")


# ── Sheets helpers ────────────────────────────────────────────────────────────
def get_values(service, sheet):
    return (service.spreadsheets().values()
            .get(spreadsheetId=SPREADSHEET_ID, range=f"'{sheet}'")
            .execute().get("values", []))

def _clean(val):
    if val is None or str(val).strip() == "": return 0.0
    try: return float(re.sub(r"[^\d.\-]", "", str(val)))
    except: return 0.0

def to_df(values, header_row=0):
    headers = values[header_row]
    rows    = values[header_row + 1:]
    padded  = [r + [""] * (len(headers) - len(r)) for r in rows]
    return pd.DataFrame(padded, columns=headers)

def coerce(df, cols):
    for c in cols:
        if c in df.columns: df[c] = df[c].apply(_clean)
    return df


# ── Load data ─────────────────────────────────────────────────────────────────
def load_data(service):
    # NGX
    raw = get_values(service, SHEET_NGX)
    hi  = next(i for i, r in enumerate(raw) if r and r[0] == "Stock Name")
    df  = to_df(raw, header_row=hi)
    df  = df[df["Stock Name"].str.strip() != ""].copy()
    num = ["Shares Bought","Avg Cost","Current Price","Sold Units","Sold Price",
           "Remaining Shares","Remaining Cost","Current Equity",
           "Realized P/L","Unrealized P/L","Total P/L",
           "% Return (Unrealized)","Sale Comm","Cash Received From Sale","Original Total Cost"]
    df  = coerce(df, num)
    df["Return Pct"] = df["% Return (Unrealized)"]

    df_all  = df.copy()
    df_act  = df[df["Remaining Shares"] > 0].copy()
    df_sold = df[(df["Sold Units"] > 0) & (df["Remaining Shares"] == 0)].copy()

    # Rename for chart compatibility
    for d in [df_all, df_act, df_sold]:
        d.rename(columns={
            "Stock Name":       "Stock",
            "Remaining Cost":   "Remaining Cost",
            "Current Equity":   "Current Equity",
            "Unrealized P/L":   "Unrealized PL",
            "Realized P/L":     "Realized PL",
            "Total P/L":        "Total PL",
            "Original Total Cost": "Original Cost",
        }, inplace=True)

    # US
    raw_us = get_values(service, SHEET_US)
    hi_us  = next(i for i, r in enumerate(raw_us) if r and r[0] == "Stock Name")
    df_us  = to_df(raw_us, header_row=hi_us)
    df_us  = df_us[df_us["Stock Name"].str.strip() != ""].copy()
    df_us  = coerce(df_us, num)
    df_us["Return Pct"] = df_us["% Return (Unrealized)"]
    df_us  = df_us[df_us["Remaining Shares"] > 0].copy()
    df_us.rename(columns={
        "Stock Name":       "Stock",
        "Remaining Cost":   "Remaining Cost",
        "Current Equity":   "Current Equity",
        "Unrealized P/L":   "Unrealized PL",
        "Realized P/L":     "Realized PL",
        "Total P/L":        "Total PL",
        "Original Total Cost": "Original Cost",
    }, inplace=True)

    return df_all, df_act, df_sold, df_us


# ── Theme ─────────────────────────────────────────────────────────────────────
BG, PANEL = "#0f1117", "#1a1d2e"
GREEN, RED, GOLD, WHITE, GREY, ACCENT = "#00d084","#ff4757","#ffd700","#e8eaf0","#6b7280","#4f8ef7"
BLUE2 = "#74b9ff"
SECTOR_COLORS = {
    "Healthcare":"#00c2a8","Telecom":"#4f8ef7","Agro":"#7ec850",
    "Energy":"#ff9f43","Construction":"#a29bfe","Insurance":"#fd79a8",
    "Manufacturing":"#fdcb6e","Banking":"#6c5ce7","Consumer":"#b2bec3",
    "Technology":"#00cec9","Media":"#fd79a8",
}

def naira(x, pos=None):
    ax = abs(x)
    if ax >= 1e6: return f"N{x/1e6:.1f}M"
    if ax >= 1e3: return f"N{x/1e3:.0f}K"
    return f"N{x:.0f}"

def usd(x, pos=None):
    ax = abs(x)
    if ax >= 1e3: return f"${x/1e3:.1f}K"
    return f"${x:.0f}"


# ── Chart ─────────────────────────────────────────────────────────────────────
def build_chart(df_all, df_act, df_sold, df_us):
    fig = plt.figure(figsize=(26, 22), facecolor=BG)
    gs  = gridspec.GridSpec(3, 3, figure=fig, hspace=0.52, wspace=0.38,
                             left=0.05, right=0.97, top=0.93, bottom=0.05)
    ax1 = fig.add_subplot(gs[0, :2])
    ax2 = fig.add_subplot(gs[0, 2])
    ax3 = fig.add_subplot(gs[1, :])
    ax4 = fig.add_subplot(gs[2, :2])
    ax5 = fig.add_subplot(gs[2, 2])

    for ax in [ax1,ax2,ax3,ax4,ax5]:
        ax.set_facecolor(PANEL)
        for sp in ax.spines.values(): sp.set_color("#2d3048")

    fig.text(0.5, 0.965, "NGX PORTFOLIO — ADVANCED ANALYTICS", ha="center",
             fontsize=22, fontweight="bold", color=WHITE, fontfamily="monospace")
    fig.text(0.5, 0.945, f"Live from Google Sheets  |  USD/NGN  N{USDNGN:,.0f}", ha="center",
             fontsize=10, color=GREY)

    total_eq = df_act["Current Equity"].sum()

    # ── 1. Cost Basis vs Current Value ───────────────────────────────────────
    df_cb = df_act.sort_values("Unrealized PL", ascending=True).copy()
    y     = np.arange(len(df_cb))
    ax1.barh(y, df_cb["Remaining Cost"], color="#3d4166", edgecolor="none", height=0.6, label="Cost Basis")
    gl_c = [GREEN if g >= 0 else RED for g in df_cb["Unrealized PL"]]
    ax1.barh(y, df_cb["Unrealized PL"], left=df_cb["Remaining Cost"],
             color=gl_c, edgecolor="none", height=0.6, label="Unrealized G/L")
    for i, (c, g) in enumerate(zip(df_cb["Remaining Cost"], df_cb["Unrealized PL"])):
        ax1.text(c+g + total_eq*0.005, i, naira(c+g), va="center", fontsize=7.5, color=WHITE)
        ax1.text(c + abs(g)/2, i, ("+"+naira(g) if g>=0 else naira(g)),
                 va="center", ha="center", fontsize=6.5, color=BG, fontweight="bold")
    ax1.set_yticks(y); ax1.set_yticklabels(df_cb["Ticker"], fontsize=8, color=GREY)
    ax1.xaxis.set_major_formatter(FuncFormatter(naira))
    ax1.tick_params(colors=GREY, labelsize=7)
    ax1.set_title("Cost Basis vs Current Value  (grey = cost  |  colour = unrealized G/L)",
                  color=WHITE, fontsize=10, fontweight="bold", pad=8)
    ax1.set_xlim(0, df_cb["Current Equity"].max() * 1.22)
    ax1.legend(loc="lower right", frameon=False, labelcolor=WHITE, fontsize=8)
    for sp in ax1.spines.values(): sp.set_visible(False)

    # ── 2. Concentration Risk (HHI) ─────────────────────────────────────────
    weights = df_act["Current Equity"] / total_eq
    hhi     = (weights ** 2).sum() * 10000
    ax2.set_xlim(-1.3, 1.3); ax2.set_ylim(-0.9, 1.3); ax2.axis("off")
    ax2.set_title("Concentration Risk  (HHI)", color=WHITE, fontsize=10, fontweight="bold", pad=8)
    for (t1, t2, col) in [(180,120,GREEN),(120,60,GOLD),(60,0,RED)]:
        ax2.add_patch(Wedge((0,0), 1.0, t1, t2, width=0.28,
                            facecolor=col, edgecolor=PANEL, lw=2, alpha=0.85))
    needle = max(0, min(180, 180 - (hhi/3000)*180))
    rad    = np.radians(needle)
    ax2.annotate("", xy=(0.75*np.cos(rad), 0.75*np.sin(rad)), xytext=(0,0),
                 arrowprops=dict(arrowstyle="->", color=WHITE, lw=2.5))
    ax2.plot(0, 0, "o", color=WHITE, ms=8, zorder=5)
    risk_lbl = "LOW" if hhi<1000 else ("MODERATE" if hhi<1800 else "HIGH")
    risk_col = GREEN if hhi<1000 else (GOLD if hhi<1800 else RED)
    ax2.text(0, -0.15, f"HHI  {hhi:.0f}", ha="center", fontsize=13, color=WHITE, fontweight="bold")
    ax2.text(0, -0.28, f"{risk_lbl} CONCENTRATION", ha="center", fontsize=9, color=risk_col)
    top5     = df_act.sort_values("Current Equity", ascending=False).head(5)
    top5_pct = top5["Current Equity"].sum() / total_eq * 100
    ax2.text(0, 0.42, f"Top 5 = {top5_pct:.1f}% of portfolio", ha="center", fontsize=8.5, color=GREY)
    for i, (_, row) in enumerate(top5.iterrows()):
        pct = row["Current Equity"] / total_eq * 100
        ax2.barh(-0.52 - i*0.13, pct/100*1.8, left=-0.9, height=0.09,
                 color=SECTOR_COLORS.get(row["Sector"], ACCENT), alpha=0.85)
        ax2.text(-0.90, -0.52-i*0.13, row["Ticker"], va="center", fontsize=7, color=WHITE, fontweight="bold")
        ax2.text(0.92, -0.52-i*0.13, f"{pct:.1f}%", va="center", ha="right", fontsize=7, color=GREY)
    ax2.text(-0.10, 1.12, "LOW", fontsize=7, color=GREEN)
    ax2.text(0.62, 0.75, "MOD", fontsize=7, color=GOLD)
    ax2.text(0.88, 0.18, "HIGH", fontsize=7, color=RED)

    # ── 3. Waterfall ─────────────────────────────────────────────────────────
    total_cost    = df_all["Original Cost"].sum()
    realized_pl   = df_all["Realized PL"].sum()
    unrealized_pl = df_act["Unrealized PL"].sum()
    total_equity_v= df_act["Current Equity"].sum()
    steps = [
        ("Total\nCost",      total_cost,    0,                      "#3d4166", True),
        ("Realized\nP/L",    realized_pl,   total_cost,             GREEN if realized_pl>=0 else RED, False),
        ("Unrealized\nP/L",  unrealized_pl, total_cost+realized_pl, GREEN if unrealized_pl>=0 else RED, False),
        ("Current\nEquity",  total_equity_v,0,                      GOLD, True),
    ]
    for i, (lbl, val, base, col, is_total) in enumerate(steps):
        if is_total:
            ax3.bar(i, val, color=col, edgecolor="none", width=0.55, alpha=0.9)
            ax3.text(i, val + total_cost*0.01, naira(val), ha="center", fontsize=9,
                     color=WHITE, fontweight="bold")
        else:
            ax3.bar(i, val, bottom=base, color=col, edgecolor="none", width=0.55, alpha=0.9)
            sign = "+" if val>=0 else ""
            ax3.text(i, base+val+total_cost*0.01*(1 if val>=0 else -1),
                     f"{sign}{naira(val)}", ha="center", fontsize=9, color=WHITE, fontweight="bold")
    running = total_cost
    for i in range(1, len(steps)-1):
        ax3.plot([i-0.27,i+0.27],[running,running], color=GREY, lw=1, ls="--", alpha=0.6)
        running += steps[i][1]
    ax3.plot([2.27,2.73],[running,running], color=GREY, lw=1, ls="--", alpha=0.6)
    ax3.set_xticks(range(4)); ax3.set_xticklabels([s[0] for s in steps], color=WHITE, fontsize=10)
    ax3.yaxis.set_major_formatter(FuncFormatter(naira))
    ax3.tick_params(colors=GREY, labelsize=8)
    ax3.set_title("Portfolio Value Waterfall  (Cost -> Realized P/L -> Unrealized P/L -> Equity)",
                  color=WHITE, fontsize=10, fontweight="bold", pad=8)
    ax3.set_xlim(-0.6, 3.6)
    ax3.set_ylim(0, max(total_cost, total_equity_v) * 1.15)
    for sp in ax3.spines.values(): sp.set_visible(False)
    net = total_equity_v - total_cost
    ax3.annotate(f"Net gain: {naira(net)}  ({net/total_cost*100:+.1f}%)",
                 xy=(3, total_equity_v), xytext=(2.3, total_equity_v*1.07),
                 fontsize=9, color=GOLD, fontweight="bold",
                 arrowprops=dict(arrowstyle="->", color=GOLD, lw=1.2))

    # ── 4. FX-Adjusted Unified View ──────────────────────────────────────────
    ngx_u = df_act.copy()
    ngx_u["Equity_USD"] = ngx_u["Current Equity"] / USDNGN
    ngx_u["Cost_USD"]   = ngx_u["Remaining Cost"] / USDNGN
    ngx_u["GL_USD"]     = ngx_u["Unrealized PL"]  / USDNGN
    ngx_u["Market"]     = "NGX"

    us_u = df_us.copy()
    us_u["Equity_USD"]  = us_u["Current Equity"]
    us_u["Cost_USD"]    = us_u["Remaining Cost"]
    us_u["GL_USD"]      = us_u["Unrealized PL"]
    us_u["Market"]      = "US"

    unified = pd.concat([ngx_u[["Ticker","Sector","Market","Equity_USD","Cost_USD","GL_USD"]],
                         us_u[["Ticker","Sector","Market","Equity_USD","Cost_USD","GL_USD"]]],
                        ignore_index=True).sort_values("Equity_USD", ascending=True)

    t_ngx = ngx_u["Equity_USD"].sum()
    t_us  = us_u["Equity_USD"].sum()
    t_all = t_ngx + t_us

    ax4.barh(unified["Ticker"], unified["Cost_USD"], color="#3d4166", edgecolor="none", height=0.6)
    gl_c2 = [GREEN if g>=0 else RED for g in unified["GL_USD"]]
    ax4.barh(unified["Ticker"], unified["GL_USD"], left=unified["Cost_USD"],
             color=gl_c2, edgecolor="none", height=0.6, alpha=0.9)
    for i, (_, row) in enumerate(unified.iterrows()):
        badge_col = ACCENT if row["Market"]=="NGX" else GOLD
        ax4.text(-3, i, row["Market"], va="center", ha="left", fontsize=6,
                 color=badge_col, fontweight="bold")
        ax4.text(row["Equity_USD"] + t_all*0.006, i, usd(row["Equity_USD"]),
                 va="center", fontsize=7, color=WHITE)
    ax4.set_title(f"FX-Adjusted Unified View  (NGX @ N{USDNGN:,.0f}/USD)  |  "
                  f"NGX: {usd(t_ngx)}  |  US: {usd(t_us)}  |  Total: {usd(t_all)}",
                  color=WHITE, fontsize=10, fontweight="bold", pad=8)
    ax4.xaxis.set_major_formatter(FuncFormatter(usd))
    ax4.tick_params(colors=GREY, labelsize=8)
    ax4.set_xlim(-8, unified["Equity_USD"].max() * 1.20)
    for sp in ax4.spines.values(): sp.set_visible(False)

    # NGX vs US split pie (inset)
    pie_ax = fig.add_axes([0.88, 0.095, 0.095, 0.18])
    pie_ax.set_facecolor(PANEL)
    pie_ax.pie([t_ngx, t_us], labels=["NGX","US"], colors=[ACCENT, GOLD],
               autopct="%1.0f%%", startangle=90,
               wedgeprops=dict(edgecolor=PANEL, lw=1.5),
               textprops=dict(color=WHITE, fontsize=7))
    pie_ax.set_title("Split", color=GREY, fontsize=7, pad=3)

    # ── 5. Risk-Return Scatter ────────────────────────────────────────────────
    df_rr = df_act.copy()
    df_rr["Weight"] = df_rr["Current Equity"] / total_eq * 100
    ax5.axhline(0, color=GREY, lw=0.8, ls="--", alpha=0.5)
    ax5.axvline(df_rr["Weight"].mean(), color=GREY, lw=0.8, ls="--", alpha=0.5)
    for _, row in df_rr.iterrows():
        col  = SECTOR_COLORS.get(row["Sector"], ACCENT)
        size = row["Current Equity"] / total_eq * 3000
        ax5.scatter(row["Weight"], row["Return Pct"], s=size,
                    color=col, edgecolors="white", lw=0.6, alpha=0.85, zorder=3)
        ax5.text(row["Weight"]+0.15, row["Return Pct"]+2.5,
                 row["Ticker"], fontsize=6.5, color=WHITE, zorder=4)
    ax5.text(0.97,0.97,"High Weight\nHigh Return",transform=ax5.transAxes,ha="right",va="top",fontsize=6.5,color=GREEN,alpha=0.7)
    ax5.text(0.03,0.97,"Low Weight\nHigh Return",transform=ax5.transAxes,ha="left",va="top",fontsize=6.5,color=BLUE2,alpha=0.7)
    ax5.text(0.97,0.03,"High Weight\nLow Return",transform=ax5.transAxes,ha="right",va="bottom",fontsize=6.5,color=GOLD,alpha=0.7)
    ax5.text(0.03,0.03,"Low Weight\nLow Return",transform=ax5.transAxes,ha="left",va="bottom",fontsize=6.5,color=RED,alpha=0.7)
    ax5.set_xlabel("Portfolio Weight (%)", color=GREY, fontsize=8)
    ax5.set_ylabel("Return (%)", color=GREY, fontsize=8)
    ax5.tick_params(colors=GREY, labelsize=7)
    ax5.set_title("Risk-Return  (size = equity weight)", color=WHITE, fontsize=10, fontweight="bold", pad=8)
    ax5.yaxis.set_major_formatter(FuncFormatter(lambda x,p: f"{x:+.0f}%"))
    for sp in ax5.spines.values(): sp.set_color("#2d3048")

    plt.savefig(OUTPUT_FILE, dpi=150, bbox_inches="tight", facecolor=BG)
    print(f"Dashboard saved -> {OUTPUT_FILE}")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("Authenticating...")
    creds   = get_credentials()
    service = build("sheets", "v4", credentials=creds)

    print("Fetching data from Google Sheets...")
    df_all, df_act, df_sold, df_us = load_data(service)
    print(f"   -> NGX active: {len(df_act)}  |  NGX sold: {len(df_sold)}  |  US: {len(df_us)}")

    print("Building advanced analytics chart...")
    build_chart(df_all, df_act, df_sold, df_us)

if __name__ == "__main__":
    main()