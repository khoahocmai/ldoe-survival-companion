import React from 'react';
import { Card } from '../common/Card';
import { CompactBadgeList } from './CompactBadgeList';

export interface WikiCardStat {
  label: string;
  value: React.ReactNode;
}

export interface CompactWikiCardProps {
  id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  isSelected?: boolean;
  badges?: React.ReactNode;
  /** Up to three key numbers shown under the title so the grid is scannable without opening details. */
  stats?: WikiCardStat[];
  onClick: () => void;
  className?: string;
}

/**
 * Reference card for the wiki grids: a name, an optional translation, a few headline stats and
 * at most two badges. Everything else lives in the detail panel.
 */
export const CompactWikiCard: React.FC<CompactWikiCardProps> = ({
  id,
  title,
  subtitle,
  eyebrow,
  isSelected = false,
  badges,
  stats,
  onClick,
  className = '',
}) => (
  <Card
    key={id}
    onClick={onClick}
    selected={isSelected}
    padded={false}
    className={`flex min-h-[96px] flex-col justify-between gap-2 p-3 ${className}`}
  >
    <div className="min-w-0">
      {eyebrow && <span className="mb-0.5 block truncate text-2xs font-medium text-faint">{eyebrow}</span>}
      <h3 title={title} className={`truncate text-sm font-semibold ${isSelected ? 'text-accent' : ''}`}>
        {title}
      </h3>
      {subtitle && (
        <p title={subtitle} className="mt-0.5 truncate text-xs text-muted">
          {subtitle}
        </p>
      )}
    </div>

    <div className="space-y-2">
      {stats && stats.length > 0 && (
        <dl className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          {stats.slice(0, 3).map((s) => (
            <div key={s.label} className="flex items-baseline gap-1">
              <dt className="text-faint">{s.label}</dt>
              <dd className="num font-medium">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <CompactBadgeList max={2}>{badges}</CompactBadgeList>
    </div>
  </Card>
);
