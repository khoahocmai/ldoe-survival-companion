import React from 'react';

type Align = 'left' | 'right' | 'center';

const alignClass: Record<Align, string> = { left: 'text-left', right: 'text-right', center: 'text-center' };

/**
 * Table building blocks so every table has the same header, padding, dividers and horizontal scroll.
 * Compose them like plain HTML: <Table><Thead><Th/>…</Thead><Tbody><Tr><Td/>…</Tr></Tbody></Table>.
 */
export const Table: React.FC<{
  children: React.ReactNode;
  /** Visually hidden title that tells screen readers what the table lists. */
  caption?: string;
  /** Let the table scroll sideways instead of squeezing columns on narrow screens (default on). */
  scroll?: boolean;
  className?: string;
}> = ({ children, caption, scroll = true, className = '' }) => (
  <div className="overflow-x-auto">
    <table className={`w-full text-left text-sm ${scroll ? 'min-w-table' : ''} ${className}`}>
      {caption && <caption className="sr-only">{caption}</caption>}
      {children}
    </table>
  </div>
);

export const Thead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead>
    <tr className="border-b border-line bg-subtle/40 text-xs font-medium text-muted">{children}</tr>
  </thead>
);

export const Th: React.FC<{ children?: React.ReactNode; align?: Align; className?: string }> = ({
  children,
  align = 'left',
  className = '',
}) => (
  <th scope="col" className={`px-3 py-2 font-medium first:pl-4 last:pr-4 ${alignClass[align]} ${className}`}>
    {children}
  </th>
);

export const Tbody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-line">{children}</tbody>
);

export const Tr: React.FC<{ children: React.ReactNode; highlight?: boolean; className?: string }> = ({
  children,
  highlight = false,
  className = '',
}) => (
  <tr className={`${highlight ? 'bg-accent-soft/50' : 'hover:bg-subtle/60'} transition-colors ${className}`}>{children}</tr>
);

export const Td: React.FC<{
  children?: React.ReactNode;
  align?: Align;
  /** Tabular figures for quantities and stats. */
  numeric?: boolean;
  colSpan?: number;
  className?: string;
}> = ({ children, align = 'left', numeric = false, colSpan, className = '' }) => (
  <td
    colSpan={colSpan}
    className={`px-3 py-2.5 first:pl-4 last:pr-4 ${alignClass[align]} ${numeric ? 'num' : ''} ${className}`}
  >
    {children}
  </td>
);

/** Single full-width row for "nothing here" messages. */
export const TableEmpty: React.FC<{ colSpan: number; children: React.ReactNode }> = ({ colSpan, children }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-4 text-center text-xs text-muted">
      {children}
    </td>
  </tr>
);
