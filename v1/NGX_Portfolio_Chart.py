import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
from matplotlib.patches import FancyBboxPatch
from matplotlib.ticker import FuncFormatter
import numpy as np
import openpyxl
import datetime

# ── Load data ──────────────────────────────────────────────────────────────
wb = openpyxl.load_workbook('./dep/NGX_Portfolio.xlsx', data_only=True)
ws = wb['NGX_Portfolio']
rows = list(ws.iter_rows(min_row=5, values_only=True))
data = [r for r in rows[1:] if r[0] is not None]

stocks = []
for r in data:
    stocks.append({
        'Stock': r[0], 'Ticker': r[1], 'Sector': r[5],
        'Remaining Shares': r[8] or 0, 'Current Equity': r[10] or 0,
        'Cost': r[9] or 0, 'Unrealized PL': r[12] or 0,
        'Total PL': r[13] or 0, 'Return Pct': (r[14] or 0) * 100,
        'Sold': (r[6] or 0) > 0
    })

df = pd.DataFrame(stocks)
df_active = df[df['Remaining Shares'] > 0].copy().sort_values('Return Pct', ascending=False)
sec = pd.read_excel('./dep/NGX_Portfolio.xlsx', sheet_name='NGX Sector Allocation')
sec['Gain_pct_display'] = sec['Gain (%)'] * 100

total_equity = df_active['Current Equity'].sum()
total_cost   = df_active['Cost'].sum()
total_gain   = total_equity - total_cost
overall_ret  = total_gain / total_cost * 100

# ── Theme ───────────────────────────────────────────────────────────────────
BG, PANEL = '#0f1117', '#1a1d2e'
GREEN, RED, GOLD, WHITE, GREY, ACCENT = '#00d084','#ff4757','#ffd700','#e8eaf0','#6b7280','#4f8ef7'
SECTOR_COLORS = {
    'Healthcare':'#00c2a8','Telecom':'#4f8ef7','Agro':'#7ec850',
    'Energy':'#ff9f43','Construction':'#a29bfe','Insurance':'#fd79a8',
    'Manufacturing':'#fdcb6e','Banking':'#6c5ce7','Consumer':'#b2bec3'
}

def naira(x, pos=None):
    if abs(x) >= 1_000_000: return f'₦{x/1e6:.1f}M'
    if abs(x) >= 1_000: return f'₦{x/1e3:.0f}K'
    return f'₦{x:.0f}'

# ── Proper squarify algorithm ───────────────────────────────────────────────
def squarify(values, x, y, w, h, pad=0.003):
    """Slice-and-dice squarify producing real 2-D rectangles."""
    if not values: return []
    total = sum(values)
    rects = []
    
    def layout(vals, x, y, w, h):
        if not vals: return
        if len(vals) == 1:
            rects.append((x+pad, y+pad, w-2*pad, h-2*pad, vals[0]))
            return
        # split so first group fills left/top strip
        cut = 1
        best = float('inf')
        row_sum = 0
        for i, v in enumerate(vals):
            row_sum += v
            if w >= h:
                strip_w = w * row_sum / total
                aspect = max(strip_w / (h * v / row_sum), (h * v / row_sum) / strip_w) if v > 0 else float('inf')
            else:
                strip_h = h * row_sum / total
                aspect = max(strip_h / (w * v / row_sum), (w * v / row_sum) / strip_h) if v > 0 else float('inf')
            if aspect < best:
                best = aspect; cut = i + 1
            else:
                break
        group  = vals[:cut]
        rest   = vals[cut:]
        g_sum  = sum(group)

        if w >= h:
            gw = w * g_sum / total
            gy = y
            for v in group:
                gh = h * v / g_sum
                rects.append((x+pad, gy+pad, gw-2*pad, gh-2*pad, v))
                gy += gh
            if rest:
                layout(rest, x+gw, y, w-gw, h)
        else:
            gh = h * g_sum / total
            gx = x
            for v in group:
                gw2 = w * v / g_sum
                rects.append((gx+pad, y+pad, gw2-2*pad, gh-2*pad, v))
                gx += gw2
            if rest:
                layout(rest, x, y+gh, w, h-gh)

    layout(sorted(values, reverse=True), x, y, w, h)
    return rects

