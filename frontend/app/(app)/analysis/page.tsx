'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import MarkdownViewer from '@/components/MarkdownViewer';
import { usePortfolio } from '@/context/PortfolioContext';
import {
  streamAnalysis,
  fetchAnalysisHistory,
  fetchAnalysisById,
  clearAnalysisHistory,
} from '@/services/api';
import type { AnalysisSummary, AnalysisDetail, AnalysisScope, AnalysisDepth } from '@/models/analysis';
import {
  IconSparkles,
  IconRefresh,
  IconTrash,
  IconCopy,
  IconCheck,
  IconX,
} from '@/components/atoms/icons';

// ── Helpers ───────────────────────────────────────────────────────────────────
const SCOPE_LABELS: Record<string, string> = {
  portfolio: 'Portfolio',
  watchlist: 'Watchlist',
  combined: 'Combined',
};

function stripMd(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^[-*>]\s+/gm, '')
    .trim();
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

// ── Collapsible sections ──────────────────────────────────────────────────────
function CollapsibleSections({ markdown }: { markdown: string }) {
  const sections = useMemo(() => {
    const lines = markdown.split('\n');
    const result: { heading: string; body: string }[] = [];
    let current: { heading: string; lines: string[] } | null = null;
    for (const line of lines) {
      if (/^## /.test(line)) {
        if (current) result.push({ heading: current.heading, body: current.lines.join('\n').trim() });
        current = { heading: line.replace(/^## /, ''), lines: [] };
      } else if (current) {
        current.lines.push(line);
      }
    }
    if (current) result.push({ heading: current.heading, body: current.lines.join('\n').trim() });
    return result;
  }, [markdown]);

  const [open, setOpen] = useState<Record<number, boolean>>({});
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
              onClick={() => setOpen(prev => ({ ...prev, [i]: !prev[i] }))}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--sidebar)] hover:bg-[var(--accent-light)] transition-colors text-left"
            >
              <span className="text-[13px] font-semibold text-[var(--ink)]">{s.heading}</span>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                className={`text-[var(--ink-4)] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-4 py-4 border-t border-[var(--border)]">
                <MarkdownViewer>{s.body}</MarkdownViewer>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Rebalancing table ─────────────────────────────────────────────────────────
function RebalancingCalc({
  markdown,
  holdings,
}: {
  markdown: string;
  holdings: { ticker: string; equity: number }[];
}) {
  const rows = useMemo(() => {
    if (!holdings.length) return null;
    const found: Record<string, number> = {};
    for (const line of markdown.split('\n')) {
      const m = line.match(/\*{0,2}([A-Z]{2,10})\*{0,2}[^%\n]*?(\d+(?:\.\d+)?)\s*%/);
      if (m) {
        const ticker = m[1], pct = parseFloat(m[2]);
        if (pct > 0 && pct <= 100 && holdings.some(h => h.ticker === ticker)) found[ticker] = pct;
      }
    }
    if (!Object.keys(found).length) return null;
    const total = holdings.reduce((s, h) => s + h.equity, 0) || 1;
    return holdings
      .filter(h => found[h.ticker] != null)
      .map(h => ({
        ticker: h.ticker,
        current: +((h.equity / total) * 100).toFixed(1),
        suggested: found[h.ticker],
        delta: +(found[h.ticker] - (h.equity / total) * 100).toFixed(1),
      }));
  }, [markdown, holdings]);

  if (!rows?.length) return null;

  return (
    <div className="card mt-4">
      <div className="px-4 pt-3.5 pb-2 border-b border-[var(--border)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ink-4)]">Rebalancing Guide</p>
        <p className="text-[10px] text-[var(--ink-4)] mt-0.5">Weights mentioned in analysis</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['Ticker', 'Current', 'Suggested', 'Delta'].map(h => (
                <th key={h} className={`py-2 px-4 text-[9px] font-semibold uppercase tracking-wide text-[var(--ink-4)] ${h === 'Ticker' ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.ticker} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--sidebar)]">
                <td className="py-2.5 px-4 font-mono font-semibold text-[var(--ink)]">{r.ticker}</td>
                <td className="py-2.5 px-4 font-mono text-right text-[var(--ink-2)]">{r.current}%</td>
                <td className="py-2.5 px-4 font-mono text-right text-[var(--ink-2)]">{r.suggested}%</td>
                <td className={`py-2.5 px-4 font-mono font-semibold text-right ${r.delta > 0 ? 'text-[var(--gain)]' : r.delta < 0 ? 'text-[var(--loss)]' : 'text-[var(--ink-4)]'}`}>
                  {r.delta > 0 ? '+' : ''}{r.delta}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── History card ──────────────────────────────────────────────────────────────
