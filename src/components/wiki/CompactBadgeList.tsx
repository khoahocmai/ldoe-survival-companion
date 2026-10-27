import React from 'react';

export interface CompactBadgeListProps {
  children?: React.ReactNode;
  max?: number;
  className?: string;
}

/** Unwraps React fragments so passed `<>...</>` badge lists count their inner elements. */
function flattenChildren(children: React.ReactNode): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (!child) return;
    if (React.isValidElement(child) && child.type === React.Fragment) {
      result.push(...flattenChildren((child.props as { children?: React.ReactNode }).children));
    } else {
      result.push(child);
    }
  });
  return result;
}

/** Renders up to `max` badges on one line, followed by a `+N` marker for the rest. */
export const CompactBadgeList: React.FC<CompactBadgeListProps> = ({ children, max = 2, className = '' }) => {
  const items = flattenChildren(children).filter(Boolean);
  if (items.length === 0) return null;

  const overflowCount = items.length - max;

  return (
    <div className={`flex flex-nowrap items-center gap-1.5 overflow-hidden ${className}`}>
      {items.slice(0, max)}
      {overflowCount > 0 && (
        <span
          title={`${overflowCount} nhãn khác`}
          className="num inline-flex shrink-0 select-none items-center rounded bg-subtle px-1.5 py-0.5 text-2xs font-medium leading-none text-muted"
        >
          +{overflowCount}
        </span>
      )}
    </div>
  );
};