# ── Figure ──────────────────────────────────────────────────────────────────
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
    for sp in ax.spines.values(): sp.set_color('#2d3048')

# ── KPI banner ──────────────────────────────────────────────────────────────
fig.text(0.5, 0.965, 'NGX PORTFOLIO DASHBOARD', ha='center',
         fontsize=24, fontweight='bold', color=WHITE, fontfamily='monospace')
fig.text(0.5, 0.935, 'As at 26 Feb 2026', ha='center', fontsize=11, color=GREY)

kpis = [('TOTAL EQUITY', f'₦{total_equity/1e6:.2f}M', GOLD),
        ('TOTAL COST',   f'₦{total_cost/1e6:.2f}M',   WHITE),
        ('TOTAL GAIN',   f'₦{total_gain/1e6:.2f}M',   GREEN),
        ('OVERALL RETURN', f'{overall_ret:+.1f}%',     GREEN),
        ('ACTIVE POSITIONS', str(len(df_active)),      ACCENT)]
for i, (lbl, val, col) in enumerate(kpis):
    kx = np.linspace(0.10, 0.90, 5)[i]
    fig.text(kx, 0.918, lbl, ha='center', fontsize=8, color=GREY, fontweight='bold')
    fig.text(kx, 0.898, val, ha='center', fontsize=15, color=col, fontweight='bold')

# ── 1. Sector donut ──────────────────────────────────────────────────────────
s_s = sec.sort_values('Equity', ascending=False)
cpie = [SECTOR_COLORS.get(s, ACCENT) for s in s_s['Sector']]
wedges, _, autotexts = ax_pie.pie(
    s_s['Equity'], labels=None, autopct='%1.1f%%', colors=cpie, startangle=90,
    pctdistance=0.78, wedgeprops=dict(width=0.62, edgecolor=PANEL, linewidth=2))
for at in autotexts: at.set_fontsize(7); at.set_color(BG); at.set_fontweight('bold')
ax_pie.set_title('Sector Allocation', color=WHITE, fontsize=11, fontweight='bold', pad=8)
legend_patches = [mpatches.Patch(color=SECTOR_COLORS.get(s,ACCENT), label=s) for s in s_s['Sector']]
ax_pie.legend(handles=legend_patches,
              loc='lower center', bbox_to_anchor=(0.5,-0.20), ncol=3,
              fontsize=7, frameon=False, labelcolor=WHITE)

# ── 2. Equity bar ───────────────────────────────────────────────────────────
df_eq = df_active.sort_values('Current Equity')
bcolors = [SECTOR_COLORS.get(s, ACCENT) for s in df_eq['Sector']]
bars = ax_bar.barh(df_eq['Ticker'], df_eq['Current Equity'], color=bcolors, edgecolor='none', height=0.65)
for bar, val in zip(bars, df_eq['Current Equity']):
    ax_bar.text(bar.get_width() + total_equity*0.006, bar.get_y()+bar.get_height()/2,
                naira(val), va='center', fontsize=8, color=WHITE)
ax_bar.set_title('Portfolio Equity by Stock', color=WHITE, fontsize=11, fontweight='bold', pad=8)
ax_bar.xaxis.set_major_formatter(FuncFormatter(naira))
ax_bar.tick_params(colors=GREY, labelsize=8); ax_bar.set_xlim(0, df_eq['Current Equity'].max()*1.20)
for sp in ax_bar.spines.values(): sp.set_visible(False)

# ── 3. Return % diverging bar ───────────────────────────────────────────────
df_r = df_active.sort_values('Return Pct')
rc = [GREEN if x >= 0 else RED for x in df_r['Return Pct']]
ax_ret.barh(df_r['Ticker'], df_r['Return Pct'], color=rc, edgecolor='none', height=0.65)
ax_ret.axvline(0, color=GREY, lw=1.0)
for i, v in enumerate(df_r['Return Pct']):
    off = 1.5 if v >= 0 else -1.5; ha = 'left' if v >= 0 else 'right'
    ax_ret.text(v+off, i, f'{v:+.1f}%', va='center', ha=ha, fontsize=7.5, color=WHITE)