function HistoryCard({
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
  const summary = item.summary ? stripMd(item.summary) : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left card px-4 py-3 transition-all duration-150 ${
        active ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'hover:border-[var(--accent-light)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className={`text-[12px] font-semibold ${active ? 'text-[var(--accent)]' : 'text-[var(--ink)]'}`}>
          {SCOPE_LABELS[item.scope] ?? item.scope} Analysis
        </span>
        <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
          item.depth === 'deep' ? 'bg-purple-100 text-purple-700' : 'bg-[var(--accent-light)] text-[var(--accent)]'
        }`}>
          {item.depth === 'quick' ? 'Haiku' : 'Sonnet'}
        </span>
      </div>
      <p className="text-[11px] text-[var(--ink-3)] line-clamp-2 leading-relaxed mb-1.5">
        {summary ?? 'No summary available'}
      </p>
      <div className="flex items-center gap-2 text-[10px] text-[var(--ink-5)]">
        <span>{dateStr} · {timeStr}</span>
        {item.tokens_used ? <span>· ~{item.tokens_used} tokens</span> : null}
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
    try { setHistory(await fetchAnalysisHistory()); } catch { /* silent */ }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    if (streaming && viewerRef.current)
      viewerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [streamText, streaming]);

  const handleRun = useCallback(() => {
    setStreaming(true);
    setStreamText('');
    setError(null);
    setTokenInfo(null);
    setActiveId(null);
    setActiveDetail(null);
    abortRef.current = streamAnalysis(
      scope, depth,
      (chunk) => setStreamText(prev => prev + chunk),
      (id, tokens, cached) => { setStreaming(false); setTokenInfo({ tokens, cached }); if (id) setActiveId(id); loadHistory(); },
      (msg) => { setStreaming(false); setError(msg); },
    );
  }, [scope, depth, loadHistory]);

  const handleAbort = useCallback(() => { abortRef.current?.abort(); setStreaming(false); }, []);

  const handleSelectHistory = useCallback(async (item: AnalysisSummary) => {
    setStreamText(''); setError(null); setTokenInfo(null);
    setActiveId(item.id);
    try { setActiveDetail(await fetchAnalysisById(item.id)); }
    catch { setError('Failed to load analysis'); }
  }, []);

  const handleClearHistory = useCallback(async () => {
    if (!confirm('Clear all analysis history?')) return;
    await clearAnalysisHistory();
    setHistory([]); setActiveId(null); setActiveDetail(null); setStreamText('');
  }, []);

  const handleCopy = useCallback(() => {
    const text = activeDetail?.full_response ?? streamText;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }, [activeDetail, streamText]);

  const displayText = activeDetail?.full_response ?? streamText;
  const displayEmpty = !displayText && !streaming && !error;
  const ngxHoldings = (portfolioData?.ngx_stocks ?? [])
    .filter(s => s.CurrentEquity != null)
    .map(s => ({ ticker: s.Ticker, equity: s.CurrentEquity! }));

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[15px] font-semibold text-[var(--ink)]">AI Analyst</h1>
          <p className="text-[11px] text-[var(--ink-4)] mt-0.5">
            Claude analyses your portfolio and watchlist
          </p>
        </div>
        {displayText && !streaming && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold border border-[var(--border)] text-[var(--ink-3)] rounded-lg hover:border-[var(--accent-light)] transition-colors"
            >
              <IconRefresh width={12} height={12} />
              Re-run
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold border border-[var(--border)] text-[var(--ink-3)] rounded-lg hover:border-[var(--accent-light)] transition-colors"
            >
              {copied ? <IconCheck width={12} height={12} className="text-[var(--gain)]" /> : <IconCopy width={12} height={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* ── Controls card ── */}
      <div className="card px-4 py-4 space-y-4">
        {/* Scope */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ink-4)] mb-2">Scope</p>
          <div className="flex gap-2">
            {(['portfolio', 'watchlist', 'combined'] as AnalysisScope[]).map(s => (
              <button
                key={s}
                onClick={() => setScope(s)}
                disabled={streaming}
                className={`flex-1 text-[12px] font-semibold py-2 rounded-lg border transition-all duration-150 disabled:opacity-50 ${
                  scope === s
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-white text-[var(--ink-3)] border-[var(--border)] hover:border-[var(--accent-light)]'
                }`}
              >
                {SCOPE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Depth */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ink-4)] mb-2">Depth</p>
          <div className="flex gap-2">
            {([
              { key: 'quick', label: 'Quick · Haiku', active: 'bg-[var(--accent)] text-white border-[var(--accent)]' },
              { key: 'deep',  label: 'Deep · Sonnet', active: 'bg-purple-600 text-white border-purple-600' },
            ] as { key: AnalysisDepth; label: string; active: string }[]).map(d => (
              <button
                key={d.key}
                onClick={() => setDepth(d.key)}
                disabled={streaming}
                className={`flex-1 text-[12px] font-semibold py-2 rounded-lg border transition-all duration-150 disabled:opacity-50 ${
                  depth === d.key ? d.active : 'bg-white text-[var(--ink-3)] border-[var(--border)] hover:border-[var(--accent-light)]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Run / Abort */}
        {streaming ? (
          <button
            onClick={handleAbort}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
          >
            <IconX width={14} height={14} />
            Stop
          </button>
        ) : (
          <button
            onClick={handleRun}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold bg-[var(--accent)] text-white hover:bg-[#17A06B] transition-colors"
          >
            <IconSparkles width={14} height={14} />
            Analyse Now
          </button>
        )}
      </div>

      {/* ── Result viewer ── */}
      {(displayText || streaming || error) && (
        <div className="card overflow-hidden">
          {/* Meta bar */}
          {(activeDetail || tokenInfo) && (
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--sidebar)]">
              {(() => {
                const s = activeDetail?.scope ?? scope;
                const d = activeDetail?.depth ?? depth;
                const ts = activeDetail
                  ? new Date(activeDetail.created_at).toLocaleString()
                  : null;
                const tok = activeDetail?.tokens_used ?? tokenInfo?.tokens;
                const cached = tokenInfo?.cached;
                return (
                  <>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--ink-6)] text-[var(--ink-3)]">
                      {SCOPE_LABELS[s] ?? s}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${d === 'deep' ? 'bg-purple-100 text-purple-700' : 'bg-[var(--accent-light)] text-[var(--accent)]'}`}>
                      {d === 'quick' ? 'Haiku' : 'Sonnet'}
                    </span>
                    {cached && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--ink-6)] text-[var(--ink-4)]">cached</span>}
                    <span className="ml-auto text-[10px] text-[var(--ink-4)]">
                      {ts ?? ''}{tok ? ` · ~${tok} tokens` : ''}
                    </span>
                  </>
                );
              })()}
            </div>
          )}

          <div ref={viewerRef} className="px-4 py-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-[13px] font-semibold text-red-700 mb-0.5">Analysis failed</p>
                <p className="text-[11px] text-red-600">{error}</p>
              </div>
            )}

            {/* Streaming: flat render */}
            {streaming && streamText && <MarkdownViewer>{streamText}</MarkdownViewer>}
            {streaming && <Cursor />}

            {/* Done: collapsible sections + rebalancing */}
            {!streaming && displayText && (
              <>
                <CollapsibleSections markdown={displayText} />
                <RebalancingCalc markdown={displayText} holdings={ngxHoldings} />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {displayEmpty && (
        <div className="card px-6 py-14 flex flex-col items-center text-center">
          <IconSparkles width={28} height={28} className="text-[var(--ink-5)] mb-3" />
          <p className="text-[13px] font-semibold text-[var(--ink-3)]">No analysis yet</p>
          <p className="text-[11px] text-[var(--ink-5)] mt-1">Choose a scope and depth, then tap Analyse Now</p>
        </div>
      )}

      {/* ── History ── */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[13px] font-semibold text-[var(--ink)]">Past Analyses</h2>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1 text-[11px] text-[var(--loss)] hover:underline"
            >
              <IconTrash width={11} height={11} />
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {history.map(item => (
              <HistoryCard
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
  );
}
