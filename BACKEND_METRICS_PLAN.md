# Backend Implementation Plan for Stock Metrics

## Current Status

### ✅ Currently Being Extracted (but not all returned)

**From overview.py (Performance Service):**
- return_1d, 1w, 1m, 3m, 6m, 1y, ytd
- volatility
- sharpe_ratio
- max_drawdown
- beta ✅ (returned)
- correlation_market

**From performance.py (Overview Service):**
- market_cap ✅ (returned)
- pe_ratio ✅ (returned)
- eps ✅ (returned)
- book_value ✅ (returned)
- dividend_yield ✅ (returned)
- roe ✅ (returned)
- debt_to_equity ✅ (returned)
- current_ratio (extracted but NOT returned)
- gross_margin (extracted but NOT returned)
- net_margin (extracted but NOT returned)
- earnings_growth (extracted but NOT returned)
- revenue (extracted but NOT returned)
- net_income (extracted but NOT returned)

### ❌ Missing Completely (Need to Add to Scrapers)

**Profitability Margins:**
- Operating Margin %
- EBITDA Margin %
- FCF Margin %
- Pretax Margin %

**Growth Metrics:**
- Revenue Growth YoY %
- Operating Income Growth %
- Net Income Growth YoY %
- EPS Growth YoY %
- Dividend Growth YoY %

**Cash Flow:**
- Free Cash Flow (FCF)
- FCF Per Share
- Operating Cash Flow
- Capital Expenditures
- FCF Yield %

**Efficiency Ratios:**
- Return on Assets (ROA) %
- Return on Invested Capital (ROIC) %
- Return on Capital Employed (ROCE) %
- Asset Turnover
- Revenue Per Employee

**Valuation Ratios:**
- Price/Sales Ratio
- Price/Book Ratio
- Price/FCF Ratio
- EV/EBITDA
- EV/Sales
- EV/EBIT
- EV/FCF
- Forward P/E Ratio
- Earnings Yield %

**Financial Health:**
- Quick Ratio
- Net Debt
- Net Cash Per Share
- Interest Coverage Ratio
- Debt / EBITDA

**Stock Quality:**
- RSI (Relative Strength Index)
- 52-Week High
- 52-Week Low
- 50-Day Moving Average
- 200-Day Moving Average
- Insider Ownership %
- Institutional Ownership %
- Float %

**Quality Scores:**
- Piotroski F-Score
- Altman Z-Score

**Financial Statements:**
- Gross Profit
- Operating Income
- Pretax Income
- EBITDA
- Cash & Cash Equivalents
- Total Debt
- Equity (Book Value)
- Working Capital

---

## Implementation Strategy

### Phase 1: Return Already-Extracted Fields (Quick Win)
Update `/data/{ticker}` endpoint to return:
- current_ratio
- gross_margin
- net_margin  
- earnings_growth
- revenue
- net_income

### Phase 2: Expand Scrapers (Medium Effort)
Add extraction logic to performance.py and overview.py for:
- All margin ratios (Operating, EBITDA, FCF, Pretax)
- Growth rates (from comparing multiple years - need historical data)
- Cash flow metrics
- Efficiency ratios
- Valuation ratios
- Financial health ratios

### Phase 3: Add Missing Metrics (High Effort)
Scrape additional data from stockanalysis.com pages:
- /statistics - contains most valuation and efficiency metrics
- /financials - contains historical data for growth calculations
- Technical indicators (RSI, Moving averages)
- Ownership data

### Phase 4: Historical Data Storage (Infrastructure)
Build capability to:
- Store multi-year financial data
- Calculate growth rates automatically
- Track metrics over time
- Support trend analysis

---

## Quick Implementation (Phase 1)

Add to `/data/{ticker}` response under overview or as new section:

```json
{
  "ticker": "MTNN",
  "price": {...},
  "profile": {...},
  "overview": {...},
  "performance": {...},
  "NEW_extra_metrics": {
    "current_ratio": 0.56,
    "gross_margin": 82.80,
    "net_margin": 21.38,
    "revenue": 5204436,
    "net_income": 1112846,
    "earnings_growth": null
  }
}
```

Lines to update in backend/app/routers/data.py: ~95-115
Files to modify: 
- app/services/performance.py (add extraction for current_ratio, gross_margin, net_margin)
- app/services/overview.py (mapping for 1Y return)
- app/routers/data.py (return the new fields)