ax_ret.set_title('Unrealized Return % per Stock', color=WHITE, fontsize=11, fontweight='bold', pad=8)
ax_ret.xaxis.set_major_formatter(FuncFormatter(lambda x,p: f'{x:+.0f}%'))
ax_ret.tick_params(colors=GREY, labelsize=8)
for sp in ax_ret.spines.values(): sp.set_visible(False)

# ── 4. Sector gain % ────────────────────────────────────────────────────────
s_g = sec.sort_values('Gain_pct_display')
sg_c = [GREEN if x >= 0 else RED for x in s_g['Gain_pct_display']]
ax_sret.barh(s_g['Sector'], s_g['Gain_pct_display'], color=sg_c, edgecolor='none', height=0.65)
ax_sret.axvline(0, color=GREY, lw=1.0)
for i, v in enumerate(s_g['Gain_pct_display']):
    off = 1.5 if v >= 0 else -1.5; ha = 'left' if v >= 0 else 'right'
    ax_sret.text(v+off, i, f'{v:+.1f}%', va='center', ha=ha, fontsize=7.5, color=WHITE)
ax_sret.set_title('Gain % by Sector', color=WHITE, fontsize=11, fontweight='bold', pad=8)
ax_sret.xaxis.set_major_formatter(FuncFormatter(lambda x,p: f'{x:+.0f}%'))
ax_sret.tick_params(colors=GREY, labelsize=8)
for sp in ax_sret.spines.values(): sp.set_visible(False)

# ── 5. Proper Treemap ────────────────────────────────────────────────────────
ax_tree.set_xlim(0, 1); ax_tree.set_ylim(0, 1); ax_tree.axis('off')
ax_tree.set_title('Portfolio Treemap  (size = Equity  |  color = Return %)',
                  color=WHITE, fontsize=11, fontweight='bold', pad=8)

df_tm = df_active.sort_values('Current Equity', ascending=False).reset_index(drop=True)
vals  = df_tm['Current Equity'].tolist()
rets  = df_tm['Return Pct'].tolist()
ticks = df_tm['Ticker'].tolist()

# re-normalise values to fill [0,1]×[0,1]
total_v = sum(vals)
norm_vals = [v/total_v for v in vals]

rects = squarify(norm_vals, 0, 0, 1, 1, pad=0.004)

vmin, vmax = -30, 130
norm = plt.Normalize(vmin=vmin, vmax=vmax)
cmap = plt.cm.RdYlGn

# match rects back to original order by area
sorted_idx = np.argsort(vals)[::-1]

for i, (rx, ry, rw, rh, _) in enumerate(rects):
    orig_i = sorted_idx[i]
    ret = rets[orig_i]; ticker = ticks[orig_i]; eq = vals[orig_i]
    color = cmap(norm(ret))
    patch = FancyBboxPatch((rx, ry), rw, rh,
                            boxstyle='round,pad=0.003',
                            facecolor=color, edgecolor=BG, linewidth=1.8)
    ax_tree.add_patch(patch)
    if rw > 0.04 and rh > 0.035:
        fs_ticker = max(7, min(13, int(rw * 70)))
        fs_ret    = max(6, min(10, int(rw * 55)))
        ax_tree.text(rx+rw/2, ry+rh*0.60, ticker,
                     ha='center', va='center', fontsize=fs_ticker,
                     fontweight='bold', color='white')
        ax_tree.text(rx+rw/2, ry+rh*0.28, f'{ret:+.1f}%',
                     ha='center', va='center', fontsize=fs_ret, color='white', alpha=0.9)
        ax_tree.text(rx+rw/2, ry+rh*0.08, naira(eq),
                     ha='center', va='center', fontsize=max(5, fs_ret-1), color='white', alpha=0.7)

sm = plt.cm.ScalarMappable(cmap=cmap, norm=norm)
sm.set_array([])
cbar = fig.colorbar(sm, ax=ax_tree, orientation='horizontal', fraction=0.025, pad=0.01, aspect=50)
cbar.set_label('Return %', color=GREY, fontsize=8)
cbar.ax.tick_params(colors=GREY, labelsize=7)
cbar.outline.set_visible(False)

now = datetime.datetime.now()
formatted_date = now.strftime("%m_%d_%Y")

plt.savefig(f'./dep/NGX_Portfolio_Dashboard_{formatted_date}.png',
            dpi=150, bbox_inches='tight', facecolor=BG)
print("SAVED OK")
