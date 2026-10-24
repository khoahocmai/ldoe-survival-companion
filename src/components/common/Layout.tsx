import React from 'react';
import { Tone, toneStyles } from './Badge';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Every page starts with this: short title, one line of context, primary actions on the right. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon, actions }) => (
  <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 items-start gap-3">
      {icon && (
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </header>
);

interface SectionProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** A titled block inside a page or detail panel. */
export const Section: React.FC<SectionProps> = ({ title, description, action, children, className = '' }) => (
  <section className={className}>
    {(title || action) && (
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

interface StatProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  tone?: Tone;
  hint?: string;
}

const statValueTone: Record<Tone, string> = {
  neutral: 'text-fg',
  accent: 'text-accent',
  ok: 'text-ok',
  info: 'text-info',
  warn: 'text-warn',
  danger: 'text-danger',
};

export const Stat: React.FC<StatProps> = ({ label, value, unit, tone = 'neutral', hint }) => (
  <div className="rounded-lg bg-subtle px-3 py-2.5">
    <div className="text-xs text-muted">{label}</div>
    <div className={`num mt-0.5 text-lg font-semibold leading-tight ${statValueTone[tone]}`}>
      {value}
      {unit && <span className="ml-1 text-xs font-normal text-muted">{unit}</span>}
    </div>
    {hint && <div className="mt-0.5 text-xs text-faint">{hint}</div>}
  </div>
);

export const StatGrid: React.FC<{ children: React.ReactNode; cols?: 2 | 3 | 4; className?: string }> = ({
  children,
  cols = 3,
  className = '',
}) => {
  const colClass = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }[cols];
  return <div className={`grid gap-2 ${colClass} ${className}`}>{children}</div>;
};

/** Key / value rows for plain facts (location, workstation, ...). */
export const PropertyList: React.FC<{ items: Array<{ label: string; value: React.ReactNode }> }> = ({ items }) => (
  <dl className="divide-y divide-line rounded-lg border border-line">
    {items.map((item) => (
      <div key={item.label} className="flex items-baseline justify-between gap-4 px-3 py-2 text-sm">
        <dt className="shrink-0 text-muted">{item.label}</dt>
        <dd className="num text-right font-medium">{item.value}</dd>
      </div>
    ))}
  </dl>
);

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-12 text-center">
    {icon && <div className="mb-3 text-faint [&>svg]:h-8 [&>svg]:w-8">{icon}</div>}
    <h3 className="text-sm font-semibold">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

interface ChipOption {
  id: string;
  label: string;
  count?: number;
}

/** Single-select filter pills. */
export const FilterChips: React.FC<{
  options: ChipOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}> = ({ options, value, onChange, className = '' }) => (
  <div className={`flex gap-1.5 overflow-x-auto scrollbar-none ${className}`} role="group">
    {options.map((opt) => {
      const active = opt.id === value;
      return (
        <button
          key={opt.id}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(opt.id)}
          className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
            active ? 'bg-fg text-bg' : 'border border-line bg-surface text-muted hover:text-fg'
          }`}
        >
          {opt.label}
          {opt.count !== undefined && <span className={`num ${active ? 'opacity-70' : 'text-faint'}`}>{opt.count}</span>}
        </button>
      );
    })}
  </div>
);

export const ProgressBar: React.FC<{ percent: number; tone?: Tone; className?: string }> = ({
  percent,
  tone = 'accent',
  className = '',
}) => {
  const fill: Record<Tone, string> = {
    neutral: 'bg-muted',
    accent: 'bg-accent-solid',
    ok: 'bg-ok',
    info: 'bg-info',
    warn: 'bg-warn',
    danger: 'bg-danger',
  };
  const safe = Math.min(100, Math.max(0, percent));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-2 w-full overflow-hidden rounded-full bg-subtle ${className}`}
    >
      <div className={`h-full rounded-full transition-all duration-300 ${fill[tone]}`} style={{ width: `${safe}%` }} />
    </div>
  );
};

/** Inline notice: info, warning, or success message inside a page. */
export const Callout: React.FC<{ tone?: Tone; icon?: React.ReactNode; children: React.ReactNode }> = ({
  tone = 'info',
  icon,
  children,
}) => (
  <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${toneStyles[tone]}`}>
    {icon && <span className="mt-0.5 shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
    <div className="min-w-0">{children}</div>
  </div>
);
