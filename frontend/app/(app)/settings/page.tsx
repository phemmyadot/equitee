'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getHoldings, getClosedPositions,
  createHolding, updateHolding, deleteHolding,
  buyShares, sellShares,
  type HoldingRecord, type ClosedRecord, type SellResult,
} from '@/services/settingsApi';
import { fmtNGN, fmtUSD, fmtPct } from '@/lib/formatters';
import { useAuth } from '@/context/AuthContext';
import { usePortfolio } from '@/context/PortfolioContext';
import {
  IconX, IconCheck, IconAlertCircle, IconCopy, IconPlus, IconMinus, IconEdit, IconTrash,
} from '@/components/ui/icons';

// ─────────────────────────────────────────────────────────────────────────────
// Tiny reusable primitives
// ─────────────────────────────────────────────────────────────────────────────

const SECTORS = [
  'Banking','Consumer','Construction','Energy','Healthcare',
  'Insurance','Manufacturing','Media','Technology','Telecom',
  'Agro','Other',
];

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">
        {label}
      </label>
      {children}
      {error && <span className="text-[10px] text-[var(--loss)]">{error}</span>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'h-8 px-2.5 rounded-md text-[12px] font-mono text-[var(--ink)]',
        'bg-white border border-[var(--border)] outline-none',
        'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-light)]',
        'disabled:bg-[var(--canvas)] disabled:text-[var(--ink-4)]',
        'transition-colors duration-150',
        props.className ?? '',
      ].join(' ')}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        'h-8 px-2.5 rounded-md text-[12px] text-[var(--ink)]',
        'bg-white border border-[var(--border)] outline-none',
        'focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-light)]',
        'transition-colors duration-150',
        props.className ?? '',
      ].join(' ')}
    />
  );
}

