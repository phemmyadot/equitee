import clsx from 'clsx';

type Accent = 'green' | 'gold' | 'blue' | 'red' | 'purple' | 'muted';

interface KPICardProps {
  label:   string;
  value:   string | number;
  sub?:    string;
  accent?: Accent;
  delay?:  number;
}

const ACCENT_STYLES: Record<Accent, { bar: string; value: string }> = {
  green:  { bar: 'bg-[var(--green)]',  value: 'text-[var(--green)]'  },
  gold:   { bar: 'bg-[var(--gold)]',   value: 'text-[var(--gold)]'   },
  blue:   { bar: 'bg-[var(--blue)]',   value: 'text-[var(--blue)]'   },
  red:    { bar: 'bg-[var(--red)]',    value: 'text-[var(--red)]'    },
  purple: { bar: 'bg-[var(--purple)]', value: 'text-[var(--purple)]' },
  muted:  { bar: 'bg-[var(--muted)]',  value: 'text-[var(--snow)]'   },
};

export default function KPICard({ label, value, sub, accent = 'blue', delay = 0 }: KPICardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div
      className="kpi-animate chart-card flex-1 min-w-[140px] flex flex-col gap-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Accent bar */}
      <div className={clsx('w-5 h-0.5 rounded-full mb-1', styles.bar)} />

      <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-[var(--muted)]">
        {label}
      </span>

      <span className={clsx('font-mono text-[18px] font-bold leading-tight', styles.value)}>
        {value}
      </span>

      {sub && (
        <span className="font-mono text-[9px] text-[var(--muted)] mt-0.5 leading-relaxed">
          {sub}
        </span>
      )}
    </div>
  );
}