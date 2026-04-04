'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const components: Components = {
  // ── Headings ────────────────────────────────────────────────────────────────
  h1: ({ children }) => (
    <h1 className="text-xl font-bold mt-6 mb-3 pb-2 border-b border-[var(--border)] text-[var(--ink-1)] tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold mt-5 mb-2 pb-1.5 border-b border-[var(--border)] text-[var(--ink-1)] tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-bold mt-4 mb-1.5 text-[var(--ink-1)]">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold mt-3 mb-1 text-[var(--ink-2)]">{children}</h4>
  ),

  // ── Body ────────────────────────────────────────────────────────────────────
  p: ({ children }) => (
    <p className="mb-3 leading-relaxed text-[var(--ink-2)]">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--ink-1)]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-[var(--ink-3)]">{children}</em>
  ),
  del: ({ children }) => (
    <del className="line-through text-[var(--ink-4)]">{children}</del>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--accent)] underline underline-offset-2 hover:opacity-80 transition-opacity"
    >
      {children}
    </a>
  ),

  // ── Lists ───────────────────────────────────────────────────────────────────
  ul: ({ children }) => (
    <ul className="list-none pl-0 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1 text-[var(--ink-2)]">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 leading-relaxed text-[var(--ink-2)] text-sm">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)] opacity-70" />
      <span>{children}</span>
    </li>
  ),

  // ── Divider ─────────────────────────────────────────────────────────────────
  hr: () => <hr className="border-[var(--border)] my-4" />,

  // ── Blockquote ──────────────────────────────────────────────────────────────
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[var(--accent)] bg-[var(--accent-light)] rounded-r-lg pl-4 pr-3 py-2 my-3 text-[var(--ink-2)] italic text-sm">
      {children}
    </blockquote>
  ),

  // ── Inline code ─────────────────────────────────────────────────────────────
  code: ({ children, className }) => {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      // block code is wrapped by <pre> below — just pass raw text
      return <code className="font-mono text-xs text-[var(--ink-1)]">{children}</code>;
    }
    return (
      <code className="bg-[var(--canvas)] border border-[var(--border)] text-[var(--accent)] px-1.5 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
    );
  },

  // ── Code block ──────────────────────────────────────────────────────────────
  pre: ({ children }) => (
    <pre className="bg-[var(--ink-1)] text-[var(--canvas)] rounded-xl px-4 py-3 mb-3 overflow-x-auto text-xs leading-relaxed font-mono whitespace-pre-wrap">
      {children}
    </pre>
  ),

  // ── Table ───────────────────────────────────────────────────────────────────
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4 rounded-xl border border-[var(--border)]">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[var(--canvas)] border-b border-[var(--border)]">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-[var(--border)] last:border-0 even:bg-[var(--surface)]">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-[var(--ink-2)] whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-[var(--ink-2)] align-top">{children}</td>
  ),
};

interface MarkdownViewerProps {
  children: string;
  className?: string;
}

export default function MarkdownViewer({ children, className = '' }: MarkdownViewerProps) {
  return (
    <div className={`text-sm ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