function Btn({
  children, variant = 'primary', size = 'sm', loading, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'xs';
  loading?: boolean;
}) {
  const base = 'inline-flex items-center gap-1.5 font-semibold rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';
  const sizes = { sm: 'px-3 py-1.5 text-[11px]', xs: 'px-2 py-1 text-[10px]' };
  const variants = {
    primary:   'bg-[var(--accent)] text-white hover:bg-[#17A06B]',
    secondary: 'bg-white border border-[var(--border)] text-[var(--ink-2)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]',
    danger:    'bg-white border border-[#F5C6C6] text-[var(--loss)] hover:bg-[var(--loss-light)]',
    ghost:     'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--canvas)]',
  };
  return (
    <button {...props} disabled={props.disabled || loading} className={`${base} ${sizes[size]} ${variants[variant]}`}>
      {loading && (
        <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      )}
      {children}
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-xl border border-[var(--border)] shadow-[var(--shadow-md)] w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-[13px] font-semibold text-[var(--ink)]">{title}</h2>
          <button onClick={onClose} className="text-[var(--ink-4)] hover:text-[var(--ink)] transition-colors">
            <IconX width={16} height={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={[
      'fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[300]',
      'flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-[var(--shadow-md)]',
      'text-[12px] font-medium animate-[page-in_0.2s_ease_both]',
      type === 'success'
        ? 'bg-[var(--gain-light)] text-[var(--gain)] border border-[#A7D7BC]'
        : 'bg-[var(--loss-light)] text-[var(--loss)] border border-[#F5C6C6]',
    ].join(' ')}>
      {type === 'success'
        ? <IconCheck width={13} height={13} />
        : <IconAlertCircle width={13} height={13} />
      }
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: 'add' }
  | { type: 'edit';   holding: HoldingRecord }
  | { type: 'buy';    holding: HoldingRecord }
  | { type: 'sell';   holding: HoldingRecord }
  | { type: 'delete'; holding: HoldingRecord }
  | null;

type Tab = 'active' | 'closed';

// ─────────────────────────────────────────────────────────────────────────────
// Invite code types
// ─────────────────────────────────────────────────────────────────────────────

interface InviteCode {
  code:       string;
  created_at: string;
  used:       boolean;
  used_at:    string | null;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  // Normalise: replace space separator with T, truncate microseconds to ms
  const d = new Date(iso.replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1'));
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin invite panel
// ─────────────────────────────────────────────────────────────────────────────

function AdminInvitePanel({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [invites, setInvites]   = useState<InviteCode[]>([]);
  const [loading, setLoading]   = useState(false);
  const [genBusy, setGenBusy]   = useState(false);
  const [copied,  setCopied]    = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/invites');
      if (res.ok) setInvites(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadInvites(); }, [loadInvites]);

  const generate = async () => {
    setGenBusy(true);
    try {
      const res = await fetch('/api/auth/invite', { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).detail ?? 'Failed');
      const data = await res.json();
      setInvites(prev => [data, ...prev]);
      showToast(`Invite code created: ${data.code}`);
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally { setGenBusy(false); }
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-semibold text-[var(--ink)]">Invite Codes</h2>
          <p className="text-[11px] text-[var(--ink-4)] mt-0.5">Generate codes for new users to register</p>
        </div>
        <Btn variant="primary" size="sm" loading={genBusy} onClick={generate}>
          <IconPlus width={11} height={11} />
          Generate
        </Btn>
      </div>

      {loading ? (
        <p className="text-[11px] text-[var(--ink-4)]">Loading…</p>
      ) : invites.length === 0 ? (
        <p className="text-[11px] text-[var(--ink-4)]">No invite codes yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Created</th>
                <th>Status</th>
                <th className="right">Copy</th>
              </tr>
            </thead>
            <tbody>
              {invites.map(inv => (
                <tr key={inv.code}>
                  <td>
                    <span className="font-mono font-semibold text-[11px] tracking-widest text-[var(--ink)]">
                      {inv.code}
                    </span>
                  </td>
                  <td className="text-[var(--ink-4)] font-mono text-[11px]">
                    {fmtDate(inv.created_at)}
                  </td>
                  <td>
                    {inv.used ? (
                      <span className="badge badge-nodata">Used</span>
                    ) : (
                      <span className="badge badge-live">Available</span>
                    )}
                  </td>
                  <td className="right">
                    {!inv.used && (
                      <Btn size="xs" variant="ghost" onClick={() => copy(inv.code)}>
                        {copied === inv.code ? (
                          <IconCheck width={11} height={11} />
                        ) : (
                          <IconCopy width={11} height={11} />
                        )}
                        {copied === inv.code ? 'Copied!' : 'Copy'}
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user }                    = useAuth();
  const { refresh: refreshPortfolio } = usePortfolio();
  const [tab,      setTab]     = useState<Tab>('active');
  const [holdings, setHoldings] = useState<HoldingRecord[]>([]);
  const [closed,   setClosed]   = useState<ClosedRecord[]>([]);
  const [modal,    setModal]    = useState<ModalState>(null);
  const [toast,    setToast]    = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [busy,     setBusy]     = useState(false);
  const [filter,   setFilter]   = useState<'all' | 'ngx' | 'us'>('all');

  // ── Load data ──────────────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    const [h, c] = await Promise.all([getHoldings(), getClosedPositions()]);
    setHoldings(h);
    setClosed(c);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Filtered active holdings ───────────────────────────────────────────────
  const active = holdings.filter(h =>
    h.is_active && (filter === 'all' || h.market === filter)
  );

  const fmtCost  = (h: HoldingRecord) => h.market === 'ngx' ? fmtNGN(h.avg_cost) : fmtUSD(h.avg_cost);
  const fmtValue = (h: HoldingRecord) => h.market === 'ngx' ? fmtNGN(h.shares * h.avg_cost) : fmtUSD(h.shares * h.avg_cost);

  return (
    <div className="space-y-5">

      {/* ── Admin: invite codes ── */}
      {user?.is_admin && <AdminInvitePanel showToast={showToast} />}

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-[var(--ink)]">Portfolio Settings</h1>
          <p className="text-[11px] text-[var(--ink-4)] mt-0.5">
            {holdings.filter(h => h.is_active).length} active · {closed.length} closed positions
          </p>
        </div>
        <Btn variant="primary" onClick={() => setModal({ type: 'add' })}>
          <IconPlus width={12} height={12} />
          Add Position
        </Btn>
      </div>

      {/* ── Tabs + filter ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-0 border border-[var(--border)] rounded-lg overflow-hidden">
          {(['active', 'closed'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'px-4 py-2 text-[11px] font-semibold capitalize transition-colors duration-150',
                tab === t
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-white text-[var(--ink-3)] hover:text-[var(--ink)]',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'active' && (
          <div className="flex gap-1">
            {(['all', 'ngx', 'us'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  'px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors',
                  filter === f
                    ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                    : 'text-[var(--ink-4)] hover:text-[var(--ink)]',
                ].join(' ')}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Active holdings table ── */}
      {tab === 'active' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Name</th>
                  <th>Market</th>
                  <th>Sector</th>
                  <th className="right">Shares</th>
                  <th className="right">Avg Cost</th>
                  <th className="right">Cost Basis</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {active.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-[var(--ink-4)] py-8 text-[12px]">
                      No positions yet. Click "Add Position" to get started.
                    </td>
                  </tr>
                )}
                {active.map(h => (
                  <tr key={h.id}>
                    <td>
                      <span className="font-mono font-semibold text-[var(--ink)] text-[11px]">{h.ticker}</span>
                    </td>
                    <td className="text-[var(--ink-2)] max-w-[160px] truncate">{h.name}</td>
                    <td>
                      <span className={[
                        'badge',
                        h.market === 'ngx' ? 'badge-live' : 'badge-yahoo',
                      ].join(' ')}>
                        {h.market.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-[var(--ink-3)]">{h.sector}</td>
                    <td className="right font-mono text-[var(--ink)]">{h.shares.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                    <td className="right font-mono text-[var(--ink-3)]">{fmtCost(h)}</td>
                    <td className="right font-mono font-medium text-[var(--ink)]">{fmtValue(h)}</td>
                    <td className="right">
                      <div className="flex items-center justify-end gap-1">
                        <Btn size="xs" variant="ghost" onClick={() => setModal({ type: 'buy', holding: h })} title="Buy more">
                          <IconPlus width={11} height={11} />
                          Buy
                        </Btn>
                        <Btn size="xs" variant="ghost" onClick={() => setModal({ type: 'sell', holding: h })} title="Sell shares">
                          <IconMinus width={11} height={11} />
                          Sell
                        </Btn>
                        <Btn size="xs" variant="ghost" onClick={() => setModal({ type: 'edit', holding: h })} title="Edit">
                          <IconEdit width={11} height={11} />
                        </Btn>
                        <Btn size="xs" variant="danger" onClick={() => setModal({ type: 'delete', holding: h })} title="Delete">
                          <IconTrash width={11} height={11} />
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Closed positions table ── */}
      {tab === 'closed' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Name</th>
                  <th>Market</th>
                  <th className="right">Realized P/L</th>
                  <th>Closed</th>
                </tr>
              </thead>
              <tbody>
                {closed.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-[var(--ink-4)] py-8 text-[12px]">
                      No closed positions yet.
                    </td>
                  </tr>
                )}
                {closed.map(c => (
                  <tr key={c.id}>
                    <td><span className="font-mono font-semibold text-[var(--ink)] text-[11px]">{c.ticker}</span></td>
                    <td className="text-[var(--ink-2)]">{c.name}</td>
                    <td><span className="badge badge-nodata">{c.market.toUpperCase()}</span></td>
                    <td className={`right font-mono font-semibold ${c.realized_pl >= 0 ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
                      {c.market === 'ngx' ? fmtNGN(c.realized_pl) : fmtUSD(c.realized_pl)}
                    </td>
                    <td className="text-[var(--ink-4)] font-mono text-[11px]">
                      {new Date(c.closed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── Add position ── */}
      {modal?.type === 'add' && (
        <AddModal
          onClose={() => setModal(null)}
          onDone={() => { reload(); refreshPortfolio(); setModal(null); showToast('Position added'); }}
        />
      )}

      {/* ── Edit position ── */}
      {modal?.type === 'edit' && (
        <EditModal
          holding={modal.holding}
          onClose={() => setModal(null)}
          onDone={() => { reload(); refreshPortfolio(); setModal(null); showToast('Position updated'); }}
        />
      )}

      {/* ── Buy more ── */}
      {modal?.type === 'buy' && (
        <BuyModal
          holding={modal.holding}
          onClose={() => setModal(null)}
          onDone={() => { reload(); refreshPortfolio(); setModal(null); showToast(`Shares added to ${modal.holding.ticker}`); }}
        />
      )}

      {/* ── Sell ── */}
      {modal?.type === 'sell' && (
        <SellModal
          holding={modal.holding}
          onClose={() => setModal(null)}
          onDone={(res) => {
            reload();
            refreshPortfolio();
            setModal(null);
            const pl = res.holding.market === 'ngx' ? fmtNGN(res.realized_pl) : fmtUSD(res.realized_pl);
            showToast(
              res.fully_closed
                ? `${modal.holding.ticker} fully closed · P/L ${pl}`
                : `Sold · Realized P/L ${pl}`
            );
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* ── Delete confirm ── */}
      {modal?.type === 'delete' && (
        <Modal title={`Delete ${modal.holding.ticker}?`} onClose={() => setModal(null)}>
          <p className="text-[12px] text-[var(--ink-3)]">
            This will permanently remove <strong className="text-[var(--ink)]">{modal.holding.name}</strong> and
            all its data. This cannot be undone.
          </p>
          <p className="text-[11px] text-[var(--ink-4)] bg-[var(--loss-light)] border border-[#F5C6C6] rounded-md px-3 py-2">
            If you want to record a realized P/L, use <strong>Sell</strong> instead.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn
              variant="danger"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await deleteHolding(modal.holding.id);
                  reload(); refreshPortfolio(); setModal(null); showToast(`${modal.holding.ticker} deleted`);
                } catch (e: any) {
                  showToast(e.message, 'error');
                } finally { setBusy(false); }
              }}
            >
              Delete
            </Btn>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Modal
// ─────────────────────────────────────────────────────────────────────────────

function AddModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    ticker: '', name: '', market: 'ngx', shares: '', avg_cost: '', sector: 'Other',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy,   setBusy]   = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.ticker.trim()) e.ticker = 'Required';
    if (!form.name.trim())   e.name   = 'Required';
    if (!form.shares || isNaN(Number(form.shares)) || Number(form.shares) <= 0) e.shares = 'Must be > 0';
    if (!form.avg_cost || isNaN(Number(form.avg_cost)) || Number(form.avg_cost) <= 0) e.avg_cost = 'Must be > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      await createHolding({
        ticker:   form.ticker.trim().toUpperCase(),
        name:     form.name.trim(),
        market:   form.market,
        shares:   Number(form.shares),
        avg_cost: Number(form.avg_cost),
        sector:   form.sector,
      });
      onDone();
    } catch (e: any) {
      setErrors({ _: e.message });
    } finally { setBusy(false); }
  };

  return (
    <Modal title="Add New Position" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ticker" error={errors.ticker}>
          <Input value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())} placeholder="e.g. GTCO" />
        </Field>
        <Field label="Market">
          <Select value={form.market} onChange={e => set('market', e.target.value)}>
            <option value="ngx">NGX</option>
            <option value="us">US</option>
          </Select>
        </Field>
        <Field label="Company Name" error={errors.name}>
          <Input className="col-span-2" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Guaranty Trust Holding Co" />
        </Field>
        <Field label="Sector">
          <Select value={form.sector} onChange={e => set('sector', e.target.value)}>
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Shares" error={errors.shares}>
          <Input type="number" min="0" step="any" value={form.shares} onChange={e => set('shares', e.target.value)} placeholder="0" />
        </Field>
        <Field label={`Avg Cost (${form.market === 'ngx' ? '₦' : '$'}) per share`} error={errors.avg_cost}>
          <Input type="number" min="0" step="any" value={form.avg_cost} onChange={e => set('avg_cost', e.target.value)} placeholder="0.00" />
        </Field>
      </div>
      {errors._ && <p className="text-[11px] text-[var(--loss)]">{errors._}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={busy} onClick={submit}>Add Position</Btn>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Modal
// ─────────────────────────────────────────────────────────────────────────────

function EditModal({ holding, onClose, onDone }: { holding: HoldingRecord; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    name:     holding.name,
    sector:   holding.sector,
    avg_cost: String(holding.avg_cost),
    shares:   String(holding.shares),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setBusy(true);
    try {
      await updateHolding(holding.id, {
        name:     form.name,
        sector:   form.sector,
        avg_cost: Number(form.avg_cost),
        shares:   Number(form.shares),
      });
      onDone();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal title={`Edit ${holding.ticker}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company Name">
          <Input value={form.name} onChange={e => set('name', e.target.value)} />
        </Field>
        <Field label="Sector">
          <Select value={form.sector} onChange={e => set('sector', e.target.value)}>
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Shares">
          <Input type="number" min="0" step="any" value={form.shares} onChange={e => set('shares', e.target.value)} />
        </Field>
        <Field label={`Avg Cost (${holding.market === 'ngx' ? '₦' : '$'})`}>
          <Input type="number" min="0" step="any" value={form.avg_cost} onChange={e => set('avg_cost', e.target.value)} />
        </Field>
      </div>
      {error && <p className="text-[11px] text-[var(--loss)]">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={busy} onClick={submit}>Save Changes</Btn>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Buy Modal
// ─────────────────────────────────────────────────────────────────────────────

function BuyModal({ holding, onClose, onDone }: { holding: HoldingRecord; onClose: () => void; onDone: () => void }) {
  const [shares,    setShares]    = useState('');
  const [buyPrice,  setBuyPrice]  = useState('');
  const [busy,      setBusy]      = useState(false);
  const [error,     setError]     = useState('');

  const newAvg = shares && buyPrice
    ? ((holding.shares * holding.avg_cost) + (Number(shares) * Number(buyPrice))) / (holding.shares + Number(shares))
    : null;

  const submit = async () => {
    if (!shares || !buyPrice) { setError('Both fields required'); return; }
    setBusy(true);
    try {
      await buyShares(holding.id, { shares: Number(shares), buy_price: Number(buyPrice) });
      onDone();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const cur = holding.market === 'ngx' ? '₦' : '$';

  return (
    <Modal title={`Buy More · ${holding.ticker}`} onClose={onClose}>
      <div className="bg-[var(--canvas)] rounded-lg px-3 py-2.5 text-[11px] font-mono space-y-0.5">
        <div className="flex justify-between"><span className="text-[var(--ink-4)]">Current shares</span><span>{holding.shares.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span></div>
        <div className="flex justify-between"><span className="text-[var(--ink-4)]">Current avg cost</span><span>{cur}{holding.avg_cost.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Shares to buy">
          <Input type="number" min="0" step="any" value={shares} onChange={e => setShares(e.target.value)} placeholder="0" />
        </Field>
        <Field label={`Buy price (${cur})`}>
          <Input type="number" min="0" step="any" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="0.00" />
        </Field>
      </div>
      {newAvg !== null && (
        <div className="bg-[var(--accent-light)] rounded-md px-3 py-2 text-[11px] font-mono flex justify-between">
          <span className="text-[var(--ink-3)]">New avg cost</span>
          <span className="font-semibold text-[var(--accent)]">{cur}{newAvg.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
        </div>
      )}
      {error && <p className="text-[11px] text-[var(--loss)]">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" loading={busy} onClick={submit}>Confirm Buy</Btn>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sell Modal
// ─────────────────────────────────────────────────────────────────────────────

function SellModal({
  holding, onClose, onDone, onError,
}: {
  holding: HoldingRecord;
  onClose: () => void;
  onDone: (res: SellResult) => void;
  onError: (msg: string) => void;
}) {
  const [shares,     setShares]     = useState('');
  const [salePrice,  setSalePrice]  = useState('');
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState('');

  const cur = holding.market === 'ngx' ? '₦' : '$';
  const sharesNum    = Number(shares)    || 0;
  const salePriceNum = Number(salePrice) || 0;
  const projPL       = sharesNum > 0 && salePriceNum > 0
    ? (salePriceNum - holding.avg_cost) * sharesNum
    : null;
  const fullSale = sharesNum >= holding.shares;

  const submit = async () => {
    if (!shares || !salePrice) { setError('Both fields required'); return; }
    if (sharesNum > holding.shares) { setError(`Max ${holding.shares} shares`); return; }
    setBusy(true);
    try {
      const res = await sellShares(holding.id, { shares_sold: sharesNum, sale_price: salePriceNum });
      onDone(res);
    } catch (e: any) { setError(e.message); onError(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal title={`Sell · ${holding.ticker}`} onClose={onClose}>
      <div className="bg-[var(--canvas)] rounded-lg px-3 py-2.5 text-[11px] font-mono space-y-0.5">
        <div className="flex justify-between"><span className="text-[var(--ink-4)]">Shares held</span><span>{holding.shares.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span></div>
        <div className="flex justify-between"><span className="text-[var(--ink-4)]">Avg cost</span><span>{cur}{holding.avg_cost.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Shares to sell">
          <Input type="number" min="0" step="any" max={holding.shares} value={shares} onChange={e => setShares(e.target.value)} placeholder="0" />
        </Field>
        <Field label={`Sale price (${cur})`}>
          <Input type="number" min="0" step="any" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="0.00" />
        </Field>
      </div>

      {projPL !== null && (
        <div className={[
          'rounded-md px-3 py-2 text-[11px] font-mono',
          projPL >= 0 ? 'bg-[var(--gain-light)]' : 'bg-[var(--loss-light)]',
        ].join(' ')}>
          <div className="flex justify-between">
            <span className="text-[var(--ink-3)]">Projected P/L</span>
            <span className={`font-semibold ${projPL >= 0 ? 'text-[var(--gain)]' : 'text-[var(--loss)]'}`}>
              {projPL >= 0 ? '+' : ''}{cur}{Math.abs(projPL).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          {fullSale && (
            <p className="text-[var(--ink-4)] mt-1">This will fully close the position.</p>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-[var(--loss)]">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant={fullSale ? 'danger' : 'primary'} loading={busy} onClick={submit}>
          {fullSale ? 'Close Position' : 'Record Sale'}
        </Btn>
      </div>
    </Modal>
  );
}