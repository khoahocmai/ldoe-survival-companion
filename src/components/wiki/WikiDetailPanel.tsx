import React, { useEffect, useRef } from 'react';

interface WikiDetailPanelProps {
  selectedId?: string | null;
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export const WikiDetailPanel: React.FC<WikiDetailPanelProps> = ({
  selectedId,
  header,
  children,
  className = '',
  footer,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Switching entity: start at the top of the new one.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [selectedId]);

  return (
    <div
      className={`flex h-full flex-col overflow-hidden bg-surface xl:rounded-xl xl:border xl:border-line xl:shadow-card ${className}`}
    >
      {header}
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {children}
      </div>
      {footer && <div className="shrink-0 border-t border-line bg-subtle/50 px-5 py-3">{footer}</div>}
    </div>
  );
};
