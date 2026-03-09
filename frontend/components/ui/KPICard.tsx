import clsx from 'clsx';

type Accent = 'gain' | 'loss' | 'accent' | 'teal' | 'warn' | 'neutral';

interface KPICardProps {
  label:   string;
  value:   string | number;
  sub?:    string;
  accent?: Accent;
  delay?:  number;
}

const STYLES: Record<Accent, { value: string; dot: string; bg: string }> = {
  gain:    { value: 'text-[var(--gain)]',   dot: 'bg-[var(--gain)]',   bg: 'bg-[var(--gain-light)]'  },
  loss:    { value: 'text-[var(--loss)]',   dot: 'bg-[var(--loss)]',   bg: 'bg-[var(--loss-light)]'  },
  accent:  { value: 'text-[var(--accent)]', dot: 'bg-[var(--accent)]', bg: 'bg-[var(--accent-light)]'},
  teal:    { value: 'text-[var(--teal)]',   dot: 'bg-[var(--teal)]',   bg: 'bg-[#E0F2F7]'           },
  warn:    { value: 'text-[var(--warn)]',   dot: 'bg-[var(--warn)]',   bg: 'bg-[var(--warn-light)]'  },
  neutral: { value: 'text-[var(--ink)]',    dot: 'bg-[var(--ink-4)]',  bg: 'bg-[var(--sidebar)]'     },
};

export default function KPICard({ label, value, sub, accent = 'neutral', delay = 0 }: KPICardProps) {
  const s = STYLES[accent];

  return (
    <div
      className={clsx(
        'kpi-animate card flex-1 min-w-[120px]',
        'flex flex-col gap-1 px-4 py-4',
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Label row */}
      <div className="flex items-center gap-1.5">
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--ink-4)]">
          {label}
        </span>
      </div>

      {/* Value */}
      <span className={clsx('font-mono text-[20px] font-semibold leading-tight mt-0.5', s.value)}>
        {value}
      </span>

      {/* Sub text */}
      {sub && (
        <span className="text-[10px] text-[var(--ink-4)] leading-relaxed mt-0.5 font-mono">
          {sub}
        </span>
      )}
    </div>
  );
}