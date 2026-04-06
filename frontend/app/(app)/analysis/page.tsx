'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import MarkdownViewer from '@/components/MarkdownViewer';
import {
  streamAnalysis,
  fetchAnalysisHistory,
  fetchAnalysisById,
  clearAnalysisHistory,
} from '@/services/api';
import type { AnalysisSummary, AnalysisDetail, AnalysisScope, AnalysisDepth } from '@/models/analysis';
import { usePortfolio } from '@/context/PortfolioContext';
import {
  IconSparkles,
  IconRefresh,
  IconTrash,
  IconCopy,
  IconCheck,
  IconX,
} from '@/components/atoms/icons';

// ── Collapsible section renderer ─────────────────────────────────────────────
function CollapsibleSections({ markdown }: { markdown: string }) {
  // Split on ## headings — each becomes a collapsible block
  const sections = useMemo(() => {
    const lines = markdown.split('\n');
    const result: { heading: string; body: string; defaultOpen: boolean }[] = [];
    let current: { heading: string; lines: string[] } | null = null;

    for (const line of lines) {
      if (/^## /.test(line)) {
        if (current) result.push({ heading: current.heading, body: current.lines.join('\n').trim(), defaultOpen: result.length === 0 });
        current = { heading: line.replace(/^## /, ''), lines: [] };
      } else if (current) {
        current.lines.push(line);
      }
    }
    if (current) result.push({ heading: current.heading, body: current.lines.join('\n').trim(), defaultOpen: result.length === 0 });
    return result;
  }, [markdown]);

  const [open, setOpen] = useState<Record<number, boolean>>({});

  // Initialise first section open on first render
  useEffect(() => {
    setOpen(sections.reduce((acc, _, i) => ({ ...acc, [i]: i === 0 }), {} as Record<number, boolean>));
  }, [sections.length]);

  if (!sections.length) return <MarkdownViewer>{markdown}</MarkdownViewer>;

  return (
    <div className="space-y-2">
      {sections.map((s, i) => {
        const isOpen = open[i] ?? false;
        return (
          <div key={i} className="border border-[var(--border)] rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen((prev) => ({ ...prev, [i]: !prev[i] }))}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--sidebar)] hover:bg-[var(--accent-light)] transition-colors text-left"
            >
              <span className="text-sm font-semibold text-[var(--ink-1)]">{s.heading}</span>
              <span className={`text-[var(--ink-4)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
              </span>
            </button>
            {isOpen && (
              <div className="px-4 py-3 border-t border-[var(--border)]">
                <MarkdownViewer>{s.body}</MarkdownViewer>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Rebalancing calculator ────────────────────────────────────────────────────
/** Parses "suggested weight" lines like "- **TICKER** — suggested: 15%" or "TICKER: 15%" from response */
function RebalancingCalc({ markdown, holdings }: { markdown: string; holdings?: { ticker: string; equity: number }[] }) {
  const suggestions = useMemo(() => {
    if (!holdings?.length) return null;
    // Extract suggested weights from lines like: TICKER.*(\d+)%
    const lines = markdown.split('\n');
    const found: Record<string, number> = {};
    for (const line of lines) {
      const m = line.match(/\*{0,2}([A-Z]{2,10})\*{0,2}[^%\n]*?(\d+(?:\.\d+)?)\s*%/);
      if (m) {
        const ticker = m[1];
        const pct = parseFloat(m[2]);
        if (pct > 0 && pct <= 100 && holdings.some(h => h.ticker === ticker)) {
          found[ticker] = pct;
        }
      }
    }
    if (!Object.keys(found).length) return null;

    const totalEquity = holdings.reduce((s, h) => s + h.equity, 0) || 1;
    return holdings
      .filter(h => found[h.ticker] != null)
      .map(h => ({
        ticker: h.ticker,
        current: parseFloat(((h.equity / totalEquity) * 100).toFixed(1)),
        suggested: found[h.ticker],
        delta: parseFloat((found[h.ticker] - (h.equity / totalEquity) * 100).toFixed(1)),
      }));
  }, [markdown, holdings]);

  if (!suggestions?.length) return null;

  return (
    <div className="mt-4 border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-[var(--sidebar)] border-b border-[var(--border)]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-4)]">Rebalancing Guide</p>
        <p className="text-[10px] text-[var(--ink-4)] mt-0.5">Weights mentioned in analysis</p>
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {['Ticker', 'Current %', 'Suggested %', 'Delta'].map(h => (
              <th key={h} className={`py-1.5 px-3 text-[9px] font-semibold uppercase text-[var(--ink-4)] ${h === 'Ticker' ? 'text-left' : 'text-right'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {suggestions.map(r => (
            <tr key={r.ticker} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--sidebar)]">
              <td className="py-2 px-3 font-mono font-semibold text-[var(--ink)]">{r.ticker}</td>
              <td className="py-2 px-3 font-mono text-right text-[var(--ink-2)]">{r.current}%</td>
              <td className="py-2 px-3 font-mono text-right text-[var(--ink-2)]">{r.suggested}%</td>
              <td className={`py-2 px-3 font-mono font-semibold text-right ${r.delta > 0 ? 'text-[var(--gain)]' : r.delta < 0 ? 'text-[var(--loss)]' : 'text-[var(--ink-4)]'}`}>
                {r.delta > 0 ? '+' : ''}{r.delta}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Scope / Depth badge ───────────────────────────────────────────────────────
const SCOPE_LABELS: Record<string, string> = {
  portfolio: 'Portfolio',
  watchlist: 'Watchlist',
  combined: 'Combined',
};
const DEPTH_COLORS: Record<string, string> = {
  quick: 'bg-[var(--accent-light)] text-[var(--accent)]',
  deep: 'bg-purple-100 text-purple-700',
};

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--ink-6)] text-[var(--ink-3)]">
      {SCOPE_LABELS[scope] ?? scope}
    </span>
  );
}
function DepthBadge({ depth }: { depth: string }) {
  return (
    <span
      className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${DEPTH_COLORS[depth] ?? ''}`}
    >
      {depth === 'quick' ? 'Haiku' : 'Sonnet'}
    </span>
  );
}

// ── Streaming cursor ──────────────────────────────────────────────────────────
function Cursor() {
  return (
    <span
      className="inline-block w-0.5 h-4 bg-[var(--accent)] ml-0.5 align-middle animate-pulse"
      aria-hidden
    />
  );
}

// ── History entry ─────────────────────────────────────────────────────────────
/** Strip residual markdown syntax so card text is always plain. */
function stripMd(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[-*>]\s+/gm, '')
    .trim();
}

function HistoryItem({
  item,
  active,
  onClick,
}: {
  item: AnalysisSummary;
  active: boolean;
  onClick: () => void;
}) {
  const d = new Date(item.created_at);
  const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const scopeLabel = SCOPE_LABELS[item.scope] ?? item.scope;
  const summary = item.summary ? stripMd(item.summary) : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-150 ${
        active
          ? 'border-[var(--accent)] bg-[var(--accent-light)]'
          : 'border-[var(--border)] bg-white hover:border-[var(--accent-light)]'
      }`}
    >
      {/* Heading row */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`text-xs font-semibold ${active ? 'text-[var(--accent)]' : 'text-[var(--ink-1)]'}`}>
          {scopeLabel} Analysis
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <DepthBadge depth={item.depth} />
        </div>
      </div>
      {/* Subheading — summary text */}
      <p className="text-[11px] text-[var(--ink-3)] line-clamp-2 leading-relaxed mb-1">
        {summary ?? 'No summary available'}
      </p>
      {/* Footer */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[var(--ink-5)]">{dateStr} · {timeStr}</span>
        {item.tokens_used ? (
          <span className="text-[10px] text-[var(--ink-5)]">~{item.tokens_used} tokens</span>
        ) : null}
      </div>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalysisPage() {
  const { data: portfolioData } = usePortfolio();
  const [scope, setScope] = useState<AnalysisScope>('portfolio');
  const [depth, setDepth] = useState<AnalysisDepth>('quick');

  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{ tokens: number; cached: boolean } | null>(null);

  const [history, setHistory] = useState<AnalysisSummary[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeDetail, setActiveDetail] = useState<AnalysisDetail | null>(null);

  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    try {
      const data = await fetchAnalysisHistory();
      setHistory(data);
    } catch {
      // silent — history is optional
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Auto-scroll page to bottom of viewer during stream
  useEffect(() => {
    if (streaming && viewerRef.current) {
      viewerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [streamText, streaming]);

  const handleRun = useCallback(() => {
    setStreaming(true);
    setStreamText('');
    setError(null);
    setTokenInfo(null);
    setActiveId(null);
    setActiveDetail(null);

    abortRef.current = streamAnalysis(
      scope,
      depth,
      (chunk) => setStreamText((prev) => prev + chunk),
      (id, tokens, cached) => {
        setStreaming(false);
        setTokenInfo({ tokens, cached });
        if (id) setActiveId(id);
        loadHistory();
      },
      (msg) => {
        setStreaming(false);
        setError(msg);
      },
    );
  }, [scope, depth, loadHistory]);

  const handleAbort = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const handleSelectHistory = useCallback(async (item: AnalysisSummary) => {
    setStreamText('');
    setError(null);
    setTokenInfo(null);
    setActiveId(item.id);
    try {
      const detail = await fetchAnalysisById(item.id);
      setActiveDetail(detail);
    } catch {
      setError('Failed to load analysis');
    }
  }, []);

  const handleClearHistory = useCallback(async () => {
    if (!confirm('Clear all analysis history?')) return;
    await clearAnalysisHistory();
    setHistory([]);
    setActiveId(null);
    setActiveDetail(null);
    setStreamText('');
  }, []);

  const handleCopy = useCallback(() => {
    const text = activeDetail?.full_response ?? streamText;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [activeDetail, streamText]);

  const displayText = activeDetail?.full_response ?? streamText;
  const displayEmpty = !displayText && !streaming && !error;

  return (
    <div className="min-h-screen bg-[var(--surface)] pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <IconSparkles width={18} height={18} className="text-[var(--accent)]" />
          <h1 className="text-lg font-bold text-[var(--ink-1)]">AI Analyst</h1>
        </div>
        <p className="text-xs text-[var(--ink-4)]">
          Claude analyses your portfolio and watchlist
        </p>
      </div>

      {/* Controls */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl border border-[var(--border)] p-3 space-y-3">
          {/* Scope pills */}
          <div>
            <p className="text-[10px] font-semibold text-[var(--ink-4)] uppercase tracking-wide mb-1.5">
              Scope
            </p>
            <div className="flex gap-1.5">
              {(['portfolio', 'watchlist', 'combined'] as AnalysisScope[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  disabled={streaming}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-lg border transition-all duration-150 ${
                    scope === s
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'bg-white text-[var(--ink-3)] border-[var(--border)] hover:border-[var(--accent-light)]'
                  } disabled:opacity-50`}
                >
                  {SCOPE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Depth toggle */}
          <div>
            <p className="text-[10px] font-semibold text-[var(--ink-4)] uppercase tracking-wide mb-1.5">
              Depth
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setDepth('quick')}
                disabled={streaming}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-lg border transition-all duration-150 ${
                  depth === 'quick'
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-white text-[var(--ink-3)] border-[var(--border)]'
                } disabled:opacity-50`}
              >
                Quick · Haiku
              </button>
              <button
                onClick={() => setDepth('deep')}
                disabled={streaming}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-lg border transition-all duration-150 ${
                  depth === 'deep'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-[var(--ink-3)] border-[var(--border)]'
                } disabled:opacity-50`}
              >
                Deep · Sonnet
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {streaming ? (
              <button
                onClick={handleAbort}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200"
              >
                <IconX width={14} height={14} />
                Abort
              </button>
            ) : (
              <button
                onClick={handleRun}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-xl bg-[var(--accent)] text-white"
              >
                <IconSparkles width={14} height={14} />
                Analyse Now
              </button>
            )}
            {displayText && !streaming && (
              <button
                onClick={handleRun}
                title="Re-run analysis"
                className="px-3 py-2.5 rounded-xl border border-[var(--border)] text-[var(--ink-3)] hover:border-[var(--accent-light)]"
              >
                <IconRefresh width={14} height={14} />
              </button>
            )}
            {displayText && (
              <button
                onClick={handleCopy}
                title="Copy to clipboard"
                className="px-3 py-2.5 rounded-xl border border-[var(--border)] text-[var(--ink-3)] hover:border-[var(--accent-light)]"
              >
                {copied ? (
                  <IconCheck width={14} height={14} className="text-[var(--gain)]" />
                ) : (
                  <IconCopy width={14} height={14} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content: viewer + history */}
      <div className="px-4 space-y-4">
        {/* Viewer */}
        <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
          {/* Viewer header */}
          {(activeDetail || (streamText && tokenInfo)) && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
              {activeDetail ? (
                <>
                  <ScopeBadge scope={activeDetail.scope} />
                  <DepthBadge depth={activeDetail.depth} />
                  <span className="text-[10px] text-[var(--ink-4)] ml-auto">
                    {new Date(activeDetail.created_at).toLocaleString()}
                    {activeDetail.tokens_used ? ` · ~${activeDetail.tokens_used} tokens` : ''}
                  </span>
                </>
              ) : tokenInfo ? (
                <>
                  <ScopeBadge scope={scope} />
                  <DepthBadge depth={depth} />
                  {tokenInfo.cached && (
                    <span className="text-[10px] text-[var(--ink-4)] bg-[var(--ink-6)] px-1.5 py-0.5 rounded">
                      cached
                    </span>
                  )}
                  {tokenInfo.tokens > 0 && (
                    <span className="text-[10px] text-[var(--ink-4)] ml-auto">
                      ~{tokenInfo.tokens} tokens used
                    </span>
                  )}
                </>
              ) : null}
            </div>
          )}

          <div ref={viewerRef} className="px-4 py-4">
            {displayEmpty && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <IconSparkles
                  width={32}
                  height={32}
                  className="text-[var(--ink-5)] mb-3"
                />
                <p className="text-sm text-[var(--ink-3)] font-medium">No analysis yet</p>
                <p className="text-xs text-[var(--ink-5)] mt-1">
                  Choose a scope and depth, then tap Analyse Now
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm font-semibold text-red-700 mb-0.5">Analysis failed</p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* During streaming: plain markdown. After: collapsible sections */}
            {streaming && streamText && (
              <MarkdownViewer>{streamText}</MarkdownViewer>
            )}

            {!streaming && displayText && (
              <>
                <CollapsibleSections markdown={displayText} />
                <RebalancingCalc
                  markdown={displayText}
                  holdings={(portfolioData?.ngx_stocks ?? [])
                    .filter(s => s.CurrentEquity != null)
                    .map(s => ({ ticker: s.Ticker, equity: s.CurrentEquity! }))}
                />
              </>
            )}

            {streaming && <Cursor />}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-[var(--border)] p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[var(--ink-3)]">Past Analyses</p>
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1 text-[10px] text-[var(--loss)] hover:underline"
              >
                <IconTrash width={10} height={10} />
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  active={item.id === activeId}
                  onClick={() => handleSelectHistory(item)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
